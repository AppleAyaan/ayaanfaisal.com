import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { isKnownTrackFile } from '@/app/music-tracks';

const redis = Redis.fromEnv();
const LIKE_VISITOR_COOKIE = 'af_like_visitor_id';

export const dynamic = 'force-dynamic';

function buildVisitorCookieValue() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getTrackMembersKey(trackFile: string) {
  return `site:music_likes:members:${encodeURIComponent(trackFile)}`;
}

function getVisitorId(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const pair = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LIKE_VISITOR_COOKIE}=`));
  return pair ? decodeURIComponent(pair.split('=').slice(1).join('=')) : '';
}

function attachVisitorCookieIfMissing(response: NextResponse, visitorId: string, hadCookie: boolean) {
  if (hadCookie) return;
  response.cookies.set(LIKE_VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 2,
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track') ?? '';
    if (!track || !isKnownTrackFile(track)) {
      return NextResponse.json({ error: 'Invalid track' }, { status: 400 });
    }

    const existingVisitorId = getVisitorId(request);
    const hadCookie = Boolean(existingVisitorId);
    const visitorId = existingVisitorId || buildVisitorCookieValue();
    const membersKey = getTrackMembersKey(track);

    const [countRaw, likedRaw] = await Promise.all([
      redis.scard(membersKey),
      redis.sismember(membersKey, visitorId),
    ]);

    const response = NextResponse.json({
      track,
      count: typeof countRaw === 'number' ? countRaw : 0,
      liked: Boolean(likedRaw),
    });
    attachVisitorCookieIfMissing(response, visitorId, hadCookie);
    return response;
  } catch {
    return NextResponse.json({ error: 'Music likes unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as { track?: string }));
    const track = typeof body.track === 'string' ? body.track : '';
    if (!track || !isKnownTrackFile(track)) {
      return NextResponse.json({ error: 'Invalid track' }, { status: 400 });
    }

    const existingVisitorId = getVisitorId(request);
    const hadCookie = Boolean(existingVisitorId);
    const visitorId = existingVisitorId || buildVisitorCookieValue();
    const membersKey = getTrackMembersKey(track);

    // SADD is idempotent: same user cannot like twice.
    await redis.sadd(membersKey, visitorId);
    const countRaw = await redis.scard(membersKey);

    const response = NextResponse.json({
      track,
      count: typeof countRaw === 'number' ? countRaw : 0,
      liked: true,
    });
    attachVisitorCookieIfMissing(response, visitorId, hadCookie);
    return response;
  } catch {
    return NextResponse.json({ error: 'Music likes unavailable' }, { status: 503 });
  }
}

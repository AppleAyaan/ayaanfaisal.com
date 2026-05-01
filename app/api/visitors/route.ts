import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();
const VISITOR_TOTAL_KEY = 'site:lifetime_visitors';
const VISITOR_COOKIE = 'af_visitor_id';

export const dynamic = 'force-dynamic';

function buildVisitorCookieValue() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const hasVisitorCookie = cookieHeader.includes(`${VISITOR_COOKIE}=`);

    const value = hasVisitorCookie
      ? await redis.get<number>(VISITOR_TOTAL_KEY)
      : await redis.incr(VISITOR_TOTAL_KEY);

    const response = NextResponse.json({
      value: typeof value === 'number' ? value : 0,
    });

    if (!hasVisitorCookie) {
      response.cookies.set(VISITOR_COOKIE, buildVisitorCookieValue(), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 2,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ error: 'Visitor counter unavailable' }, { status: 503 });
  }
}

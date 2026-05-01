export interface MusicTrack {
  file: string;
  title: string;
  artist: string;
  artFile: string;
  explicit?: boolean;
}

export interface ResolvedMusicTrack extends MusicTrack {
  src: string;
  artSrc: string;
}

/* add music here! 
  { file: 'fileName.mp3',
    title: 'title',
    artist: 'artist',
    artFile: 'artFile.webp',
    explicit: true, (or leave blank if not explicit)
  },
*/
export const rawMusicTracks: MusicTrack[] = [
  { file: 'NOKIA - drake.mp3',
    title: 'NOKIA',
    artist: 'Drake',
    artFile: 'nokia.webp',
    explicit: true,
  },
  {
    file: 'billie jean - michael jackson.mp3',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    artFile: 'billie jean.jpg',
  },
  { file: 'tried our best - drake.mp3',
    title: 'Tried Our Best', 
    artist: 'Drake', 
    artFile: 'tried our best.jpeg', 
    explicit: true,
  },
  { file: 'what did i miss - drake.mp3',
    title: 'What Did I Miss',
    artist: 'Drake',
    artFile: 'what did i miss.png',
  },
  { file: 'come thru - drake.mp3',
    title: 'Come Thru',
    artist: 'Drake',
    artFile: 'come thru.jpeg',
    explicit: true,
  },
  {
    file: 'dil dil pakistan - junaid jamshed.m4a',
    title: 'Dil Dil Pakistan',
    artist: 'Junaid Jamshed',
    artFile: 'dil dil pakistan.webp',
  },
  {
    file: 'espresso - sabrina carpenter.mp3',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    artFile: 'espresso.png',
    explicit: true,
  },
  {
    file: 'hona tha pyar - atif aslam.mp3',
    title: 'Hona Tha Pyar',
    artist: 'Atif Aslam',
    artFile: 'hona tha pyar.jpg',
  },
  {
    file: 'raining in houston - drake.mp3',
    title: 'Raining in Houston',
    artist: 'Drake',
    artFile: 'raining in houston.webp',
    explicit: true,
  },
  {
    file: 'what do you mean - justin bieber.mp3',
    title: 'What Do You Mean',
    artist: 'Justin Bieber',
    artFile: 'what do you mean.jpg',
  },
];

export const musicTracks: ResolvedMusicTrack[] = rawMusicTracks.map((track) => ({
  ...track,
  src: `/audio/${encodeURIComponent(track.file)}`,
  artSrc: `/album-art/${encodeURIComponent(track.artFile)}`,
}));

const trackFileSet = new Set(rawMusicTracks.map((track) => track.file));

export function isKnownTrackFile(file: string) {
  return trackFileSet.has(file);
}

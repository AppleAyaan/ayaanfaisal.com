export interface MusicTrack {
  file: string;
  title: string;
  artist: string;
  artFile: string;
  explicit?: boolean;
}

/* add music here! 
  { file: 'fileName.mp3',
    title: 'title',
    artist: 'artist',
    artFile: 'artFile.webp',
    explicit: true, (or leave blank if not explicit)
  },
*/
const rawMusicTracks: MusicTrack[] = [
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
    explicit: true,
  },
  { file: 'come thru - drake.mp3',
    title: 'Come Thru',
    artist: 'Drake',
    artFile: 'come thru.jpeg',
    explicit: true,
  },
  {
    file: 'dil dil pakistan - junaid jamshed.mp3',
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

export const musicTracks = rawMusicTracks.map((track) => ({
  ...track,
  src: `/audio/${encodeURIComponent(track.file)}`,
  artSrc: `/album-art/${encodeURIComponent(track.artFile)}`,
}));

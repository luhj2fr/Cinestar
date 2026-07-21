/**
 * MediaAPI - TMDb Metadata Provider & Video Stream Mapping Engine
 * Hulu / Max Inspired Architecture with Brand Hubs, TMDb IDs, IMDb IDs, and comprehensive TV Episode Data.
 */

import { StorageManager } from './storage.js';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';
const DEFAULT_TMDB_API_KEY = 'fed93f38c50b0032b3f866e99deb9335'; // User provided TMDb API key

// High quality video streams mapped for instant play
const SAMPLE_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
];

/**
 * Hulu & Max Inspired Brand Hubs
 */
export const BRAND_HUBS = [
  { id: 'all', name: 'All Media', icon: '✨', bgGradient: 'from-purple-600 to-indigo-600' },
  { id: 'hbo', name: 'HBO', logoText: 'HBO', icon: '👑', bgGradient: 'from-purple-900 to-violet-950', badge: 'HBO ORIGINAL' },
  { id: 'max', name: 'Max Originals', logoText: 'MAX', icon: '🚀', bgGradient: 'from-blue-700 to-purple-900', badge: 'MAX ORIGINAL' },
  { id: 'fx', name: 'FX on Hulu', logoText: 'FX', icon: '🔥', bgGradient: 'from-emerald-800 to-teal-950', badge: 'FX EXCLUSIVE' },
  { id: 'dc', name: 'DC Universe', logoText: 'DC', icon: '🦇', bgGradient: 'from-blue-900 to-slate-950', badge: 'DC COMICS' },
  { id: 'warner', name: 'Warner Bros.', logoText: 'WB', icon: '🎬', bgGradient: 'from-indigo-900 to-slate-900', badge: 'WARNER BROS' },
  { id: 'hulu', name: 'Hulu Originals', logoText: 'hulu', icon: '💚', bgGradient: 'from-emerald-600 to-teal-900', badge: 'HULU ORIGINAL' }
];

/**
 * Rich Pre-Populated Media Database with Full TMDb IDs, IMDb IDs, Seasons & Episode Data
 */
const OFFLINE_MEDIA_DATABASE = [
  // 1. GAME OF THRONES
  {
    id: 1399,
    imdb_id: 'tt0944947',
    type: 'tv',
    hub: 'hbo',
    title: 'Game of Thrones',
    original_title: 'Game of Thrones',
    tagline: 'Winter is coming.',
    overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war while an ancient evil awakens in the far north.',
    poster_path: 'https://image.tmdb.org/t/p/w500/1XS1oqL89v2Ukko83C9R28ByA30.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/2OMB0yKqA2A9P3y8O3fB3f.jpg',
    vote_average: 8.4,
    vote_count: 23800,
    first_air_date: '2011-04-17',
    year: '2011',
    runtime: 60,
    seasons_count: 8,
    episodes_count: 73,
    genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 18, name: 'Drama' }, { id: 10759, name: 'Action & Adventure' }],
    languages: ['English'],
    countries: ['United States'],
    studios: ['HBO', 'Generator Entertainment'],
    director: 'David Benioff, D.B. Weiss',
    writers: ['George R.R. Martin', 'David Benioff', 'D.B. Weiss'],
    cast: [
      { id: 1223786, name: 'Emilia Clarke', character: 'Daenerys Targaryen', profile_path: 'https://image.tmdb.org/t/p/w185/r6y112s1.jpg' },
      { id: 239019, name: 'Kit Harington', character: 'Jon Snow', profile_path: 'https://image.tmdb.org/t/p/w185/2912s.jpg' },
      { id: 84423, name: 'Peter Dinklage', character: 'Tyrion Lannister', profile_path: 'https://image.tmdb.org/t/p/w185/1932s.jpg' },
      { id: 13636, name: 'Lena Headey', character: 'Cersei Lannister', profile_path: 'https://image.tmdb.org/t/p/w185/5431s.jpg' }
    ],
    trailer_key: 'KPLWWIOCOOQ',
    stream_url: SAMPLE_STREAMS[0],
    match_score: 99,
    age_rating: 'TV-MA',
    badge: 'HBO ORIGINAL',
    seasons: [
      {
        season_number: 1,
        name: 'Season 1',
        episode_count: 10,
        episodes: [
          { episode_number: 1, title: 'Winter Is Coming', overview: 'Jon Arryn, the Hand of the King, is dead. King Robert Baratheon travels north to Winterfell to ask his old friend Eddard "Ned" Stark to take his place.', runtime: 62, air_date: '2011-04-17', still_path: 'https://image.tmdb.org/t/p/w500/2OMB0yKqA2A9P3y8O3fB3f.jpg', stream_url: SAMPLE_STREAMS[0], skip_intro: { start: 10, end: 100 }, skip_credits: { start: 3500, end: 3720 } },
          { episode_number: 2, title: 'The Kingsroad', overview: 'While Bran recovers from his fall, Ned leaves Winterfell with his daughters Sansa and Arya for King\'s Landing.', runtime: 56, air_date: '2011-04-24', still_path: 'https://image.tmdb.org/t/p/w500/1XS1oqL89v2Ukko83C9R28ByA30.jpg', stream_url: SAMPLE_STREAMS[1] },
          { episode_number: 3, title: 'Lord Snow', overview: 'Ned arrives in King\'s Landing and learns of the Crown\'s financial recklessness. Jon Snow begins his training at the Wall.', runtime: 58, air_date: '2011-05-01', still_path: 'https://image.tmdb.org/t/p/w500/pbrL136mYgK5eB3Sbf9sYx4dO5m.jpg', stream_url: SAMPLE_STREAMS[2] },
          { episode_number: 4, title: 'Cripples, Bastards, and Broken Things', overview: 'Ned investigates Jon Arryn\'s final days. Catelyn captures Tyrion Lannister at an inn.', runtime: 56, air_date: '2011-05-08', still_path: 'https://image.tmdb.org/t/p/w500/s3T1311oA8h32R3S393.jpg', stream_url: SAMPLE_STREAMS[3] },
          { episode_number: 5, title: 'The Wolf and the Lion', overview: 'Robert orders a strike on Daenerys. Ned refuses to take part and resigns as Hand.', runtime: 55, air_date: '2011-05-15', still_path: 'https://image.tmdb.org/t/p/w500/1pdfLPoA6S3C3sL932S.jpg', stream_url: SAMPLE_STREAMS[4] }
        ]
      },
      {
        season_number: 2,
        name: 'Season 2',
        episode_count: 10,
        episodes: [
          { episode_number: 1, title: 'The North Remembers', overview: 'Tyrion arrives in King\'s Landing to act as Hand of the King. Stannis Baratheon plans his claim to the throne.', runtime: 53, air_date: '2012-04-01', still_path: 'https://image.tmdb.org/t/p/w500/2OMB0yKqA2A9P3y8O3fB3f.jpg', stream_url: SAMPLE_STREAMS[5] }
        ]
      }
    ]
  },

  // 2. HOUSE OF THE DRAGON
  {
    id: 94997,
    imdb_id: 'tt11198330',
    type: 'tv',
    hub: 'hbo',
    title: 'House of the Dragon',
    original_title: 'House of the Dragon',
    tagline: 'Fire and blood.',
    overview: 'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their command. An internal succession war threatens to tear the realm apart.',
    poster_path: 'https://image.tmdb.org/t/p/w500/1X4vh2C2R33T11o.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/et311oA8h32R3S393.jpg',
    vote_average: 8.4,
    vote_count: 4500,
    first_air_date: '2022-08-21',
    year: '2022',
    runtime: 60,
    seasons_count: 2,
    episodes_count: 18,
    genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 18, name: 'Drama' }, { id: 10759, name: 'Action & Adventure' }],
    director: 'Ryan Condal, Miguel Sapochnik',
    writers: ['George R.R. Martin', 'Ryan Condal'],
    cast: [
      { id: 12211, name: 'Emma D\'Arcy', character: 'Princess Rhaenyra Targaryen' },
      { id: 41686, name: 'Matt Smith', character: 'Prince Daemon Targaryen' },
      { id: 139135, name: 'Olivia Cooke', character: 'Alicent Hightower' }
    ],
    trailer_key: 'DotnJ7tTA34',
    stream_url: SAMPLE_STREAMS[1],
    match_score: 98,
    age_rating: 'TV-MA',
    badge: 'HBO ORIGINAL',
    seasons: [
      {
        season_number: 1,
        name: 'Season 1',
        episode_count: 10,
        episodes: [
          { episode_number: 1, title: 'The Heirs of the Dragon', overview: 'Viserys hosts a tournament to celebrate the birth of his second child. Rhaenyra welcomes her uncle Daemon back to the Red Keep.', runtime: 66, air_date: '2022-08-21', still_path: 'https://image.tmdb.org/t/p/w500/et311oA8h32R3S393.jpg', stream_url: SAMPLE_STREAMS[1], skip_intro: { start: 10, end: 85 } },
          { episode_number: 2, title: 'The Rogue Prince', overview: 'Rhaenyra steps in at a Small Council meeting. Daemon occupies Dragonstone with his gold cloaks.', runtime: 54, air_date: '2022-08-28', still_path: 'https://image.tmdb.org/t/p/w500/1X4vh2C2R33T11o.jpg', stream_url: SAMPLE_STREAMS[2] },
          { episode_number: 3, title: 'Second of His Name', overview: 'Daemon and the Sea Snake fight the Crabfeeder at the Stepstones. Viserys plans a royal hunt.', runtime: 63, air_date: '2022-09-04', still_path: 'https://image.tmdb.org/t/p/w500/pbrL136mYgK5eB3Sbf9sYx4dO5m.jpg', stream_url: SAMPLE_STREAMS[3] }
        ]
      }
    ]
  },

  // 3. THE BEAR (FX on Hulu)
  {
    id: 125988,
    imdb_id: 'tt14452776',
    type: 'tv',
    hub: 'fx',
    title: 'The Bear',
    original_title: 'The Bear',
    tagline: 'Every second counts.',
    overview: 'A young chef from the fine dining world returns to Chicago to run his family\'s sandwich shop after a heartbreaking death.',
    poster_path: 'https://image.tmdb.org/t/p/w500/2OMB0yKqA2A9P3y8O3fB3fBear.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/BearBackdrop.jpg',
    vote_average: 8.6,
    vote_count: 2100,
    first_air_date: '2022-06-23',
    year: '2022',
    runtime: 30,
    seasons_count: 3,
    episodes_count: 28,
    genres: [{ id: 18, name: 'Drama' }, { id: 35, name: 'Comedy' }],
    director: 'Christopher Storer',
    writers: ['Christopher Storer'],
    cast: [
      { id: 1111, name: 'Jeremy Allen White', character: 'Carmen "Carmy" Berzatto' },
      { id: 2222, name: 'Ayo Edebiri', character: 'Sydney Adamu' },
      { id: 3333, name: 'Ebon Moss-Bachrach', character: 'Richard "Richie" Jerimovich' }
    ],
    trailer_key: 'gB9P3y8O3fB.jpg',
    stream_url: SAMPLE_STREAMS[2],
    match_score: 99,
    age_rating: 'TV-MA',
    badge: 'FX EXCLUSIVE',
    seasons: [
      {
        season_number: 1,
        name: 'Season 1',
        episode_count: 8,
        episodes: [
          { episode_number: 1, title: 'System', overview: 'Carmy tries to modernize The Original Beef of Chicagoland despite resistance from his late brother\'s best friend Richie.', runtime: 30, air_date: '2022-06-23', still_path: 'https://image.tmdb.org/t/p/w500/BearBackdrop.jpg', stream_url: SAMPLE_STREAMS[2] },
          { episode_number: 2, title: 'Hands', overview: 'Carmy brings in Sydney to help re-organize the kitchen workflow using the Brigade de Cuisine method.', runtime: 28, air_date: '2022-06-23', still_path: 'https://image.tmdb.org/t/p/w500/1XS1oqL89v2Ukko83C9R28ByA30.jpg', stream_url: SAMPLE_STREAMS[3] }
        ]
      }
    ]
  },

  // 4. THE BATMAN (DC / Warner)
  {
    id: 414906,
    imdb_id: 'tt1877830',
    type: 'movie',
    hub: 'dc',
    title: 'The Batman',
    original_title: 'The Batman',
    tagline: 'Unmask the truth.',
    overview: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.',
    poster_path: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Cpooo50A9221311o.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/5P8K9HN3aA32R3S393.jpg',
    vote_average: 7.7,
    vote_count: 10200,
    release_date: '2022-03-01',
    year: '2022',
    runtime: 176,
    genres: [{ id: 80, name: 'Crime' }, { id: 9648, name: 'Mystery' }, { id: 28, name: 'Action' }],
    director: 'Matt Reeves',
    writers: ['Matt Reeves', 'Peter Craig'],
    cast: [
      { id: 11288, name: 'Robert Pattinson', character: 'Bruce Wayne / Batman' },
      { id: 505710, name: 'Zoë Kravitz', character: 'Selina Kyle / Catwoman' },
      { id: 2224, name: 'Paul Dano', character: 'Edward Nashton / Riddler' },
      { id: 2524, name: 'Colin Farrell', character: 'Oswald Cobblepot / Penguin' }
    ],
    trailer_key: 'mqqft2x_Aa4',
    stream_url: SAMPLE_STREAMS[3],
    match_score: 96,
    age_rating: 'PG-13',
    badge: 'DC COMICS'
  },

  // 5. INTERSTELLAR (Warner Bros)
  {
    id: 157336,
    imdb_id: 'tt0816692',
    type: 'movie',
    hub: 'warner',
    title: 'Interstellar',
    original_title: 'Interstellar',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    poster_path: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/pbrL136mYgK5eB3Sbf9sYx4dO5m.jpg',
    vote_average: 8.4,
    vote_count: 34500,
    release_date: '2014-11-05',
    year: '2014',
    runtime: 169,
    genres: [{ id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }, { id: 878, name: 'Science Fiction' }],
    director: 'Christopher Nolan',
    writers: ['Jonathan Nolan', 'Christopher Nolan'],
    cast: [
      { id: 10296, name: 'Matthew McConaughey', character: 'Joseph Cooper' },
      { id: 1813, name: 'Anne Hathaway', character: 'Dr. Amelia Brand' },
      { id: 8210, name: 'Jessica Chastain', character: 'Murphy Cooper' }
    ],
    trailer_key: 'zSWdZVtXT7E',
    stream_url: SAMPLE_STREAMS[0],
    match_score: 99,
    age_rating: 'PG-13',
    badge: '4K ULTRA HD'
  },

  // 6. DUNE: PART TWO
  {
    id: 438631,
    imdb_id: 'tt1160419',
    type: 'movie',
    hub: 'warner',
    title: 'Dune: Part Two',
    original_title: 'Dune: Part Two',
    tagline: 'Long live the fighters.',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    poster_path: 'https://image.tmdb.org/t/p/w500/1pdfLPoA6S3C3sL932S.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9312.jpg',
    vote_average: 8.5,
    vote_count: 5100,
    release_date: '2024-02-27',
    year: '2024',
    runtime: 166,
    genres: [{ id: 878, name: 'Science Fiction' }, { id: 12, name: 'Adventure' }],
    director: 'Denis Villeneuve',
    writers: ['Denis Villeneuve', 'Jon Spaihts'],
    cast: [
      { id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides' },
      { id: 505710, name: 'Zendaya', character: 'Chani' },
      { id: 93292, name: 'Rebecca Ferguson', character: 'Lady Jessica' }
    ],
    trailer_key: 'Way9Dexny3w',
    stream_url: SAMPLE_STREAMS[4],
    match_score: 99,
    age_rating: 'PG-13',
    badge: 'MAX ORIGINAL'
  },

  // 7. STRANGER THINGS
  {
    id: 66732,
    imdb_id: 'tt2579788',
    type: 'tv',
    hub: 'max',
    title: 'Stranger Things',
    original_title: 'Stranger Things',
    tagline: 'Every ending has a beginning.',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    poster_path: 'https://image.tmdb.org/t/p/w500/49WJfe161f3kVS3p3.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/562232S3p3.jpg',
    vote_average: 8.6,
    vote_count: 17200,
    first_air_date: '2016-07-15',
    year: '2016',
    seasons_count: 4,
    episodes_count: 34,
    genres: [{ id: 18, name: 'Drama' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 9648, name: 'Mystery' }],
    cast: [
      { id: 1356210, name: 'Millie Bobby Brown', character: 'Eleven' },
      { id: 68826, name: 'Winona Ryder', character: 'Joyce Byers' },
      { id: 1444929, name: 'Finn Wolfhard', character: 'Mike Wheeler' }
    ],
    trailer_key: 'b9EkMc79ZSU',
    stream_url: SAMPLE_STREAMS[5],
    match_score: 97,
    age_rating: 'TV-14',
    badge: 'EXCLUSIVE',
    seasons: [
      {
        season_number: 1,
        name: 'Season 1',
        episode_count: 8,
        episodes: [
          { episode_number: 1, title: 'Chapter One: The Vanishing of Will Byers', overview: 'On his way home from a friend\'s house, young Will sees something terrifying.', runtime: 48, air_date: '2016-07-15', still_path: 'https://image.tmdb.org/t/p/w500/562232S3p3.jpg', stream_url: SAMPLE_STREAMS[5] },
          { episode_number: 2, title: 'Chapter Two: The Weirdo on Maple Street', overview: 'Lucas, Mike and Dustin try to talk to the girl they found in the woods.', runtime: 55, air_date: '2016-07-15', still_path: 'https://image.tmdb.org/t/p/w500/pbrL136mYgK5eB3Sbf9sYx4dO5m.jpg', stream_url: SAMPLE_STREAMS[6] }
        ]
      }
    ]
  },

  // 8. THE LAST OF US
  {
    id: 94605,
    imdb_id: 'tt3581920',
    type: 'tv',
    hub: 'hbo',
    title: 'The Last of Us',
    original_title: 'The Last of Us',
    tagline: 'When you\'re lost in the darkness, look for the light.',
    overview: 'Twenty years after modern civilization has been destroyed, Joel is hired to smuggle 14-year-old Ellie out of an oppressive quarantine zone.',
    poster_path: 'https://image.tmdb.org/t/p/w500/u3bZgnP93p.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/u3bZgnP93pBack.jpg',
    vote_average: 8.6,
    vote_count: 4800,
    first_air_date: '2023-01-15',
    year: '2023',
    seasons_count: 1,
    episodes_count: 9,
    genres: [{ id: 18, name: 'Drama' }, { id: 10765, name: 'Sci-Fi & Fantasy' }],
    cast: [
      { id: 1253360, name: 'Pedro Pascal', character: 'Joel Miller' },
      { id: 2283134, name: 'Bella Ramsey', character: 'Ellie Williams' }
    ],
    trailer_key: 'uLtkt8BonwM',
    stream_url: SAMPLE_STREAMS[6],
    match_score: 98,
    age_rating: 'TV-MA',
    badge: 'HBO ORIGINAL',
    seasons: [
      {
        season_number: 1,
        name: 'Season 1',
        episode_count: 9,
        episodes: [
          { episode_number: 1, title: 'When You\'re Lost in the Darkness', overview: 'Twenty years after a fungal outbreak ravages the planet, Joel and Tess take on a mission.', runtime: 81, air_date: '2023-01-15', still_path: 'https://image.tmdb.org/t/p/w500/u3bZgnP93pBack.jpg', stream_url: SAMPLE_STREAMS[6] }
        ]
      }
    ]
  },

  // 9. OPPENHEIMER
  {
    id: 872585,
    imdb_id: 'tt15398776',
    type: 'movie',
    hub: 'warner',
    title: 'Oppenheimer',
    original_title: 'Oppenheimer',
    tagline: 'The story of American Prometheus.',
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
    poster_path: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv3s.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/fm6K312s3.jpg',
    vote_average: 8.1,
    vote_count: 8200,
    release_date: '2023-07-19',
    year: '2023',
    runtime: 181,
    genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }],
    director: 'Christopher Nolan',
    writers: ['Christopher Nolan'],
    cast: [
      { id: 2038, name: 'Cillian Murphy', character: 'J. Robert Oppenheimer' },
      { id: 5081, name: 'Emily Blunt', character: 'Katherine Oppenheimer' },
      { id: 1892, name: 'Matt Damon', character: 'Leslie Groves' }
    ],
    trailer_key: 'uYPbbksJxIg',
    stream_url: SAMPLE_STREAMS[7],
    match_score: 97,
    age_rating: 'R',
    badge: 'ACADEMY AWARD WINNER'
  }
];

export class MediaAPI {
  /**
   * Get active TMDb API Key
   */
  static getApiKey() {
    return (import.meta.env && import.meta.env.VITE_TMDB_API_KEY) ? import.meta.env.VITE_TMDB_API_KEY : DEFAULT_TMDB_API_KEY;
  }

  /**
   * Helper to format TMDb image URLs
   */
  static getImageUrl(path, size = 'w500') {
    if (!path) return 'https://via.placeholder.com/500x750/090714/ffffff?text=Cinestar';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${TMDB_IMAGE_BASE}${size}${path}`;
  }

  /**
   * Fetch wrapper with error handling & API Key injection
   */
  static async fetchTmdb(endpoint, params = {}) {
    const apiKey = this.getApiKey();
    const queryParams = new URLSearchParams({ api_key: apiKey, ...params });
    const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error(`TMDb API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`MediaAPI: Fetch failed for ${endpoint}, using rich offline fallback`, error);
      return null;
    }
  }

  /**
   * Get Trending Content (Filtered by Brand Hub if specified)
   */
  static async getTrending(type = 'all', hub = 'all') {
    const apiResult = await this.fetchTmdb(`/trending/${type === 'all' ? 'all' : type}/day`);
    let items = [];

    if (apiResult && apiResult.results && apiResult.results.length > 0) {
      items = apiResult.results.map(item => this.normalizeMediaItem(item, item.media_type || type));
    } else {
      items = OFFLINE_MEDIA_DATABASE;
    }

    if (hub && hub !== 'all') {
      return items.filter(i => i.hub === hub || (OFFLINE_MEDIA_DATABASE.find(o => String(o.id) === String(i.id))?.hub === hub));
    }

    return items;
  }

  /**
   * Get Popular Movies
   */
  static async getPopularMovies(page = 1) {
    const apiResult = await this.fetchTmdb('/movie/popular', { page });
    if (apiResult && apiResult.results && apiResult.results.length > 0) {
      return apiResult.results.map(item => this.normalizeMediaItem(item, 'movie'));
    }
    return OFFLINE_MEDIA_DATABASE.filter(m => m.type === 'movie');
  }

  /**
   * Get Popular TV Shows
   */
  static async getPopularTV(page = 1) {
    const apiResult = await this.fetchTmdb('/tv/popular', { page });
    if (apiResult && apiResult.results && apiResult.results.length > 0) {
      return apiResult.results.map(item => this.normalizeMediaItem(item, 'tv'));
    }
    return OFFLINE_MEDIA_DATABASE.filter(m => m.type === 'tv');
  }

  /**
   * Get Top Rated Movies & TV
   */
  static async getTopRated(type = 'movie', page = 1) {
    const apiResult = await this.fetchTmdb(`/${type}/top_rated`, { page });
    if (apiResult && apiResult.results && apiResult.results.length > 0) {
      return apiResult.results.map(item => this.normalizeMediaItem(item, type));
    }
    return OFFLINE_MEDIA_DATABASE.filter(m => m.type === type);
  }

  /**
   * Get Upcoming Movies
   */
  static async getUpcoming(page = 1) {
    const apiResult = await this.fetchTmdb('/movie/upcoming', { page });
    if (apiResult && apiResult.results && apiResult.results.length > 0) {
      return apiResult.results.map(item => this.normalizeMediaItem(item, 'movie'));
    }
    return OFFLINE_MEDIA_DATABASE.filter(m => m.type === 'movie');
  }

  /**
   * Fetch Full Media Details with Credits, Videos, Recommendations, External IDs
   */
  static async getDetails(id, type = 'movie') {
    const cached = StorageManager.getCachedMetadata(id, type);
    if (cached) return cached;

    const offlineMatch = OFFLINE_MEDIA_DATABASE.find(m => String(m.id) === String(id) && m.type === type);

    const apiResult = await this.fetchTmdb(`/${type}/${id}`, {
      append_to_response: 'videos,credits,recommendations,similar,external_ids'
    });

    if (apiResult) {
      const normalized = this.normalizeMediaDetails(apiResult, type, offlineMatch);
      StorageManager.cacheMetadata(id, type, normalized);
      return normalized;
    }

    if (offlineMatch) {
      return offlineMatch;
    }

    return {
      id,
      type,
      title: 'Cinestar Media Title',
      overview: 'Experience this title in ultra-high resolution with spatial audio.',
      poster_path: null,
      backdrop_path: null,
      stream_url: SAMPLE_STREAMS[0]
    };
  }

  /**
   * Fetch Season and Episode details dynamically or from pre-populated dataset
   */
  static async getTVSeasonDetails(tvId, seasonNumber) {
    const apiResult = await this.fetchTmdb(`/tv/${tvId}/season/${seasonNumber}`);
    
    if (apiResult && apiResult.episodes && apiResult.episodes.length > 0) {
      return {
        season_number: seasonNumber,
        name: apiResult.name || `Season ${seasonNumber}`,
        episodes: apiResult.episodes.map((ep, idx) => ({
          episode_number: ep.episode_number,
          title: ep.name || `Episode ${ep.episode_number}`,
          overview: ep.overview || 'Synopsis for this episode.',
          runtime: ep.runtime || 50,
          still_path: this.getImageUrl(ep.still_path, 'w500'),
          air_date: ep.air_date || '2023-01-01',
          stream_url: SAMPLE_STREAMS[idx % SAMPLE_STREAMS.length],
          skip_intro: { start: 10, end: 75 },
          skip_credits: { start: (ep.runtime || 50) * 60 - 120, end: (ep.runtime || 50) * 60 }
        }))
      };
    }

    // Offline match
    const offlineShow = OFFLINE_MEDIA_DATABASE.find(m => String(m.id) === String(tvId) && m.type === 'tv');
    if (offlineShow && offlineShow.seasons) {
      const matchSeason = offlineShow.seasons.find(s => Number(s.season_number) === Number(seasonNumber));
      if (matchSeason) return matchSeason;
    }

    // Fallback generated episode list for any TV show season
    return {
      season_number: seasonNumber,
      name: `Season ${seasonNumber}`,
      episodes: Array.from({ length: 10 }).map((_, idx) => ({
        episode_number: idx + 1,
        title: `Episode ${idx + 1}: Chapter ${idx + 1}`,
        overview: `Intense chapter unfolding high-stakes drama and critical plot turns.`,
        runtime: 52,
        still_path: this.getImageUrl(null),
        air_date: '2023-05-12',
        stream_url: SAMPLE_STREAMS[idx % SAMPLE_STREAMS.length],
        skip_intro: { start: 10, end: 70 },
        skip_credits: { start: 3000, end: 3120 }
      }))
    };
  }

  /**
   * Search Movies, TV Shows, Actors, Directors, IMDb IDs, TMDb IDs
   */
  static async search(query, filters = {}) {
    if (!query || query.trim() === '') {
      return OFFLINE_MEDIA_DATABASE;
    }

    const cleanQuery = query.trim();

    // IMDb ID lookup (e.g. tt0944947)
    if (/^tt\d{7,8}$/i.test(cleanQuery)) {
      const apiFind = await this.fetchTmdb(`/find/${cleanQuery}`, { external_source: 'imdb_id' });
      if (apiFind) {
        const movieResults = (apiFind.movie_results || []).map(m => this.normalizeMediaItem(m, 'movie'));
        const tvResults = (apiFind.tv_results || []).map(t => this.normalizeMediaItem(t, 'tv'));
        return [...movieResults, ...tvResults];
      }
    }

    const searchType = filters.type === 'tv' ? 'tv' : filters.type === 'movie' ? 'movie' : 'multi';
    const params = { query: cleanQuery };
    if (filters.year) params.primary_release_year = filters.year;

    const apiResult = await this.fetchTmdb(`/search/${searchType}`, params);

    let results = [];
    if (apiResult && apiResult.results) {
      results = apiResult.results
        .filter(item => item.media_type !== 'person')
        .map(item => this.normalizeMediaItem(item, item.media_type || searchType));
    }

    // Filter offline DB
    const queryLower = cleanQuery.toLowerCase();
    const offlineMatches = OFFLINE_MEDIA_DATABASE.filter(item => {
      const titleMatch = (item.title || '').toLowerCase().includes(queryLower);
      const actorMatch = (item.cast || []).some(c => c.name.toLowerCase().includes(queryLower));
      const directorMatch = (item.director || '').toLowerCase().includes(queryLower);
      const genreMatch = (item.genres || []).some(g => g.name.toLowerCase().includes(queryLower));
      const imdbMatch = (item.imdb_id || '').toLowerCase() === queryLower;
      return titleMatch || actorMatch || directorMatch || genreMatch || imdbMatch;
    });

    const combined = [...results];
    offlineMatches.forEach(offItem => {
      if (!combined.some(c => String(c.id) === String(offItem.id) && c.type === offItem.type)) {
        combined.push(offItem);
      }
    });

    return combined.filter(item => {
      if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.genre && filters.genre !== 'all') {
        const hasGenre = (item.genres || []).some(g => String(g.id) === String(filters.genre) || g.name === filters.genre);
        if (!hasGenre) return false;
      }
      if (filters.minRating && (item.vote_average || 0) < Number(filters.minRating)) return false;
      return true;
    });
  }

  /**
   * Helper to normalize media list items
   */
  static normalizeMediaItem(item, defaultType = 'movie') {
    const type = item.media_type || defaultType || (item.first_air_date ? 'tv' : 'movie');
    const releaseDate = item.release_date || item.first_air_date || '';
    const streamIndex = Math.abs((item.id || 0) % SAMPLE_STREAMS.length);

    return {
      id: item.id,
      imdb_id: item.imdb_id || null,
      type,
      title: item.title || item.name || 'Untitled',
      original_title: item.original_title || item.original_name || item.title || item.name,
      overview: item.overview || '',
      poster_path: this.getImageUrl(item.poster_path, 'w500'),
      backdrop_path: this.getImageUrl(item.backdrop_path, 'original'),
      vote_average: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.2,
      vote_count: item.vote_count || 120,
      release_date: releaseDate,
      year: releaseDate.substring(0, 4) || '2024',
      genres: item.genres || [],
      stream_url: SAMPLE_STREAMS[streamIndex],
      match_score: Math.min(99, Math.max(82, Math.round((item.vote_average || 8.0) * 10 + 12))),
      badge: item.type === 'tv' ? 'MAX SERIES' : '4K ULTRA HD'
    };
  }

  /**
   * Helper to normalize full media details
   */
  static normalizeMediaDetails(item, type, offlineFallback = null) {
    const base = this.normalizeMediaItem(item, type);
    const videos = item.videos && item.videos.results ? item.videos.results : [];
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];

    const cast = (item.credits && item.credits.cast ? item.credits.cast : [])
      .slice(0, 12)
      .map(c => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: this.getImageUrl(c.profile_path, 'w185')
      }));

    const crew = item.credits && item.credits.crew ? item.credits.crew : [];
    const director = crew.find(c => c.job === 'Director' || c.job === 'Executive Producer')?.name || offlineFallback?.director || 'N/A';
    const writers = crew.filter(c => c.department === 'Writing').map(c => c.name).slice(0, 3);

    const recommendations = (item.recommendations && item.recommendations.results ? item.recommendations.results : [])
      .slice(0, 10)
      .map(r => this.normalizeMediaItem(r, type));

    return {
      ...base,
      imdb_id: item.external_ids?.imdb_id || offlineFallback?.imdb_id || base.imdb_id,
      tagline: item.tagline || offlineFallback?.tagline || '',
      runtime: item.runtime || item.episode_run_time?.[0] || offlineFallback?.runtime || 120,
      genres: item.genres || offlineFallback?.genres || [],
      director,
      writers: writers.length > 0 ? writers : (offlineFallback?.writers || []),
      cast: cast.length > 0 ? cast : (offlineFallback?.cast || []),
      trailer_key: trailer ? trailer.key : (offlineFallback?.trailer_key || 'YoHD9XEInc0'),
      recommendations,
      seasons_count: item.number_of_seasons || offlineFallback?.seasons_count || 1,
      episodes_count: item.number_of_episodes || offlineFallback?.episodes_count || 10,
      seasons: offlineFallback?.seasons || []
    };
  }
}

// Demo data for Abuja. All venues and people are fictional.
// Times are generated relative to "now" so there is always something happening tonight.

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

const DEFAULT_LOCATION = { lat: 9.0765, lng: 7.47, label: 'Wuse 2' };

const CATEGORIES = {
  lounge: { label: 'Lounge', emoji: '🍸' },
  rooftop: { label: 'Rooftop', emoji: '🌃' },
  concert: { label: 'Concert', emoji: '🎤' },
  dj: { label: 'Live DJ', emoji: '🎧' },
  hangout: { label: 'Free hangout', emoji: '🙌' },
};

const GENRES = ['Afrobeats', 'Amapiano', 'Hip-hop', 'R&B', 'Highlife', 'Live band', 'Chill', 'Afro-house', 'Street-pop', 'Alté', 'Dancehall', 'Fuji', 'Jazz', 'Gospel'];

// ---------- onboarding options ----------

// Each type maps to event tags (see EVENT_TAGS below).
const EVENT_TYPES = [
  { id: 'rooftop', emoji: '🌃', label: 'Rooftop parties', desc: 'Skyline views, sunset sets' },
  { id: 'club', emoji: '🪩', label: 'Club nights', desc: 'Dance till the lights come on' },
  { id: 'lounge', emoji: '🍸', label: 'Lounges', desc: 'Cocktails, shisha, good gist' },
  { id: 'concert', emoji: '🎤', label: 'Concerts', desc: 'Live acts and big stages' },
  { id: 'dj', emoji: '🎧', label: 'DJ sets', desc: 'Selectors who read the room' },
  { id: 'outdoor', emoji: '🌳', label: 'Outdoor & picnics', desc: 'Gardens, parks, lakesides' },
  { id: 'pool', emoji: '🏖️', label: 'Pool & beach', desc: 'Day parties by the water' },
  { id: 'owambe', emoji: '🎉', label: 'Owambe', desc: 'Big celebrations, bigger aso-ebi' },
  { id: 'comedy', emoji: '😂', label: 'Comedy & open mic', desc: 'Laughs, poetry, raw talent' },
  { id: 'games', emoji: '🎲', label: 'Game nights', desc: 'Cards, board games, karaoke' },
  { id: 'brunch', emoji: '🥂', label: 'Day parties & brunch', desc: 'Bottomless and sunny' },
  { id: 'art', emoji: '🎨', label: 'Art & culture', desc: 'Exhibitions, fashion, film' },
];

const GENRE_EMOJI = {
  Afrobeats: '🥁', Amapiano: '🎹', 'Hip-hop': '🎤', 'R&B': '💜', Highlife: '🎺', 'Live band': '🎸', Chill: '🌙',
  'Afro-house': '🔊', 'Street-pop': '🔥', 'Alté': '🌀', Dancehall: '🇯🇲', Fuji: '🪘', Jazz: '🎷', Gospel: '🙏',
};

const INTERESTS = [
  { id: 'dancing', emoji: '💃', label: 'Dancing till dawn', tags: ['club', 'dj'] },
  { id: 'chill', emoji: '🛋️', label: 'Chill & catch up', tags: ['lounge', 'outdoor'] },
  { id: 'meet', emoji: '🤝', label: 'Meeting new people', tags: [] },
  { id: 'date', emoji: '❤️', label: 'Date night', tags: ['lounge', 'rooftop'] },
  { id: 'live', emoji: '🎶', label: 'Live performances', tags: ['concert', 'comedy'] },
  { id: 'food', emoji: '🍢', label: 'Suya, food & drinks', tags: ['outdoor', 'brunch'] },
  { id: 'shisha', emoji: '💨', label: 'Shisha', tags: ['lounge'] },
  { id: 'network', emoji: '💼', label: 'Networking', tags: ['art', 'lounge'] },
  { id: 'pics', emoji: '📸', label: 'Content & pics', tags: ['rooftop', 'art'] },
  { id: 'games', emoji: '🎯', label: 'Games & activities', tags: ['games'] },
];

const BUDGETS = [
  { id: 'free', label: 'Free only', sub: '₦0', max: 0 },
  { id: '5k', label: 'Easy', sub: 'Under ₦5k', max: 5000 },
  { id: '15k', label: 'Standard', sub: '₦5k – ₦15k', max: 15000 },
  { id: '30k', label: 'Treat myself', sub: '₦15k – ₦30k', max: 30000 },
  { id: 'big', label: 'Big boy/girl', sub: 'No limit 💸', max: 1e9 },
];

const CREW_STYLES = [
  { id: 'solo', emoji: '🧍🏾', label: 'Solo', desc: "I'll make friends there" },
  { id: 'squad', emoji: '👯🏾', label: 'With my squad', desc: 'Usually 3–6 of us' },
  { id: 'date', emoji: '💑🏾', label: 'With my person', desc: 'Date nights, mostly' },
  { id: 'open', emoji: '🙌🏾', label: 'Open to crews', desc: 'Happy to link up with new people' },
];

const CITIES = [
  { id: 'Abuja', cc: 'NG', live: true },
  { id: 'Lagos', cc: 'NG' },
  { id: 'Port Harcourt', cc: 'NG' },
  { id: 'Ibadan', cc: 'NG' },
  { id: 'Enugu', cc: 'NG' },
  { id: 'Accra', cc: 'GH' },
  { id: 'Nairobi', cc: 'KE' },
  { id: 'Johannesburg', cc: 'ZA' },
  { id: 'Cape Town', cc: 'ZA' },
  { id: 'Kigali', cc: 'RW' },
  { id: 'Kampala', cc: 'UG' },
  { id: 'Dakar', cc: 'SN' },
];

const NIGHTS = ['Thu', 'Fri', 'Sat', 'Sun', 'Weekdays'];

const EVENT_TAGS = {
  e1: ['rooftop', 'dj', 'outdoor'],
  e2: ['lounge'],
  e3: ['concert', 'outdoor'],
  e4: ['club', 'dj'],
  e5: ['concert'],
  e6: ['outdoor', 'games', 'brunch'],
  e7: ['club', 'dj'],
  e8: ['outdoor'],
  e9: ['club', 'dj'],
  e10: ['comedy', 'lounge', 'art'],
};

function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function profileBase(profile) {
  if (profile.coords) return { ...profile.coords, label: 'your location' };
  const area = AREAS[profile.area] ? profile.area : DEFAULT_LOCATION.label;
  return { ...AREAS[area], label: area };
}

// How well an event fits a user's onboarding answers: 0–100 plus human-readable reasons.
// Weights: event type 40, music 30, budget 10, distance 10, vibe/interests 10.
function matchEvent(event, venue, profile) {
  let score = 0;
  const reasons = [];

  const typeHits = event.tags.filter((t) => profile.types.includes(t));
  if (typeHits.length) {
    score += Math.min(40, 28 + typeHits.length * 6);
    reasons.push(EVENT_TYPES.find((t) => t.id === typeHits[0]).label);
  }

  const genreHits = event.genres.filter((g) => profile.genres.includes(g));
  if (genreHits.length) {
    score += Math.min(30, 22 + genreHits.length * 8);
    reasons.push(genreHits[0]);
  }

  const budget = (BUDGETS.find((b) => b.id === profile.budget) || BUDGETS[2]).max;
  if (event.fee <= budget) {
    score += 10;
    if (event.fee === 0) reasons.push('Free');
  } else if (event.fee <= budget * 1.5) score += 4;

  const dist = distanceKm(profileBase(profile), venue);
  if (dist <= profile.radius) score += 10;
  else if (dist <= profile.radius * 1.5) score += 4;

  const vibeTags = INTERESTS.filter((i) => profile.interests.includes(i.id)).flatMap((i) => i.tags);
  const wantsCompany = profile.interests.includes('meet') || profile.crew === 'open' || profile.crew === 'solo';
  if (event.tags.some((t) => vibeTags.includes(t)) || (wantsCompany && event.lookingCount >= 4)) score += 10;
  if (wantsCompany && event.lookingCount >= 4) reasons.push(`${event.lookingCount} looking for company`);

  return { score: Math.min(100, score), reasons: reasons.slice(0, 2) };
}

const AREAS = {
  'Wuse 2': { lat: 9.0790, lng: 7.4700 },
  'Maitama': { lat: 9.0880, lng: 7.4930 },
  'Garki': { lat: 9.0340, lng: 7.4890 },
  'Jabi': { lat: 9.0700, lng: 7.4250 },
  'Asokoro': { lat: 9.0450, lng: 7.5250 },
  'Utako': { lat: 9.0650, lng: 7.4400 },
  'Central Area': { lat: 9.0560, lng: 7.4900 },
  'Gwarinpa': { lat: 9.1080, lng: 7.4050 },
};

const VIBE_LABELS = ['Dead', 'Quiet', 'Warming up', 'Lively', 'Packed', 'On fire'];

function createSeed(now) {
  const at = (hours) => {
    const t = now + hours * HOUR;
    return Math.round(t / (30 * MIN)) * (30 * MIN);
  };
  const ago = (mins) => now - mins * MIN;

  const people = {
    me: { name: 'You', friend: false },
    f1: { name: 'Tolu', friend: true },
    f2: { name: 'Chidi', friend: true },
    f3: { name: 'Amina', friend: true },
    f4: { name: 'Ifeoma', friend: true },
    f5: { name: 'Musa', friend: true },
    f6: { name: 'Zainab', friend: true },
    f7: { name: 'Kunle', friend: true },
    p_halima: { name: 'Halima', friend: false },
    p_femi: { name: 'Femi', friend: false },
    p_bisi: { name: 'Bisi', friend: false },
    p_ngozi: { name: 'Ngozi', friend: false },
    p_ada: { name: 'Ada', friend: false },
  };

  const venues = {
    v1: { name: 'Skyline Rooftop', area: 'Wuse 2', lat: 9.0801, lng: 7.4712, verified: true },
    v2: { name: 'Velvet Lounge', area: 'Maitama', lat: 9.0868, lng: 7.4935, verified: true },
    v3: { name: 'Lakeside Deck', area: 'Jabi', lat: 9.0712, lng: 7.4232, verified: true },
    v4: { name: 'The Basement', area: 'Garki', lat: 9.0345, lng: 7.4884, verified: false },
    v5: { name: 'Echo Arena', area: 'Central Area', lat: 9.0552, lng: 7.4905, verified: true },
    v6: { name: 'Palm Court Garden', area: 'Asokoro', lat: 9.0442, lng: 7.5248, verified: true },
    v7: { name: 'Utako Social Club', area: 'Utako', lat: 9.0648, lng: 7.4398, verified: false },
    v8: { name: 'Gwarinpa Park', area: 'Gwarinpa', lat: 9.1085, lng: 7.4060, verified: false },
  };

  const events = [
    {
      id: 'e1', title: 'Rooftop Sundowner: Afro x Amapiano', venueId: 'v1', category: 'rooftop',
      genres: ['Afrobeats', 'Amapiano'], start: at(-1.5), end: at(4.5), fee: 10000,
      dressCode: 'Smart casual, no slippers', baseVibe: 4, promoted: true, tickets: true, tables: true,
      friendIds: ['f1', 'f3'], lookingCount: 6,
      description: 'City views, two DJs and a sunset set that rolls into a full Amapiano takeover.',
    },
    {
      id: 'e2', title: 'Velvet Fridays: R&B & Cocktails', venueId: 'v2', category: 'lounge',
      genres: ['R&B', 'Chill'], start: at(1), end: at(6), fee: 15000,
      dressCode: 'Dress to impress', baseVibe: 3, promoted: false, tickets: false, tables: true,
      friendIds: ['f2'], lookingCount: 3,
      description: 'Slow jams, signature cocktails and table bookings for groups.',
    },
    {
      id: 'e3', title: 'Lakeside Live Band Night', venueId: 'v3', category: 'concert',
      genres: ['Highlife', 'Live band'], start: at(0.5), end: at(4.5), fee: 5000,
      dressCode: 'Casual', baseVibe: 3, promoted: false, tickets: true, tables: false,
      friendIds: [], lookingCount: 4,
      description: 'Highlife classics and covers by the lake. Bring a jacket, it gets breezy.',
    },
    {
      id: 'e4', title: 'Basement Sessions: Hip-hop Cypher', venueId: 'v4', category: 'dj',
      genres: ['Hip-hop'], start: at(2), end: at(7), fee: 3000,
      dressCode: 'Streetwear welcome', baseVibe: 2, promoted: false, tickets: false, tables: false,
      friendIds: ['f5'], lookingCount: 2,
      description: 'Open cypher from 10pm, DJ sets before and after.',
    },
    {
      id: 'e5', title: 'Echo Live: Rising Stars Concert', venueId: 'v5', category: 'concert',
      genres: ['Afrobeats'], start: at(1.5), end: at(5.5), fee: 20000,
      dressCode: 'Casual', baseVibe: 4, promoted: true, tickets: true, tables: false,
      friendIds: ['f1', 'f4', 'f6'], lookingCount: 9,
      description: 'Five up-and-coming Afrobeats acts on one stage. Limited tickets left.',
    },
    {
      id: 'e6', title: 'Garden Picnic & Chill', venueId: 'v6', category: 'hangout',
      genres: ['Chill', 'Afrobeats'], start: at(-2), end: at(2), fee: 0,
      dressCode: 'Anything comfy', baseVibe: 3, promoted: false, tickets: false, tables: false,
      friendIds: ['f3'], lookingCount: 5,
      description: 'Free entry. Mats, board games and a soft Afrobeats playlist under the palms.',
    },
    {
      id: 'e7', title: 'Amapiano Takeover', venueId: 'v7', category: 'dj',
      genres: ['Amapiano'], start: at(3), end: at(9), fee: 8000,
      dressCode: 'Smart casual', baseVibe: 2, promoted: false, tickets: true, tables: true,
      friendIds: ['f2', 'f7'], lookingCount: 7,
      description: 'Log drums all night with three resident DJs.',
    },
    {
      id: 'e8', title: 'Sunset Jog & Hangout', venueId: 'v8', category: 'hangout',
      genres: ['Chill'], start: at(-4), end: at(-2), fee: 0,
      dressCode: 'Sportswear', baseVibe: 2, promoted: false, tickets: false, tables: false,
      friendIds: [], lookingCount: 0,
      description: 'Community 5k jog followed by drinks on the grass.',
    },
    {
      id: 'e9', title: 'Afrobeats Till Dawn', venueId: 'v4', category: 'dj',
      genres: ['Afrobeats'], start: at(4), end: at(10), fee: 5000,
      dressCode: 'No dress code', baseVibe: 2, promoted: false, tickets: false, tables: false,
      friendIds: [], lookingCount: 3,
      description: 'The after-party spot. Doors open late, music stops at sunrise.',
    },
    {
      id: 'e10', title: 'Open Mic & Shisha', venueId: 'v7', category: 'lounge',
      genres: ['Live band', 'R&B'], start: at(-0.5), end: at(3.5), fee: 2000,
      dressCode: 'Casual', baseVibe: 3, promoted: false, tickets: false, tables: true,
      friendIds: ['f6'], lookingCount: 1,
      description: 'Singers, poets and comedians. Sign up at the bar to perform.',
    },
  ];

  events.forEach((e) => (e.tags = EVENT_TAGS[e.id] || []));

  const stories = [
    { id: 's1', eventId: 'e1', venueId: 'v1', at: ago(8), vibe: 5, crowd: 'Packed', text: 'DJ just switched to Amapiano 🔥 Dance floor full, still a few tables left.' },
    { id: 's2', eventId: 'e1', personId: 'p_halima', at: ago(22), vibe: 4, crowd: 'Filling up', text: 'View is unreal tonight. Queue at the door is about 10 mins.' },
    { id: 's3', eventId: 'e6', venueId: 'v6', at: ago(15), vibe: 3, crowd: 'Filling up', text: 'Picnic mats are out and there is free zobo until 8pm 🍹' },
    { id: 's4', eventId: 'e10', personId: 'p_femi', at: ago(5), vibe: 3, crowd: 'Cozy', text: 'First performer is up. Small crowd but a good one.' },
    { id: 's5', eventId: 'e8', venueId: 'v8', at: ago(95), vibe: 1, crowd: 'Empty', text: "That's a wrap! Thanks to everyone who came out." },
    { id: 's6', eventId: 'e3', venueId: 'v3', at: ago(30), vibe: 2, crowd: 'Quiet', text: 'Soundcheck done. Lakeside seats are going fast.' },
    { id: 's7', eventId: 'e5', venueId: 'v5', at: ago(40), vibe: 4, crowd: 'Queue forming', text: 'Doors open soon and the queue is already forming 👀' },
  ];

  const plans = [
    {
      id: 'p1', personId: 'p_bisi', at: ago(12), budget: 15000, area: 'Wuse 2', genre: 'Afrobeats',
      text: "Who's going out in Abuja tonight? Budget ₦15k, Afrobeats, somewhere around Wuse.",
      replies: [{ personId: 'p_femi', at: ago(6), text: 'Skyline Rooftop is lit right now.', eventId: 'e1' }],
      joiners: ['p_halima'],
    },
    {
      id: 'p2', personId: 'f7', at: ago(35), budget: 3000, area: 'Garki', genre: 'Chill',
      text: 'Want a chill night, nothing loud. Free or cheap, around Garki or Asokoro.',
      replies: [], joiners: [],
    },
    {
      id: 'p3', personId: 'p_ngozi', at: ago(50), budget: 20000, area: 'Maitama', genre: 'R&B',
      text: "Three of us are looking for 2–3 more people for Velvet Fridays. Let's split a table!",
      replies: [], joiners: ['p_ada'],
    },
  ];

  const crews = [
    { id: 'c1', name: 'Rooftop Squad', eventId: 'e1', ownerId: 'f1', members: ['f1', 'f3', 'p_halima'], invited: [], open: true, max: 6, note: 'Meeting at the entrance at 8:30. Splitting a table.' },
    { id: 'c2', name: 'Echo Live front row', eventId: 'e5', ownerId: 'f4', members: ['f4', 'f6'], invited: [], open: true, max: 5, note: 'Tickets bought. Come early for a good spot.' },
    { id: 'c3', name: 'Amapiano girls night', eventId: 'e7', ownerId: 'p_ngozi', members: ['p_ngozi', 'p_ada'], invited: [], open: true, max: 4, note: 'Women-only crew. We are getting a cab from Wuse together.' },
  ];

  return { people, venues, events, stories, plans, crews };
}

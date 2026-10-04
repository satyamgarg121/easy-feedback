// Static knowledge base: complaint types and who is responsible for them.
// No database. To add a city or a complaint type, edit this file.
//
// NOTE: X/Twitter handles and portal links change over time.
// Before going public, verify every entry marked `verify: true`.

const ISSUES = {
  garbage: {
    key: 'garbage',
    emoji: '🗑️',
    title: 'Garbage',
    tagline: 'Dumps, overflowing bins, missed pickup, burning',
    dept: 'Solid Waste Management Department',
    hashtags: ['#SwachhBharat'],
    problems: [
      'Garbage dumped on road / open plot',
      'Overflowing dustbin',
      'Garbage not collected from my area',
      'Garbage being burnt',
      'Dead animal not removed',
      'Street not swept',
    ],
    extras: [
      { id: 'since', label: 'Since how long?', options: ['Today', '2–3 days', 'About a week', 'More than a month'] },
      { id: 'size', label: 'How big is it?', options: ['A few bags', 'A cart-load', 'A truck-load'] },
    ],
    nationalHandles: ['@SwachhBharatGov', '@MoHUA_India'],
    portals: [
      { name: 'Swachhata app (MoHUA)', desc: 'Official garbage complaint app, routed to your municipal ward', url: 'https://play.google.com/store/apps/details?id=com.ichangemycity.swachhbharat' },
      { name: 'CPGRAMS', desc: 'Govt. of India public grievance portal, use for escalation', url: 'https://pgportal.gov.in/' },
    ],
  },

  road: {
    key: 'road',
    emoji: '🚧',
    title: 'Broken Road',
    tagline: 'Potholes, open manholes, waterlogging, broken footpaths',
    dept: 'Roads / Engineering Department',
    hashtags: ['#FixThePothole'],
    problems: [
      'Pothole(s)',
      'Road badly broken',
      'Open / broken manhole',
      'Waterlogging on road',
      'Broken footpath',
      'Road dug up and left unrepaired',
    ],
    extras: [
      { id: 'since', label: 'Since how long?', options: ['Today', '2–3 days', 'About a week', 'More than a month'] },
      { id: 'danger', label: 'How dangerous is it?', options: ['Inconvenient', 'Slows down traffic', 'Accidents likely', 'Accident already happened'] },
      { id: 'roadType', label: 'Which kind of road?', options: ['Colony / lane', 'Main city road', 'National / State highway', 'Not sure'] },
    ],
    nationalHandles: ['@MORTHIndia'],
    highwayHandles: ['@NHAI_Official'],
    portals: [
      { name: 'NHAI helpline 1033', desc: 'For national highways only: call 1033 (24x7)', url: 'tel:1033' },
      { name: 'CPGRAMS', desc: 'Govt. of India public grievance portal, use for escalation', url: 'https://pgportal.gov.in/' },
    ],
  },
};

// City → civic body. `match` holds lowercase strings that may appear in a reverse-geocoded address.
const CITIES = [
  { city: 'Delhi', match: ['delhi'], body: 'Municipal Corporation of Delhi', handles: ['@MCD_Delhi'], verify: true },
  { city: 'Mumbai', match: ['mumbai', 'bombay'], body: 'Brihanmumbai Municipal Corporation', handles: ['@mybmc'], verify: true },
  { city: 'Bengaluru', match: ['bengaluru', 'bangalore'], body: 'Greater Bengaluru Authority', handles: ['@BBMPCOMM'], verify: true },
  { city: 'Hyderabad', match: ['hyderabad'], body: 'Greater Hyderabad Municipal Corporation', handles: ['@GHMCOnline'], verify: true },
  { city: 'Chennai', match: ['chennai'], body: 'Greater Chennai Corporation', handles: ['@chennaicorp'], verify: true },
  { city: 'Pune', match: ['pune'], body: 'Pune Municipal Corporation', handles: ['@PMCPune'], verify: true },
  { city: 'Ahmedabad', match: ['ahmedabad'], body: 'Amdavad Municipal Corporation', handles: ['@AmdavadAMC'], verify: true },
  { city: 'Gurugram', match: ['gurugram', 'gurgaon'], body: 'Municipal Corporation of Gurugram', handles: ['@MCGurugram'], verify: true },
  { city: 'Noida', match: ['noida', 'gautam buddha nagar'], body: 'Noida Authority', handles: ['@noida_authority'], verify: true },
  { city: 'Kolkata', match: ['kolkata', 'calcutta'], body: 'Kolkata Municipal Corporation', handles: [], verify: true },
];

function findCity(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  return CITIES.find(c => c.match.some(m => t.includes(m))) || null;
}

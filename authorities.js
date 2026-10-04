// Static knowledge base: complaint types and who is responsible for them.
// No database. To add a city or a complaint type, edit this file.
//
// Official channels below were checked on 2026-10-04 against the sources noted
// next to each authority. Re-check them every few months: numbers change.

const HIGHWAY = 'National / State highway';

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
      { id: 'roadType', label: 'Which kind of road?', hint: 'This decides which department it goes to.', options: ['Colony / lane', 'Main city road', HIGHWAY, 'Not sure'] },
    ],
    nationalHandles: ['@MORTHIndia'],
    portals: [
      { name: 'CPGRAMS', desc: 'Govt. of India public grievance portal, use for escalation', url: 'https://pgportal.gov.in/' },
    ],
  },
};

// ---------- authorities and their official channels ----------
// channel.kind: whatsapp | call | email | web
// whatsapp numbers include the 91 country code. `bot: true` = menu-driven chatbot,
// so we pre-type `prefill` and copy the full complaint for the user to paste.

// Source: mcdonline.nic.in/portal/contactUs
const MCD = {
  body: 'Municipal Corporation of Delhi',
  handles: ['@MCD_Delhi'],
  note: 'Garbage, and roads narrower than 60 ft (colonies, lanes).',
  channels: [
    { kind: 'web', label: 'MCD online complaint form', value: 'https://mcd.everythingcivic.com/citizen/createissue' },
    { kind: 'call', label: 'MCD helpline', value: '155305' },
  ],
};

// Source: pwddelhi.gov.in/sewa
const PWD_DELHI = {
  body: 'Public Works Department, Govt. of NCT of Delhi',
  handles: [],
  note: 'Roads 60 ft and wider (main roads, flyovers).',
  channels: [
    { kind: 'email', label: 'PWD complaint email', value: 'complaint@pwddelhi.gov.in' },
    { kind: 'whatsapp', label: 'PWD WhatsApp chatbot', value: '918130188222', bot: true, prefill: 'Hi' },
    { kind: 'call', label: 'PWD helpline', value: '1908' },
    { kind: 'web', label: 'PWD SEWA complaint portal', value: 'https://www.pwddelhi.gov.in/sewa' },
  ],
};

// Sources: freepressjournal.in (BMC WhatsApp chatbot + Pothole QuickFix, Jun 2025); 1916 helpline
const BMC = {
  body: 'Brihanmumbai Municipal Corporation',
  handles: ['@mybmc'],
  channels: [
    { kind: 'whatsapp', label: 'BMC WhatsApp chatbot', value: '918999228999', bot: true, prefill: 'Hi' },
    { kind: 'call', label: 'BMC helpline', value: '1916' },
  ],
};
const BMC_ROADS = {
  ...BMC,
  note: 'Pothole complaints not fixed within 48 hours are auto-escalated to senior officials.',
  channels: [{ ...BMC.channels[0], prefill: 'Pothole' }, BMC.channels[1]],
};

// Sources: thenewsminute.com (BBMP WhatsApp 9480685700 + 1533); GBA replaced BBMP in 2025
const GBA = {
  body: 'Greater Bengaluru Authority',
  handles: ['@GBA_office'],
  channels: [
    { kind: 'whatsapp', label: 'GBA (ex-BBMP) WhatsApp helpline', value: '919480685700' },
    { kind: 'call', label: 'Sahaaya helpline (24x7)', value: '1533' },
  ],
};

// Source: kmcgov.in/KMCPortal/jsp/KmcContact.jsp
const KMC = {
  body: 'Kolkata Municipal Corporation',
  handles: ['@kmc_kolkata'],
  channels: [
    { kind: 'whatsapp', label: 'KMC WhatsApp', value: '918335988888' },
    { kind: 'whatsapp', label: 'KMC WhatsApp chatbot', value: '918335999111', bot: true, prefill: 'Hi' },
    { kind: 'call', label: 'KMC toll-free helpline', value: '18003453375' },
  ],
};

// National highways anywhere in India.
const NHAI = {
  body: 'National Highways Authority of India',
  handles: ['@NHAI_Official'],
  note: 'Only for national highways.',
  channels: [{ kind: 'call', label: 'NHAI highway helpline (24x7)', value: '1033' }],
};

// City → which authorities handle which complaint. `match` = lowercase strings that may
// appear in a reverse-geocoded address.
const CITIES = [
  {
    city: 'Delhi', match: ['delhi'],
    route(issue, x) {
      if (issue === 'garbage') return [MCD];
      if (x.roadType === 'Main city road' || x.roadType === HIGHWAY) return [PWD_DELHI];
      if (x.roadType === 'Colony / lane') return [MCD];
      return [MCD, PWD_DELHI]; // not sure: show both, letter goes to MCD
    },
  },
  { city: 'Mumbai', match: ['mumbai', 'bombay'], route: issue => [issue === 'road' ? BMC_ROADS : BMC] },
  { city: 'Bengaluru', match: ['bengaluru', 'bangalore'], route: () => [GBA] },
  { city: 'Kolkata', match: ['kolkata', 'calcutta'], route: () => [KMC] },
];

function findCity(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  return CITIES.find(c => c.match.some(m => t.includes(m))) || null;
}

// The authorities responsible for this complaint, most relevant first. Empty = city not covered yet.
function routeFor(cityInfo, issueKey, extras = {}) {
  const list = cityInfo ? cityInfo.route(issueKey, extras) : [];
  return issueKey === 'road' && extras.roadType === HIGHWAY ? [NHAI, ...list] : list;
}

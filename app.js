// Awaaz: a zero-backend civic complaint generator.
// Everything runs in the browser; complaints are kept in localStorage only.

const STEPS = ['photo', 'location', 'details', 'contact'];
const STEP_TITLES = {
  photo: 'Show us the problem',
  location: 'Where is it?',
  details: 'Tell us a bit more',
  contact: 'Who is raising this Awaaz?',
};
const ESCALATE_AFTER_DAYS = 7;
const STORE_KEY = 'awaaz.complaints';
const ME_KEY = 'awaaz.me';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let state;
let stepIndex = 0;

function freshState(issueKey) {
  return {
    issue: ISSUES[issueKey],
    photo: null, // resized JPEG data URL
    lat: null, lng: null, accuracy: null,
    address: '', city: '', landmark: '',
    problem: '', extras: {}, notes: '',
    name: '', phone: '',
  };
}

// ---------- storage (never trusted to exist) ----------
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
};

// ---------- navigation ----------
function show(screen) {
  $$('.screen').forEach(s => { s.hidden = s.id !== `screen-${screen}`; });
  if (screen === 'home') renderHome();
  if (screen === 'mine') renderMine();
  window.scrollTo({ top: 0 });
}

document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { show(go.dataset.go); return; }
  const copy = e.target.closest('[data-copy]');
  if (copy) copyText($('#' + copy.dataset.copy).textContent);
});

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast('Copied ✔');
}

// ---------- home ----------
function renderHome() {
  $('#issueGrid').innerHTML = Object.values(ISSUES).map(i => `
    <button class="issue-card" data-issue="${i.key}">
      <span class="emoji">${i.emoji}</span>
      <span class="t">${i.title}</span>
      <span class="d">${i.tagline}</span>
    </button>`).join('');
  updateMineCount();
}

$('#issueGrid').addEventListener('click', e => {
  const card = e.target.closest('[data-issue]');
  if (card) startWizard(card.dataset.issue);
});

function updateMineCount() {
  const open = store.get(STORE_KEY, []).filter(c => c.status === 'open').length;
  const pill = $('#mineCount');
  pill.hidden = open === 0;
  pill.textContent = open;
}

// ---------- wizard ----------
function startWizard(issueKey) {
  state = freshState(issueKey);
  const me = store.get(ME_KEY, null);
  if (me) { state.name = me.name || ''; state.phone = me.phone || ''; }

  // reset inputs
  ['address', 'city', 'landmark', 'notes'].forEach(id => { $('#' + id).value = ''; });
  $('#name').value = state.name;
  $('#phone').value = state.phone;
  $('#photoInput').value = '';
  $('#photoPreview').hidden = true;
  $('#photoPrompt').hidden = false;
  $('#locStatus').textContent = '';
  $('#mapLink').hidden = true;
  $('#cityList').innerHTML = CITIES.map(c => `<option value="${c.city}">`).join('');

  renderChips($('#problemChips'), state.issue.problems, v => { state.problem = v; });
  $('#extraFields').innerHTML = '';
  state.issue.extras.forEach(x => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p class="label">${x.label}</p><div class="chips"></div>`;
    renderChips($('.chips', wrap), x.options, v => { state.extras[x.id] = v; });
    $('#extraFields').appendChild(wrap);
  });

  stepIndex = 0;
  show('wizard');
  renderStep();
}

function renderChips(container, options, onPick) {
  container.innerHTML = options.map(o => `<button type="button" class="chip">${esc(o)}</button>`).join('');
  container.onclick = e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip', container).forEach(c => c.classList.toggle('on', c === chip));
    onPick(chip.textContent);
  };
}

function renderStep() {
  const step = STEPS[stepIndex];
  $$('.step').forEach(s => { s.hidden = s.dataset.step !== step; });
  $('#wizTitle').textContent = `${state.issue.emoji} ${STEP_TITLES[step]}`;
  $('#stepLabel').textContent = `${stepIndex + 1}/${STEPS.length}`;
  $('#progressBar').style.width = `${((stepIndex + 1) / STEPS.length) * 100}%`;
  // Auto-grab location the moment the user lands on that step: one less tap.
  if (step === 'location' && state.lat == null && !$('#address').value) locate();
}

$('#backBtn').addEventListener('click', () => {
  if (stepIndex === 0) show('home');
  else { stepIndex--; renderStep(); }
});

$('#screen-wizard').addEventListener('click', e => {
  const next = e.target.closest('[data-next]');
  if (!next) return;
  const step = STEPS[stepIndex];
  if (next.hasAttribute('data-skip-photo')) state.photo = null;
  else if (!validate(step)) return;
  if (stepIndex < STEPS.length - 1) { stepIndex++; renderStep(); window.scrollTo({ top: 0 }); }
  else finish();
});

function validate(step) {
  if (step === 'photo' && !state.photo) { toast('Take a photo, or tap "Skip photo"'); return false; }
  if (step === 'location') {
    state.address = $('#address').value.trim();
    state.city = $('#city').value.trim();
    state.landmark = $('#landmark').value.trim();
    if (!state.address && state.lat == null) { toast('Tell us where it is 📍'); return false; }
    if (!state.city) { toast('Which city?'); $('#city').focus(); return false; }
  }
  if (step === 'details') {
    state.notes = $('#notes').value.trim();
    if (!state.problem) { toast('Pick what the problem is'); return false; }
  }
  if (step === 'contact') {
    state.name = $('#name').value.trim();
    state.phone = $('#phone').value.trim();
    if (state.phone && !/^(\+?91[\s-]?)?[6-9]\d{9}$/.test(state.phone.replace(/\s/g, ''))) {
      toast('That mobile number looks off'); return false;
    }
    store.set(ME_KEY, $('#remember').checked ? { name: state.name, phone: state.phone } : null);
  }
  return true;
}

// ---------- photo ----------
$('#photoInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    state.photo = await resizeImage(file, 1600);
    $('#photoPreview').src = state.photo;
    $('#photoPreview').hidden = false;
    $('#photoPrompt').hidden = true;
  } catch {
    toast('Could not read that image');
  }
});

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function resizeImage(file, maxSide) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------- location ----------
$('#locBtn').addEventListener('click', locate);

function locate() {
  const status = $('#locStatus');
  if (!navigator.geolocation) { status.textContent = 'Location not supported. Please type the address.'; return; }
  status.textContent = '⏳ Finding you…';
  navigator.geolocation.getCurrentPosition(async pos => {
    state.lat = +pos.coords.latitude.toFixed(6);
    state.lng = +pos.coords.longitude.toFixed(6);
    state.accuracy = Math.round(pos.coords.accuracy);
    status.textContent = `✔ Pinned (±${state.accuracy} m). Looking up the address…`;
    const link = $('#mapLink');
    link.href = mapsUrl();
    link.hidden = false;
    try {
      const geo = await reverseGeocode(state.lat, state.lng);
      if (!$('#address').value) $('#address').value = geo.address;
      if (!$('#city').value) $('#city').value = geo.city;
      status.textContent = `✔ Pinned (±${state.accuracy} m). Please check the address below.`;
    } catch {
      status.textContent = `✔ Pinned (±${state.accuracy} m). Please type the address / area.`;
    }
  }, err => {
    status.textContent = err.code === 1
      ? 'Location permission denied. No problem, type the address below.'
      : 'Could not get location. Please type the address below.';
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}

async function reverseGeocode(lat, lng) {
  // OpenStreetMap Nominatim: free, no key, fine for low-volume prototype use.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  const a = data.address || {};
  const known = findCity(data.display_name);
  const city = known ? known.city : (a.city || a.town || a.village || a.state_district || a.county || '');
  const parts = [a.house_number, a.road, a.neighbourhood || a.suburb, a.city_district, a.postcode].filter(Boolean);
  return { address: parts.join(', ') || data.display_name, city };
}

function mapsUrl(lat = state.lat, lng = state.lng) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

// ---------- generate ----------
function makeRefId() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `AWZ-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function shortArea() {
  if (state.landmark) return state.landmark;
  return state.address.split(',').slice(0, 2).join(',').trim() || state.city;
}

function handlesFor(s, cityInfo) {
  const h = [...(cityInfo?.handles || [])];
  if (s.extras.roadType === 'National / State highway') h.unshift(...(s.issue.highwayHandles || []));
  h.push(...s.issue.nationalHandles);
  return [...new Set(h)].slice(0, 3);
}

function buildLetter(s, id, cityInfo, when) {
  const body = cityInfo ? cityInfo.body : `Municipal Corporation / Nagar Nigam, ${s.city}`;
  const lines = [
    `To,`,
    `The Commissioner / Officer In-charge,`,
    `${s.issue.dept},`,
    `${body}`,
    ``,
    `Subject: Complaint regarding "${s.problem}" at ${shortArea()}, ${s.city} (Ref: ${id})`,
    ``,
    `Respected Sir/Madam,`,
    ``,
    `I wish to bring the following civic issue to your urgent attention:`,
    ``,
    `• Issue: ${s.problem}`,
    ...s.issue.extras.filter(x => s.extras[x.id]).map(x => `• ${x.label.replace('?', '')}: ${s.extras[x.id]}`),
    `• Location: ${[s.address, s.landmark && `near ${s.landmark}`, s.city].filter(Boolean).join(', ')}`,
    s.lat != null ? `• GPS: ${s.lat}, ${s.lng} (${mapsUrl(s.lat, s.lng)})` : null,
    `• Reported on: ${when.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
    s.notes ? `• Additional details: ${s.notes}` : null,
    ``,
    s.photo ? `A geo-tagged, time-stamped photograph of the site is attached as evidence.\n` : null,
    `I request you to kindly get this resolved at the earliest, within the timeline of your Citizen Charter, and share the action taken. I will follow up on this complaint.`,
    ``,
    `Thanking you,`,
    s.name || 'A concerned citizen',
    s.phone ? `Mobile: ${s.phone}` : null,
  ];
  return lines.filter(l => l !== null).join('\n');
}

function buildPost(s, id, cityInfo) {
  const handles = handlesFor(s, cityInfo).join(' ');
  const extra = [s.extras.since && `Since: ${s.extras.since}.`, s.extras.danger && `${s.extras.danger}!`].filter(Boolean).join(' ');
  const tail = `${s.lat != null ? `\n📍 ${mapsUrl(s.lat, s.lng)}` : ''}\nRef ${id}\n${handles} please act. ${s.issue.hashtags.join(' ')}`;
  let area = `${shortArea()}, ${s.city}`;
  const head = a => `${s.issue.emoji} ${s.problem} at ${a}. ${extra}`.trim();
  // X counts every link as 23 chars; keep a safe margin.
  const len = t => t.replace(/https?:\/\/\S+/g, 'x'.repeat(23)).length;
  while (len(head(area) + tail) > 275 && area.length > 20) area = area.slice(0, -10) + '…';
  return head(area) + tail;
}

async function stampPhoto(dataUrl, id, when) {
  const img = await loadImage(dataUrl);
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const fs = Math.max(14, Math.round(c.width / 40));
  const lines = [
    state.lat != null ? `📍 ${state.lat}, ${state.lng}  (±${state.accuracy} m)` : `📍 ${shortArea()}`,
    `${state.city}  •  ${when.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
    `${state.issue.emoji} ${state.problem}  •  Ref ${id}  •  Awaaz`,
  ];
  const pad = fs * 0.6;
  const band = lines.length * fs * 1.35 + pad * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, c.height - band, c.width, band);
  ctx.fillStyle = '#FF9933';
  ctx.fillRect(0, c.height - band, c.width, Math.max(3, fs / 5));
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${fs}px system-ui, sans-serif`;
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, pad, c.height - band + pad + i * fs * 1.35, c.width - pad * 2));
  return c.toDataURL('image/jpeg', 0.85);
}

async function dataUrlToFile(dataUrl, name) {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: 'image/jpeg' });
}

async function finish() {
  const when = new Date();
  const id = makeRefId();
  const cityInfo = findCity(state.city) || findCity(state.address);
  const letter = buildLetter(state, id, cityInfo, when);
  const post = buildPost(state, id, cityInfo);
  const subject = `Complaint: ${state.problem} at ${shortArea()}, ${state.city} (Ref ${id})`;
  const stamped = state.photo ? await stampPhoto(state.photo, id, when) : null;
  const photoFile = stamped ? await dataUrlToFile(stamped, `${id}.jpg`) : null;

  $('#refId').textContent = id;
  $('#letter').textContent = letter;
  const img = $('#stampedPhoto');
  img.hidden = !stamped;
  if (stamped) img.src = stamped;

  const actions = [];
  const canShareFile = photoFile && navigator.canShare?.({ files: [photoFile] });
  if (canShareFile || navigator.share) {
    actions.push({ label: canShareFile ? '📤 Share with photo' : '📤 Share', cls: 'primary', onClick: async () => {
      try {
        await navigator.share({ title: subject, text: letter, ...(canShareFile ? { files: [photoFile] } : {}) });
      } catch (err) {
        if (err.name !== 'AbortError') toast('Sharing failed. Try another option.');
      }
    } });
  }
  actions.push({ label: '𝕏 Tag officials on X', cls: 'x', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post)}` });
  actions.push({ label: '💬 WhatsApp', cls: 'wa', href: `https://wa.me/?text=${encodeURIComponent(letter)}` });
  actions.push({ label: '✉️ Email', cls: 'mail', href: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter)}` });
  if (stamped) actions.push({ label: '⬇️ Save evidence photo', cls: 'ghost', href: stamped, download: `${id}.jpg` });
  actions.push({ label: '📋 Copy X post', cls: 'ghost', onClick: () => copyText(post) });

  const box = $('#actions');
  box.innerHTML = '';
  actions.forEach(a => {
    const el = document.createElement(a.href ? 'a' : 'button');
    el.className = `btn ${a.cls}`;
    el.textContent = a.label;
    if (a.href) {
      el.href = a.href;
      if (a.download) el.download = a.download;
      else if (a.href.startsWith('http')) { el.target = '_blank'; el.rel = 'noopener'; }
    }
    if (a.onClick) el.addEventListener('click', a.onClick);
    box.appendChild(el);
  });
  if (stamped) {
    const tip = document.createElement('p');
    tip.className = 'hint';
    tip.textContent = 'Tip: X / WhatsApp links can\'t carry the photo. Save it first, then attach it.';
    box.appendChild(tip);
  }

  $('#portals').innerHTML = state.issue.portals.map(p => `
    <a class="portal" href="${p.url}" ${p.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
      <b>${esc(p.name)} ↗</b><span>${esc(p.desc)}</span>
    </a>`).join('');

  const list = store.get(STORE_KEY, []);
  list.unshift({
    id, issue: state.issue.key, problem: state.problem, area: shortArea(), city: state.city,
    lat: state.lat, lng: state.lng, createdAt: when.toISOString(), status: 'open',
    handles: handlesFor(state, cityInfo),
  });
  if (!store.set(STORE_KEY, list.slice(0, 100))) toast('Could not save to this device (private mode?)');

  show('result');
}

// ---------- my complaints: the accountability ledger ----------
function daysSince(iso, until = Date.now()) {
  return Math.max(0, Math.floor((until - new Date(iso).getTime()) / 86400000));
}

function buildEscalation(c) {
  const n = daysSince(c.createdAt);
  const issue = ISSUES[c.issue];
  return `⏰ Day ${n}: My complaint (Ref ${c.id}) about "${c.problem}" at ${c.area}, ${c.city} is STILL not resolved.` +
    `${c.lat != null ? `\n📍 ${mapsUrl(c.lat, c.lng)}` : ''}` +
    `\n${c.handles.join(' ')} when will this be fixed? ${issue.hashtags.join(' ')} #Day${n}`;
}

function renderMine() {
  const list = store.get(STORE_KEY, []);
  const fixed = list.filter(c => c.status === 'fixed');
  const avg = fixed.length
    ? Math.round(fixed.reduce((s, c) => s + daysSince(c.createdAt, new Date(c.fixedAt).getTime()), 0) / fixed.length)
    : null;
  $('#scoreboard').innerHTML = `
    <div><b>${list.length}</b><span>raised</span></div>
    <div><b>${list.length - fixed.length}</b><span>pending</span></div>
    <div><b>${fixed.length}</b><span>fixed</span></div>
    <div><b>${avg ?? '–'}</b><span>avg days to fix</span></div>`;

  if (!list.length) {
    $('#mineList').innerHTML = `<div class="empty">No complaints yet.<br>India won't fix itself. <button class="link-btn" data-go="home">Raise your first Awaaz →</button></div>`;
    updateMineCount();
    return;
  }

  $('#mineList').innerHTML = list.map(c => {
    const issue = ISSUES[c.issue];
    const open = c.status === 'open';
    const days = open ? daysSince(c.createdAt) : daysSince(c.createdAt, new Date(c.fixedAt).getTime());
    const overdue = open && days >= ESCALATE_AFTER_DAYS;
    return `
    <article class="complaint ${open ? (overdue ? 'overdue' : '') : 'fixed'}" data-id="${c.id}">
      <div class="row">
        <span class="emoji">${issue.emoji}</span>
        <div class="grow">
          <b>${esc(c.problem)}</b>
          <div class="meta">${esc(c.area)}, ${esc(c.city)} · ${c.id}</div>
        </div>
        <span class="badge">${open ? (overdue ? `🔥 ${days}d overdue` : `⏳ Day ${days}`) : `✅ Fixed in ${days}d`}</span>
      </div>
      ${open ? `
      <div class="row btns">
        <button class="btn small ${overdue ? 'primary' : 'ghost'}" data-act="escalate">📣 Escalate on X</button>
        <button class="btn small ghost" data-act="fixed">🎉 Got fixed</button>
        <button class="btn small ghost" data-act="delete" aria-label="Delete">🗑</button>
      </div>` : `
      <div class="row btns"><button class="btn small ghost" data-act="thank">🙏 Thank them publicly</button>
      <button class="btn small ghost" data-act="delete" aria-label="Delete">🗑</button></div>`}
    </article>`;
  }).join('');
  updateMineCount();
}

$('#mineList').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.closest('[data-id]').dataset.id;
  const list = store.get(STORE_KEY, []);
  const c = list.find(x => x.id === id);
  if (!c) return;
  const act = btn.dataset.act;
  if (act === 'escalate') {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(buildEscalation(c))}`, '_blank', 'noopener');
    return;
  }
  if (act === 'thank') {
    const d = daysSince(c.createdAt, new Date(c.fixedAt).getTime());
    const text = `🙏 ${c.problem} at ${c.area}, ${c.city} has been fixed in ${d} day${d === 1 ? '' : 's'} (Ref ${c.id}). Thank you ${c.handles.join(' ')}! This is how it should work. #Awaaz`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    return;
  }
  if (act === 'fixed') { c.status = 'fixed'; c.fixedAt = new Date().toISOString(); toast('🎉 One less problem in India!'); }
  if (act === 'delete') {
    if (btn.dataset.confirm !== '1') { btn.dataset.confirm = '1'; btn.textContent = 'Sure?'; return; }
    list.splice(list.indexOf(c), 1);
  }
  store.set(STORE_KEY, list);
  renderMine();
});

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

show('home');

// Started by auth.js once the user is logged in and onboarded.
window.startApp = (account, session) => {
  'use strict';

  const STORE_KEY = `partyfinder.v1:${account.key}`;
  const profile = account.profile;
  const city = CITIES.find((c) => c.id === profile.city) || CITIES[0];
  const seed = createSeed(Date.now());
  const saved = loadSaved();

  const state = {
    view: 'tonight',
    sort: 'foryou',
    category: 'all',
    freeOnly: false,
    friendsOnly: false,
    maxFee: 0, // 0 means any budget
    openEventId: null,
    crewDraftEventId: null,
    loc: city.live ? profileBase(profile) : { ...DEFAULT_LOCATION },
    people: seed.people,
    venues: seed.venues,
    events: seed.events,
    stories: [...seed.stories, ...saved.stories],
    plans: [...seed.plans, ...saved.plans],
    crews: [...seed.crews, ...saved.crews],
    going: saved.going,           // { eventId: { share: bool } }
    looking: saved.looking,       // [eventId]
    joinedCrews: saved.joinedCrews,
    joinedPlans: saved.joinedPlans,
    replies: saved.replies,       // { planId: [reply] } for replies added to seed plans
  };

  // ---------- persistence ----------

  function loadSaved() {
    const empty = { stories: [], plans: [], crews: [], going: {}, looking: [], joinedCrews: [], joinedPlans: [], replies: {} };
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? { ...empty, ...JSON.parse(raw) } : empty;
    } catch {
      return empty;
    }
  }

  function save() {
    const data = {
      stories: state.stories.filter((s) => s.mine),
      plans: state.plans.filter((p) => p.mine),
      crews: state.crews.filter((c) => c.mine),
      going: state.going,
      looking: state.looking,
      joinedCrews: state.joinedCrews,
      joinedPlans: state.joinedPlans,
      replies: state.replies,
    };
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable (private mode etc.) — the app still works for this session.
    }
  }

  // ---------- helpers ----------

  const $ = (sel) => document.querySelector(sel);

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const naira = (n) => (n === 0 ? 'Free' : '₦' + n.toLocaleString('en-NG'));
  const clock = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  function timeAgo(t) {
    const mins = Math.max(0, Math.round((Date.now() - t) / MIN));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.round(mins / 60)}h ago`;
  }

  function km(a, b) {
    const R = 6371;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  const venueOf = (e) => state.venues[e.venueId];
  const eventById = (id) => state.events.find((e) => e.id === id);
  const person = (id) => state.people[id] || { name: 'Someone' };
  const distanceTo = (e) => km(state.loc, venueOf(e));

  function status(e) {
    const now = Date.now();
    if (now < e.start) {
      const mins = Math.round((e.start - now) / MIN);
      return { key: 'upcoming', label: mins < 60 ? `Starts in ${mins}m` : `Starts ${clock(e.start)}` };
    }
    if (now < e.end) return { key: 'live', label: `Live · until ${clock(e.end)}` };
    return { key: 'ended', label: 'Ended' };
  }

  // Vibe = average of the last 2 hours of stories, otherwise the organiser's estimate.
  function vibe(e) {
    const recent = state.stories.filter((s) => s.eventId === e.id && Date.now() - s.at < 2 * HOUR);
    const score = recent.length
      ? Math.round(recent.reduce((sum, s) => sum + s.vibe, 0) / recent.length)
      : status(e).key === 'ended' ? 0 : e.baseVibe;
    return { score, label: VIBE_LABELS[score], fresh: recent.length > 0 };
  }

  const match = (e) => matchEvent(e, venueOf(e), profile);

  function friendsGoing(e) {
    const ids = [...e.friendIds];
    if (state.going[e.id]) ids.unshift('me');
    return ids;
  }

  function lookingCount(e) {
    return e.lookingCount + (state.looking.includes(e.id) ? 1 : 0);
  }

  function avatar(id, size = '') {
    const name = person(id).name;
    let hash = 0;
    for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
    return `<span class="avatar ${size}" style="--hue:${hash}" title="${esc(name)}">${esc(name[0])}</span>`;
  }

  function avatars(ids, max = 4) {
    const shown = ids.slice(0, max).map((id) => avatar(id, 'sm')).join('');
    const more = ids.length > max ? `<span class="avatar sm more">+${ids.length - max}</span>` : '';
    return `<span class="avatar-stack">${shown}${more}</span>`;
  }

  function vibeMeter(v) {
    const bars = [1, 2, 3, 4, 5].map((i) => `<i class="${i <= v.score ? 'on' : ''}"></i>`).join('');
    return `<span class="vibe vibe-${v.score}" title="${v.fresh ? 'Based on live updates' : 'Organiser estimate'}"><span class="bars">${bars}</span>${esc(v.label)}</span>`;
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---------- filtering & sorting ----------

  function visibleEvents() {
    let list = state.events.filter((e) => {
      if (state.category !== 'all' && e.category !== state.category) return false;
      if (state.freeOnly && e.fee > 0) return false;
      if (state.maxFee && e.fee > state.maxFee) return false;
      if (state.friendsOnly && friendsGoing(e).length === 0) return false;
      return true;
    });

    const rank = { live: 0, upcoming: 1, ended: 2 };
    const sorters = {
      foryou: (a, b) => match(b).score - match(a).score || rank[status(a).key] - rank[status(b).key],
      soonest: (a, b) => rank[status(a).key] - rank[status(b).key] || a.start - b.start,
      nearest: (a, b) => distanceTo(a) - distanceTo(b),
      hottest: (a, b) => vibe(b).score - vibe(a).score || lookingCount(b) - lookingCount(a),
    };
    list.sort((a, b) => (status(a).key === 'ended') - (status(b).key === 'ended') || sorters[state.sort](a, b));
    return list;
  }

  // Events that fit a "What's the plan?" post: in budget, still on, genre match first, then closest to the area.
  function matchesForPlan(plan) {
    const origin = AREAS[plan.area] || DEFAULT_LOCATION;
    return state.events
      .filter((e) => status(e).key !== 'ended' && e.fee <= plan.budget)
      .map((e) => ({ e, genre: e.genres.includes(plan.genre), dist: km(origin, venueOf(e)) }))
      .sort((a, b) => b.genre - a.genre || a.dist - b.dist)
      .slice(0, 2)
      .map((m) => m.e);
  }

  // ---------- views ----------

  function renderFilters() {
    const cats = [['all', 'All', '✨'], ...Object.entries(CATEGORIES).map(([k, c]) => [k, c.label, c.emoji])];
    const sorts = [['foryou', 'For you'], ['soonest', 'Soonest'], ['nearest', 'Nearest'], ['hottest', 'Hottest vibe']];
    const budgets = [[0, 'Any budget'], [5000, 'Under ₦5k'], [10000, 'Under ₦10k'], [15000, 'Under ₦15k'], [20000, 'Under ₦20k']];
    return `
      <div class="chips scroll">
        ${cats.map(([k, label, emoji]) => `<button class="chip ${state.category === k ? 'active' : ''}" data-action="set-category" data-value="${k}">${emoji} ${esc(label)}</button>`).join('')}
      </div>
      <div class="filter-row">
        <div class="segmented">
          ${sorts.map(([k, label]) => `<button class="${state.sort === k ? 'active' : ''}" data-action="set-sort" data-value="${k}">${label}</button>`).join('')}
        </div>
        <select data-change="maxFee" aria-label="Budget">
          ${budgets.map(([v, label]) => `<option value="${v}" ${state.maxFee === v ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <button class="chip ${state.freeOnly ? 'active' : ''}" data-action="toggle-free">Free only</button>
        <button class="chip ${state.friendsOnly ? 'active' : ''}" data-action="toggle-friends">Friends going</button>
      </div>`;
  }

  function renderStoryStrip() {
    const recent = [...state.stories]
      .filter((s) => Date.now() - s.at < 2 * HOUR)
      .sort((a, b) => b.at - a.at)
      .slice(0, 8);
    if (!recent.length) return '';
    return `
      <section>
        <h2 class="section-title">Live from the venues</h2>
        <div class="story-strip scroll">
          ${recent.map((s) => {
            const e = eventById(s.eventId);
            const by = s.venueId ? state.venues[s.venueId].name : person(s.personId).name;
            return `<button class="story-bubble vibe-bg-${s.vibe}" data-action="open-event" data-id="${e.id}">
              <span class="story-crowd">${esc(s.crowd)}</span>
              <span class="story-text">${esc(s.text)}</span>
              <span class="story-by">${esc(by)}${s.venueId && state.venues[s.venueId].verified ? ' ✔' : ''} · ${timeAgo(s.at)}</span>
            </button>`;
          }).join('')}
        </div>
      </section>`;
  }

  function eventCard(e) {
    const v = venueOf(e);
    const st = status(e);
    const cat = CATEGORIES[e.category];
    const friends = friendsGoing(e);
    const looking = lookingCount(e);
    const m = match(e);
    return `
      <article class="card event-card ${st.key}" data-action="open-event" data-id="${e.id}" tabindex="0">
        <div class="event-thumb cat-${e.category}">${cat.emoji}</div>
        <div class="event-body">
          <div class="event-top">
            <span class="pill pill-${st.key}">${st.key === 'live' ? '<span class="dot"></span>' : ''}${esc(st.label)}</span>
            ${st.key !== 'ended' && m.score >= 50 ? `<span class="pill pill-match">${m.score}% match</span>` : ''}
            ${e.promoted ? '<span class="pill pill-promoted">Promoted</span>' : ''}
          </div>
          ${st.key !== 'ended' && m.score >= 50 && m.reasons.length ? `<p class="match-why">Because you like ${m.reasons.map(esc).join(' & ')}</p>` : ''}
          <h3>${esc(e.title)}</h3>
          <p class="muted">${esc(v.name)}${v.verified ? ' <span class="verified" title="Verified venue">✔</span>' : ''} · ${esc(v.area)} · ${distanceTo(e).toFixed(1)} km</p>
          <div class="event-meta">
            <span class="fee">${naira(e.fee)}</span>
            ${vibeMeter(vibe(e))}
          </div>
          ${friends.length || looking ? `<div class="event-social">
            ${friends.length ? `${avatars(friends)} <span>${friends.length === 1 && friends[0] === 'me' ? 'You’re going' : `${friends.length} friend${friends.length > 1 ? 's' : ''} going`}</span>` : ''}
            ${looking ? `<span class="looking">👋 ${looking} looking for company</span>` : ''}
          </div>` : ''}
        </div>
      </article>`;
  }

  function renderTonight() {
    const list = visibleEvents();
    const liveCount = state.events.filter((e) => status(e).key === 'live').length;
    const upcoming = state.events.filter((e) => status(e).key === 'upcoming').length;
    const day = new Date().toLocaleDateString([], { weekday: 'long' });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = account.name.trim().split(/\s+/)[0];
    const picks = state.events.filter((e) => status(e).key !== 'ended' && match(e).score >= 50).length;
    return `
      <section class="hero">
        <p class="eyebrow">${esc(day)} · ${clock(Date.now())} · Abuja</p>
        <h1>${greeting}, ${esc(name)}. Find your vibe, find your people, and go.</h1>
        <p class="muted"><strong>${liveCount}</strong> happening now · <strong>${upcoming}</strong> starting later · <strong>${picks}</strong> picked for you</p>
      </section>
      ${city.live ? '' : `<div class="card city-note">Party Finder isn't in ${esc(city.id)} yet. You're seeing Abuja for now, and we'll let you know when ${esc(city.id)} goes live.</div>`}
      ${renderStoryStrip()}
      ${renderFilters()}
      <section class="event-list">
        ${list.length ? list.map(eventCard).join('') : '<p class="empty">Nothing matches those filters. Try widening your budget.</p>'}
      </section>`;
  }

  function renderPlans() {
    const plans = [...state.plans].sort((a, b) => b.at - a.at);
    return `
      <section class="hero compact">
        <h1>What's the plan?</h1>
        <p class="muted">Say what you're in the mood for. People can join you or suggest a spot.</p>
      </section>
      <form class="card composer" data-form="plan">
        <textarea name="text" rows="2" maxlength="280" required placeholder="Who's going out tonight? Budget ₦15k, Afrobeats, around Wuse…"></textarea>
        <div class="form-row">
          <label>Budget <input name="budget" type="number" min="0" step="1000" value="${Math.min(50000, BUDGETS.find((b) => b.id === profile.budget)?.max ?? 15000)}" required></label>
          <label>Area <select name="area">${Object.keys(AREAS).map((a) => `<option ${a === profile.area ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></label>
          <label>Music <select name="genre">${GENRES.map((g) => `<option ${g === profile.genres[0] ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></label>
        </div>
        <button class="btn primary" type="submit">Post plan</button>
      </form>
      <section class="plan-list">${plans.map(planCard).join('')}</section>`;
  }

  function planCard(p) {
    const replies = [...p.replies, ...(state.replies[p.id] || [])];
    const joined = state.joinedPlans.includes(p.id);
    const joiners = [...p.joiners, ...(joined ? ['me'] : [])];
    const isMine = p.personId === 'me';
    const matches = matchesForPlan(p);
    return `
      <article class="card plan-card">
        <header class="row">
          ${avatar(p.personId)}
          <div><strong>${esc(person(p.personId).name)}</strong>${person(p.personId).friend ? ' <span class="tag">Friend</span>' : ''}<br><span class="muted small">${timeAgo(p.at)}</span></div>
        </header>
        <p class="plan-text">${esc(p.text)}</p>
        <div class="chips">
          <span class="chip static">💸 ${naira(p.budget)}</span>
          <span class="chip static">📍 ${esc(p.area)}</span>
          <span class="chip static">🎶 ${esc(p.genre)}</span>
        </div>
        ${matches.length ? `<div class="suggest">
          <p class="small muted">Suggested spots</p>
          ${matches.map((e) => `<button class="link-event" data-action="open-event" data-id="${e.id}">${CATEGORIES[e.category].emoji} ${esc(e.title)} · ${naira(e.fee)}</button>`).join('')}
        </div>` : ''}
        ${replies.length ? `<ul class="replies">
          ${replies.map((r) => `<li>${avatar(r.personId, 'sm')}<div><strong>${esc(person(r.personId).name)}</strong> ${esc(r.text)}
            ${r.eventId ? `<button class="link-event" data-action="open-event" data-id="${r.eventId}">→ ${esc(eventById(r.eventId).title)}</button>` : ''}
            <span class="muted small"> · ${timeAgo(r.at)}</span></div></li>`).join('')}
        </ul>` : ''}
        <div class="row between">
          <span class="muted small">${joiners.length ? `${avatars(joiners)} ${joiners.length} in` : 'Be the first to join'}</span>
          ${isMine ? '<span class="tag">Your plan</span>' : `<button class="btn ${joined ? '' : 'primary'} sm" data-action="toggle-plan" data-id="${p.id}">${joined ? 'Joined ✓' : "I'm in"}</button>`}
        </div>
        <form class="reply-form" data-form="reply" data-id="${p.id}">
          <input name="text" maxlength="200" placeholder="Reply or suggest a spot…" required>
          <select name="eventId" aria-label="Suggest an event">
            <option value="">No event</option>
            ${state.events.filter((e) => status(e).key !== 'ended').map((e) => `<option value="${e.id}">${esc(e.title)}</option>`).join('')}
          </select>
          <button class="btn sm" type="submit">Send</button>
        </form>
      </article>`;
  }

  function crewCard(c) {
    const e = eventById(c.eventId);
    const joined = c.members.includes('me') || state.joinedCrews.includes(c.id);
    const members = [...c.members, ...(state.joinedCrews.includes(c.id) ? ['me'] : [])];
    const spots = c.max - members.length;
    const isOwner = c.ownerId === 'me';
    return `
      <article class="card crew-card">
        <div class="row between">
          <h3>${esc(c.name)}</h3>
          ${c.open ? '<span class="tag">Open to join</span>' : '<span class="tag">Invite only</span>'}
        </div>
        <button class="link-event" data-action="open-event" data-id="${e.id}">${CATEGORIES[e.category].emoji} ${esc(e.title)} · ${esc(status(e).label)}</button>
        ${c.note ? `<p class="small">${esc(c.note)}</p>` : ''}
        <div class="row between">
          <span class="small">${avatars(members, 6)} ${members.length}/${c.max}${spots > 0 ? ` · ${spots} spot${spots > 1 ? 's' : ''} left` : ' · Full'}</span>
          ${isOwner ? '<span class="tag">You started this</span>'
            : joined ? `<button class="btn sm" data-action="toggle-crew" data-id="${c.id}">Leave</button>`
            : spots > 0 && c.open ? `<button class="btn primary sm" data-action="toggle-crew" data-id="${c.id}">Join crew</button>` : ''}
        </div>
        ${c.invited.length ? `<p class="muted small">Invited: ${c.invited.map((id) => esc(person(id).name)).join(', ')} (pending)</p>` : ''}
      </article>`;
  }

  function renderCrews() {
    const mine = state.crews.filter((c) => c.members.includes('me') || state.joinedCrews.includes(c.id));
    const open = state.crews.filter((c) => !mine.includes(c) && c.open && status(eventById(c.eventId)).key !== 'ended');
    const friends = Object.entries(state.people).filter(([, p]) => p.friend);
    const eventOptions = state.events.filter((e) => status(e).key !== 'ended');
    return `
      <section class="hero compact">
        <h1>Find your crew</h1>
        <p class="muted">Start a group plan, invite friends, or join people already heading out.</p>
      </section>
      <form class="card composer" data-form="crew">
        <label>Crew name <input name="name" maxlength="40" required placeholder="Friday rooftop gang"></label>
        <label>Event
          <select name="eventId">${eventOptions.map((e) => `<option value="${e.id}" ${state.crewDraftEventId === e.id ? 'selected' : ''}>${esc(e.title)} · ${esc(venueOf(e).name)}</option>`).join('')}</select>
        </label>
        <label>Note <input name="note" maxlength="120" placeholder="Where to meet, splitting a table, transport…"></label>
        <fieldset>
          <legend>Invite friends</legend>
          <div class="chips">${friends.map(([id, p]) => `<label class="chip check"><input type="checkbox" name="invite" value="${id}"> ${esc(p.name)}</label>`).join('')}</div>
        </fieldset>
        <div class="form-row">
          <label>Max size <input name="max" type="number" min="2" max="20" value="6"></label>
          <label class="inline"><input type="checkbox" name="open" checked> Let others join</label>
        </div>
        <button class="btn primary" type="submit">Create crew</button>
      </form>
      ${mine.length ? `<h2 class="section-title">Your crews</h2>${mine.map(crewCard).join('')}` : ''}
      <h2 class="section-title">Open crews tonight</h2>
      ${open.length ? open.map(crewCard).join('') : '<p class="empty">No open crews right now. Start one!</p>'}`;
  }

  function renderSheet() {
    const sheet = $('#sheet');
    const e = state.openEventId && eventById(state.openEventId);
    document.body.classList.toggle('sheet-open', !!e);
    if (!e) {
      sheet.hidden = true;
      sheet.innerHTML = '';
      return;
    }
    const v = venueOf(e);
    const st = status(e);
    const going = state.going[e.id];
    const looking = state.looking.includes(e.id);
    const friends = friendsGoing(e);
    const stories = state.stories.filter((s) => s.eventId === e.id).sort((a, b) => b.at - a.at);
    const crews = state.crews.filter((c) => c.eventId === e.id);
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`;

    sheet.hidden = false;
    sheet.innerHTML = `
      <div class="sheet-backdrop" data-action="close-sheet"></div>
      <div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <button class="sheet-close" data-action="close-sheet" aria-label="Close">✕</button>
        <div class="sheet-hero cat-${e.category}">${CATEGORIES[e.category].emoji}</div>
        <div class="sheet-content">
          <div class="event-top">
            <span class="pill pill-${st.key}">${st.key === 'live' ? '<span class="dot"></span>' : ''}${esc(st.label)}</span>
            ${e.promoted ? '<span class="pill pill-promoted">Promoted</span>' : ''}
            ${vibeMeter(vibe(e))}
          </div>
          <h2 id="sheet-title">${esc(e.title)}</h2>
          <p class="muted">${esc(v.name)}${v.verified ? ' <span class="verified">✔ Verified venue</span>' : ''} · ${esc(v.area)}</p>
          <p>${esc(e.description)}</p>

          <dl class="facts">
            <div><dt>Entry</dt><dd>${naira(e.fee)}${e.tickets ? ' · tickets on Party Finder' : ' · pay at the door'}</dd></div>
            <div><dt>Time</dt><dd>${clock(e.start)} – ${clock(e.end)}</dd></div>
            <div><dt>Dress code</dt><dd>${esc(e.dressCode)}</dd></div>
            <div><dt>Distance</dt><dd>${distanceTo(e).toFixed(1)} km from ${esc(state.loc.label)}</dd></div>
            <div><dt>Music</dt><dd>${e.genres.map(esc).join(', ')}</dd></div>
          </dl>

          ${st.key !== 'ended' ? `
          <div class="actions">
            <button class="btn ${going ? '' : 'primary'}" data-action="toggle-going" data-id="${e.id}">${going ? 'Going ✓' : "I'm going"}</button>
            <button class="btn ${looking ? 'active' : ''}" data-action="toggle-looking" data-id="${e.id}">👋 ${looking ? 'Looking for company ✓' : 'Looking for company'}</button>
            <a class="btn" href="${directions}" target="_blank" rel="noopener">🧭 Directions</a>
            ${e.tickets ? `<button class="btn" data-action="demo" data-msg="Ticket checkout would open here (commission revenue).">🎟 Get tickets</button>` : ''}
            ${e.tables ? `<button class="btn" data-action="demo" data-msg="Table booking request would go to the venue (referral revenue).">🛋 Book a table</button>` : ''}
            <button class="btn" data-action="share" data-id="${e.id}">↗ Share</button>
          </div>
          ${going ? `<label class="inline small"><input type="checkbox" data-change="share" data-id="${e.id}" ${going.share ? 'checked' : ''}> Show friends that I'm going</label>` : ''}` : ''}

          <section>
            <h3 class="section-title">Who's going</h3>
            ${friends.length ? `<p>${avatars(friends, 8)} ${friends.map((id) => esc(person(id).name)).join(', ')}</p>` : '<p class="muted small">None of your friends have shared that they are going.</p>'}
            <p class="small">👋 ${lookingCount(e)} people are looking for company for this event.</p>
          </section>

          <section>
            <div class="row between">
              <h3 class="section-title">Crews heading here</h3>
              ${st.key !== 'ended' ? `<button class="btn sm" data-action="start-crew" data-id="${e.id}">+ Start a crew</button>` : ''}
            </div>
            ${crews.length ? crews.map(crewCard).join('') : '<p class="muted small">No crews yet.</p>'}
          </section>

          <section>
            <h3 class="section-title">Live stories</h3>
            ${st.key !== 'ended' ? `
            <form class="card composer story-form" data-form="story" data-id="${e.id}">
              <input name="text" maxlength="200" required placeholder="What's it like right now?">
              <div class="form-row">
                <label>Crowd <select name="crowd">${['Empty', 'Quiet', 'Cozy', 'Filling up', 'Packed', 'Queue forming'].map((c) => `<option>${c}</option>`).join('')}</select></label>
                <label>Vibe <select name="vibe">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${n === 3 ? 'selected' : ''}>${n} · ${VIBE_LABELS[n]}</option>`).join('')}</select></label>
              </div>
              <button class="btn primary sm" type="submit">Post update</button>
            </form>` : ''}
            ${stories.length ? `<ul class="stories">
              ${stories.map((s) => {
                const by = s.venueId ? state.venues[s.venueId].name : person(s.personId).name;
                const verified = s.venueId && state.venues[s.venueId].verified;
                return `<li class="vibe-border-${s.vibe}">
                  <div class="row between"><strong>${esc(by)}${verified ? ' <span class="verified">✔</span>' : ''}</strong><span class="muted small">${timeAgo(s.at)}</span></div>
                  <p>${esc(s.text)}</p>
                  <span class="small muted">${esc(s.crowd)} · ${VIBE_LABELS[s.vibe]}</span>
                </li>`;
              }).join('')}
            </ul>` : '<p class="muted small">No updates yet. Be the first to post.</p>'}
          </section>
        </div>
      </div>`;
  }

  // ---------- map ----------

  let map = null;
  let markerLayer = null;
  let userMarker = null;
  const VIBE_COLORS = ['#6b7280', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#ef4444'];

  function ensureMap() {
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
      return true;
    }
    if (typeof L === 'undefined') {
      $('#map').innerHTML = '<p class="empty">The map needs an internet connection to load.</p>';
      return false;
    }
    map = L.map('map', { zoomControl: true }).setView([state.loc.lat, state.loc.lng], 13);
    // Standard OSM tiles, darkened in CSS (.leaflet-tile-pane). Swap for a paid tile provider in production.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    return true;
  }

  function updateMarkers() {
    if (!ensureMap()) return;
    markerLayer.clearLayers();
    const perVenue = {};
    for (const e of visibleEvents()) {
      const v = venueOf(e);
      const idx = (perVenue[e.venueId] = (perVenue[e.venueId] ?? -1) + 1);
      const st = status(e);
      const vb = vibe(e);
      const icon = L.divIcon({
        className: '',
        html: `<div class="pin pin-${st.key}" style="--c:${VIBE_COLORS[vb.score]}">${CATEGORIES[e.category].emoji}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });
      L.marker([v.lat + idx * 0.0015, v.lng + idx * 0.0015], { icon })
        .bindPopup(`
          <div class="popup">
            <strong>${esc(e.title)}</strong><br>
            ${esc(v.name)} · ${naira(e.fee)}<br>
            <span class="small">${esc(st.label)} · ${esc(vb.label)}</span><br>
            <button class="btn primary sm" data-action="open-event" data-id="${e.id}">View details</button>
          </div>`)
        .addTo(markerLayer);
    }
    if (userMarker) userMarker.remove();
    userMarker = L.circleMarker([state.loc.lat, state.loc.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 })
      .bindTooltip('You')
      .addTo(map);
  }

  function renderMapHeader() {
    return `
      ${renderFilters()}
      <div class="legend small">
        <span><i style="background:${VIBE_COLORS[5]}"></i>On fire</span>
        <span><i style="background:${VIBE_COLORS[4]}"></i>Packed</span>
        <span><i style="background:${VIBE_COLORS[3]}"></i>Lively</span>
        <span><i style="background:${VIBE_COLORS[2]}"></i>Warming up</span>
        <span><i style="background:${VIBE_COLORS[1]}"></i>Quiet</span>
        <span class="pulse-key">◉ Live now</span>
      </div>`;
  }

  // ---------- render ----------

  function render() {
    document.querySelectorAll('[data-nav]').forEach((b) => b.classList.toggle('active', b.dataset.nav === state.view));
    const isMap = state.view === 'map';
    $('#map-view').hidden = !isMap;
    document.body.classList.toggle('map-mode', isMap);
    const views = { tonight: renderTonight, map: renderMapHeader, plans: renderPlans, crews: renderCrews };
    $('#view').innerHTML = views[state.view]();
    $('#loc-label').textContent = state.loc.label;
    if (isMap) updateMarkers();
    renderSheet();
  }

  // ---------- actions ----------

  const actions = {
    nav: (el) => {
      state.view = el.dataset.nav;
      state.openEventId = null;
      if (map) map.closePopup();
      render();
      window.scrollTo(0, 0);
    },
    'open-event': (el) => {
      state.openEventId = el.dataset.id;
      if (map) map.closePopup();
      renderSheet();
    },
    'close-sheet': () => {
      state.openEventId = null;
      renderSheet();
    },
    'set-category': (el) => { state.category = el.dataset.value; render(); },
    'set-sort': (el) => { state.sort = el.dataset.value; render(); },
    'toggle-free': () => { state.freeOnly = !state.freeOnly; render(); },
    'toggle-friends': () => { state.friendsOnly = !state.friendsOnly; render(); },
    'toggle-going': (el) => {
      const id = el.dataset.id;
      if (state.going[id]) delete state.going[id];
      else {
        const share = profile.privacy.shareGoing;
        state.going[id] = { share };
        toast(share ? 'Nice! Your friends can see you are going. You can turn that off below.' : "You're going! This stays private unless you share it below.");
      }
      save();
      render();
    },
    'toggle-looking': (el) => {
      const id = el.dataset.id;
      const i = state.looking.indexOf(id);
      if (i >= 0) state.looking.splice(i, 1);
      else {
        state.looking.push(id);
        toast('Others looking for company at this event can now see you. Meet in public spots first.');
      }
      save();
      render();
    },
    'toggle-crew': (el) => {
      const id = el.dataset.id;
      const crew = state.crews.find((c) => c.id === id);
      if (crew.mine && crew.members.includes('me')) return;
      const i = state.joinedCrews.indexOf(id);
      if (i >= 0) state.joinedCrews.splice(i, 1);
      else {
        state.joinedCrews.push(id);
        toast(`You joined ${crew.name}.`);
      }
      save();
      render();
    },
    'toggle-plan': (el) => {
      const id = el.dataset.id;
      const i = state.joinedPlans.indexOf(id);
      if (i >= 0) state.joinedPlans.splice(i, 1);
      else {
        state.joinedPlans.push(id);
        toast("You're in! The poster has been notified.");
      }
      save();
      render();
    },
    'start-crew': (el) => {
      state.crewDraftEventId = el.dataset.id;
      state.openEventId = null;
      state.view = 'crews';
      render();
      window.scrollTo(0, 0);
      $('[data-form="crew"] input[name="name"]')?.focus();
    },
    share: async (el) => {
      const e = eventById(el.dataset.id);
      const v = venueOf(e);
      const text = `${e.title} at ${v.name}, ${v.area} · ${clock(e.start)} · ${naira(e.fee)}. Who's coming?`;
      try {
        if (navigator.share) await navigator.share({ title: e.title, text });
        else {
          await navigator.clipboard.writeText(text);
          toast('Copied to clipboard. Paste it in your group chat.');
        }
      } catch {
        // User cancelled the share sheet.
      }
    },
    locate: () => {
      if (!navigator.geolocation) return toast('Location is not available in this browser.');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (km(here, DEFAULT_LOCATION) > 60) {
            toast(`You seem to be outside Abuja. The demo data is Abuja-only, so distances are from ${DEFAULT_LOCATION.label}.`);
            return;
          }
          state.loc = { ...here, label: 'your location' };
          if (map) map.setView([here.lat, here.lng], 13);
          render();
          toast('Distances now use your location.');
        },
        () => toast('Could not get your location.'),
        { timeout: 8000 },
      );
    },
    demo: (el) => toast(el.dataset.msg),
    menu: () => {
      $('#menu').hidden = !$('#menu').hidden;
    },
    'edit-vibe': () => session.editVibe(),
    logout: () => session.logout(),
  };

  const forms = {
    plan: (f, data) => {
      state.plans.push({
        id: 'p' + Date.now(), personId: 'me', at: Date.now(), mine: true,
        text: data.get('text').trim(), budget: Number(data.get('budget')) || 0,
        area: data.get('area'), genre: data.get('genre'), replies: [], joiners: [],
      });
      toast('Plan posted. We added some suggested spots under it.');
    },
    reply: (f, data) => {
      const planId = f.dataset.id;
      (state.replies[planId] ||= []).push({ personId: 'me', at: Date.now(), text: data.get('text').trim(), eventId: data.get('eventId') || null });
    },
    crew: (f, data) => {
      state.crews.push({
        id: 'c' + Date.now(), mine: true, ownerId: 'me', members: ['me'],
        name: data.get('name').trim(), eventId: data.get('eventId'), note: data.get('note').trim(),
        invited: data.getAll('invite'), open: data.get('open') === 'on',
        max: Math.min(20, Math.max(2, Number(data.get('max')) || 6)),
      });
      state.crewDraftEventId = null;
      toast('Crew created. Invites sent to your friends.');
    },
    story: (f, data) => {
      state.stories.push({
        id: 's' + Date.now(), mine: true, eventId: f.dataset.id, personId: 'me', at: Date.now(),
        text: data.get('text').trim(), crowd: data.get('crowd'), vibe: Number(data.get('vibe')),
      });
      toast('Thanks! Your update helps people decide.');
    },
  };

  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#menu, [data-action="menu"]')) $('#menu').hidden = true;
    const el = ev.target.closest('[data-action], [data-nav]');
    if (!el) return;
    if (el.dataset.nav) return actions.nav(el);
    const fn = actions[el.dataset.action];
    if (fn) {
      ev.preventDefault();
      fn(el, ev);
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && state.openEventId) actions['close-sheet']();
    if (ev.key === 'Enter' && ev.target.matches('.event-card')) actions['open-event'](ev.target);
  });

  document.addEventListener('submit', (ev) => {
    const f = ev.target.closest('[data-form]');
    if (!f) return;
    ev.preventDefault();
    forms[f.dataset.form](f, new FormData(f));
    save();
    render();
  });

  document.addEventListener('change', (ev) => {
    const key = ev.target.dataset.change;
    if (key === 'maxFee') {
      state.maxFee = Number(ev.target.value);
      render();
    } else if (key === 'share') {
      state.going[ev.target.dataset.id].share = ev.target.checked;
      save();
    }
  });

  // Refresh statuses ("starts in 12m", live/ended) every minute.
  setInterval(() => {
    if (!document.activeElement || !document.activeElement.matches('input, textarea, select')) render();
  }, MIN);

  $('#me-initial').textContent = account.name.trim()[0].toUpperCase();
  $('#menu-name').textContent = account.name;
  render();
};

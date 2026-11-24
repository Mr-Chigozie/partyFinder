// Login, sign-up and onboarding. Hands off to window.startApp(account, session) once the user has a profile.
// Prototype only: accounts live in this browser's localStorage. A real launch needs a backend.
(() => {
  'use strict';

  const AUTH_KEY = 'partyfinder.auth';
  const REONBOARD_KEY = 'partyfinder.reonboard';
  const root = document.getElementById('auth-root');
  const seed = createSeed(Date.now());
  const db = load();

  // ---------- storage ----------

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(AUTH_KEY));
      if (raw && raw.accounts) return raw;
    } catch {
      // fall through
    }
    return { accounts: {}, session: null };
  }

  function persist() {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(db));
    } catch {
      // Storage blocked: the session still works until the tab closes.
    }
  }

  async function hashPassword(key, password) {
    const text = `partyfinder:${key}:${password}`;
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      let h = 0;
      for (const ch of text) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
      return 'weak-' + h.toString(16);
    }
  }

  // ---------- helpers ----------

  const $ = (sel, el = root) => el.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'friend';
  const naira = (n) => (n === 0 ? 'Free' : '₦' + n.toLocaleString('en-NG'));
  const clock = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // Accepts an email or a phone number (Nigerian local format is normalised to +234).
  function normaliseLogin(value) {
    const v = value.trim();
    if (v.includes('@')) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? { key: v.toLowerCase(), kind: 'email' } : null;
    }
    let digits = v.replace(/[\s()-]/g, '');
    if (/^0\d{10}$/.test(digits)) digits = '+234' + digits.slice(1);
    else if (/^234\d{10}$/.test(digits)) digits = '+' + digits;
    return /^\+\d{10,15}$/.test(digits) ? { key: digits, kind: 'phone' } : null;
  }

  function passwordStrength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(4, s);
  }

  function age(dob) {
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return -1;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
    return a;
  }

  // ---------- boot ----------

  function boot() {
    const acct = db.session && db.accounts[db.session];
    if (!acct) return showAuth(Object.keys(db.accounts).length ? 'login' : 'signup');
    let reonboard = false;
    try {
      reonboard = sessionStorage.getItem(REONBOARD_KEY) === '1';
      sessionStorage.removeItem(REONBOARD_KEY);
    } catch {
      // ignore
    }
    if (!acct.profile || reonboard) return showOnboarding(acct);
    launch(acct);
  }

  function launch(acct) {
    root.hidden = true;
    root.innerHTML = '';
    document.getElementById('app').hidden = false;
    window.startApp(acct, {
      logout() {
        db.session = null;
        persist();
        location.reload();
      },
      editVibe() {
        try {
          sessionStorage.setItem(REONBOARD_KEY, '1');
        } catch {
          // ignore
        }
        location.reload();
      },
    });
  }

  // ---------- auth screen ----------

  let mode = 'signup';

  function showAuth(initialMode) {
    const live = seed.events.filter((e) => Date.now() >= e.start && Date.now() < e.end).length;
    const maxDob = new Date();
    maxDob.setFullYear(maxDob.getFullYear() - 18);

    root.hidden = false;
    root.innerHTML = `
      <div class="auth">
        <section class="auth-side">
          <div class="brand-lg"><span class="logo-orb"></span>Party Finder</div>

          <div class="auth-inner">
            <p class="ticker"><span class="live-dot"></span>${live} parties live in Abuja right now</p>
            <h1 class="auth-title" id="auth-title"></h1>
            <p class="auth-sub" id="auth-sub"></p>

            <div class="auth-tabs" role="tablist">
              <button type="button" role="tab" data-mode="signup">Create account</button>
              <button type="button" role="tab" data-mode="login">Log in</button>
              <span class="tab-ink"></span>
            </div>

            <form id="auth-form" novalidate>
              <div class="field" data-only="signup">
                <label for="f-name">Full name</label>
                <input id="f-name" name="name" autocomplete="name" placeholder="Ada Okafor">
                <p class="err"></p>
              </div>
              <div class="field">
                <label for="f-id">Email or phone number</label>
                <input id="f-id" name="id" autocomplete="username" placeholder="you@email.com or 0803 123 4567">
                <p class="err"></p>
              </div>
              <div class="field">
                <div class="label-row">
                  <label for="f-pw">Password</label>
                  <button type="button" class="link" data-only="login" data-act="forgot">Forgot password?</button>
                </div>
                <div class="pw-wrap">
                  <input id="f-pw" name="password" type="password" autocomplete="current-password" placeholder="At least 8 characters">
                  <button type="button" class="pw-toggle" data-act="toggle-pw" aria-label="Show password">Show</button>
                </div>
                <div class="strength" data-only="signup"><i></i><i></i><i></i><i></i><span></span></div>
                <p class="err"></p>
              </div>
              <div class="field" data-only="signup">
                <label for="f-dob">Date of birth <span class="hint">You must be 18+</span></label>
                <input id="f-dob" name="dob" type="date" max="${maxDob.toISOString().slice(0, 10)}">
                <p class="err"></p>
              </div>
              <p class="form-err" role="alert"></p>
              <button class="cta" type="submit"><span class="cta-label"></span><span class="cta-arrow">→</span></button>
            </form>

            <button type="button" class="ghost-link" data-act="demo">Just looking? <strong>Explore with a guest account</strong></button>
            <p class="legal">18+ only. By continuing you agree to our Terms, Privacy Policy and Community Guidelines.</p>
          </div>

          <footer class="auth-foot"><span class="kente"></span>Made in Abuja, for the culture</footer>
        </section>

        <section class="auth-visual" aria-hidden="true">
          <div class="visual-grid">
            <figure class="vis vis-a"><img src="assets/lounge.svg" alt=""></figure>
            <figure class="vis vis-b"><img src="assets/crowd.svg" alt=""></figure>
          </div>

          <div class="float f-story">
            <span class="f-emoji">🔥</span>
            <div><strong>Packed right now</strong><span>Skyline Rooftop · Wuse 2 · 8m ago</span></div>
            <span class="f-bars"><i></i><i></i><i></i><i></i><i></i></span>
          </div>
          <div class="float f-going">
            <span class="stack"><b style="--h:20">T</b><b style="--h:300">A</b><b style="--h:150">C</b><b style="--h:40">Z</b></span>
            <div><strong>Tolu, Amina +37</strong><span>going to Echo Live tonight</span></div>
          </div>
          <div class="float f-plan">
            <span class="plan-q">“Who's out tonight? ₦15k budget, Afrobeats, around Wuse 👀”</span>
            <span class="plan-meta">💬 6 replies · 👯🏾 3 joined</span>
          </div>

          <div class="visual-caption">
            <p>Find your vibe.</p>
            <p>Find your people.</p>
            <p class="go">Go.</p>
          </div>
        </section>
      </div>`;

    root.onclick = onAuthClick;
    root.oninput = onAuthInput;
    $('#auth-form').onsubmit = onAuthSubmit;
    setMode(initialMode);
  }

  function setMode(next) {
    mode = next;
    const signup = mode === 'signup';
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    $('.auth-tabs').dataset.active = mode;
    root.querySelectorAll('[data-only]').forEach((el) => (el.hidden = el.dataset.only !== mode));
    $('#auth-title').innerHTML = signup ? 'Your weekend<br><span class="grad">starts here.</span>' : 'Welcome back.<br><span class="grad">Where to tonight?</span>';
    $('#auth-sub').textContent = signup
      ? "Parties, lounges, rooftops and the people going. Free, always."
      : 'Log in to see what your friends are up to.';
    $('.cta-label').textContent = signup ? 'Create account' : 'Log in';
    $('#f-pw').autocomplete = signup ? 'new-password' : 'current-password';
    clearErrors();
  }

  function clearErrors() {
    root.querySelectorAll('.field').forEach((f) => f.classList.remove('invalid'));
    root.querySelectorAll('.err, .form-err').forEach((e) => (e.textContent = ''));
  }

  function fieldError(name, msg) {
    const field = $(`[name="${name}"]`).closest('.field');
    field.classList.add('invalid');
    $('.err', field).textContent = msg;
  }

  function onAuthClick(ev) {
    const t = ev.target.closest('[data-mode], [data-act]');
    if (!t) return;
    if (t.dataset.mode) return setMode(t.dataset.mode);
    const act = t.dataset.act;
    if (act === 'toggle-pw') {
      const input = $('#f-pw');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      t.textContent = show ? 'Hide' : 'Show';
      t.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    } else if (act === 'forgot') {
      toast('Password reset links come with the real backend. For now, create a new account.');
    } else if (act === 'demo') {
      const key = 'guest@partyfinder.local';
      db.accounts[key] ||= { key, kind: 'email', name: 'Guest', createdAt: Date.now(), profile: null, guest: true };
      db.session = key;
      persist();
      transitionTo(() => showOnboarding(db.accounts[key]));
    }
  }

  function onAuthInput(ev) {
    const field = ev.target.closest('.field');
    if (field) {
      field.classList.remove('invalid');
      $('.err', field).textContent = '';
    }
    if (ev.target.name === 'password' && mode === 'signup') {
      const s = ev.target.value ? passwordStrength(ev.target.value) : 0;
      const meter = $('.strength');
      meter.dataset.level = ev.target.value ? s : '';
      $('span', meter).textContent = ev.target.value ? ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][s] : '';
    }
  }

  async function onAuthSubmit(ev) {
    ev.preventDefault();
    clearErrors();
    const f = new FormData(ev.target);
    const name = (f.get('name') || '').trim();
    const login = normaliseLogin(f.get('id') || '');
    const password = f.get('password') || '';
    const dob = f.get('dob') || '';
    let ok = true;

    if (mode === 'signup' && name.length < 2) { fieldError('name', 'Tell us what to call you.'); ok = false; }
    if (!login) { fieldError('id', 'Enter a valid email or phone number.'); ok = false; }
    if (mode === 'signup') {
      if (password.length < 8) { fieldError('password', 'Use at least 8 characters.'); ok = false; }
      const a = age(dob);
      if (a < 0) { fieldError('dob', 'Add your date of birth.'); ok = false; }
      else if (a < 18) { fieldError('dob', 'Party Finder is for people 18 and over.'); ok = false; }
    } else if (!password) { fieldError('password', 'Enter your password.'); ok = false; }
    if (!ok) return;

    const btn = $('.cta');
    btn.classList.add('loading');
    btn.disabled = true;
    const [hash] = await Promise.all([hashPassword(login.key, password), new Promise((r) => setTimeout(r, 650))]);
    btn.classList.remove('loading');
    btn.disabled = false;

    if (mode === 'signup') {
      if (db.accounts[login.key]) {
        $('.form-err').innerHTML = 'You already have an account. <button type="button" class="link" data-mode="login">Log in instead</button>';
        return;
      }
      db.accounts[login.key] = { key: login.key, kind: login.kind, name, dob, pass: hash, createdAt: Date.now(), profile: null };
      db.session = login.key;
      persist();
      transitionTo(() => showOnboarding(db.accounts[login.key]));
    } else {
      const acct = db.accounts[login.key];
      if (!acct || acct.pass !== hash) {
        $('.form-err').textContent = "That login and password don't match.";
        return;
      }
      db.session = login.key;
      persist();
      transitionTo(() => (acct.profile ? launch(acct) : showOnboarding(acct)));
    }
  }

  function transitionTo(next) {
    root.classList.add('leaving');
    setTimeout(() => {
      root.classList.remove('leaving');
      window.scrollTo(0, 0);
      next();
    }, 380);
  }

  // ---------- onboarding ----------

  const STEPS = [
    { id: 'types', min: 2, hint: (d) => (d.types.length < 2 ? `Pick ${2 - d.types.length} more` : `${d.types.length} picked`) },
    { id: 'sound', min: 1, hint: (d) => (d.genres.length ? `${d.genres.length} picked` : 'Pick at least 1') },
    { id: 'vibe', hint: (d) => (d.interests.length ? 'Looking good' : 'Pick at least 1 vibe') },
    { id: 'place', hint: (d) => (CITIES.find((c) => c.id === d.city)?.live ? `${d.radius} km around ${d.coords ? 'you' : d.area}` : `${d.city} is coming soon`) },
    { id: 'privacy', hint: () => 'You can change these any time' },
    { id: 'done', hint: () => '' },
  ];

  const valid = {
    types: (d) => d.types.length >= 2,
    sound: (d) => d.genres.length >= 1,
    vibe: (d) => d.interests.length >= 1 && d.budget && d.crew,
    place: (d) => !!d.city,
    privacy: () => true,
    done: () => true,
  };

  let acct = null;
  let draft = null;
  let step = 0;
  let lastStep = -1;

  function defaultProfile() {
    return {
      types: [], genres: [], interests: [], budget: '15k', crew: 'squad',
      city: 'Abuja', area: 'Wuse 2', coords: null, radius: 10, nights: ['Fri', 'Sat'],
      privacy: { shareGoing: false, shareLooking: false, notifyFriends: true, tonightPicks: true },
    };
  }

  function showOnboarding(account) {
    acct = account;
    draft = account.profile ? JSON.parse(JSON.stringify(account.profile)) : defaultProfile();
    step = 0;
    lastStep = -1;
    root.hidden = false;
    root.onclick = onObClick;
    root.oninput = onObInput;
    root.onsubmit = null;
    renderOnboarding();
  }

  function scored() {
    return seed.events
      .filter((e) => Date.now() < e.end)
      .map((e) => ({ e, v: seed.venues[e.venueId], m: matchEvent(e, seed.venues[e.venueId], draft) }))
      .sort((a, b) => b.m.score - a.m.score || a.e.start - b.e.start);
  }

  function renderOnboarding() {
    const s = STEPS[step];
    const isDone = s.id === 'done';
    const animate = lastStep !== step;
    const dir = step >= lastStep ? 'fwd' : 'back';
    lastStep = step;

    root.innerHTML = `
      <div class="ob ${isDone ? 'ob-finished' : ''}">
        <div class="ob-bg"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span></div>
        <header class="ob-top">
          <div class="brand-lg sm"><span class="logo-orb"></span>Party Finder</div>
          ${isDone ? '' : `<div class="ob-progress" aria-label="Step ${step + 1} of ${STEPS.length - 1}">
            ${STEPS.slice(0, -1).map((_, i) => `<span class="${i < step ? 'done' : i === step ? 'current' : ''}"></span>`).join('')}
          </div>`}
          <span class="ob-who">Hey, ${esc(firstName(acct.name))} 👋🏾</span>
        </header>

        <main class="ob-main">
          <section class="ob-q ${animate ? 'anim-' + dir : ''}" id="ob-q">${stepBody(s.id)}</section>
          ${isDone ? '' : `<aside class="ob-preview" id="ob-preview">${previewHtml()}</aside>`}
        </main>

        ${isDone ? '' : `<footer class="ob-foot" id="ob-foot">${footHtml()}</footer>`}
      </div>`;

    if (isDone) burstConfetti();
  }

  function refresh() {
    const s = STEPS[step];
    const q = $('#ob-q');
    const scroll = window.scrollY;
    q.className = 'ob-q';
    q.innerHTML = stepBody(s.id);
    if ($('#ob-preview')) $('#ob-preview').innerHTML = previewHtml();
    if ($('#ob-foot')) $('#ob-foot').innerHTML = footHtml();
    window.scrollTo(0, scroll);
  }

  function footHtml() {
    const s = STEPS[step];
    const ok = valid[s.id](draft);
    return `
      <button class="ob-back" data-ob="back" ${step === 0 ? 'disabled' : ''}>← Back</button>
      <span class="ob-hint ${ok ? 'ok' : ''}">${esc(s.hint(draft))}</span>
      <button class="cta" data-ob="next" ${ok ? '' : 'disabled'}>
        <span class="cta-label">${step === STEPS.length - 2 ? 'Build my night' : 'Continue'}</span><span class="cta-arrow">→</span>
      </button>`;
  }

  function previewHtml() {
    const list = scored();
    const strong = list.filter((x) => x.m.score >= 50).length;
    const city = CITIES.find((c) => c.id === draft.city);
    const day = new Date().toLocaleDateString([], { weekday: 'long' });
    return `
      <div class="phone">
        <div class="notch"></div>
        <p class="phone-eyebrow">Your ${esc(day)} · live preview</p>
        <h3><span class="count">${strong}</span> ${strong === 1 ? 'event fits' : 'events fit'} you</h3>
        ${city && !city.live ? `<p class="phone-note">${esc(city.id)} is coming soon. Showing Abuja for now.</p>` : ''}
        <ul class="pv-list">
          ${list.slice(0, 4).map(({ e, v, m }) => `
            <li>
              <span class="pv-thumb cat-${e.category}">${CATEGORIES[e.category].emoji}</span>
              <div class="pv-text">
                <strong>${esc(e.title)}</strong>
                <span>${esc(v.area)} · ${clock(e.start)} · ${naira(e.fee)}</span>
                ${m.reasons.length ? `<em>${m.reasons.map(esc).join(' · ')}</em>` : ''}
              </div>
              <span class="ring" style="--p:${m.score}"><b>${m.score}</b></span>
            </li>`).join('')}
        </ul>
        <p class="phone-foot">Your answers shape this list. Try picking something.</p>
      </div>`;
  }

  function stepBody(id) {
    const pressed = (on) => `aria-pressed="${on}"`;
    switch (id) {
      case 'types':
        return `
          <p class="ob-step">Step 1 · Your scene</p>
          <h1>What gets you <span class="grad">out the house?</span></h1>
          <p class="ob-sub">Pick at least 2. These decide what shows up first in your Tonight feed.</p>
          <div class="tile-grid">
            ${EVENT_TYPES.map((t) => `
              <button class="tile" data-pick="types" data-val="${t.id}" ${pressed(draft.types.includes(t.id))}>
                <span class="tile-emoji">${t.emoji}</span>
                <span class="tile-label">${esc(t.label)}</span>
                <span class="tile-desc">${esc(t.desc)}</span>
                <span class="tick">✓</span>
              </button>`).join('')}
          </div>`;

      case 'sound':
        return `
          <p class="ob-step">Step 2 · Your sound</p>
          <h1>What's <span class="grad">your sound?</span></h1>
          <p class="ob-sub">We'll put the DJs and acts that play it at the top of your feed.</p>
          <div class="chip-cloud">
            ${GENRES.map((g) => `
              <button class="big-chip" data-pick="genres" data-val="${esc(g)}" ${pressed(draft.genres.includes(g))}>
                <span>${GENRE_EMOJI[g] || '🎵'}</span>${esc(g)}<span class="eq"><i></i><i></i><i></i></span>
              </button>`).join('')}
          </div>`;

      case 'vibe':
        return `
          <p class="ob-step">Step 3 · Your vibe</p>
          <h1>How do you <span class="grad">like to party?</span></h1>
          <h2 class="ob-h2">Your kind of night</h2>
          <div class="chip-cloud">
            ${INTERESTS.map((i) => `<button class="big-chip" data-pick="interests" data-val="${i.id}" ${pressed(draft.interests.includes(i.id))}><span>${i.emoji}</span>${esc(i.label)}</button>`).join('')}
          </div>
          <h2 class="ob-h2">Usual spend on a night out</h2>
          <div class="budget-row">
            ${BUDGETS.map((b) => `<button class="budget" data-one="budget" data-val="${b.id}" ${pressed(draft.budget === b.id)}><strong>${esc(b.label)}</strong><span>${esc(b.sub)}</span></button>`).join('')}
          </div>
          <h2 class="ob-h2">Who do you roll with?</h2>
          <div class="crew-row">
            ${CREW_STYLES.map((c) => `<button class="crew-opt" data-one="crew" data-val="${c.id}" ${pressed(draft.crew === c.id)}><span class="tile-emoji">${c.emoji}</span><strong>${esc(c.label)}</strong><span>${esc(c.desc)}</span></button>`).join('')}
          </div>`;

      case 'place': {
        const city = CITIES.find((c) => c.id === draft.city);
        return `
          <p class="ob-step">Step 4 · Your city</p>
          <h1>Where are you <span class="grad">partying?</span></h1>
          <p class="ob-sub">We use this to sort events by distance. We never show your location to anyone.</p>
          <div class="city-grid">
            ${CITIES.map((c) => `
              <button class="city" data-one="city" data-val="${esc(c.id)}" ${pressed(draft.city === c.id)}>
                <span class="flag">${c.cc}</span>${esc(c.id)}
                <span class="badge ${c.live ? 'live' : ''}">${c.live ? '● Live' : 'Soon'}</span>
              </button>`).join('')}
          </div>
          ${city && city.live ? `
            <h2 class="ob-h2">Your home base</h2>
            <div class="chip-cloud">
              <button class="big-chip locate ${draft.coords ? '' : 'pulse'}" data-ob="locate" aria-pressed="${!!draft.coords}"><span>📍</span>${draft.coords ? 'Using my location' : 'Use my current location'}</button>
              ${Object.keys(AREAS).map((a) => `<button class="big-chip" data-one="area" data-val="${esc(a)}" ${pressed(!draft.coords && draft.area === a)}>${esc(a)}</button>`).join('')}
            </div>
            <h2 class="ob-h2">How far will you go? <span class="radius-val" id="radius-val">${draft.radius} km</span></h2>
            <input class="range" type="range" min="2" max="30" step="1" value="${draft.radius}" data-range="radius" style="--fill:${((draft.radius - 2) / 28) * 100}%">
            <div class="range-labels"><span>Walking distance</span><span>Anywhere in the city</span></div>`
          : `<div class="soon-card">
              <span class="soon-flag">${city ? city.cc : ''}</span>
              <div><strong>${esc(draft.city)} is next on our list.</strong>
              <p>We're live in Abuja first. We'll notify you the day ${esc(draft.city)} launches. Until then you can explore Abuja.</p></div>
            </div>`}
          <h2 class="ob-h2">When do you usually go out?</h2>
          <div class="chip-cloud">
            ${NIGHTS.map((n) => `<button class="big-chip" data-pick="nights" data-val="${n}" ${pressed(draft.nights.includes(n))}>${n}</button>`).join('')}
          </div>`;
      }

      case 'privacy': {
        const row = (key, title, desc) => `
          <label class="toggle-row">
            <div><strong>${title}</strong><span>${desc}</span></div>
            <input type="checkbox" data-privacy="${key}" ${draft.privacy[key] ? 'checked' : ''}>
            <span class="switch"></span>
          </label>`;
        return `
          <p class="ob-step">Step 5 · Your rules</p>
          <h1>You're <span class="grad">in control.</span></h1>
          <p class="ob-sub">Nothing about where you go is shared unless you turn it on. You can change this per event too.</p>
          <div class="toggle-list">
            ${row('shareGoing', 'Let friends see events I’m going to', 'Only people you have added as friends.')}
            ${row('shareLooking', 'Show me as “looking for company”', 'Others going solo to the same event can see you and say hi.')}
            ${row('notifyFriends', 'Tell me when friends make plans', 'A ping when your people commit to a night out.')}
            ${row('tonightPicks', 'Send me tonight’s picks at 6pm', 'Your top 3 matches on the nights you go out.')}
          </div>
          <div class="safety">🛡️ Verified venues, report and block on every profile, and women-only crews. Meet new people in public spots first.</div>`;
      }

      case 'done': {
        const top = scored().slice(0, 3);
        const strong = scored().filter((x) => x.m.score >= 50).length;
        const types = EVENT_TYPES.filter((t) => draft.types.includes(t.id));
        return `
          <div class="ob-done">
            <div class="done-badge">🎉</div>
            <h1>You're set, <span class="grad">${esc(firstName(acct.name))}.</span></h1>
            <p class="ob-sub">We found <strong>${strong} events</strong> that fit your vibe tonight. Here are your top picks.</p>
            <div class="done-picks">
              ${top.map(({ e, v, m }, i) => `
                <article class="pick" style="--i:${i}">
                  <div class="pick-art cat-${e.category}">${CATEGORIES[e.category].emoji}<span class="pick-score">${m.score}% match</span></div>
                  <div class="pick-body">
                    <strong>${esc(e.title)}</strong>
                    <span>${esc(v.name)} · ${esc(v.area)}</span>
                    <span>${clock(e.start)} · ${naira(e.fee)}</span>
                    ${m.reasons.length ? `<em>Because: ${m.reasons.map(esc).join(', ')}</em>` : ''}
                  </div>
                </article>`).join('')}
            </div>
            <div class="done-tags">
              ${types.map((t) => `<span>${t.emoji} ${esc(t.label)}</span>`).join('')}
              ${draft.genres.map((g) => `<span>${GENRE_EMOJI[g] || '🎵'} ${esc(g)}</span>`).join('')}
              <span>📍 ${esc(draft.coords ? 'Near you' : draft.city === 'Abuja' ? draft.area : draft.city)}</span>
            </div>
            <button class="cta big" data-ob="finish"><span class="cta-label">Show me tonight</span><span class="cta-arrow">→</span></button>
            <button class="ob-back" data-ob="back">Change my answers</button>
          </div>`;
      }
    }
    return '';
  }

  function onObClick(ev) {
    const t = ev.target.closest('[data-pick], [data-one], [data-ob]');
    if (!t) return;

    if (t.dataset.pick) {
      const list = draft[t.dataset.pick];
      const i = list.indexOf(t.dataset.val);
      if (i >= 0) list.splice(i, 1);
      else list.push(t.dataset.val);
      return refresh();
    }

    if (t.dataset.one) {
      draft[t.dataset.one] = t.dataset.val;
      if (t.dataset.one === 'area') draft.coords = null;
      return refresh();
    }

    const act = t.dataset.ob;
    if (act === 'next' && valid[STEPS[step].id](draft)) {
      step++;
      renderOnboarding();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'back' && step > 0) {
      step--;
      renderOnboarding();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'locate') {
      locate();
    } else if (act === 'finish') {
      acct.profile = { ...draft, completedAt: Date.now() };
      persist();
      transitionTo(() => launch(acct));
    }
  }

  function onObInput(ev) {
    const el = ev.target;
    if (el.dataset.range === 'radius') {
      draft.radius = Number(el.value);
      el.style.setProperty('--fill', `${((draft.radius - 2) / 28) * 100}%`);
      $('#radius-val').textContent = `${draft.radius} km`;
      $('#ob-preview').innerHTML = previewHtml();
      $('#ob-foot').innerHTML = footHtml();
    } else if (el.dataset.privacy) {
      draft.privacy[el.dataset.privacy] = el.checked;
    }
  }

  function locate() {
    if (!navigator.geolocation) return toast('Location is not available in this browser. Pick an area instead.');
    toast('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (distanceKm(here, DEFAULT_LOCATION) > 60) {
          toast("Looks like you're outside Abuja right now. Pick the area you usually go out in.");
          return;
        }
        draft.coords = here;
        toast('Got it. Distances now start from where you are.');
        refresh();
      },
      () => toast("Couldn't get your location. Pick an area instead."),
      { timeout: 8000 },
    );
  }

  function burstConfetti() {
    const colors = ['#c084fc', '#f5b82e', '#22c55e', '#ff5a5f', '#38bdf8', '#fff'];
    const box = document.createElement('div');
    box.className = 'confetti';
    for (let i = 0; i < 90; i++) {
      const p = document.createElement('i');
      p.style.cssText = `--x:${Math.random() * 100}vw;--d:${1.8 + Math.random() * 1.6}s;--delay:${Math.random() * 0.4}s;--r:${Math.random() * 720 - 360}deg;--drift:${Math.random() * 160 - 80}px;background:${colors[i % colors.length]}`;
      box.appendChild(p);
    }
    root.appendChild(box);
    setTimeout(() => box.remove(), 4000);
  }

  boot();
})();

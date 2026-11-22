/* Livinai for Business: API client shared by the website pages. */
(function () {
  const qs = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const API = (local && qs.get('api')) || 'https://ai-interior-design-g5oc.onrender.com';
  const GOOGLE_CLIENT_ID = '365853441307-1o7tsq766fvic5b1rh7ib94u39dhlmed.apps.googleusercontent.com';
  const SITE = local ? `${location.origin}/business/` : 'https://livinai.app/business/';
  const TEAM_PLAN = {
    currency: 'USD', seatsIncluded: 3, maxSeats: 200, trialDays: 14,
    trialCredits: 10, monthlyCredits: 100, creditsPerExtraSeat: 25,
    prices: { month: { team: 5900, seat: 1500 }, year: { team: 58800, seat: 14400 } },
  };
  const money = (cents, currency = TEAM_PLAN.currency) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 2, minimumFractionDigits: 0,
  }).format(cents / 100);

  const memory = new Map();
  const store = {
    get(k) { if (memory.has(k)) return memory.get(k); try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) {
      try {
        if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v);
        memory.delete(k);
      } catch { memory.set(k, v); }
    },
  };

  async function call(path, { method = 'GET', body, base = '/api/business', auth = true } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    const ut = store.get('lvb_user'), vt = store.get('lvb_visitor');
    if (auth && ut) headers.Authorization = `Bearer ${ut}`;
    if (auth && vt) headers['X-Biz-Visitor'] = vt;
    let res;
    try {
      res = await fetch(API + base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      throw Object.assign(new Error('We could not reach Livinai. Check your connection and try again.'), { status: 0 });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw Object.assign(new Error(data.message || `Something went wrong (${res.status}).`), { status: res.status, data });
    }
    return data;
  }

  /** Read a picked file into a resized JPEG (or PNG, to keep transparency) data URL. */
  function fileToDataUrl(file, { maxSide = 1600, png = false } = {}) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type)) return reject(new Error('Please choose a JPG, PNG or WebP photo.'));
      if (file.size > 25 * 1024 * 1024) return reject(new Error('That photo is too large. Please use one under 25 MB.'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * s));
          c.height = Math.max(1, Math.round(img.naturalHeight * s));
          const ctx = c.getContext('2d');
          if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.9));
        } catch { reject(new Error('We could not prepare that photo. Try a smaller image.')); }
        finally { URL.revokeObjectURL(url); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('We could not open that photo. Try a JPG or PNG.')); };
      img.src = url;
    });
  }

  /** An image already on the page (a sample cut-out) as a PNG data URL. */
  async function urlToDataUrl(src) {
    const response = await fetch(src);
    if (!response.ok) throw new Error('The sample image could not load. Try again.');
    const blob = await response.blob();
    return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob); });
  }

  let gisLoading = null;
  function loadGoogle() {
    if (window.google?.accounts?.id) return Promise.resolve();
    gisLoading ??= new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client?hl=en'; s.async = true;
      s.onload = resolve; s.onerror = () => reject(new Error('Google sign-in could not load.'));
      document.head.appendChild(s);
    });
    return gisLoading.catch(error => { gisLoading = null; throw error; });
  }

  /** Render a "Sign in with Google" button; resolves the account once signed in. */
  async function renderGoogleButton(el, onDone, onError) {
    await loadGoogle();
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          const auth = await call('/social', { method: 'POST', base: '/api/auth', body: { provider: 'google', identityToken: credential } });
          store.set('lvb_user', auth.accessToken);
          const acct = await call('/claim', { method: 'POST' });
          if (!acct.visitor) store.set('lvb_visitor', null);
          onDone?.(acct);
        } catch (e) { onError?.(e); }
      },
    });
    window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'en', width: Math.min(320, el.clientWidth || 320) });
  }

  function signOut() { store.set('lvb_user', null); store.set('lvb_visitor', null); }

  window.Biz = {
    API, SITE, TEAM_PLAN, money, store, call, fileToDataUrl, urlToDataUrl, renderGoogleButton, signOut,
    hasSession: () => Boolean(store.get('lvb_user') || store.get('lvb_visitor')),
    me: () => call('/me'),
    session: (d) => call('/session', { method: 'POST', body: d }).then((r) => { store.set('lvb_visitor', r.visitorToken); return r; }),
    stores: {
      ios: 'https://apps.apple.com/app/id6800486898',
      android: 'https://play.google.com/store/apps/details?id=com.livinai.app',
    },
  };
})();

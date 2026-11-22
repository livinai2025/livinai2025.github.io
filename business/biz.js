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
    prices: { month: { team: 9900, seat: 2500 }, year: { team: 94800, seat: 30000 } },
  };
  const money = (cents, currency = TEAM_PLAN.currency) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 2, minimumFractionDigits: 0,
  }).format(cents / 100);
  const checkoutAvailable = billing => Boolean(billing?.ready && billing.plan && (
    (billing.environment === 'production' && billing.clientToken?.startsWith('live_')) ||
    (local && billing.environment === 'sandbox' && billing.clientToken?.startsWith('test_'))
  ));

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

  const imageType = name => ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' })[name.split('.').pop().toLowerCase()];
  const isPhoto = type => /^image\/(jpeg|png|webp)$/i.test(type);

  /** Read a picked file into a resized JPEG (or PNG, to keep transparency) data URL. */
  function fileToDataUrl(file, { maxSide = 1600, png = false } = {}) {
    return new Promise((resolve, reject) => {
      if (!file || (!isPhoto(file.type) && !imageType(file.name))) return reject(new Error('Please choose a JPG, PNG or WebP photo.'));
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

  /** Read a sample image as a data URL. */
  async function urlToDataUrl(src) {
    const response = await fetch(src);
    if (!response.ok) throw new Error('The sample image could not load. Try again.');
    let blob = await response.blob();
    if (!isPhoto(blob.type)) {
      const type = imageType(new URL(src, location.href).pathname);
      if (!type) throw new Error('That sample is in an unsupported image format.');
      blob = new Blob([blob], { type });
    }
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

  async function renderSignIn(el, onDone) {
    el.innerHTML = `<div class="biz-signin">
      <div data-google></div>
      <p class="biz-signin-status" data-status role="status"></p>
      <details data-password>
        <summary>Sign in with email and password</summary>
        <form>
          <label>Email<input name="email" type="email" autocomplete="username" required></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
          <button type="submit" class="btn btn-primary btn-sm">Sign in</button>
        </form>
      </details>
    </div>`;
    const googleMount = el.querySelector('[data-google]');
    const status = el.querySelector('[data-status]');
    const password = el.querySelector('[data-password]');
    const form = el.querySelector('form');
    const submit = form.querySelector('button');
    let pending = false;

    async function authenticate(path, body) {
      if (pending || !el.isConnected) return;
      pending = submit.disabled = true;
      status.textContent = 'Signing in…';
      try {
        const auth = await call(path, { method: 'POST', base: '/api/auth', body, auth: false });
        if (!auth.accessToken) throw new Error('Livinai did not return a session. Please try signing in again.');
        store.set('lvb_user', auth.accessToken);
        let acct;
        try {
          acct = path === '/social' ? await call('/claim', { method: 'POST' }) : await call('/me');
        } catch (error) {
          if (path !== '/social') throw error;
          acct = await call('/me');
        }
        if (!acct.user) {
          store.set('lvb_user', null);
          throw new Error('The session could not be opened. Please sign in again.');
        }
        if (!acct.visitor) store.set('lvb_visitor', null);
        status.textContent = '';
        await onDone?.(acct);
      } catch (error) {
        status.textContent = error.status === 401 && path === '/login'
          ? 'That email and password did not match a Livinai account.'
          : error.message;
      } finally {
        pending = submit.disabled = false;
        form.elements.password.value = '';
      }
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      authenticate('/login', { email: form.elements.email.value.trim(), password: form.elements.password.value });
    });
    function googleUnavailable() {
      if (!el.isConnected || pending) return;
      status.textContent = 'Google sign-in is unavailable here. If your Livinai account has a password, you can use it below.';
      password.open = true;
    }
    try {
      await loadGoogle();
      if (!el.isConnected) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        use_fedcm_for_button: true,
        callback: ({ credential }) => authenticate('/social', { provider: 'google', identityToken: credential }),
      });
      window.google.accounts.id.renderButton(googleMount, {
        theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'en',
        width: Math.min(320, Math.round(googleMount.clientWidth) || 320),
      });
      setTimeout(() => {
        const button = googleMount.querySelector('iframe');
        if (!button || button.getBoundingClientRect().height === 0) googleUnavailable();
      }, 4500);
    } catch {
      googleUnavailable();
    }
  }

  function signOut() { store.set('lvb_user', null); store.set('lvb_visitor', null); }

  window.Biz = {
    API, SITE, TEAM_PLAN, money, checkoutAvailable, store, call, fileToDataUrl, urlToDataUrl, renderSignIn, signOut,
    hasSession: () => Boolean(store.get('lvb_user') || store.get('lvb_visitor')),
    me: () => call('/me'),
    session: (d) => call('/session', { method: 'POST', body: d }).then((r) => { store.set('lvb_visitor', r.visitorToken); return r; }),
    stores: {
      ios: 'https://apps.apple.com/app/id6800486898',
      android: 'https://play.google.com/store/apps/details?id=com.livinai.app',
    },
  };
})();

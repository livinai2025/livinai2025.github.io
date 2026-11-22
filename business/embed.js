/*!
 * Livinai "See it in your room" button.
 * <script src="https://livinai.app/business/embed.js" data-catalogue="CATALOGUE_ID" async></script>
 * Optional: data-product="PRODUCT_ID", data-label="See it in your room", data-target="#css-selector", data-color="#164a37"
 */
(function () {
  var script = document.currentScript || document.querySelector('script[src*="business/embed.js"][data-catalogue]');
  if (!script) return;
  var cid = script.getAttribute('data-catalogue');
  if (!cid) return;
  var base = script.src.replace(/embed\.js(\?.*)?$/, '');
  var pid = script.getAttribute('data-product') || '';
  var label = script.getAttribute('data-label') || 'See it in your room';
  var target = script.getAttribute('data-target');
  var color = /^#[0-9a-f]{6}$/i.test(script.getAttribute('data-color') || '') ? script.getAttribute('data-color') : '#164a37';

  var css = '.lvb-btn{display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 20px;border-radius:999px;border:0;background:' + color + ';color:#fff;font:500 15px/1 Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 20px -10px rgba(14,43,33,.6)}'
    + '.lvb-btn:hover{filter:brightness(1.12)}.lvb-btn svg{width:18px;height:18px}'
    + '.lvb-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(14,22,18,.55)}'
    + '.lvb-ov iframe{width:min(720px,100%);height:min(720px,calc(100vh - 32px));border:0;border-radius:24px;background:#fff;box-shadow:0 40px 80px -32px rgba(0,0,0,.5)}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'lvb-btn';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z"/></svg>';
  btn.appendChild(document.createTextNode(label));

  var ov = null;
  function close() { if (ov) { ov.remove(); ov = null; document.documentElement.style.overflow = ''; } }
  btn.addEventListener('click', function () {
    ov = document.createElement('div'); ov.className = 'lvb-ov';
    var f = document.createElement('iframe');
    f.title = label; f.allow = 'camera';
    f.src = base + 'try/?c=' + encodeURIComponent(cid) + (pid ? '&p=' + encodeURIComponent(pid) : '');
    ov.appendChild(f);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov);
    document.documentElement.style.overflow = 'hidden';
  });
  window.addEventListener('message', function (e) { if (e.data === 'livinai-try-close') close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  var host = target && document.querySelector(target);
  if (host) host.appendChild(btn); else script.parentNode.insertBefore(btn, script);
})();

(function () {
  "use strict";

  /* ───────── CONFIG ───────── */

  // tried in order; if one doesn't fire `load` in LOAD_TIMEOUT, the next is used
  var TARGETS = [
    "https://truffled.lol/",
    "https://truffled.lol.cdn.cloudflare.net/",   // Cloudflare DNS mirror
    "https://truffled.lol/iframe.html?url=%2F"    // truffled's own embed wrapper
  ];

  var LOAD_TIMEOUT    = 7000;   // ms before falling through to next target
  var AUTO_FULLSCREEN = false;  // true = fullscreen on first click/keypress (F11 also works)

  /* every Permissions-Policy feature Chrome knows, delegated to any origin */
  var FEATURES = [
    "accelerometer","ambient-light-sensor","attribution-reporting","autoplay",
    "battery","bluetooth","browsing-topics","camera","clipboard-read",
    "clipboard-write","compute-pressure","cross-origin-isolated","display-capture",
    "document-domain","encrypted-media","execution-while-not-rendered",
    "execution-while-out-of-viewport","fullscreen","gamepad","geolocation",
    "gyroscope","hid","idle-detection","keyboard-map","local-fonts","magnetometer",
    "microphone","midi","navigation-override","otp-credentials","payment",
    "picture-in-picture","publickey-credentials-get","screen-wake-lock","serial",
    "speaker-selection","storage-access","sync-xhr","unload","usb","wake-lock",
    "web-share","window-placement","xr-spatial-tracking"
  ];
  var ALLOW = FEATURES.map(function (f) { return f + " *"; }).join("; ");

  /* deliberately NO allow-same-origin -> the shell becomes an opaque origin */
  var SANDBOX = [
    "allow-scripts","allow-forms","allow-modals","allow-popups",
    "allow-popups-to-escape-sandbox","allow-downloads","allow-presentation",
    "allow-pointer-lock","allow-orientation-lock",
    "allow-top-navigation-by-user-activation",
    "allow-storage-access-by-user-activation"
  ].join(" ");

  /* ───────── inner shell document (parses at about:srcdoc) ───────── */
  var SHELL = [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    '<style>',
    '*,*::before,*::after{box-sizing:border-box}',
    'html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}',
    '#f{position:fixed;inset:0;width:100vw;height:100vh;border:0;display:block}',
    '</style></head><body><iframe id="f" title="truffled.lol"></iframe>',
    '<script>',
    'var L=' + JSON.stringify(TARGETS) + ',A=' + JSON.stringify(ALLOW) + ';',
    'var f=document.getElementById("f"),i=0,t=0;',
    'f.setAttribute("allow",A);',
    'f.setAttribute("allowfullscreen","");',
    'f.setAttribute("webkitallowfullscreen","");',
    'f.setAttribute("mozallowfullscreen","");',
    'f.setAttribute("referrerpolicy","strict-origin-when-cross-origin");',
    'function n(){if(i>=L.length)return;clearTimeout(t);f.src=L[i++];t=setTimeout(n,' + LOAD_TIMEOUT + ');}',
    'f.addEventListener("load",function(){clearTimeout(t);});',
    'n();',
    '<\/script></body></html>'
  ].join("");

  /* ───────── outer frame ───────── */
  var stage = document.getElementById("stage");
  stage.setAttribute("allow", ALLOW);
  stage.setAttribute("sandbox", SANDBOX);
  stage.setAttribute("allowfullscreen", "");
  stage.setAttribute("webkitallowfullscreen", "");
  stage.setAttribute("mozallowfullscreen", "");
  stage.srcdoc = SHELL;

  /* ───────── optional auto-fullscreen ───────── */
  if (AUTO_FULLSCREEN) {
    var kick = function () {
      var el = document.documentElement;
      var fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!document.fullscreenElement && fn) fn.call(el);
      window.removeEventListener("blur", kick);
      window.removeEventListener("keydown", kick, true);
    };
    window.addEventListener("blur", kick);        // fires when you click into the frame
    window.addEventListener("keydown", kick, true);
  }
})();

(function () {
  "use strict";

  /* ══════════════════════ CONFIG ══════════════════════ */

  // first entry is baked into the markup below, rest are auto-fallbacks
  var TARGETS = [
    "https://truffled.lol/",
    "https://truffled.lol.cdn.cloudflare.net/",
    "https://truffled.lol/iframe.html?url=%2F"
  ];

  var LOAD_TIMEOUT    = 1;   // ms before trying the next target
  var HEAL_DELAY      = 5;   // ms before dropping the shell entirely if it never came up
  var AUTO_FULLSCREEN = false;

  /* ══════════ every permission Chrome has, delegated to any origin ══════════ */

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

  /* ══════════ full-bleed hardener ══════════ */

  var BOX = [
    ["position","fixed"],["top","0px"],["left","0px"],["right","0px"],["bottom","0px"],
    ["margin","0px"],["padding","0px"],["border","0px"],["display","block"],
    ["max-width","none"],["max-height","none"],["min-width","100%"],["min-height","100%"],
    ["overflow","hidden"],["box-sizing","border-box"],["background","#000"]
  ];

  function harden(el) {
    for (var i = 0; i < BOX.length; i++) {
      el.style.setProperty(BOX[i][0], BOX[i][1], "important");
    }
  }

  function fit(el) {
    var w = window.innerWidth  || document.documentElement.clientWidth  || 0;
    var h = window.innerHeight || document.documentElement.clientHeight || 0;
    if (window.visualViewport) {
      w = window.visualViewport.width  || w;
      h = window.visualViewport.height || h;
    }
    el.style.setProperty("width",  w + "px", "important");
    el.style.setProperty("height", h + "px", "important");
  }

  /* ══════════════════════ SHELL ══════════════════════
     Loads at about:srcdoc - no http(s) URL, so GoGuardian's
     content script never matches it and its JS never lands here.
     The target src is written into the markup, not set by JS.
  ═══════════════════════════════════════════════════ */

  var SHELL =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>' +
    'html,body{margin:0;padding:0;border:0;width:100%;height:100%;overflow:hidden;background:#000}' +
    'body>*:not(#f){display:none !important}' +
    '#f{position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:0;margin:0;padding:0;display:block;background:#000}' +
    '</style></head><body>' +
    '<iframe id="f" src="' + TARGETS[0] + '"' +
    ' allow="' + ALLOW + '"' +
    ' allowfullscreen webkitallowfullscreen mozallowfullscreen scrolling="no"' +
    ' title="truffled.lol"></iframe>' +
    '<script>' +
    '(function(){' +
    'var L=' + JSON.stringify(TARGETS) + ';' +
    'var f=document.getElementById("f");' +
    'var i=1,t=0;' +
    'function size(){' +
    'var w=window.innerWidth||document.documentElement.clientWidth;' +
    'var h=window.innerHeight||document.documentElement.clientHeight;' +
    'if(window.visualViewport){w=window.visualViewport.width||w;h=window.visualViewport.height||h;}' +
    'f.style.setProperty("width",w+"px","important");' +
    'f.style.setProperty("height",h+"px","important");}' +
    'function next(){if(i>=L.length)return;clearTimeout(t);f.src=L[i++];t=setTimeout(next,' + LOAD_TIMEOUT + ');}' +
    'function ok(){clearTimeout(t);}' +
    'f.addEventListener("load",ok);' +
    'window.addEventListener("resize",size);' +
    'window.addEventListener("orientationchange",size);' +
    'if(window.visualViewport){window.visualViewport.addEventListener("resize",size);}' +
    'size();' +
    't=setTimeout(next,' + LOAD_TIMEOUT + ');' +
    '})();' +
    '<\/script></body></html>';

  /* ══════════════════════ OUTER ══════════════════════ */

  var stage = document.getElementById("stage");

  harden(document.documentElement);
  harden(document.body);
  harden(stage);
  fit(stage);

  stage.setAttribute("allow", ALLOW);
  stage.setAttribute("allowfullscreen", "");
  stage.setAttribute("webkitallowfullscreen", "");
  stage.setAttribute("mozallowfullscreen", "");

  window.addEventListener("resize", function () { fit(stage); });
  window.addEventListener("orientationchange", function () { fit(stage); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", function () { fit(stage); });
  }

  stage.srcdoc = SHELL;

  /* ══════ self-heal: if the shell never materialised, go direct ══════ */

  setTimeout(function () {
    var alive = false;
    try {
      alive = !!(stage.contentDocument &&
                 stage.contentDocument.getElementById("f"));
    } catch (e) { alive = false; }

    if (!alive) {
      stage.removeAttribute("srcdoc");
      stage.src = TARGETS[0];
    }
  }, HEAL_DELAY);

  /* ══════ optional auto-fullscreen ══════ */

  if (AUTO_FULLSCREEN) {
    var kick = function () {
      var el = document.documentElement;
      var fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!document.fullscreenElement && fn) fn.call(el);
      window.removeEventListener("blur", kick);
      window.removeEventListener("keydown", kick, true);
    };
    window.addEventListener("blur", kick);
    window.addEventListener("keydown", kick, true);
  }
})();

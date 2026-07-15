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
  var checkoutReady = false;
  var checkoutRequested = false;
  var revealTimer;

  function revealCheckout() {
    if (!root || !checkoutReady || !checkoutRequested) return;
    root.style.visibility = "visible";
    root.style.opacity = "1";
    root.style.pointerEvents = "auto";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function prepareCheckout() {
    if (root) return;

    root = document.createElement("div");
    root.id = "__checkout-embed-root";
    root.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;width:100%;height:100%;background:#fff;visibility:hidden;opacity:0;pointer-events:none;transition:opacity 120ms ease;";

    iframe = document.createElement("iframe");
    iframe.src = checkoutUrlWithParams();
    iframe.title = "Secure checkout";
    iframe.allow = "payment; publickey-credentials-get; clipboard-read; clipboard-write";
    iframe.setAttribute("allowfullscreen", "true");
    iframe.style.cssText = "flex:1 1 0%;width:100%;height:100%;border:0;background:#fff;";

    iframe.addEventListener("load", function () {
      checkoutReady = false;
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(function () {
        checkoutReady = true;
        revealCheckout();
      }, 900);
    });

    window.setTimeout(function () {
      checkoutReady = true;
      revealCheckout();
    }, 6000);

    root.appendChild(iframe);
    document.body.appendChild(root);
  }

  function showCheckout() {
    checkoutRequested = true;
    prepareCheckout();
    revealCheckout();
  }

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
      window.location.pathname === "/confirmar-saque"
    ) {
      prepareCheckout();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prewarmCheckout, { once: true });
  } else {
    prewarmCheckout();
  }

  window.showEmbeddedCheckout = showCheckout;
})();

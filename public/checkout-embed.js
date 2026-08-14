(function () {
  if (window.__checkoutEmbedInstalled) return;
  window.__checkoutEmbedInstalled = true;

  var CHECKOUT_URL = "https://www.checkout-ds24.com/product/716458?aff=hutlike26804&cam=CAMPAIGNKEY";

  function checkoutUrlWithParams() {
    var target = new URL(CHECKOUT_URL);
    new URLSearchParams(window.location.search).forEach(function (value, key) {
      if (value && !target.searchParams.has(key)) target.searchParams.set(key, value);
    });
    return target.toString();
  }

  function showCheckout() {
    window.location.href = checkoutUrlWithParams();
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

  function prewarmCheckout() {}

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

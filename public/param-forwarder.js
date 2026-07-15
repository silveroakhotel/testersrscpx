(function () {
  if (window.__paramForwarderInstalled) return;
  window.__paramForwarderInstalled = true;

  var CHECKOUT_HOSTS = new Set(["checkout.vendepay.com"]);

  function currentParams() {
    return new URLSearchParams(window.location.search);
  }

  function appendCurrentParams(rawUrl) {
    var params = currentParams();
    if (!rawUrl || !params.toString()) return rawUrl;

    try {
      var url = new URL(rawUrl, window.location.href);
      params.forEach(function (value, key) {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      return url.toString();
    } catch (error) {
      return rawUrl;
    }
  }

  function localCheckoutUrl(rawUrl) {
    var checkoutUrl = appendCurrentParams(rawUrl);

    try {
      var url = new URL(checkoutUrl, window.location.href);
      if (!CHECKOUT_HOSTS.has(url.hostname)) return checkoutUrl;
      return "/checkout" + (url.search || "");
    } catch (error) {
      return checkoutUrl;
    }
  }

  function decorateCheckoutLinks() {
    document.querySelectorAll("a[href]").forEach(function (link) {
      try {
        var url = new URL(link.href, window.location.href);
        if (CHECKOUT_HOSTS.has(url.hostname) && !link.hasAttribute("data-direct-checkout")) {
          link.href = localCheckoutUrl(link.href);
        }
      } catch (error) {}
    });
  }

  function appendParamsToInternalUrl(rawUrl) {
    var params = currentParams();
    if (!rawUrl || !params.toString()) return rawUrl;

    try {
      var url = new URL(rawUrl, window.location.href);
      if (url.origin !== window.location.origin || url.search) return rawUrl;
      url.search = params.toString();
      return url.pathname + url.search + url.hash;
    } catch (error) {
      return rawUrl;
    }
  }

  function patchHistoryMethod(methodName) {
    var original = history[methodName];
    history[methodName] = function (state, title, url) {
      if (typeof url === "string") {
        return original.call(this, state, title, appendParamsToInternalUrl(url));
      }
      return original.apply(this, arguments);
    };
  }

  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");

  document.addEventListener(
    "click",
    function (event) {
      var link = event.target && event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      if (link.hasAttribute("data-direct-checkout")) return;

      try {
        var url = new URL(link.href, window.location.href);
        if (!CHECKOUT_HOSTS.has(url.hostname)) return;
        link.href = localCheckoutUrl(link.href);
      } catch (error) {}
    },
    true
  );

  decorateCheckoutLinks();
  new MutationObserver(decorateCheckoutLinks).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.forwardParamsToCheckout = function (rawUrl) {
    if (
      window.location.pathname === "/confirmar-saque" &&
      typeof window.showEmbeddedCheckout === "function"
    ) {
      window.showEmbeddedCheckout();
      // The cloned button assigns this return value to window.location.href.
      // Keep that assignment inert so its popstate guard cannot redirect away
      // after the preloaded checkout has been revealed.
      return "javascript:void(0)";
    }

    return localCheckoutUrl(rawUrl);
  };
})();

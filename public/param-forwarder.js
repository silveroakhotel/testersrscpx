(function () {
  if (window.__paramForwarderInstalled) return;
  window.__paramForwarderInstalled = true;

  var CHECKOUT_HOSTS = new Set(["www.checkout-ds24.com"]);

  function currentParams() {
    return new URLSearchParams(window.location.search);
  }

  function readCookie(name) {
    try {
      var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : "";
    } catch (error) {
      return "";
    }
  }

  function store(key, value) {
    try {
      if (value) window.localStorage.setItem(key, value);
    } catch (error) {}
  }

  function load(key) {
    try {
      return window.localStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  // Persist TikTok click identifiers so they survive the whole funnel.
  (function persistTikTokIds() {
    var params = currentParams();
    store("__ttclid", params.get("ttclid") || "");
    store("__ttp", params.get("ttp") || readCookie("_ttp"));
  })();

  function tikTokIds() {
    var params = currentParams();
    return {
      ttclid: params.get("ttclid") || load("__ttclid"),
      ttp: params.get("ttp") || readCookie("_ttp") || load("__ttp"),
    };
  }

  /**
   * Digistore24 only returns its own tracking fields in the IPN, so we pack the
   * TikTok click ids into `custom` (echoed back verbatim) for server-side
   * CompletePayment attribution.
   */
  function addTikTokTracking(url) {
    var ids = tikTokIds();
    if (!ids.ttclid && !ids.ttp) return;
    var parts = [];
    if (ids.ttclid) parts.push("ttclid:" + ids.ttclid);
    if (ids.ttp) parts.push("ttp:" + ids.ttp);
    var custom = parts.join("|").slice(0, 250);
    url.searchParams.set("custom", custom);
    if (ids.ttclid) url.searchParams.set("ttclid", ids.ttclid);
    if (ids.ttp) url.searchParams.set("ttp", ids.ttp);
  }

  function appendCurrentParams(rawUrl) {
    if (!rawUrl) return rawUrl;

    try {
      var url = new URL(rawUrl, window.location.href);
      currentParams().forEach(function (value, key) {
        if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      if (CHECKOUT_HOSTS.has(url.hostname)) addTikTokTracking(url);
      return url.toString();
    } catch (error) {
      return rawUrl;
    }
  }


  function shouldDecorate(url) {
    return url.origin === window.location.origin || CHECKOUT_HOSTS.has(url.hostname);
  }

  function decorateTrackedLinks() {
    document.querySelectorAll("a[href]").forEach(function (link) {
      try {
        var url = new URL(link.href, window.location.href);
        if (shouldDecorate(url)) link.href = appendCurrentParams(link.href);
      } catch (error) {}
    });
  }

  function appendParamsToInternalUrl(rawUrl) {
    var params = currentParams();
    if (!rawUrl || !params.toString()) return rawUrl;

    try {
      var url = new URL(rawUrl, window.location.href);
      if (url.origin !== window.location.origin) return rawUrl;
      params.forEach(function (value, key) {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
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

      try {
        var url = new URL(link.href, window.location.href);
        if (!shouldDecorate(url)) return;
        link.href = appendCurrentParams(link.href);
      } catch (error) {}
    },
    true,
  );

  if (document.readyState === "complete") {
    window.setTimeout(decorateTrackedLinks, 0);
  } else {
    window.addEventListener("load", decorateTrackedLinks, { once: true });
  }

  window.forwardParamsToCheckout = appendCurrentParams;
})();

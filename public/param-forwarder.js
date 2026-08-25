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

  function writeCookie(name, value) {
    if (!value) return;
    try {
      var host = window.location.hostname.replace(/^www\./, "");
      document.cookie =
        name + "=" + encodeURIComponent(value) + ";path=/;max-age=31536000;SameSite=Lax;domain=." + host;
      document.cookie = name + "=" + encodeURIComponent(value) + ";path=/;max-age=31536000;SameSite=Lax";
    } catch (error) {}
  }

  function store(key, value) {
    if (!value) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {}
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {}
    writeCookie(key, value);
  }

  function load(key) {
    try {
      var v = window.localStorage.getItem(key);
      if (v) return v;
    } catch (error) {}
    try {
      var s = window.sessionStorage.getItem(key);
      if (s) return s;
    } catch (error) {}
    return readCookie(key);
  }

  // Persist the full landing query string so params survive even if a page is
  // reached without them (hard redirects, external returns, refreshes).
  var TRACKED_PREFIXES = /^(utm_|sck|src|xcod|ttclid|ttp|fbclid|gclid|aff|cam|campaign|click_id|sub[0-9]?|ref)/i;

  (function persistLandingParams() {
    var stored = new URLSearchParams(load("__lp_qs") || "");
    currentParams().forEach(function (value, key) {
      if (value && TRACKED_PREFIXES.test(key)) stored.set(key, value);
    });
    var qs = stored.toString();
    if (qs) store("__lp_qs", qs);
  })();

  function storedParams() {
    return new URLSearchParams(load("__lp_qs") || "");
  }

  // Persist TikTok click identifiers so they survive the whole funnel.
  (function persistTikTokIds() {
    var params = currentParams();
    store("__ttclid", params.get("ttclid") || readCookie("ttclid") || load("__ttclid"));
    store("__ttp", params.get("ttp") || readCookie("_ttp") || load("__ttp"));
  })();


  // The pixel may only drop the _ttp cookie after it loads, so re-check for a while.
  (function watchTtp() {
    var tries = 0;
    var timer = window.setInterval(function () {
      var ttp = readCookie("_ttp");
      if (ttp) store("__ttp", ttp);
      var ttclid = readCookie("ttclid");
      if (ttclid) store("__ttclid", ttclid);
      if (++tries > 20 || (ttp && load("__ttclid"))) window.clearInterval(timer);
    }, 500);
  })();

  function tikTokIds() {
    var params = currentParams();
    var saved = storedParams();
    return {
      ttclid: params.get("ttclid") || saved.get("ttclid") || load("__ttclid") || readCookie("ttclid"),
      ttp: params.get("ttp") || saved.get("ttp") || load("__ttp") || readCookie("_ttp"),
    };
  }

  // Keep the click ids inside the persisted landing query string as well, so
  // every internal navigation and the final checkout link carry them.
  function syncTikTokIdsIntoStore() {
    var ids = tikTokIds();
    if (!ids.ttclid && !ids.ttp) return;
    var stored = new URLSearchParams(load("__lp_qs") || "");
    if (ids.ttclid) stored.set("ttclid", ids.ttclid);
    if (ids.ttp) stored.set("ttp", ids.ttp);
    store("__lp_qs", stored.toString());
    if (ids.ttclid) store("__ttclid", ids.ttclid);
    if (ids.ttp) store("__ttp", ids.ttp);
  }

  syncTikTokIdsIntoStore();

  function ensureTikTokIds(url) {
    var ids = tikTokIds();
    if (ids.ttclid && !url.searchParams.get("ttclid")) url.searchParams.set("ttclid", ids.ttclid);
    if (ids.ttp && !url.searchParams.get("ttp")) url.searchParams.set("ttp", ids.ttp);
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
    if (!url.searchParams.get("custom")) url.searchParams.set("custom", custom);
    ensureTikTokIds(url);
  }

  function appendCurrentParams(rawUrl) {
    if (!rawUrl) return rawUrl;

    try {
      syncTikTokIdsIntoStore();
      var url = new URL(rawUrl, window.location.href);
      currentParams().forEach(function (value, key) {
        if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      // Fallback: params captured on the landing page, kept for the whole funnel.
      storedParams().forEach(function (value, key) {
        if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      ensureTikTokIds(url);
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
    var saved = storedParams();
    if (!rawUrl || (!params.toString() && !saved.toString())) return rawUrl;

    try {
      var url = new URL(rawUrl, window.location.href);
      if (url.origin !== window.location.origin) return rawUrl;
      params.forEach(function (value, key) {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      saved.forEach(function (value, key) {
        if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      return url.pathname + url.search + url.hash;
    } catch (error) {
      return rawUrl;
    }
  }

  // If the current page lost the params (hard redirect, refresh), restore them
  // into the address bar so every downstream step keeps them.
  (function restoreParamsInAddressBar() {
    try {
      var restored = appendParamsToInternalUrl(
        window.location.pathname + window.location.search + window.location.hash,
      );
      if (restored && restored !== window.location.pathname + window.location.search + window.location.hash) {
        history.replaceState(history.state, "", restored);
      }
    } catch (error) {}
  })();


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

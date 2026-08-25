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
    return {
      ttclid: params.get("ttclid") || load("__ttclid") || readCookie("ttclid"),
      ttp: params.get("ttp") || load("__ttp") || readCookie("_ttp"),
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

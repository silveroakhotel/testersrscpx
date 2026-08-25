(function () {
  if (window.__ttAttribInstalled) return;
  window.__ttAttribInstalled = true;

  var CHECKOUT_HOSTS = ["checkout-ds24.com", "www.checkout-ds24.com", "checkout.vendepay.com"];

  function cookie(name) {
    try {
      var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : "";
    } catch (e) {
      return "";
    }
  }

  function save(key, value) {
    if (!value) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {}
    try {
      var host = location.hostname.replace(/^www\./, "");
      document.cookie = key + "=" + encodeURIComponent(value) + ";path=/;max-age=31536000;SameSite=Lax;domain=." + host;
      document.cookie = key + "=" + encodeURIComponent(value) + ";path=/;max-age=31536000;SameSite=Lax";
    } catch (e) {}
  }

  function read(key) {
    try {
      var v = localStorage.getItem(key);
      if (v) return v;
    } catch (e) {}
    try {
      var s = sessionStorage.getItem(key);
      if (s) return s;
    } catch (e) {}
    return cookie(key);
  }

  function capture() {
    var q = new URLSearchParams(location.search);
    save("__ttclid", q.get("ttclid") || cookie("ttclid") || read("__ttclid"));
    save("__ttp", q.get("ttp") || q.get("_ttp") || cookie("_ttp") || read("__ttp"));
  }

  capture();

  // The TikTok pixel may drop _ttp only after it loads.
  var tries = 0;
  var timer = setInterval(function () {
    capture();
    if (++tries > 40 || (read("__ttp") && read("__ttclid"))) clearInterval(timer);
  }, 500);

  function ids() {
    return { ttclid: read("__ttclid"), ttp: read("__ttp") };
  }

  window.ttAttribution = ids;

  window.ttAttributionToken = function (email) {
    var v = ids();
    return [email || "", v.ttclid || "", v.ttp || ""].join("|").slice(0, 250);
  };

  function decorate(rawUrl) {
    try {
      var url = new URL(rawUrl, location.href);
      var isCheckout = CHECKOUT_HOSTS.indexOf(url.hostname) !== -1;
      if (url.origin !== location.origin && !isCheckout) return rawUrl;

      var v = ids();
      if (v.ttclid && !url.searchParams.get("ttclid")) url.searchParams.set("ttclid", v.ttclid);
      if (v.ttp && !url.searchParams.get("ttp")) url.searchParams.set("ttp", v.ttp);

      // Forward funnel/UTM params kept by the param forwarder.
      var q = new URLSearchParams(location.search);
      ["xcod", "sck", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
        var value = q.get(key) || read("__" + key);
        if (value) {
          save("__" + key, value);
          if (!url.searchParams.get(key)) url.searchParams.set(key, value);
        }
      });

      if (isCheckout && !url.searchParams.get("custom")) {
        var v2 = ids();
        var parts = [];
        if (v2.ttclid) parts.push(v2.ttclid);
        if (v2.ttp) parts.push(v2.ttp);
        if (parts.length) url.searchParams.set("custom", parts.join("|").slice(0, 250));
      }
      return url.toString();
    } catch (e) {
      return rawUrl;
    }
  }

  window.ttDecorateUrl = decorate;

  document.addEventListener(
    "click",
    function (event) {
      var link = event.target && event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      link.href = decorate(link.href);
    },
    true,
  );
})();

/**
 * Browser-side TikTok CompletePayment for the thank-you page.
 * Uses the Digistore order id as event_id so it dedupes with the
 * server-side IPN event (same event_id = one conversion).
 */
(function () {
  if (window.self !== window.top || window.__ttPurchaseFired) return;
  window.__ttPurchaseFired = true;

  var qs = new URLSearchParams(window.location.search);
  var orderId =
    qs.get("order_id") || qs.get("orderid") || qs.get("receipt") || qs.get("transaction_id") || "";
  var value = parseFloat(String(qs.get("amount") || qs.get("order_amount") || "37.12").replace(",", ".")) || 37.12;
  var currency = qs.get("currency") || "USD";
  var email = (qs.get("email") || qs.get("buyer_email") || "").trim().toLowerCase();

  var key = "tt_purchase_" + (orderId || "session");
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch (e) {
    /* storage blocked - still fire once per page load */
  }

  function fire() {
    if (!window.ttq || typeof window.ttq.track !== "function") return false;
    try {
      if (email && typeof window.ttq.identify === "function") window.ttq.identify({ email: email });
      window.ttq.track(
        "CompletePayment",
        {
          content_id: "digistore-product",
          content_type: "product",
          content_name: "Task Partners Access",
          quantity: 1,
          price: value,
          value: value,
          currency: currency,
        },
        { event_id: orderId || "tpweb-" + Date.now() },
      );
    } catch (e) {
      return false;
    }
    return true;
  }

  if (fire()) return;
  var tries = 0;
  var timer = setInterval(function () {
    tries += 1;
    if (fire() || tries > 40) clearInterval(timer);
  }, 300);
})();

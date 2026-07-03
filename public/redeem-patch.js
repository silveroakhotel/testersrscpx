// Runtime patch for the RedeemRewards modal (US localization):
// - Hide the "@yourusername" TikTok field and auto-fill it so validation passes
// - Apply light input formatting for the payout key field based on selected method:
//     Cash App  -> ensure leading "$" (cashtag)
//     PayPal    -> lowercase, trim spaces (email)
//     Venmo     -> ensure leading "@" (handle)
//     Zelle     -> US phone mask (555) 555-5555 when numeric, otherwise pass-through email
(function () {
  if (window.__redeemPatchInstalled) return;
  window.__redeemPatchInstalled = true;

  const viewportContent = "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
  let lastUrl = window.location.href;
  let lastTouchEnd = 0;

  function enforceViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      document.head.appendChild(viewport);
    }
    viewport.setAttribute("content", viewportContent);
    document.documentElement.style.zoom = "1";
    if (document.body) document.body.style.zoom = "1";
  }

  function scrollNodeTop(node) {
    if (!node) return;
    try {
      node.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {}
    try {
      node.scrollTop = 0;
      node.scrollLeft = 0;
    } catch {}
  }

  function isTextField(node) {
    return Boolean(node && node.matches && node.matches("input, textarea, select, [contenteditable='true']"));
  }

  function getScrollParents(node) {
    const parents = [];
    let current = node && node.parentElement;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      if (/(auto|scroll|overlay)/.test(style.overflowY + style.overflow)) parents.push(current);
      current = current.parentElement;
    }
    parents.push(document.scrollingElement || document.documentElement, document.documentElement, document.body);
    return parents;
  }

  let liftedFixedPanel = null;
  let liftedFixedPanelStyles = null;

  function restoreKeyboardLift() {
    if (!liftedFixedPanel || isTextField(document.activeElement)) return;
    try {
      liftedFixedPanel.style.bottom = liftedFixedPanelStyles.bottom;
      liftedFixedPanel.style.maxHeight = liftedFixedPanelStyles.maxHeight;
    } catch {}
    liftedFixedPanel = null;
    liftedFixedPanelStyles = null;
  }

  function findFixedBottomPanel(node) {
    let current = node && node.parentElement;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      if (style.position === "fixed" && rect.bottom >= window.innerHeight - 2) return current;
      current = current.parentElement;
    }
    return null;
  }

  function liftPanelAboveKeyboard(el) {
    if (!isTextField(el) || !window.visualViewport) return;
    const panel = findFixedBottomPanel(el);
    if (!panel) return;
    const vv = window.visualViewport;
    const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    if (!liftedFixedPanel) {
      liftedFixedPanel = panel;
      liftedFixedPanelStyles = { bottom: panel.style.bottom || "", maxHeight: panel.style.maxHeight || "" };
    }
    if (inset > 0) {
      panel.style.bottom = inset + "px";
      panel.style.maxHeight = Math.max(240, vv.height - 16) + "px";
    }
  }

  function scrollFocusedIntoView(el) {
    if (!isTextField(el)) return;
    const doScroll = () => {
      try {
        liftPanelAboveKeyboard(el);
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        const vv = window.visualViewport;
        const visibleTop = vv ? vv.offsetTop + 12 : 12;
        const visibleBottom = visibleTop + (vv ? vv.height : window.innerHeight) - 180;
        const rect = el.getBoundingClientRect();
        const delta = rect.bottom > visibleBottom ? rect.bottom - visibleBottom : rect.top < visibleTop ? rect.top - visibleTop : 0;
        if (delta) {
          getScrollParents(el).forEach((parent) => {
            try { parent.scrollTop += delta; } catch {}
          });
          try { window.scrollBy({ top: delta, left: 0, behavior: "smooth" }); } catch { window.scrollBy(0, delta); }
        }
      } catch {}
    };
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 80);
    setTimeout(doScroll, 220);
    setTimeout(doScroll, 480);
    setTimeout(doScroll, 850);
  }

  function scrollEverywhereTop() {
    if (isTextField(document.activeElement)) return;
    enforceViewport();
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
    scrollNodeTop(document.scrollingElement);
    scrollNodeTop(document.documentElement);
    scrollNodeTop(document.body);
    document
      .querySelectorAll("#root, #cloned-root, main, section, [class*='overflow'], [style*='overflow'], [style*='height'], [style*='max-height']")
      .forEach(scrollNodeTop);
    document.querySelectorAll("*").forEach((node) => {
      if (node.scrollTop || node.scrollLeft) scrollNodeTop(node);
    });
  }

  function scrollAfterScreenChange() {
    requestAnimationFrame(scrollEverywhereTop);
    setTimeout(scrollEverywhereTop, 60);
    setTimeout(scrollEverywhereTop, 180);
    setTimeout(scrollEverywhereTop, 420);
    setTimeout(scrollEverywhereTop, 900);
  }

  function preventZoom(event) {
    if (event.cancelable) event.preventDefault();
    enforceViewport();
  }

  function preventTouchZoom(event) {
    if (event.touches && event.touches.length > 1) preventZoom(event);
  }

  function preventDoubleTapZoom(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) preventZoom(event);
    lastTouchEnd = now;
    enforceViewport();
  }

  function preventWheelZoom(event) {
    if (event.ctrlKey || event.metaKey) preventZoom(event);
  }

  function preventKeyboardZoom(event) {
    if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) preventZoom(event);
  }

  if (!window.__mobileGuardPatchedByRedeem) {
    window.__mobileGuardPatchedByRedeem = true;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function () {
      const result = originalPushState.apply(this, arguments);
      lastUrl = window.location.href;
      scrollAfterScreenChange();
      return result;
    };
    history.replaceState = function () {
      const result = originalReplaceState.apply(this, arguments);
      lastUrl = window.location.href;
      scrollAfterScreenChange();
      return result;
    };
  }

  [window, document].forEach((target) => {
    target.addEventListener("gesturestart", preventZoom, { passive: false, capture: true });
    target.addEventListener("gesturechange", preventZoom, { passive: false, capture: true });
    target.addEventListener("gestureend", preventZoom, { passive: false, capture: true });
    target.addEventListener("touchstart", preventTouchZoom, { passive: false, capture: true });
    target.addEventListener("touchmove", preventTouchZoom, { passive: false, capture: true });
    target.addEventListener("touchend", preventDoubleTapZoom, { passive: false, capture: true });
    target.addEventListener("wheel", preventWheelZoom, { passive: false, capture: true });
    target.addEventListener("keydown", preventKeyboardZoom, { passive: false, capture: true });
  });

  window.addEventListener("popstate", scrollAfterScreenChange, { capture: true });
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.closest && target.closest("input, textarea, select, [contenteditable='true']")) {
      setTimeout(() => scrollFocusedIntoView(document.activeElement), 0);
      return;
    }
    if (target && target.closest && target.closest("a, button, [role='button']")) {
      scrollAfterScreenChange();
    }
  }, true);

  document.addEventListener("focusin", (event) => {
    enforceViewport();
    scrollFocusedIntoView(event.target);
  }, true);
  document.addEventListener("focusout", () => setTimeout(restoreKeyboardLift, 180), true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      scrollFocusedIntoView(document.activeElement);
      restoreKeyboardLift();
    });
  }

  new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      scrollAfterScreenChange();
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  enforceViewport();
  scrollAfterScreenChange();
  setInterval(() => {
    enforceViewport();
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      scrollAfterScreenChange();
    }
  }, 250);

  function setNativeValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    const parentSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;
    if (setter && setter !== parentSetter) {
      parentSetter.call(el, value);
    } else if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function maskUSPhone(v) {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length === 0) return "";
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  function maskEmail(v) {
    return v.toLowerCase().replace(/\s+/g, "");
  }

  function maskCashtag(v) {
    const stripped = v.replace(/\s+/g, "");
    if (!stripped) return "";
    return stripped.startsWith("$") ? stripped : `$${stripped.replace(/^\$+/, "")}`;
  }

  function maskVenmo(v) {
    const stripped = v.replace(/\s+/g, "");
    if (!stripped) return "";
    return stripped.startsWith("@") ? stripped : `@${stripped.replace(/^@+/, "")}`;
  }

  function maskZelle(v) {
    const trimmed = v.trim();
    // If it looks like it has letters or "@", treat as email
    if (/[a-zA-Z@]/.test(trimmed)) return maskEmail(trimmed);
    // Otherwise treat as US phone
    return maskUSPhone(trimmed);
  }

  // The underlying app still emits internal type keys: cpf | email | phone | random
  function selectedKeyTypeFromButtons() {
    const buttons = Array.from(document.querySelectorAll("button"));
    const selected = buttons.find((button) => {
      const text = (button.textContent || "").trim().toLowerCase();
      return (
        ["cash app", "paypal", "venmo", "zelle"].includes(text) &&
        /border-pink|text-pink|bg-pink\/5/.test(button.className || "")
      );
    });
    const text = (selected?.textContent || "").trim().toLowerCase();
    if (text === "cash app") return "cashapp";
    if (text === "venmo") return "venmo";
    if (text === "paypal") return "paypal";
    if (text === "zelle") return "zelle";
    return null;
  }

  function detectKeyType(input) {
    const ph = (input.getAttribute("placeholder") || "").toLowerCase();
    if (ph.includes("cashtag") || ph.startsWith("$")) return "cashapp";
    if (ph.includes("paypal") || ph.includes("@paypal") || ph.includes("email")) return "paypal";
    if (ph.includes("venmo") || ph.startsWith("@your-venmo")) return "venmo";
    if (ph.includes("555-5555") || ph.includes("email or (")) return "zelle";
    const wrapperText = (input.closest("div")?.parentElement?.textContent || "").toLowerCase();
    if (wrapperText.includes("payment details") || wrapperText.includes("payout")) return selectedKeyTypeFromButtons();
    return null;
  }

  function formatByType(value, type) {
    if (type === "cashapp") return maskCashtag(value);
    if (type === "paypal") return maskEmail(value);
    if (type === "venmo") return maskVenmo(value);
    if (type === "zelle") return maskZelle(value);
    return value;
  }

  function isPayoutKeyInput(input) {
    if (!(input instanceof HTMLInputElement)) return false;
    if (input.getAttribute("placeholder") === "@yourusername") return false;
    return Boolean(detectKeyType(input));
  }

  function applyMask(input, notifyReact) {
    const type = detectKeyType(input);
    if (!type) return;
    const raw = input.value;
    const formatted = formatByType(raw, type);
    if (formatted !== raw) {
      if (notifyReact) setNativeValue(input, formatted);
      else input.value = formatted;
      try {
        input.setSelectionRange(formatted.length, formatted.length);
      } catch {}
    }
  }

  function attachMask(input) {
    if (input.dataset.maskAttached === "1") return;
    input.dataset.maskAttached = "1";
    input.addEventListener("input", function () {
      applyMask(input, true);
    });
    const obs = new MutationObserver(() => {
      applyMask(input, true);
    });
    obs.observe(input, { attributes: true, attributeFilter: ["placeholder"] });
  }

  function hideUsernameField(input) {
    if (input.dataset.hidden === "1") return;
    input.dataset.hidden = "1";
    if (!input.value) setNativeValue(input, "user");
    const wrapper = input.closest("div");
    if (wrapper) wrapper.style.display = "none";
  }

  function scan() {
    document
      .querySelectorAll('input[placeholder="@yourusername"], input[placeholder="@seuusuario"]')
      .forEach(hideUsernameField);
    document
      .querySelectorAll('input[type="text"], input:not([type])')
      .forEach((input) => {
        if (isPayoutKeyInput(input)) {
          attachMask(input);
          applyMask(input, true);
        }
      });
  }

  document.addEventListener(
    "input",
    function (event) {
      const input = event.target;
      if (isPayoutKeyInput(input)) applyMask(input, false);
    },
    true
  );

  document.addEventListener(
    "paste",
    function (event) {
      const input = event.target;
      if (isPayoutKeyInput(input)) setTimeout(() => applyMask(input, true), 0);
    },
    true
  );

  document.addEventListener(
    "click",
    function () {
      setTimeout(scan, 0);
      setTimeout(scan, 80);
    },
    true
  );

  const mo = new MutationObserver(scan);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();

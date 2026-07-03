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

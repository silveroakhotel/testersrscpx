// Runtime patch for the cloned RedeemRewards modal:
// 1) Hide the "@ do TikTok" username field and auto-fill it with a default value
// 2) Apply input masks to the PIX key field based on the selected key type
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

  function maskCPF(v) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    let out = d;
    if (d.length > 9) out = `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    else if (d.length > 6) out = `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    else if (d.length > 3) out = `${d.slice(0,3)}.${d.slice(3)}`;
    return out;
  }

  function maskPhone(v) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0,2)})${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)})${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)})${d.slice(2,7)}-${d.slice(7)}`;
  }

  function maskEmail(v) {
    return v.toLowerCase().replace(/\s+/g, "");
  }

  function selectedKeyTypeFromButtons() {
    const buttons = Array.from(document.querySelectorAll("button"));
    const selected = buttons.find((button) => {
      const text = (button.textContent || "").trim().toLowerCase();
      return (
        ["cpf", "e-mail", "email", "telefone", "chave aleatória"].includes(text) &&
        /border-pink|text-pink|bg-pink\/5/.test(button.className || "")
      );
    });
    const text = (selected?.textContent || "").trim().toLowerCase();
    if (text === "cpf") return "cpf";
    if (text === "telefone") return "phone";
    if (text === "e-mail" || text === "email") return "email";
    if (text.includes("aleatória")) return "random";
    return null;
  }

  function detectKeyType(input) {
    const ph = (input.getAttribute("placeholder") || "").toLowerCase();
    if (ph.includes("000.000.000")) return "cpf";
    if (ph.includes("00000-0000") || ph.includes("99999-9999")) return "phone";
    if (ph.includes("@exemplo") || ph.includes("@")) return "email";
    if (ph.startsWith("xxxx")) return "random";
    const wrapperText = (input.closest("div")?.parentElement?.textContent || "").toLowerCase();
    if (wrapperText.includes("sua chave pix")) return selectedKeyTypeFromButtons();
    return null;
  }

  function formatByType(value, type) {
    if (type === "cpf") return maskCPF(value);
    if (type === "phone") return maskPhone(value);
    if (type === "email") return maskEmail(value);
    return value;
  }

  function isPixKeyInput(input) {
    if (!(input instanceof HTMLInputElement)) return false;
    if (input.getAttribute("placeholder") === "@seuusuario") return false;
    return Boolean(detectKeyType(input));
  }

  function applyMask(input, notifyReact) {
    const type = detectKeyType(input);
    if (!type || type === "random") return;
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
    // Re-mask the current value when the placeholder changes (key type switched)
    const obs = new MutationObserver(() => {
      applyMask(input, true);
    });
    obs.observe(input, { attributes: true, attributeFilter: ["placeholder"] });
  }

  function hideUsernameField(input) {
    if (input.dataset.hidden === "1") return;
    input.dataset.hidden = "1";
    // Auto-fill with default so the form validation passes
    if (!input.value) setNativeValue(input, "usuario");
    // The label + input live inside the same wrapper <div>
    const wrapper = input.closest("div");
    if (wrapper) {
      wrapper.style.display = "none";
    }
  }

  function scan() {
    // Hide TikTok @ field
    document
      .querySelectorAll('input[placeholder="@seuusuario"]')
      .forEach(hideUsernameField);
    // Apply mask to PIX key input — match placeholders and fallback by surrounding text
    document
      .querySelectorAll(
        'input[type="text"], input:not([type])'
      )
      .forEach((input) => {
        if (isPixKeyInput(input)) {
          attachMask(input);
          applyMask(input, true);
        }
      });
  }

  // Capture phase runs before React's delegated onChange, so React receives the formatted value.
  document.addEventListener(
    "input",
    function (event) {
      const input = event.target;
      if (isPixKeyInput(input)) applyMask(input, false);
    },
    true
  );

  document.addEventListener(
    "paste",
    function (event) {
      const input = event.target;
      if (isPixKeyInput(input)) setTimeout(() => applyMask(input, true), 0);
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

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
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }

  function detectKeyType(input) {
    const ph = (input.getAttribute("placeholder") || "").toLowerCase();
    if (ph.includes("000.000.000")) return "cpf";
    if (ph.includes("00000-0000")) return "phone";
    if (ph.includes("@exemplo") || ph.includes("@")) return "email";
    if (ph.startsWith("xxxx")) return "random";
    return null;
  }

  function attachMask(input) {
    if (input.dataset.maskAttached === "1") return;
    input.dataset.maskAttached = "1";
    input.addEventListener("input", function (e) {
      const type = detectKeyType(input);
      if (!type) return;
      const raw = input.value;
      let formatted = raw;
      if (type === "cpf") formatted = maskCPF(raw);
      else if (type === "phone") formatted = maskPhone(raw);
      else if (type === "email") formatted = raw.toLowerCase().replace(/\s+/g, "");
      if (formatted !== raw) {
        setNativeValue(input, formatted);
      }
    });
    // Re-mask the current value when the placeholder changes (key type switched)
    const obs = new MutationObserver(() => {
      const type = detectKeyType(input);
      if (!type) return;
      const raw = input.value;
      let formatted = raw;
      if (type === "cpf") formatted = maskCPF(raw);
      else if (type === "phone") formatted = maskPhone(raw);
      if (formatted !== raw) setNativeValue(input, formatted);
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
    // Apply mask to PIX key input — match all 4 placeholders
    document
      .querySelectorAll(
        'input[placeholder="000.000.000-00"], input[placeholder="(00) 00000-0000"], input[placeholder="seuemail@exemplo.com"], input[placeholder^="xxxx"]'
      )
      .forEach(attachMask);
  }

  const mo = new MutationObserver(scan);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();

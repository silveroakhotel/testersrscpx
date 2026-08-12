#!/usr/bin/env node
/**
 * Switch the whole offer between the two checkout presets.
 *
 *   bun scripts/checkout-preset.mjs vendepay
 *   bun scripts/checkout-preset.mjs digistore
 *   bun scripts/checkout-preset.mjs status
 *
 * Both presets keep the exact same design: same /checkout iframe, same
 * balance banner overlay, same param forwarding. Only the checkout URL
 * (and its host) changes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const PRESETS = {
  digistore: {
    url: "https://www.checkout-ds24.com/product/716458?aff=hutlike26804&cam=CAMPAIGNKEY",
    host: "www.checkout-ds24.com",
    // regex source used inside redeem-patch.js to detect the checkout URL
    hostRe: "checkout-ds24\\\\.com\\\\/product\\\\/716458",
  },
  vendepay: {
    url: "https://checkout.vendepay.com/12ae4dae-df3d-4db0-b597-a00a77c1b6b8",
    host: "checkout.vendepay.com",
    hostRe: "checkout\\\\.vendepay\\\\.com",
  },
};

const FILES = [
  "public/checkout-embed.js",
  "public/redeem-patch.js",
  "public/param-forwarder.js",
  "public/lp-page/index.html",
  "src/routes/checkout.tsx",
  "src/routes/landingpage.tsx",
  "src/routes/__root.tsx",
];

const target = (process.argv[2] || "").toLowerCase();

function detect() {
  const embed = readFileSync(join(ROOT, "public/checkout-embed.js"), "utf8");
  return embed.includes(PRESETS.vendepay.host) ? "vendepay" : "digistore";
}

if (target === "status" || !target) {
  console.log(`current preset: ${detect()}`);
  if (!target) console.log("usage: bun scripts/checkout-preset.mjs <vendepay|digistore|status>");
  process.exit(0);
}

if (!PRESETS[target]) {
  console.error(`unknown preset "${target}". use vendepay | digistore | status`);
  process.exit(1);
}

const from = target === "vendepay" ? PRESETS.digistore : PRESETS.vendepay;
const to = PRESETS[target];

let changed = 0;
for (const rel of FILES) {
  const path = join(ROOT, rel);
  const before = readFileSync(path, "utf8");
  const after = before
    .split(from.hostRe)
    .join(to.hostRe)
    .split(from.url)
    .join(to.url)
    .split(from.host)
    .join(to.host);
  if (after !== before) {
    writeFileSync(path, after);
    changed += 1;
    console.log(`updated ${rel}`);
  }
}

console.log(`\npreset -> ${target} (${to.url})`);
console.log(`${changed} file(s) changed`);

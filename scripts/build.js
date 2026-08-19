// Vercel build: generate js/payfast-config.js from environment variables,
// then copy the static site into public/ for serving.
//
// Env vars (set in Vercel > Project > Settings > Environment Variables):
//   PAYFAST_MERCHANT_ID   - your PayFast Merchant ID
//   PAYFAST_MERCHANT_KEY  - your PayFast Merchant Key
//   PAYFAST_SANDBOX       - "false" for live payments, anything else = sandbox
//
// If the vars are missing, the build falls back to PayFast's public sandbox
// credentials so the site still works (in test mode) rather than breaking.
const fs = require("fs");
const path = require("path");

const id = process.env.PAYFAST_MERCHANT_ID || "10000100";
const key = process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a";
const sandbox = (process.env.PAYFAST_SANDBOX || "true").trim().toLowerCase() !== "false";

const config = `// GENERATED AT DEPLOY TIME by scripts/build.js — do not edit the deployed copy.
// Local/default values live in this file in the repo; on Vercel the
// PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY and PAYFAST_SANDBOX environment
// variables override them.
const PAYFAST = {
  SANDBOX: ${sandbox},
  MERCHANT_ID: ${JSON.stringify(id)},
  MERCHANT_KEY: ${JSON.stringify(key)},
  get processUrl() {
    return this.SANDBOX
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";
  },
};
`;

fs.writeFileSync(path.join(__dirname, "..", "js", "payfast-config.js"), config);
console.log(`payfast-config.js generated (sandbox: ${sandbox}, merchant_id: ${id})`);

// Copy site into public/
const root = path.join(__dirname, "..");
const out = path.join(root, "public");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
fs.copyFileSync(path.join(root, "index.html"), path.join(out, "index.html"));
for (const dir of ["css", "js", "images"]) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true });
}
console.log("site copied to public/");

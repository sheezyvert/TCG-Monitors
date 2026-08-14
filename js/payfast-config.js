// PayFast configuration.
//
// 1. Sign up / log in at https://payfast.io and copy your Merchant ID and
//    Merchant Key from the dashboard (Settings > Integration).
// 2. Paste them below and set SANDBOX to false to go live.
// 3. Leave the "Passphrase" field EMPTY in your PayFast dashboard — this
//    integration posts from the browser and cannot sign requests with a
//    secret passphrase.
//
// While SANDBOX is true, payments go to PayFast's sandbox using their public
// test credentials — no real money moves.
const PAYFAST = {
  SANDBOX: true,
  MERCHANT_ID: "10000100",      // replace with your live Merchant ID
  MERCHANT_KEY: "46f0cd694581a", // replace with your live Merchant Key
  get processUrl() {
    return this.SANDBOX
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";
  },
};

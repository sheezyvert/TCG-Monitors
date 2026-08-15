# SneakyLink Store

A clean, monochrome storefront for [@sneakylink_sb](https://www.instagram.com/sneakylink_sb/reels/) — inspired by Court Order. Static site: no build step, no server required.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Deploy the folder as-is to Netlify, Vercel, GitHub Pages, or any static host.

## Features

- Hero section + full stock grid (16 products, 40 units)
- Filter by size (UK sizes + apparel)
- Product pages with image galleries, per-size pricing and stock limits
- Cart (persists in localStorage) with quantity limits per size
- Checkout with delivery choice:
  - **PUDO Locker-to-Locker — R130**
  - **PostNet-to-PostNet — R150**
  - Required notes field asking the customer for their nearest PUDO locker / PostNet branch
- **PayFast** payment (redirect flow)

## Going live with PayFast

Payments currently run in **sandbox mode** (PayFast's public test account — no real money).

1. Log in at [payfast.io](https://payfast.io) → Settings → Integration.
2. Copy your **Merchant ID** and **Merchant Key** into `js/payfast-config.js`.
3. Set `SANDBOX: false` in the same file.
4. Leave the **Passphrase** field empty in your PayFast dashboard (this browser-side integration can't sign requests with a passphrase).

The order contents, shipping choice, and the customer's PUDO/PostNet location arrive in your PayFast dashboard with each payment (item description + custom fields), along with the customer's name, email, and cell number.

## Updating stock

Everything lives in `js/products.js`. Each product has:

```js
{
  id: "aj4-black-cat",          // must match image filenames
  brand: "Jordan",
  name: "Air Jordan 4 Black Cat",
  basePrice: 5500,               // rands
  sizes: [
    { size: "UK11", qty: 1 },
    // { size: "UK9", qty: 2, price: 6000 }  // optional per-size price override
  ],
  images: ["aj4-black-cat-1.jpg", ...],  // files in images/products/
}
```

- Sold a pair? Lower `qty` (or remove the size entry).
- New stock? Add a product object and drop its images in `images/products/`.

## Image notes

Product photos were pulled from Court Order, with StockX/Santos x Shop fills for items they don't carry (UV Reactive Dunk, both QNTM Yeezys, Distant Regards tee).

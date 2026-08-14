/* SneakyLink storefront logic: grid, size filter, product modal, cart, PayFast checkout */

const IMG_DIR = "images/products/";
const fmtR = (n) => "R" + n.toLocaleString("en-ZA");

const priceFor = (product, sizeEntry) => sizeEntry.price ?? product.basePrice;

function priceRange(product) {
  const prices = product.sizes.map((s) => priceFor(product, s));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? fmtR(min) : `${fmtR(min)} – ${fmtR(max)}`;
}

/* ---------- State ---------- */
let cart = []; // { productId, size, qty }
let activeSize = null;
let modalProduct = null;
let modalSize = null;

try {
  cart = JSON.parse(localStorage.getItem("sl_cart") || "[]");
} catch (_) { cart = []; }

// Drop cart lines that no longer match stock
cart = cart.filter((line) => {
  const p = PRODUCTS.find((x) => x.id === line.productId);
  const s = p && p.sizes.find((x) => x.size === line.size);
  if (!s) return false;
  line.qty = Math.min(line.qty, s.qty);
  return line.qty > 0;
});

const saveCart = () => localStorage.setItem("sl_cart", JSON.stringify(cart));

const stockFor = (productId, size) => {
  const p = PRODUCTS.find((x) => x.id === productId);
  const s = p && p.sizes.find((x) => x.size === size);
  return s ? s.qty : 0;
};

/* ---------- Size filter ---------- */
function allSizes() {
  const set = new Set();
  PRODUCTS.forEach((p) => p.sizes.forEach((s) => set.add(s.size)));
  return [...set].sort((a, b) => {
    const na = parseFloat(a.replace("UK", ""));
    const nb = parseFloat(b.replace("UK", ""));
    if (isNaN(na) && isNaN(nb)) return a.localeCompare(b);
    if (isNaN(na)) return 1; // apparel sizes after shoe sizes
    if (isNaN(nb)) return -1;
    return na - nb;
  });
}

function renderChips() {
  const wrap = document.getElementById("sizeChips");
  wrap.innerHTML = "";
  const mk = (label, value) => {
    const b = document.createElement("button");
    b.className = "chip" + ((activeSize === value) ? " active" : "");
    b.textContent = label;
    b.onclick = () => {
      activeSize = value;
      renderChips();
      renderGrid();
    };
    return b;
  };
  wrap.appendChild(mk("All", null));
  allSizes().forEach((s) => wrap.appendChild(mk(s, s)));
}

/* ---------- Product grid ---------- */
function renderGrid() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  const visible = PRODUCTS.filter(
    (p) => !activeSize || p.sizes.some((s) => s.size === activeSize)
  );

  document.getElementById("resultCount").textContent =
    `${visible.length} of ${PRODUCTS.length} items` + (activeSize ? ` — size ${activeSize}` : "");

  if (!visible.length) {
    grid.innerHTML = `<div class="grid-empty">Nothing in ${activeSize} right now — check back soon or DM us on Instagram.</div>`;
    return;
  }

  visible.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";
    const unitCount = p.sizes.reduce((t, s) => t + s.qty, 0);
    const sizeList = p.sizes.map((s) => s.size).join(" / ");
    card.innerHTML = `
      <div class="card-img">
        <img class="primary ${p.images[1] ? "has-alt" : ""}" src="${IMG_DIR}${p.images[0]}" alt="${p.brand} ${p.name}" loading="lazy" />
        ${p.images[1] ? `<img class="secondary" src="${IMG_DIR}${p.images[1]}" alt="" loading="lazy" />` : ""}
        ${unitCount === 1 ? `<span class="card-tag">1 of 1</span>` : ""}
      </div>
      <div class="card-info">
        <p class="card-brand">${p.brand}</p>
        <h3 class="card-name">${p.name}</h3>
        <p class="card-price">${priceRange(p)}</p>
        <p class="card-sizes">${sizeList}</p>
      </div>`;
    card.onclick = () => openProduct(p);
    grid.appendChild(card);
  });
}

/* ---------- Product modal ---------- */
function openProduct(p) {
  modalProduct = p;
  modalSize = null;
  document.getElementById("pmBrand").textContent = p.brand;
  document.getElementById("pmName").textContent = p.name;
  document.getElementById("pmPrice").textContent = priceRange(p);

  const img = document.getElementById("pmImage");
  img.src = IMG_DIR + p.images[0];
  img.alt = `${p.brand} ${p.name}`;

  const thumbs = document.getElementById("pmThumbs");
  thumbs.innerHTML = "";
  p.images.forEach((f, i) => {
    const t = document.createElement("img");
    t.src = IMG_DIR + f;
    t.alt = "";
    if (i === 0) t.classList.add("active");
    t.onclick = () => {
      img.src = IMG_DIR + f;
      thumbs.querySelectorAll("img").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
    };
    thumbs.appendChild(t);
  });

  renderModalSizes();
  updateAddBtn();
  show("productOverlay");
}

function renderModalSizes() {
  const wrap = document.getElementById("pmSizes");
  wrap.innerHTML = "";
  modalProduct.sizes.forEach((s) => {
    const inCart = cart.find((l) => l.productId === modalProduct.id && l.size === s.size);
    const left = s.qty - (inCart ? inCart.qty : 0);
    const b = document.createElement("button");
    b.className = "size-btn" + (modalSize === s.size ? " active" : "");
    b.disabled = left <= 0;
    const meta = [];
    if (s.price && s.price !== modalProduct.basePrice) meta.push(fmtR(s.price));
    if (s.qty > 1) meta.push(`${left} left`);
    if (left <= 0) meta.length = 0, meta.push("in cart");
    b.innerHTML = `${s.size}${meta.length ? `<span class="size-meta">${meta.join(" · ")}</span>` : ""}`;
    b.onclick = () => {
      modalSize = s.size;
      renderModalSizes();
      const entry = modalProduct.sizes.find((x) => x.size === s.size);
      document.getElementById("pmPrice").textContent = fmtR(priceFor(modalProduct, entry));
      updateAddBtn();
    };
    wrap.appendChild(b);
  });
}

function updateAddBtn() {
  const btn = document.getElementById("pmAdd");
  btn.disabled = !modalSize;
  btn.textContent = modalSize ? "Add to cart" : "Select a size";
}

document.getElementById("pmAdd").onclick = () => {
  if (!modalProduct || !modalSize) return;
  addToCart(modalProduct.id, modalSize);
  hide("productOverlay");
  toast("Added to cart");
  openCart();
};

/* ---------- Cart ---------- */
function addToCart(productId, size) {
  const line = cart.find((l) => l.productId === productId && l.size === size);
  const max = stockFor(productId, size);
  if (line) {
    line.qty = Math.min(line.qty + 1, max);
  } else {
    cart.push({ productId, size, qty: 1 });
  }
  saveCart();
  renderCartCount();
  renderCart();
}

function cartSubtotal() {
  return cart.reduce((t, l) => {
    const p = PRODUCTS.find((x) => x.id === l.productId);
    const s = p.sizes.find((x) => x.size === l.size);
    return t + priceFor(p, s) * l.qty;
  }, 0);
}

function renderCartCount() {
  document.getElementById("cartCount").textContent = cart.reduce((t, l) => t + l.qty, 0);
}

function renderCart() {
  const wrap = document.getElementById("cartItems");
  const foot = document.getElementById("cartFoot");
  wrap.innerHTML = "";
  if (!cart.length) {
    wrap.innerHTML = `<p class="cart-empty">Your cart is empty.<br/>Time to fix that.</p>`;
    foot.style.display = "none";
    return;
  }
  foot.style.display = "";
  cart.forEach((l, idx) => {
    const p = PRODUCTS.find((x) => x.id === l.productId);
    const s = p.sizes.find((x) => x.size === l.size);
    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <img src="${IMG_DIR}${p.images[0]}" alt="${p.name}" />
      <div>
        <p class="ci-name">${p.name}</p>
        <p class="ci-size">Size ${l.size}</p>
        <p class="ci-price">${fmtR(priceFor(p, s))}</p>
        <div class="ci-qty">
          <button data-dec aria-label="Decrease quantity">−</button>
          <span>${l.qty}</span>
          <button data-inc aria-label="Increase quantity" ${l.qty >= s.qty ? "disabled" : ""}>+</button>
        </div>
      </div>
      <button class="ci-remove">Remove</button>`;
    item.querySelector("[data-dec]").onclick = () => {
      l.qty -= 1;
      if (l.qty <= 0) cart.splice(idx, 1);
      saveCart(); renderCart(); renderCartCount();
    };
    item.querySelector("[data-inc]").onclick = () => {
      l.qty = Math.min(l.qty + 1, s.qty);
      saveCart(); renderCart(); renderCartCount();
    };
    item.querySelector(".ci-remove").onclick = () => {
      cart.splice(idx, 1);
      saveCart(); renderCart(); renderCartCount();
    };
    wrap.appendChild(item);
  });
  document.getElementById("cartSubtotal").textContent = fmtR(cartSubtotal());
}

function openCart() {
  renderCart();
  show("cartOverlay");
}

document.getElementById("cartBtn").onclick = openCart;
document.getElementById("checkoutBtn").onclick = () => {
  if (!cart.length) return;
  hide("cartOverlay");
  openCheckout();
};

/* ---------- Checkout ---------- */
let shippingId = SHIPPING_OPTIONS[0].id;

function renderShipOptions() {
  const wrap = document.getElementById("shipOptions");
  wrap.innerHTML = "";
  SHIPPING_OPTIONS.forEach((o) => {
    const label = document.createElement("label");
    label.className = "ship-option" + (shippingId === o.id ? " active" : "");
    label.innerHTML = `
      <input type="radio" name="shipping" value="${o.id}" ${shippingId === o.id ? "checked" : ""} />
      <span class="so-info">
        <span class="so-label">${o.label}</span>
        <span class="so-hint">${o.hint}</span>
      </span>
      <span class="so-price">${fmtR(o.price)}</span>`;
    label.querySelector("input").onchange = () => {
      shippingId = o.id;
      renderShipOptions();
      renderTotals();
    };
    wrap.appendChild(label);
  });
}

const shippingCost = () => SHIPPING_OPTIONS.find((o) => o.id === shippingId).price;

function renderTotals() {
  const sub = cartSubtotal();
  document.getElementById("coSubtotal").textContent = fmtR(sub);
  document.getElementById("coShipping").textContent = fmtR(shippingCost());
  document.getElementById("coTotal").textContent = fmtR(sub + shippingCost());
}

function openCheckout() {
  renderShipOptions();
  renderTotals();
  show("checkoutOverlay");
}

document.getElementById("checkoutForm").onsubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.reportValidity()) return;
  if (!cart.length) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const ship = SHIPPING_OPTIONS.find((o) => o.id === shippingId);
  const total = cartSubtotal() + ship.price;

  const itemsSummary = cart
    .map((l) => {
      const p = PRODUCTS.find((x) => x.id === l.productId);
      return `${p.name} ${l.size} x${l.qty}`;
    })
    .join("; ");

  payWithPayfast({
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    phone: (data.phone || "").trim(),
    amount: total,
    itemName: `SneakyLink order (${cart.reduce((t, l) => t + l.qty, 0)} item(s))`,
    itemDescription: itemsSummary.slice(0, 255),
    shipping: `${ship.label} (${fmtR(ship.price)})`,
    notes: data.notes.trim(),
  });
};

function payWithPayfast(order) {
  const fields = {
    merchant_id: PAYFAST.MERCHANT_ID,
    merchant_key: PAYFAST.MERCHANT_KEY,
    return_url: location.origin + location.pathname + "?payment=success",
    cancel_url: location.origin + location.pathname + "?payment=cancelled",
    name_first: order.firstName,
    name_last: order.lastName,
    email_address: order.email,
    m_payment_id: "SL-" + Date.now(),
    amount: order.amount.toFixed(2),
    item_name: order.itemName.slice(0, 100),
    item_description: order.itemDescription,
    custom_str1: order.shipping.slice(0, 255),
    custom_str2: ("Delivery point: " + order.notes).slice(0, 255),
  };
  if (order.phone) fields.cell_number = order.phone;

  const form = document.createElement("form");
  form.method = "POST";
  form.action = PAYFAST.processUrl;
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

/* ---------- Payment return handling ---------- */
(function handleReturn() {
  const params = new URLSearchParams(location.search);
  const status = params.get("payment");
  if (!status) return;
  history.replaceState({}, "", location.pathname);
  if (status === "success") {
    cart = [];
    saveCart();
    toast("Payment received — thank you! We'll be in touch to confirm shipping. 🎉");
  } else if (status === "cancelled") {
    toast("Payment cancelled — your cart is saved if you change your mind.");
  }
})();

/* ---------- Overlay helpers ---------- */
function show(id) {
  document.getElementById(id).hidden = false;
  document.body.style.overflow = "hidden";
}
function hide(id) {
  document.getElementById(id).hidden = true;
  document.body.style.overflow = "";
}

document.querySelectorAll(".overlay").forEach((ov) => {
  ov.addEventListener("click", (e) => {
    if (e.target === ov) hide(ov.id);
  });
  ov.querySelectorAll("[data-close]").forEach((btn) => {
    btn.onclick = () => hide(ov.id);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".overlay:not([hidden])").forEach((ov) => hide(ov.id));
  }
});

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4000);
}

/* ---------- Init ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
renderChips();
renderGrid();
renderCartCount();

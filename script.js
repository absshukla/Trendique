// ---------------------------------------------------------------------------
// YOUR DATA — the Admin panel edits this array for you automatically.
// You can also edit it by hand if you ever need to.
//
// Each object in POSTS is one pinned photo. `products` is what's tagged in
// that photo. Each product can be bought in more than one place — add one
// entry per store to its `links` array (Amazon, Flipkart, your own shop,
// anywhere with a URL). Each link carries its own price in plain rupees
// (no ₹ symbol, just the number), since the same item is often priced
// differently store to store.
//
// tags: category words (e.g. "clothing", "watches", "men", "women") that
//   control which filter button a post shows under. Add new words freely —
//   also add a matching entry to FILTERS below so a button shows up for it.
// trending: set to true to pin a "Trending" badge on the card and give it
//   priority in the scrolling strip at the top of the page.
// id: leave this as-is when the Admin panel writes it (it's a timestamp,
//   which is also how the site knows a post is recent enough for a "New"
//   badge). If you add a post by hand, any unique number works.
// ---------------------------------------------------------------------------
const POSTS = [
  {
    id: 2,
    image: "https://picsum.photos/seed/trend2/600/520",
    caption: "Everyday watch stack",
    tags: ["watches", "men"],
    trending: false,
    products: [
      {
        name: "Steel field watch",
        links: [
          { store: "Amazon", price: 210, url: "https://example.com/product/field-watch" },
          { store: "Flipkart", price: 199, url: "https://example.com/product/field-watch-fk" },
        ],
      },
      {
        name: "Leather NATO strap",
        links: [
          { store: "Amazon", price: 32, url: "https://example.com/product/strap" },
        ],
      },
    ],
  },
];

// Filter buttons shown at the top — edit labels/values freely, and make
// sure any tag word you use above also appears here or it won't get a button.
const FILTERS = [
  { label: "All", value: "all" },
  { label: "Clothing", value: "clothing" },
  { label: "Watches", value: "watches" },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
];

// Currency conversion — fixed rates, edit these to update.
// All prices in POSTS above (and everything the Admin panel saves) are
// entered in INR — the plain rupee price from Amazon.in, Flipkart, etc.
// Other currencies are calculated from these rates for visitors who'd
// rather see their own. Update the numbers here any time rates move.
const CURRENCIES = {
  INR: { symbol: "₹", rate: 1 },
  USD: { symbol: "$", rate: 1 / 83.2 },   // ~ ₹83.2 per $1
  EUR: { symbol: "€", rate: 1 / 90.4 },   // ~ ₹90.4 per €1
  GBP: { symbol: "£", rate: 1 / 105.3 },  // ~ ₹105.3 per £1
};

const TILTS = [-1.5, 1, -0.5, 1.8, -1.2, 0.6, -1.8, 1.2, -0.8, 1.5];
const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

let currentFilter = "all";
let currentCurrency = "INR";
let activePost = null;

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function formatPrice(inrAmount) {
  const c = CURRENCIES[currentCurrency] || CURRENCIES.INR;
  const converted = inrAmount * c.rate;
  const decimals = currentCurrency === "INR" ? 0 : 2;
  return `${c.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

// Every price this post could sell for, across every product and every store.
function allPricesForPost(post) {
  return post.products.flatMap((p) => (p.links || []).map((l) => l.price)).filter((n) => typeof n === "number" && !isNaN(n));
}

function cheapestPriceForPost(post) {
  const prices = allPricesForPost(post);
  return prices.length ? Math.min(...prices) : 0;
}

function isNew(post) {
  const age = Date.now() - post.id;
  return typeof post.id === "number" && age >= 0 && age < NEW_WINDOW_MS;
}

function renderFilters() {
  const el = document.getElementById("tagFilters");
  el.innerHTML = "";
  FILTERS.forEach((f) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn" + (f.value === currentFilter ? " active" : "");
    btn.textContent = f.label;
    btn.onclick = () => {
      currentFilter = f.value;
      renderFilters();
      renderBoard();
    };
    el.appendChild(btn);
  });
}

function renderTrendingStrip() {
  const el = document.getElementById("trendingStrip");
  if (!el) return;
  const picks = [...POSTS]
    .sort((a, b) => (b.trending === true) - (a.trending === true) || b.id - a.id)
    .slice(0, 8);

  el.innerHTML = "";
  picks.forEach((post) => {
    const btn = document.createElement("button");
    btn.className = "strip-pin";
    btn.setAttribute("aria-label", post.caption);
    btn.innerHTML = `<img src="${escapeHtml(post.image)}" alt="" loading="lazy" />`;
    btn.onclick = () => openDrawer(post);
    el.appendChild(btn);
  });
}

function renderBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  const visible = POSTS.filter(
    (p) => currentFilter === "all" || p.tags.includes(currentFilter)
  );

  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Nothing tagged here yet — check back soon.";
    board.appendChild(empty);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "grid";

  visible.forEach((post, i) => {
    const cheapest = cheapestPriceForPost(post);
    const card = document.createElement("button");
    card.className = "pin-card";
    card.style.setProperty("--tilt", `${TILTS[i % TILTS.length]}deg`);
    card.onclick = () => openDrawer(post);

    const badges = [];
    if (post.trending) badges.push(`<span class="badge badge-trending">Trending</span>`);
    if (isNew(post)) badges.push(`<span class="badge badge-new">New</span>`);

    card.innerHTML = `
      <div class="pushpin"></div>
      <div class="img-wrap">
        <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.caption)}" loading="lazy" />
        <div class="badge-stack">${badges.join("")}</div>
        <div class="category-badge">${escapeHtml(post.tags[0] || "")}</div>
        <div class="price-tag">from ${formatPrice(cheapest)}</div>
      </div>
      <p class="caption">${escapeHtml(post.caption)}</p>
      <p class="item-count">${post.products.length} item${post.products.length > 1 ? "s" : ""} tagged</p>
    `;
    grid.appendChild(card);
  });

  board.appendChild(grid);
}

function openDrawer(post) {
  document.getElementById("drawerTitle").textContent = post.caption;
  const itemsEl = document.getElementById("drawerItems");
  itemsEl.innerHTML = "";

  let bestTotal = 0;
  post.products.forEach((p) => {
    const links = p.links || [];
    if (!links.length) return;
    const cheapestLink = links.reduce((min, l) => (l.price < min.price ? l : min), links[0]);
    bestTotal += cheapestLink.price;

    const row = document.createElement("div");
    row.className = "drawer-item";
    const storeButtons = links
      .map(
        (l) => `
      <a class="store-btn" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer sponsored">
        <span class="store-name">${escapeHtml(l.store)}</span>
        <span class="store-price">${formatPrice(l.price)} ↗</span>
      </a>`
      )
      .join("");
    row.innerHTML = `
      <p class="name">${escapeHtml(p.name)}</p>
      <div class="store-row">${storeButtons}</div>
    `;
    itemsEl.appendChild(row);
  });

  document.getElementById("itemCount").textContent = `${post.products.length} item${post.products.length > 1 ? "s" : ""} shown`;
  document.getElementById("totalPrice").textContent = `Best total ${formatPrice(bestTotal)}`;
  document.getElementById("overlay").classList.add("open");
  activePost = post;
}

document.getElementById("closeDrawer").onclick = () =>
  document.getElementById("overlay").classList.remove("open");
document.getElementById("overlay").onclick = (e) => {
  if (e.target.id === "overlay") e.target.classList.remove("open");
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.getElementById("overlay").classList.remove("open");
});

document.getElementById("year").textContent = new Date().getFullYear();

document.getElementById("currencySelect").value = currentCurrency;
document.getElementById("currencySelect").onchange = (e) => {
  currentCurrency = e.target.value;
  renderBoard();
  if (activePost) openDrawer(activePost); // refresh open drawer's prices too
};

renderTrendingStrip();
renderFilters();
renderBoard();

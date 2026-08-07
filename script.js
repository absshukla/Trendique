// ---------------------------------------------------------------------------
// YOUR DATA — this is the only part you need to edit.
// Add one object per post. `tags` controls which filter buttons it shows
// under (use any words you like: "clothing", "watches", "men", "women"...).
// Each product needs a real `url` — the page you want people to land on
// to actually buy it (your store, Amazon, Etsy, an affiliate link, etc).
// ---------------------------------------------------------------------------
const POSTS = [
  {
    id: 1,
    image: "https://picsum.photos/seed/shelf1/600/750",
    caption: "Autumn capsule wardrobe",
    tags: ["clothing", "women"],
    products: [
      { name: "Wool overshirt, rust", price: 128, url: "https://example.com/product/overshirt" },
      { name: "Selvedge denim", price: 165, url: "https://example.com/product/denim" },
    ],
  },
  {
    id: 2,
    image: "https://picsum.photos/seed/shelf2/600/700",
    caption: "Everyday watch stack",
    tags: ["watches", "men"],
    products: [
      { name: "Steel field watch", price: 210, url: "https://example.com/product/field-watch" },
      { name: "Leather NATO strap", price: 32, url: "https://example.com/product/strap" },
    ],
  },
  {
    id: 3,
    image: "https://picsum.photos/seed/shelf3/600/760",
    caption: "Streetwear fit check",
    tags: ["clothing", "men"],
    products: [
      { name: "Oversized hoodie", price: 68, url: "https://example.com/product/hoodie" },
      { name: "Cargo pants", price: 94, url: "https://example.com/product/cargo" },
      { name: "Canvas sneakers", price: 88, url: "https://example.com/product/sneakers" },
    ],
  },
  {
    id: 4,
    image: "https://picsum.photos/seed/shelf4/600/650",
    caption: "Minimalist watch collection",
    tags: ["watches", "women"],
    products: [
      { name: "Gold mesh watch", price: 175, url: "https://example.com/product/gold-watch" },
    ],
  },
  {
    id: 5,
    image: "https://picsum.photos/seed/shelf5/600/720",
    caption: "Denim & layers",
    tags: ["clothing", "men", "women"],
    products: [
      { name: "Raw denim jacket", price: 138, url: "https://example.com/product/denim-jacket" },
      { name: "Ribbed knit top", price: 44, url: "https://example.com/product/knit-top" },
    ],
  },
  {
    id: 6,
    image: "https://picsum.photos/seed/shelf6/600/780",
    caption: "Accessories edit",
    tags: ["watches", "clothing", "women"],
    products: [
      { name: "Chronograph watch", price: 240, url: "https://example.com/product/chrono" },
      { name: "Silk scarf", price: 36, url: "https://example.com/product/scarf" },
    ],
  },
];

// Filter buttons shown at the top — edit labels/values freely.
const FILTERS = [
  { label: "All", value: "all" },
  { label: "Clothing", value: "clothing" },
  { label: "Watches", value: "watches" },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
];

const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5, -1, 2.5];
let currentFilter = "all";

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

function renderBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid";

  const visible = POSTS.filter(
    (p) => currentFilter === "all" || p.tags.includes(currentFilter)
  );

  visible.forEach((post) => {
    const cheapest = Math.min(...post.products.map((p) => p.price));
    const card = document.createElement("button");
    card.className = "pin-card";
    card.style.transform = `rotate(${TILTS[post.id % TILTS.length]}deg)`;
    card.onclick = () => openDrawer(post);

    card.innerHTML = `
      <div class="pushpin"></div>
      <div class="img-wrap">
        <img src="${post.image}" alt="${post.caption}" />
        <div class="category-badge">${post.tags[0]}</div>
        <div class="price-tag">from $${cheapest}</div>
      </div>
      <p class="caption">${post.caption}</p>
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

  let total = 0;
  post.products.forEach((p) => {
    total += p.price;
    const a = document.createElement("a");
    a.className = "drawer-item";
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = `
      <div>
        <p class="name">${p.name}</p>
        <p class="price">$${p.price.toFixed(2)}</p>
      </div>
      <span class="buy">Buy &nearr;</span>
    `;
    itemsEl.appendChild(a);
  });

  document.getElementById("itemCount").textContent = `${post.products.length} items shown`;
  document.getElementById("totalPrice").textContent = `Total $${total.toFixed(2)}`;
  document.getElementById("overlay").classList.add("open");
}

document.getElementById("closeDrawer").onclick = () =>
  document.getElementById("overlay").classList.remove("open");
document.getElementById("overlay").onclick = (e) => {
  if (e.target.id === "overlay") e.target.classList.remove("open");
};

document.getElementById("year").textContent = new Date().getFullYear();

renderFilters();
renderBoard();

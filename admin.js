// ===========================================================================
// HELPERS
// ===========================================================================
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
const escapeAttr = escapeHtml;

// ===========================================================================
// LOCAL LOGIN — a soft front-door lock, not a real account system.
// Real access control is GitHub's own Collaborators permissions (Team tab).
// ===========================================================================
let USERS = JSON.parse(localStorage.getItem("trendique_users") || "null") || [
  { name: "Admin", password: "changeme", role: "admin" },
];
function saveUsers() {
  localStorage.setItem("trendique_users", JSON.stringify(USERS));
}

const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
let currentUser = null;

function showAdmin(user) {
  currentUser = user;
  loginScreen.style.display = "none";
  adminPanel.style.display = "block";
  document.getElementById("whoami").textContent = `${user.name} (${user.role})`;
  document.getElementById("teamTabBtn").style.display = user.role === "admin" ? "inline-block" : "none";
  renderTeam();
  loadConnection();
  resetProductForm();
}

function attemptLogin() {
  const name = document.getElementById("loginName").value.trim();
  const pass = document.getElementById("loginPass").value;
  const remember = document.getElementById("rememberMe").checked;
  const user = USERS.find(
    (u) => u.name.toLowerCase() === name.toLowerCase() && u.password === pass
  );
  if (!user) {
    document.getElementById("loginError").textContent = "Name or password not recognized.";
    return;
  }
  document.getElementById("loginError").textContent = "";
  const store = remember ? localStorage : sessionStorage;
  store.setItem("trendique_session", JSON.stringify(user));
  showAdmin(user);
}
document.getElementById("loginBtn").onclick = attemptLogin;
["loginName", "loginPass"].forEach((id) => {
  document.getElementById(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptLogin();
  });
});

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("trendique_session");
  sessionStorage.removeItem("trendique_session");
  location.reload();
};

function checkSession() {
  const saved = localStorage.getItem("trendique_session") || sessionStorage.getItem("trendique_session");
  if (!saved) return;
  try {
    showAdmin(JSON.parse(saved));
  } catch (e) {
    /* corrupt session data — ignore, show login screen */
  }
}

// ===========================================================================
// TABS
// ===========================================================================
document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "manage") fetchPosts();
    if (tab.dataset.tab === "team") {
      fetchCollaborators();
      fetchActivity();
    }
  };
});

// ===========================================================================
// SETTINGS DRAWER — GitHub connection (username, repo, personal access token)
// ===========================================================================
document.getElementById("settingsBtn").onclick = () =>
  document.getElementById("settingsOverlay").classList.add("open");
document.getElementById("closeSettings").onclick = () =>
  document.getElementById("settingsOverlay").classList.remove("open");
document.getElementById("settingsOverlay").onclick = (e) => {
  if (e.target.id === "settingsOverlay") e.target.classList.remove("open");
};

function loadConnection() {
  const saved = JSON.parse(
    localStorage.getItem("trendique_gh") || sessionStorage.getItem("trendique_gh") || "null"
  );
  if (saved) {
    document.getElementById("gh-user").value = saved.user || "";
    document.getElementById("gh-repo").value = saved.repo || "";
    document.getElementById("gh-token").value = saved.token || "";
  }
}

document.getElementById("gh-save").onclick = () => {
  const conn = {
    user: document.getElementById("gh-user").value.trim(),
    repo: document.getElementById("gh-repo").value.trim(),
    token: document.getElementById("gh-token").value.trim(),
  };
  const remember = document.getElementById("gh-remember").checked;
  const store = remember ? localStorage : sessionStorage;
  store.setItem("trendique_gh", JSON.stringify(conn));
  document.getElementById("gh-status").textContent = "Connection saved.";
};

function getConnection() {
  return {
    user: document.getElementById("gh-user").value.trim(),
    repo: document.getElementById("gh-repo").value.trim(),
    token: document.getElementById("gh-token").value.trim(),
  };
}

// ===========================================================================
// IMAGE INPUT — URL, click-to-browse, drag-and-drop, or paste (Ctrl+V)
// ===========================================================================
let uploadedImageData = "";

function setImageMode(mode) {
  document.getElementById("imageUrlField").style.display = mode === "url" ? "block" : "none";
  document.getElementById("imageFileField").style.display = mode === "file" ? "block" : "none";
  document.getElementById("useUrlBtn").classList.toggle("btn-primary", mode === "url");
  document.getElementById("useFileBtn").classList.toggle("btn-primary", mode === "file");
}
document.getElementById("useUrlBtn").onclick = () => { setImageMode("url"); updatePreview(); };
document.getElementById("useFileBtn").onclick = () => { setImageMode("file"); updatePreview(); };

function getCurrentImage() {
  const usingFile = document.getElementById("imageFileField").style.display !== "none";
  return usingFile ? uploadedImageData : document.getElementById("f-image").value.trim();
}

function handleImageFile(file) {
  if (!file || !file.type || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 800; // resize down so the embedded code doesn't get huge
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      uploadedImageData = canvas.toDataURL("image/jpeg", 0.85);
      const preview = document.getElementById("imgPreview");
      preview.src = uploadedImageData;
      preview.style.display = "block";
      updatePreview();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}
document.getElementById("f-imageFile").onchange = (e) => handleImageFile(e.target.files[0]);

const dropZone = document.getElementById("dropZone");
["dragenter", "dragover"].forEach((evt) =>
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  })
);
["dragleave", "drop"].forEach((evt) =>
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
  })
);
dropZone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleImageFile(file);
});

// Paste an image anywhere on the page (e.g. copied off a Pinterest pin) and
// it lands here automatically, switching to upload mode if needed.
document.addEventListener("paste", (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith("image/")) {
      setImageMode("file");
      handleImageFile(item.getAsFile());
      e.preventDefault();
      break;
    }
  }
});

// ===========================================================================
// PRODUCTS + STORE LINKS (nested, repeatable rows)
// ===========================================================================
const productBlocksEl = document.getElementById("productBlocks");

function addLinkRow(linksEl, store = "", price = "", url = "") {
  const row = document.createElement("div");
  row.className = "link-row";
  row.innerHTML = `
    <input class="l-store" list="storeOptions" placeholder="Store (e.g. Amazon)" value="${escapeAttr(store)}" />
    <input class="l-price" placeholder="Price ₹" inputmode="decimal" value="${escapeAttr(price)}" />
    <input class="l-url" placeholder="Buy link (https://...)" value="${escapeAttr(url)}" />
    <button class="btn btn-icon btn-danger" type="button" title="Remove this link" aria-label="Remove this link">&times;</button>
  `;
  row.querySelector("button").onclick = () => {
    if (linksEl.children.length > 1) {
      row.remove();
      updatePreview();
    }
  };
  linksEl.appendChild(row);
}

function addProductBlock(name = "", links = [{ store: "", price: "", url: "" }]) {
  const block = document.createElement("div");
  block.className = "product-block";
  block.innerHTML = `
    <div class="product-block-head">
      <div class="field">
        <label>Product name</label>
        <input class="p-name" placeholder="e.g. Wool overshirt, rust" value="${escapeAttr(name)}" />
      </div>
      <button class="btn btn-icon btn-danger" type="button" title="Remove this product" aria-label="Remove this product">&times;</button>
    </div>
    <div class="link-rows"></div>
    <button class="btn btn-sm" type="button">+ Add store link</button>
  `;
  const linksEl = block.querySelector(".link-rows");
  (links.length ? links : [{ store: "", price: "", url: "" }]).forEach((l) =>
    addLinkRow(linksEl, l.store, l.price, l.url)
  );
  block.querySelector(".btn-sm").onclick = () => {
    addLinkRow(linksEl);
    updatePreview();
  };
  block.querySelector(".product-block-head button").onclick = () => {
    if (productBlocksEl.children.length > 1) {
      block.remove();
      updatePreview();
    }
  };
  productBlocksEl.appendChild(block);
}

function resetProductForm() {
  setImageMode("url");
  document.getElementById("f-image").value = "";
  uploadedImageData = "";
  document.getElementById("imgPreview").style.display = "none";
  document.getElementById("f-caption").value = "";
  document.getElementById("f-tags").value = "";
  document.getElementById("f-trending").checked = false;
  productBlocksEl.innerHTML = "";
  addProductBlock();
  updatePreview();
}
document.getElementById("addProduct").onclick = () => {
  addProductBlock();
  updatePreview();
};

function buildProductsFromForm() {
  return [...productBlocksEl.querySelectorAll(".product-block")]
    .map((block) => {
      const name = block.querySelector(".p-name").value.trim();
      const links = [...block.querySelectorAll(".link-row")]
        .map((row) => ({
          store: row.querySelector(".l-store").value.trim(),
          price: parseFloat(row.querySelector(".l-price").value) || 0,
          url: row.querySelector(".l-url").value.trim(),
        }))
        .filter((l) => l.store && l.url);
      return { name, links };
    })
    .filter((p) => p.name && p.links.length);
}

// ===========================================================================
// LIVE PREVIEW — reuses the same CSS classes as the live site, so what you
// see here is exactly what visitors will see.
// ===========================================================================
function updatePreview() {
  const image = getCurrentImage();
  const caption = document.getElementById("f-caption").value.trim() || "Your caption here";
  const tags = document.getElementById("f-tags").value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const trending = document.getElementById("f-trending").checked;
  const products = buildProductsFromForm();

  const allPrices = products.flatMap((p) => p.links.map((l) => l.price)).filter((n) => n > 0);
  const cheapest = allPrices.length ? Math.min(...allPrices) : null;

  const badges = [];
  if (trending) badges.push(`<span class="badge badge-trending">Trending</span>`);
  badges.push(`<span class="badge badge-new">New</span>`); // a just-published post always starts out "New"

  const imgHtml = image
    ? `<img src="${escapeAttr(image)}" alt="" />`
    : `<div style="aspect-ratio:4/5; display:flex; align-items:center; justify-content:center; color:var(--muted-on-paper); font-size:12px; font-family:var(--font-mono); text-align:center; padding:12px;">No photo yet</div>`;

  document.getElementById("previewCardSlot").innerHTML = `
    <div class="pin-card" style="--tilt: -1.2deg;">
      <div class="pushpin"></div>
      <div class="img-wrap">
        ${imgHtml}
        <div class="badge-stack">${badges.join("")}</div>
        <div class="category-badge">${escapeHtml(tags[0] || "tag")}</div>
        <div class="price-tag">${cheapest !== null ? `from ₹${cheapest.toLocaleString()}` : "no price yet"}</div>
      </div>
      <p class="caption">${escapeHtml(caption)}</p>
      <p class="item-count">${products.length} item${products.length === 1 ? "" : "s"} tagged</p>
    </div>
  `;

  const totalLinks = products.reduce((sum, p) => sum + p.links.length, 0);
  document.getElementById("previewMeta").innerHTML = `
    <strong>${products.length}</strong> product${products.length === 1 ? "" : "s"} &middot;
    <strong>${totalLinks}</strong> buy link${totalLinks === 1 ? "" : "s"}<br/>
    ${tags.length ? `Tagged: ${escapeHtml(tags.join(", "))}` : "No tags yet"}
  `;
}
document.querySelector(".form-pane").addEventListener("input", updatePreview);
document.querySelector(".form-pane").addEventListener("change", updatePreview);

// ===========================================================================
// BUILD + SERIALIZE a post back into script.js's POSTS array format
// ===========================================================================
function buildPostObject(id) {
  return {
    id,
    image: getCurrentImage(),
    caption: document.getElementById("f-caption").value.trim(),
    tags: document.getElementById("f-tags").value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    trending: document.getElementById("f-trending").checked,
    products: buildProductsFromForm(),
  };
}

function serializePost(p) {
  const productsBlock = p.products
    .map((pr) => {
      const linksBlock = pr.links
        .map((l) => `          { store: ${JSON.stringify(l.store)}, price: ${l.price}, url: ${JSON.stringify(l.url)} },`)
        .join("\n");
      return `      {
        name: ${JSON.stringify(pr.name)},
        links: [
${linksBlock}
        ],
      },`;
    })
    .join("\n");

  return `  {
    id: ${p.id},
    image: ${JSON.stringify(p.image)},
    caption: ${JSON.stringify(p.caption)},
    tags: [${p.tags.map((t) => JSON.stringify(t)).join(", ")}],
    trending: ${p.trending ? "true" : "false"},
    products: [
${productsBlock}
    ],
  },`;
}

function serializePosts(posts) {
  const body = posts.map((p) => serializePost(p)).join("\n");
  return `const POSTS = [\n${body}\n];`;
}

function validateForm() {
  if (!getCurrentImage()) return "Add a photo first — a URL, or upload/paste one.";
  if (!document.getElementById("f-caption").value.trim()) return "Give this post a caption.";
  if (!buildProductsFromForm().length) return "Add at least one product with a store name, price, and buy link.";
  return null;
}

// ===========================================================================
// GENERATE CODE / COPY (fallback for when publishing directly isn't set up)
// ===========================================================================
document.getElementById("generate").onclick = () => {
  const err = validateForm();
  document.getElementById("copyMsg").textContent = "";
  if (err) {
    document.getElementById("output").value = "";
    document.getElementById("copyMsg").textContent = err;
    return;
  }
  const post = buildPostObject(Date.now());
  document.getElementById("output").value = serializePost(post);
};

document.getElementById("copy").onclick = async () => {
  const out = document.getElementById("output");
  if (!out.value) {
    document.getElementById("copyMsg").textContent = "Nothing to copy yet — generate code first.";
    return;
  }
  try {
    await navigator.clipboard.writeText(out.value);
  } catch (e) {
    out.select();
    document.execCommand("copy");
  }
  document.getElementById("copyMsg").textContent = "Copied — now paste it inside the POSTS array in script.js.";
};

// ===========================================================================
// PUBLISH DIRECTLY TO GITHUB — reads script.js via the Contents API, inserts
// the new post, and writes it back using your personal access token.
// ===========================================================================
async function publishToGitHub() {
  const msgEl = document.getElementById("publishMsg");
  const err = validateForm();
  if (err) {
    msgEl.textContent = err;
    return;
  }

  const { user, repo, token } = getConnection();
  if (!user || !repo || !token) {
    msgEl.textContent = "Connect your GitHub account first (⚙ icon above).";
    return;
  }

  msgEl.textContent = "Publishing...";
  const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/script.js`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };

  try {
    const getRes = await fetch(apiUrl, { headers });
    if (!getRes.ok) {
      throw new Error(`Couldn't read script.js (${getRes.status}). Check your username, repo name, and token permissions.`);
    }
    const fileData = await getRes.json();
    const currentContent = decodeURIComponent(escape(atob(fileData.content)));

    const marker = "];\n\n// Filter buttons";
    if (!currentContent.includes(marker)) {
      throw new Error("Couldn't find where to insert the new post — script.js may have been edited by hand. Use 'Generate code instead' and paste it in yourself this time.");
    }
    const post = buildPostObject(Date.now());
    const entry = serializePost(post);
    const updatedContent = currentContent.replace(marker, `${entry}\n${marker}`);

    const who = currentUser ? currentUser.name : "admin panel";
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Add post via ${who}: ${post.caption}`,
        content: btoa(unescape(encodeURIComponent(updatedContent))),
        sha: fileData.sha,
      }),
    });
    if (!putRes.ok) {
      const errBody = await putRes.json().catch(() => ({}));
      throw new Error(errBody.message || `Publish failed (${putRes.status}).`);
    }

    msgEl.textContent = "Published! Your site will update in about a minute.";
    resetProductForm();
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
  }
}
document.getElementById("publishBtn").onclick = publishToGitHub;

// ===========================================================================
// MY POSTS — list + delete, read live from script.js on GitHub
// ===========================================================================
function parsePosts(content) {
  const match = content.match(/const POSTS = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error("Couldn't find the POSTS list in script.js.");
  return new Function("return " + match[1])();
}

function renderPostsList(posts) {
  const el = document.getElementById("postsList");
  el.innerHTML = "";
  if (!posts.length) {
    el.innerHTML = `<p class="note">No posts found.</p>`;
    return;
  }
  posts
    .slice()
    .sort((a, b) => b.id - a.id)
    .forEach((post) => {
      const products = post.products || [];
      const linkCount = products.reduce((sum, p) => sum + (p.links ? p.links.length : 0), 0);
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        <img src="${escapeAttr(post.image)}" alt="" />
        <div class="info">
          <p>${escapeHtml(post.caption)}</p>
          <span>${products.length} product${products.length === 1 ? "" : "s"} &middot; ${linkCount} link${linkCount === 1 ? "" : "s"} &middot; ${escapeHtml((post.tags || []).join(", "))}</span>
        </div>
        <button class="btn btn-danger btn-sm" type="button">Delete</button>
      `;
      row.querySelector("button").onclick = () => deletePost(post.id);
      el.appendChild(row);
    });
}

async function fetchPosts() {
  const { user, repo, token } = getConnection();
  const msgEl = document.getElementById("postsMsg");
  if (!user || !repo || !token) {
    msgEl.textContent = "Connect your GitHub account (⚙ icon above) to see your posts.";
    document.getElementById("postsList").innerHTML = "";
    return;
  }
  msgEl.textContent = "Loading...";
  try {
    const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/script.js`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(`Couldn't load script.js (${res.status}).`);
    const fileData = await res.json();
    const content = decodeURIComponent(escape(atob(fileData.content)));
    renderPostsList(parsePosts(content));
    msgEl.textContent = "";
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
  }
}
document.getElementById("refreshPosts").onclick = fetchPosts;

async function deletePost(id) {
  if (!confirm("Delete this post? This publishes the change immediately.")) return;
  const { user, repo, token } = getConnection();
  const msgEl = document.getElementById("postsMsg");
  msgEl.textContent = "Deleting...";
  try {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/script.js`;
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
    const getRes = await fetch(apiUrl, { headers });
    if (!getRes.ok) throw new Error(`Couldn't read script.js (${getRes.status}).`);
    const fileData = await getRes.json();
    const content = decodeURIComponent(escape(atob(fileData.content)));
    const posts = parsePosts(content).filter((p) => p.id !== id);
    const updatedContent = content.replace(/const POSTS = \[[\s\S]*?\n\];/, serializePosts(posts));

    const who = currentUser ? currentUser.name : "admin panel";
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Delete post via ${who} (id ${id})`,
        content: btoa(unescape(encodeURIComponent(updatedContent))),
        sha: fileData.sha,
      }),
    });
    if (!putRes.ok) {
      const errBody = await putRes.json().catch(() => ({}));
      throw new Error(errBody.message || `Delete failed (${putRes.status}).`);
    }
    msgEl.textContent = "Deleted. Site will update in about a minute.";
    renderPostsList(posts);
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
  }
}

// ===========================================================================
// TEAM — real GitHub collaborators + commit activity, plus local panel logins
// ===========================================================================
function renderTeam() {
  const el = document.getElementById("teamList");
  el.innerHTML = "";
  USERS.forEach((u, idx) => {
    const canRemove = !(idx === 0 && u.name === "Admin");
    const row = document.createElement("div");
    row.className = "team-row";
    row.innerHTML = `
      <span>${escapeHtml(u.name)}</span>
      <div class="team-row-right">
        <span class="role-pill">${escapeHtml(u.role)}</span>
        ${canRemove ? `<button class="btn btn-icon btn-danger btn-sm" type="button" aria-label="Remove ${escapeAttr(u.name)}">&times;</button>` : ""}
      </div>
    `;
    if (canRemove) {
      row.querySelector("button").onclick = () => {
        if (!confirm(`Remove ${u.name}'s login from this device?`)) return;
        USERS = USERS.filter((_, i) => i !== idx);
        saveUsers();
        renderTeam();
      };
    }
    el.appendChild(row);
  });
}

document.getElementById("addPerson").onclick = () => {
  const name = document.getElementById("team-name").value.trim();
  const password = document.getElementById("team-pass").value;
  const role = document.getElementById("team-role").value;
  if (!name || !password) return;
  if (USERS.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
    alert("Someone with that name is already on the list.");
    return;
  }
  USERS.push({ name, password, role });
  saveUsers();
  document.getElementById("team-name").value = "";
  document.getElementById("team-pass").value = "";
  renderTeam();
};

async function fetchCollaborators() {
  const { user, repo, token } = getConnection();
  const listEl = document.getElementById("collabList");
  const msgEl = document.getElementById("collabMsg");
  if (!user || !repo || !token) {
    msgEl.textContent = "Connect your GitHub account (⚙ icon above) to see your real team.";
    listEl.innerHTML = "";
    return;
  }
  msgEl.textContent = "Loading...";
  try {
    const res = await fetch(`https://api.github.com/repos/${user}/${repo}/collaborators`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (res.status === 403 || res.status === 404) {
      msgEl.textContent = "Can't load collaborators — your token needs the 'Administration: Read-only' permission too. Regenerate your fine-grained token with that added, or check the list directly on GitHub (Settings → Collaborators).";
      listEl.innerHTML = "";
      return;
    }
    if (!res.ok) throw new Error(`Request failed (${res.status}).`);
    const collabs = await res.json();
    listEl.innerHTML = "";
    collabs.forEach((c) => {
      const role = c.role_name || (c.permissions && c.permissions.admin ? "admin" : c.permissions && c.permissions.push ? "write" : "read");
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        <img class="round" src="${escapeAttr(c.avatar_url)}" alt="" />
        <div class="info">
          <p>${escapeHtml(c.login)}</p>
          <span>GitHub role: ${escapeHtml(role)}</span>
        </div>
      `;
      listEl.appendChild(row);
    });
    msgEl.textContent = "";
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
  }
}
document.getElementById("refreshTeam").onclick = fetchCollaborators;

async function fetchActivity() {
  const { user, repo, token } = getConnection();
  const listEl = document.getElementById("activityList");
  const msgEl = document.getElementById("activityMsg");
  if (!user || !repo || !token) {
    listEl.innerHTML = "";
    msgEl.textContent = "";
    return;
  }
  msgEl.textContent = "Loading...";
  try {
    const res = await fetch(`https://api.github.com/repos/${user}/${repo}/commits?path=script.js&per_page=10`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(`Request failed (${res.status}).`);
    const commits = await res.json();
    listEl.innerHTML = "";
    commits.forEach((c) => {
      const author = (c.author && c.author.login) || c.commit.author.name;
      const avatar = c.author && c.author.avatar_url;
      const when = new Date(c.commit.author.date).toLocaleString();
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        ${avatar ? `<img class="round" src="${escapeAttr(avatar)}" alt="" />` : ""}
        <div class="info">
          <p>${escapeHtml(c.commit.message)}</p>
          <span>${escapeHtml(author)} &middot; ${escapeHtml(when)}</span>
        </div>
      `;
      listEl.appendChild(row);
    });
    msgEl.textContent = "";
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
  }
}

// ===========================================================================
// INIT
// ===========================================================================
resetProductForm();
checkSession();

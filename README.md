# Trendique

A shoppable, Pinterest-style "link in bio" site — pin up a photo, tag the
products in it, and let people buy straight from Amazon, Flipkart, or
anywhere else you link. Comes with an admin panel your team can use to
publish new posts without touching code.

## Files

| File | What it is |
|---|---|
| `index.html` / `style.css` / `script.js` | The public site. `script.js` holds all your content in a `POSTS` array. |
| `admin.html` / `admin.css` / `admin.js` | The admin panel your team logs into to add posts. |
| `README.md` | This file. |

No build step, no server, no database — the whole thing is static files.
GitHub itself is the "backend": the admin panel writes directly to
`script.js` in your repo using GitHub's own API.

## Launch it on GitHub Pages

1. Create a new repository on GitHub (public).
2. Upload all six files above to the repo (drag-and-drop on the GitHub
   website works, or use git).
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment", set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
5. Wait a minute or two — GitHub gives you a live URL like
   `https://yourusername.github.io/your-repo-name/`.

Your site is at that URL. Your admin panel is at
`.../your-repo-name/admin.html` — bookmark that separately; it's not
linked from the public site on purpose.

## Setting up the admin panel (do this once, as the owner)

1. Open `admin.html`, log in with name **Admin**, password **changeme**.
2. Go to the **Team** tab and give yourself a real password (add a new
   login, then remove the default one) — this login is just a name tag
   for your device though, see the warning banner in the panel for why.
3. Click the ⚙ icon and connect GitHub:
   - On GitHub: **Settings (your account) → Developer settings → Personal
     access tokens → Fine-grained tokens → Generate new**.
   - Repository access: **this repo only**.
   - Permissions: **Contents → Read and write**. Give it an expiry date.
   - Paste your GitHub username, this repo's name, and the token into the
     settings drawer and save.
4. Try publishing a test post from the **Add post** tab — you should see
   it live on your site about a minute later.

## Adding your team (10–15 people)

Two separate steps — both matter:

1. **Real access:** on GitHub, go to your repo → **Settings →
   Collaborators and teams → Add people**, enter their GitHub username,
   and give them **Write** access. They accept the invite, then create
   their *own* personal access token (same steps as above) and connect it
   on their *own* device. This is what actually lets them publish — it's
   enforced by GitHub, not by this website.
2. **Panel login:** optionally, have each person add themselves in the
   Team tab with a name and password, just so commit messages and the
   "My posts" list show who published what. This part is cosmetic — skip
   it if you don't need it.

## How posts actually work day to day

There's no automatic sync from your Pinterest board — Pinterest doesn't
offer a safe way to pull a whole board into a public static site without
exposing a secret key to anyone who views your page source, so this site
doesn't try to fake that.

What actually works well in practice: when you're browsing Pinterest and
see a pin worth tagging, open it, right-click the photo → **Copy image
address** (or just save the image), then in the **Add post** tab either
paste the URL, or switch to "Upload / paste" and paste the image directly
with Ctrl+V. Add the caption, tag(s), and every store link for each
product — the live preview on the right shows exactly how the pin will
look before you publish.

## Editing content by hand (fallback)

You normally won't need this — the admin panel does it for you — but
`script.js` is plain, readable data if you ever want to edit it directly.
One post looks like this:

```js
{
  id: 1723000000000,       // any unique number
  image: "https://...",
  caption: "Weekend fit check",
  tags: ["clothing", "men"],
  trending: false,          // true pins a "Trending" badge + priority in the top strip
  products: [
    {
      name: "Oversized hoodie",
      links: [
        { store: "Amazon", price: 1499, url: "https://..." },
        { store: "Flipkart", price: 1399, url: "https://..." },
      ],
    },
  ],
},
```

Each product can list as many stores as you want — that's what puts
multiple "Buy" buttons under one item. Prices are plain rupees (no ₹
symbol). A post gets a "New" badge automatically for its first 14 days,
based on `id`.

Edit the `FILTERS` array in `script.js` to change the filter buttons, and
the `CURRENCIES` block to update exchange rates.

## Affiliate disclosure

The footer includes a placeholder disclosure line since Amazon, Flipkart,
and most affiliate programs require you to disclose paid links. Edit the
wording in `index.html` to match your actual programs — this isn't legal
advice, just a reminder to check what your affiliate programs and your
country's disclosure rules require.

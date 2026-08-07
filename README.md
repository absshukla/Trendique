# The Corkboard

A shoppable "link in bio" style site — post photos pinned up like a corkboard, tap one to see the products and buy links.

## Edit your content
Open `script.js` — everything you need to change is at the top in the `POSTS` array:
- `image`: your photo URL
- `caption`: short caption for the post
- `tags`: category words (e.g. `"clothing"`, `"watches"`, `"men"`, `"women"`) — these control which filter button the post shows under
- `products`: list of `{ name, price, url }` — `url` is where people go to actually buy it

Edit the `FILTERS` array to change the filter buttons at the top of the page.

## Launch it on GitHub Pages
1. Create a new repository on GitHub (public).
2. Upload `index.html`, `style.css`, and `script.js` to the repo (drag-and-drop on the GitHub website works, or use git).
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save.
5. Wait a minute or two — GitHub will give you a live URL like `https://yourusername.github.io/your-repo-name/`.

That's it — no build step, no server needed.

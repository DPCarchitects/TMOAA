# The Mindset Of An IT Architect

Static site that renders the markdown essays in `contents/` to HTML with a small Node build script.

## Local setup

- Requirements: Node 14+ (uses `marked`).
- Install dependencies: `npm ci`
- Build static site: `npm run build`
- Open `dist/index.html` in a browser to view the homepage; posts live under `dist/posts/<slug>/`.

## GitHub Pages

- A workflow at `.github/workflows/pages.yml` builds from `main` and deploys `dist/` to GitHub Pages.
- Pages URL: check the workflow output or repo settings after the first successful run.

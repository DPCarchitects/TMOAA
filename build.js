const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const SITE_TITLE = 'The Mindset Of An Architect';
const CONTENT_DIR = path.join(__dirname, 'contents');
const DIST_DIR = path.join(__dirname, 'dist');
const POSTS_DIR = path.join(DIST_DIR, 'posts');
const MATERIALS_DIR = path.join(__dirname, 'materials');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const INTRO_FILE = path.join(CONTENT_DIR, 'Introductie.md');

marked.setOptions({
  gfm: true,
  breaks: false,
  smartypants: true,
  headerIds: false
});

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmdirSync(dir, { recursive: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(name) {
  const base = name.replace(/\.md$/i, '').trim();
  const normalized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'post';
}

function cleanTitle(name) {
  return name.replace(/\.md$/i, '').replace(/_/g, '').trim();
}

function introSnippet() {
  if (!fs.existsSync(INTRO_FILE)) return { html: '', slug: '' };
  const raw = fs.readFileSync(INTRO_FILE, 'utf8');
  const words = raw.split(/\s+/).filter(Boolean);
  const snippetWords = words.slice(0, 140);
  const snippet = snippetWords.join(' ') + (words.length > snippetWords.length ? '…' : '');
  const html = marked.parse(snippet);
  return { html, slug: slugify('Introductie') };
}

function excerptFrom(raw) {
  const firstParagraph = raw.split(/\n\s*\n/).find((block) => block.trim());
  if (!firstParagraph) return '';
  const text = firstParagraph.replace(/\s+/g, ' ').trim();
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

function renderLayout({ pageTitle, description, body, assetPrefix }) {
  const prefix = assetPrefix || '.';
  const metaDescription = description || 'Essays on architecture mindset, impact, and practice.';
  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}" />
  <title>${pageTitle}</title>
  <link rel="stylesheet" href="${prefix}/style.css" />
</head>
<body>
  <div class="page">
    <header class="site-header">
      <a class="brand" href="${prefix}/index.html">${SITE_TITLE}</a>
      <span class="tagline">Praktische notities voor impactvolle architecten</span>
    </header>
    ${body}
    <footer class="site-footer">
      <div class="footer-inner">
        <div>
          <p class="footer-title">${SITE_TITLE}</p>
          <p>Een collectie inzichten over ritme, toon, en beweging in architectuur.</p>
        </div>
        <div class="footer-links">
          <a href="${prefix}/index.html">Home</a>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function build() {
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error('contents directory not found');
  }

  cleanDir(DIST_DIR);
  cleanDir(POSTS_DIR);
  const intro = introSnippet();

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'nl'));

  const posts = files.map((file) => {
    const filePath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const title = cleanTitle(file);
    const slug = slugify(title);
    const html = marked.parse(raw);
    const excerpt = excerptFrom(raw);
    const stats = fs.statSync(filePath);
    return {
      title,
      slug,
      html,
      excerpt,
      updated: stats.mtime
    };
  });

  copyAssets();

  const indexBody = `
  <section class="hero">
    <div class="hero-content">
      <p class="eyebrow">Essays & Observaties</p>
      <h1>${SITE_TITLE}</h1>
      <div class="badge-frame">
        <img src="./assets/mindset-badge.png" alt="Mindset badge met de slogans mindset boven model, ritme boven ritueel, impact boven inventaris" loading="lazy" />
      </div>
      <div class="lede">
        <p>Een levend notitieboek over hoe architecten bewegen, beslissen en teams vooruit helpen. Geen frameworks om de frameworks, maar concrete manieren om impact te maken.</p>
        ${intro.html ? `
        <div class="intro-snippet">
          <div class="intro-text">${intro.html}</div>
        </div>
        ` : ''}
      </div>
      <div class="hero-actions">
        <a class="button primary" href="#posts">Lees de stukken</a>
      </div>
    </div>
  </section>
  <section class="posts" id="posts">
    <div class="section-header">
      <p class="eyebrow">Alle artikelen</p>
      <h2>Verhalen en micro-lessen</h2>
    </div>
    <div class="post-grid">
      ${posts
        .map((post) => `
          <article class="post-card">
            <div class="post-meta">Laatste update: ${post.updated.toLocaleDateString('nl-BE')}</div>
            <h3><a href="./posts/${post.slug}/index.html">${post.title}</a></h3>
            <p class="post-excerpt">${post.excerpt}</p>
            <a class="read-more" href="./posts/${post.slug}/index.html">Lees artikel →</a>
          </article>
        `)
        .join('')}
    </div>
  </section>`;

  const indexHtml = renderLayout({
    pageTitle: `${SITE_TITLE} | Architectuur essays`,
    description: 'Een collectie essays over de mindset van architecten.',
    body: indexBody,
    assetPrefix: '.'
  });

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf8');

  posts.forEach((post) => {
    const postDir = path.join(POSTS_DIR, post.slug);
    fs.mkdirSync(postDir, { recursive: true });

    const postBody = `
    <section class="post-shell">
      <a class="back-link" href="../../index.html">← Terug naar alle artikelen</a>
      <article class="post">
        <p class="eyebrow">${SITE_TITLE}</p>
        <h1>${post.title}</h1>
        <div class="post-date">Bijgewerkt op ${post.updated.toLocaleDateString('nl-BE')}</div>
        <div class="post-content">${post.html}</div>
      </article>
    </section>`;

    const html = renderLayout({
      pageTitle: `${post.title} | ${SITE_TITLE}`,
      description: post.excerpt || SITE_TITLE,
      body: postBody,
      assetPrefix: '../..'
    });

    fs.writeFileSync(path.join(postDir, 'index.html'), html, 'utf8');
  });

  writeStyles();
}

function copyAssets() {
  const badgeSrc = path.join(MATERIALS_DIR, 'mindset-badge.png');
  if (!fs.existsSync(badgeSrc)) {
    return;
  }
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.copyFileSync(badgeSrc, path.join(ASSETS_DIR, 'mindset-badge.png'));
}

function writeStyles() {
  const css = `:root {
  --bg: #0c1220;
  --surface: rgba(16, 25, 44, 0.96);
  --ink: #e4eaf6;
  --muted: #c3cce0;
  --accent: #1f5aff;
  --accent-2: #5bd3ff;
  --border: #1f2b45;
  --shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  --radius: 16px;
  font-family: 'Avenir Next', 'Nunito', 'Segoe UI', 'Trebuchet MS', sans-serif;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: radial-gradient(circle at 25% 20%, rgba(69, 106, 196, 0.15), transparent 35%),
    radial-gradient(circle at 80% 0%, rgba(91, 211, 255, 0.2), transparent 30%),
    linear-gradient(145deg, #0b1424 0%, #0a101d 50%, #0d172b 100%);
  color: var(--ink);
  min-height: 100vh;
}

.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  position: sticky;
  top: 16px;
  backdrop-filter: blur(6px);
  z-index: 10;
}

.brand {
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-decoration: none;
  font-size: 18px;
}

.tagline {
  color: var(--muted);
  font-size: 14px;
}

.hero {
  display: block;
  padding: 48px;
  margin-top: 28px;
  background: linear-gradient(135deg, rgba(31, 90, 255, 0.16), rgba(91, 211, 255, 0.12));
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) * 1.25);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  max-width: 760px;
}

.hero::after {
  content: '';
  display: block;
  clear: both;
}

.hero-content h1 {
  font-size: clamp(32px, 6vw, 46px);
  margin: 8px 0 12px;
  letter-spacing: -0.03em;
}

.lede {
  color: var(--muted);
  font-size: 18px;
  line-height: 1.6;
  max-width: 46ch;
  position: relative;
}

.lede p { margin: 0 0 12px; }

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.button {
  padding: 12px 16px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  border: 1px solid transparent;
  transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
}

.button.primary {
  background: linear-gradient(120deg, #1f5aff, #4c7dff);
  color: #f8fbff;
  box-shadow: 0 14px 34px rgba(16, 90, 255, 0.35);
}

.button.ghost {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(31, 90, 255, 0.08);
}

.button:hover {
  transform: translateY(-2px);
}

.badge-frame {
  width: min(320px, 40%);
  background: radial-gradient(circle at 30% 30%, rgba(31, 90, 255, 0.18), rgba(16, 25, 44, 0.9));
  padding: 18px;
  border-radius: 24px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  float: right;
  margin-left: 18px;
  margin-bottom: 12px;
  shape-outside: circle(50%);
}

.badge-frame img {
  display: block;
  width: 100%;
  border-radius: 18px;
}

.intro-snippet {
  position: relative;
  margin: 0;
  padding: 0;
}

.intro-text {
  color: var(--muted);
  line-height: 1.6;
  font-size: 16px;
}

.intro-text p { margin: 0 0 10px; }

.intro-fade { display: none; }

.section-header h2 {
  margin: 6px 0 0;
  letter-spacing: -0.02em;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: var(--accent-2);
  margin: 0;
}

.posts {
  margin-top: 48px;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.post-card {
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.post-card h3 {
  margin: 0;
  font-size: 20px;
}

.post-card a {
  color: var(--ink);
  text-decoration: none;
}

.post-card a:hover { color: var(--accent); }

.post-meta {
  color: var(--muted);
  font-size: 12px;
}

.post-excerpt {
  color: var(--muted);
  line-height: 1.6;
}

.read-more {
  margin-top: auto;
  color: var(--accent);
  font-weight: 700;
}

.post-shell {
  margin-top: 32px;
  padding: 28px;
  background: var(--surface);
  border-radius: calc(var(--radius) * 1.1);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.back-link {
  text-decoration: none;
  color: var(--muted);
  font-size: 14px;
}

.post h1 {
  margin: 6px 0 12px;
  font-size: clamp(30px, 5vw, 42px);
}

.post-date {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 16px;
}

.post-content {
  color: var(--ink);
  line-height: 1.7;
}

.post-content p {
  margin: 0 0 16px;
}

.post-content h2, .post-content h3, .post-content h4 {
  margin-top: 24px;
  margin-bottom: 8px;
}

.post-content ul {
  padding-left: 20px;
}

.site-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  color: var(--muted);
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.footer-title {
  margin: 0 0 6px;
  color: var(--ink);
  font-weight: 800;
}

.footer-links a {
  display: inline-block;
  margin-left: 12px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 720px) {
  .site-header {
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
  .hero {
    padding: 32px;
  }
  .post-shell { padding: 20px; }

  .badge-frame {
    float: none;
    margin: 0 auto 12px;
    width: min(320px, 100%);
    shape-outside: none;
  }
}
`; // end css

  fs.writeFileSync(path.join(DIST_DIR, 'style.css'), css, 'utf8');
}

build();

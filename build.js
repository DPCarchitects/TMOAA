const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const SITE_TITLE = 'The Mindset Of An Architect';
const CONTENT_DIR = path.join(__dirname, 'contents');
const DIST_DIR = path.join(__dirname, 'dist');
const POSTS_DIR = path.join(DIST_DIR, 'posts');

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
          <a href="mailto:info@example.com">Contact</a>
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

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'nl'));

  const posts = files.map((file) => {
    const filePath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const title = file.replace(/\.md$/i, '');
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

  const indexBody = `
  <section class="hero">
    <div class="hero-content">
      <p class="eyebrow">Essays & Observaties</p>
      <h1>${SITE_TITLE}</h1>
      <p class="lede">Een levend notitieboek over hoe architecten bewegen, beslissen en teams vooruit helpen. Geen frameworks om de frameworks, maar concrete manieren om impact te maken.</p>
      <div class="hero-actions">
        <a class="button primary" href="#posts">Lees de stukken</a>
      </div>
    </div>
    <div class="hero-aside">
      <div class="shape"></div>
      <div class="bubble">Mindset boven model</div>
      <div class="bubble">Ritme boven ritueel</div>
      <div class="bubble">Impact boven inventaris</div>
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

function writeStyles() {
  const css = `:root {
  --bg: #f4f5fb;
  --surface: rgba(255, 255, 255, 0.92);
  --ink: #0f172a;
  --muted: #475569;
  --accent: #0f766e;
  --accent-2: #f97316;
  --border: #e2e8f0;
  --shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  --radius: 16px;
  font-family: 'Avenir Next', 'Nunito', 'Segoe UI', 'Trebuchet MS', sans-serif;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: radial-gradient(circle at 20% 20%, #dff6ff 0, #f8f2e8 40%, #f4f5fb 70%, #eef2ff 100%);
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 32px;
  align-items: center;
  padding: 48px;
  margin-top: 28px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(249, 115, 22, 0.12));
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) * 1.25);
  box-shadow: var(--shadow);
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
  max-width: 36ch;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;
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
  background: var(--accent);
  color: #ecfeff;
  box-shadow: 0 14px 34px rgba(15, 118, 110, 0.35);
}

.button.ghost {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(15, 118, 110, 0.08);
}

.button:hover {
  transform: translateY(-2px);
}

.hero-aside {
  position: relative;
  min-height: 220px;
}

.hero-aside .shape {
  position: absolute;
  inset: 0;
  border-radius: 28px;
  background: radial-gradient(circle at 30% 30%, rgba(15, 118, 110, 0.35), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(249, 115, 22, 0.35), transparent 45%),
    rgba(255, 255, 255, 0.5);
  filter: blur(0px);
  border: 1px dashed rgba(15, 118, 110, 0.25);
}

.hero-aside .bubble {
  position: relative;
  display: inline-block;
  margin: 8px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 14px;
  box-shadow: var(--shadow);
  color: var(--accent);
  font-weight: 700;
}

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
  .hero { padding: 32px; }
  .post-shell { padding: 20px; }
}
`; // end css

  fs.writeFileSync(path.join(DIST_DIR, 'style.css'), css, 'utf8');
}

build();

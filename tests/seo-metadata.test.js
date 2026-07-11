const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('public SEO control files are present and exclude private routes', () => {
    const robots = read('robots.txt');
    const sitemap = read('sitemap.xml');
    const manifest = JSON.parse(read('site.webmanifest'));

    assert.match(robots, /Sitemap:\s*https:\/\/www\.kepolio\.in\/sitemap\.xml/);
    assert.match(robots, /Disallow:\s*\/dashboard/);
    assert.match(robots, /Disallow:\s*\/auth/);

    assert.match(sitemap, /<loc>https:\/\/www\.kepolio\.in\/<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/www\.kepolio\.in\/about<\/loc>/);
    assert.doesNotMatch(sitemap, /\/dashboard/);
    assert.doesNotMatch(sitemap, /\/auth/);

    assert.equal(manifest.name, 'KePolio');
    assert.ok(manifest.icons.some((icon) => icon.src === '/public/logo/android-chrome-192x192.png'));
});

test('indexable public pages include canonical, social metadata, and JSON-LD', () => {
    const pages = [
        ['index.html', 'https://www.kepolio.in/'],
        ['public/about.html', 'https://www.kepolio.in/about'],
        ['public/explore.html', 'https://www.kepolio.in/explore'],
        ['public/privacy.html', 'https://www.kepolio.in/privacy'],
        ['public/terms.html', 'https://www.kepolio.in/terms'],
    ];

    for (const [file, canonicalUrl] of pages) {
        const html = read(file);
        assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${file} has canonical`);
        assert.match(html, /<meta property="og:title"/, `${file} has og:title`);
        assert.match(html, /<meta property="og:image"/, `${file} has og:image`);
        assert.match(html, /<meta name="twitter:title"/, `${file} has twitter:title`);
        assert.match(html, /<script type="application\/ld\+json"/, `${file} has JSON-LD`);
    }
});

test('private app entry pages are noindexed', () => {
    for (const file of ['public/auth.html', 'public/dashboard.html']) {
        const html = read(file);
        assert.match(html, /<meta name="robots" content="noindex, nofollow"/, `${file} is noindexed`);
    }
});

test('profile page updates dynamic profile SEO metadata at runtime', () => {
    const profileJs = read('public/js/profile.js');

    assert.match(profileJs, /function updateProfileSeo\(/);
    assert.match(profileJs, /Person/);
    assert.match(profileJs, /og:title/);
    assert.match(profileJs, /twitter:description/);
});

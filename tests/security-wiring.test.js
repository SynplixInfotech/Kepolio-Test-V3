const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('firestore username rules require ownership on update', () => {
    const rules = read('firestore.rules');

    assert.match(
        rules,
        /allow update: if isAuth\(\)\s*&&\s*resource\.data\.uid == request\.auth\.uid\s*&&\s*request\.resource\.data\.uid == resource\.data\.uid;/,
    );
});

test('browser entry pages load validation.js before dependent app scripts', () => {
    for (const page of ['public/auth.html', 'public/dashboard.html', 'public/profile.html']) {
        const html = read(page);
        const validationIndex = html.indexOf('js/validation.js');
        const dataServiceIndex = html.indexOf('js/data-service.js');
        const authIndex = html.indexOf('js/auth.js');

        assert.notEqual(validationIndex, -1, `${page} should load validation.js`);
        assert.notEqual(dataServiceIndex, -1, `${page} should load data-service.js`);
        assert.notEqual(authIndex, -1, `${page} should load auth.js`);
        assert.ok(validationIndex < dataServiceIndex, `${page} should load validation.js before data-service.js`);
        assert.ok(validationIndex < authIndex, `${page} should load validation.js before auth.js`);
    }
});

test('package.json exposes a local test command', () => {
    const pkg = JSON.parse(read('package.json'));
    assert.equal(pkg.scripts.test, 'node --test');
});

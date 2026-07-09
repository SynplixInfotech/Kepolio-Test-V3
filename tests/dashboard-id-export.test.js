const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('ID card faces share one export stage origin', () => {
    const css = read('public/css/dashboard.css');

    assert.match(
        css,
        /\.kep-id2-stage\s*\{[\s\S]*position:\s*relative;[\s\S]*height:\s*1013px;/,
        'export stage should own a fixed card-sized box',
    );

    assert.match(
        css,
        /\.kep-id2\s*\{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;/,
        'front and back faces should stack on the same origin',
    );
});

test('PDF export waits for the visible face layout to settle before capture', () => {
    const js = read('public/js/dashboard-id.js');

    assert.match(js, /async function _waitForStableCapture\(/);
    assert.match(js, /requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)/);
    assert.match(js, /const frontCanvas = await _captureFace\('front', front, back, captureOpts\);/);
    assert.match(js, /const backCanvas = await _captureFace\('back', front, back, captureOpts\);/);
});

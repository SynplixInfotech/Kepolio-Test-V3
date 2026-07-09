const test = require('node:test');
const assert = require('node:assert/strict');

const ValidationUtils = require('../public/js/validation.js');

test('normalizes HTTPS URLs and rejects javascript URLs', () => {
    assert.equal(
        ValidationUtils.normalizeExternalUrl('github.com/example'),
        'https://github.com/example'
    );

    assert.throws(
        () => ValidationUtils.normalizeExternalUrl('javascript:alert(1)'),
        /valid HTTPS URL|Only HTTPS links are allowed/
    );
});

test('enforces expected social domains', () => {
    assert.equal(
        ValidationUtils.normalizeSocialLinks({ github: 'https://github.com/example' }).github,
        'https://github.com/example'
    );

    assert.throws(
        () => ValidationUtils.normalizeSocialLinks({ github: 'https://evil.example.com/user' }),
        /GitHub link must use github\.com over HTTPS\./
    );
});

test('normalizes WhatsApp inputs and drops unsafe hrefs', () => {
    assert.equal(
        ValidationUtils.normalizeWhatsAppLink('+91 98765 43210'),
        'https://wa.me/919876543210'
    );

    assert.equal(
        ValidationUtils.safeExternalHref('javascript:alert(1)', { kind: 'whatsapp' }),
        ''
    );
});

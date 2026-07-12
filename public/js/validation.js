(function (root, factory) {
    const api = factory();
    root.ValidationUtils = api;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

    function normalizeUsername(username) {
        return String(username || '').trim().toLowerCase();
    }

    function isValidUsername(username) {
        return USERNAME_RE.test(normalizeUsername(username));
    }

    function hasAllowedHost(hostname, allowedHosts) {
        const lower = hostname.toLowerCase();
        return allowedHosts.some(host => lower === host || lower.endsWith(`.${host}`));
    }

    function coerceUrl(raw) {
        const value = String(raw || '').trim();
        if (!value) return '';
        if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) {
            return value;
        }
        return `https://${value}`;
    }

    function normalizeExternalUrl(raw, options = {}) {
        const value = String(raw || '').trim();
        if (!value) return '';

        let url;
        try {
            url = new URL(coerceUrl(value));
        } catch (_) {
            throw new Error(options.errorMessage || 'Enter a valid HTTPS URL.');
        }

        if (url.protocol !== 'https:') {
            throw new Error(options.errorMessage || 'Only HTTPS links are allowed.');
        }

        if (options.allowedHosts && !hasAllowedHost(url.hostname, options.allowedHosts)) {
            throw new Error(options.errorMessage || 'Enter a valid URL from the expected domain.');
        }

        return url.toString();
    }

    function normalizeWhatsAppLink(raw) {
        const value = String(raw || '').trim();
        if (!value) return '';

        if (/^\+?\d[\d\s()-]{7,}$/.test(value)) {
            const digits = value.replace(/\D/g, '');
            if (digits.length < 8) throw new Error('Enter a valid WhatsApp number or wa.me link.');
            return `https://wa.me/${digits}`;
        }

        return normalizeExternalUrl(value, {
            allowedHosts: ['wa.me', 'api.whatsapp.com', 'whatsapp.com'],
            errorMessage: 'Enter a valid WhatsApp number or wa.me link.',
        });
    }

    function normalizeSocialLinks(links = {}) {
        return {
            github: normalizeExternalUrl(links.github, { allowedHosts: ['github.com'], errorMessage: 'GitHub link must use github.com over HTTPS.' }),
            linkedin: normalizeExternalUrl(links.linkedin, { allowedHosts: ['linkedin.com'], errorMessage: 'LinkedIn link must use linkedin.com over HTTPS.' }),
            portfolio: normalizeExternalUrl(links.portfolio, { errorMessage: 'Portfolio link must be a valid HTTPS URL.' }),
            twitter: normalizeExternalUrl(links.twitter, { allowedHosts: ['x.com', 'twitter.com'], errorMessage: 'Twitter / X link must use x.com or twitter.com over HTTPS.' }),
            instagram: normalizeExternalUrl(links.instagram, { allowedHosts: ['instagram.com'], errorMessage: 'Instagram link must use instagram.com over HTTPS.' }),
            youtube: normalizeExternalUrl(links.youtube, { allowedHosts: ['youtube.com', 'youtu.be'], errorMessage: 'YouTube link must use youtube.com or youtu.be over HTTPS.' }),
            leetcode: normalizeExternalUrl(links.leetcode, { allowedHosts: ['leetcode.com'], errorMessage: 'LeetCode link must use leetcode.com over HTTPS.' }),
            hackerrank: normalizeExternalUrl(links.hackerrank, { allowedHosts: ['hackerrank.com'], errorMessage: 'HackerRank link must use hackerrank.com over HTTPS.' }),
            whatsapp: normalizeWhatsAppLink(links.whatsapp),
            telegram: normalizeExternalUrl(links.telegram, { allowedHosts: ['t.me', 'telegram.me'], errorMessage: 'Telegram link must use t.me over HTTPS.' }),
        };
    }

    function safeExternalHref(raw, options = {}) {
        try {
            return options.kind === 'whatsapp'
                ? normalizeWhatsAppLink(raw)
                : normalizeExternalUrl(raw, options);
        } catch (_) {
            return '';
        }
    }

    // Disallows angle brackets / template / script-injection characters.
    // Not a format check — just a length + "no markup" guard on free text.
    const PLAIN_TEXT_RE = /^[^<>{}$`]*$/;

    function isValidPlainText(value, { min = 0, max = 200 } = {}) {
        const v = String(value == null ? '' : value).trim();
        if (v.length < min || v.length > max) return false;
        return PLAIN_TEXT_RE.test(v);
    }

    function validateQualification({ degree, institution, year, grade } = {}) {
        const errors = [];
        if (!isValidPlainText(degree, { min: 2, max: 100 })) {
            errors.push('Degree / Course must be 2–100 characters.');
        }
        if (!isValidPlainText(institution, { min: 2, max: 100 })) {
            errors.push('Institution must be 2–100 characters.');
        }
        if (year && !isValidPlainText(year, { min: 2, max: 30 })) {
            errors.push('Year must be 2–30 characters.');
        }
        if (grade && !isValidPlainText(grade, { min: 1, max: 20 })) {
            errors.push('Grade / CGPA must be under 20 characters.');
        }
        return errors;
    }

    function validateExperience({ title, company, duration, description } = {}) {
        const errors = [];
        if (!isValidPlainText(title, { min: 2, max: 100 })) {
            errors.push('Role / Title must be 2–100 characters.');
        }
        if (!isValidPlainText(company, { min: 2, max: 100 })) {
            errors.push('Company / Organization must be 2–100 characters.');
        }
        if (duration && !isValidPlainText(duration, { min: 2, max: 40 })) {
            errors.push('Duration must be 2–40 characters.');
        }
        if (description && !isValidPlainText(description, { min: 1, max: 300 })) {
            errors.push('Description must be under 300 characters.');
        }
        return errors;
    }

    function isValidCertDate(dateStr) {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return d <= today;
    }

    function validateCertificate({ name, organization, date } = {}) {
        const errors = [];
        if (!isValidPlainText(name, { min: 2, max: 100 })) {
            errors.push('Certificate name must be 2–100 characters.');
        }
        if (!isValidPlainText(organization, { min: 2, max: 100 })) {
            errors.push('Organization name must be 2–100 characters.');
        }
        if (!isValidCertDate(date)) {
            errors.push('Enter a valid issue date (not in the future).');
        }
        return errors;
    }

    const VALID_TEMPLATES = ['minimal', 'professional', 'creative', 'academic'];

    function isValidTemplate(template) {
        return VALID_TEMPLATES.includes(template);
    }

    return {
        normalizeUsername,
        isValidUsername,
        normalizeExternalUrl,
        normalizeWhatsAppLink,
        normalizeSocialLinks,
        safeExternalHref,
        isValidPlainText,
        validateQualification,
        validateExperience,
        validateCertificate,
        isValidCertDate,
        isValidTemplate,
    };
});

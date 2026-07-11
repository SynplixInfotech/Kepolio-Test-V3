/* ═══════════════════════════════════════════════════
   KePolio — Shared Utilities
   Toast, copy, QR, animations
   ═══════════════════════════════════════════════════ */

const Utils = (() => {
    'use strict';

    // ── Toast Notifications ──
    function toast(message, type = 'success', duration = 3000) {
        const existing = document.querySelector('.case-toast');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = `case-toast case-toast--${type}`;
        el.setAttribute('role', 'alert');
        el.setAttribute('aria-live', 'polite');
        el.innerHTML = `
            <span class="case-toast__icon">${type === 'success' ? '✓' : '✗'}</span>
            <span class="case-toast__msg">${Utils.escapeHTML(message)}</span>
        `;
        document.body.appendChild(el);

        requestAnimationFrame(() => el.classList.add('case-toast--visible'));

        setTimeout(() => {
            el.classList.remove('case-toast--visible');
            setTimeout(() => el.remove(), 300);
        }, duration);
    }

    // ── Copy to Clipboard ──
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            return true;
        }
    }

    // ── Copy Button Handler ──
    function initCopyButton(btn, getText) {
        if (!btn || btn._copyInitialized) return;
        btn._copyInitialized = true;
        btn.addEventListener('click', async () => {
            const text = typeof getText === 'function' ? getText() : getText;
            const ok = await copyToClipboard(text);
            if (ok) {
                const original = btn.innerHTML;
                btn.innerHTML = '<span style="color:#22c55e">✓ Copied!</span>';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.classList.remove('copied');
                }, 2000);
            }
        });
    }

    // ── QR Code Generator (simple canvas-based) ──
    function generateQR(container, url, size = 160) {
        // Use QR Code library from CDN (loaded in HTML)
        if (typeof QRCode !== 'undefined') {
            container.innerHTML = '';
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            new QRCode(container, {
                text: url,
                width: size,
                height: size,
                colorDark: isDark ? '#F1F5F9' : '#101317',
                colorLight: 'transparent',
                correctLevel: QRCode.CorrectLevel.M,
            });
        } else {
            // Fallback: show placeholder
            container.innerHTML = `
                <div style="width:${size}px;height:${size}px;border:1px dashed rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94A3B8;font-size:12px;text-align:center;">
                    QR Code<br>Loading…
                </div>
            `;
        }
    }

    // ── Re-render QR codes on theme change ──
    const qrRegistry = new Map();
    const originalGenerateQR = generateQR;
    function generateQRTracked(container, url, size) {
        qrRegistry.set(container, { url, size });
        originalGenerateQR(container, url, size);
    }
    generateQR = generateQRTracked;

    new MutationObserver(() => {
        qrRegistry.forEach((params, container) => {
            if (document.body.contains(container)) {
                originalGenerateQR(container, params.url, params.size);
            } else {
                qrRegistry.delete(container);
            }
        });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // ── Count-up Animation ──
    function animateCount(element, target, duration = 800) {
        const start = 0;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    // ── Staggered Fade-in ──
    function staggerReveal(selector, delay = 80) {
        const els = document.querySelectorAll(selector);
        els.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * delay);
        });
    }

    // ── Sequential Section Reveal ──
    function sequenceReveal(selectors, delay = 200) {
        selectors.forEach((sel, i) => {
            const el = document.querySelector(sel);
            if (!el) return;
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * delay);
        });
    }

    // ── Modal Helpers ──
    let _lastFocusedElement = null;
    let _activeModalTrap = null;

    function _getFocusableElements(container) {
        return container.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
    }

    function _trapFocus(e) {
        if (!_activeModalTrap) return;
        const focusable = _getFocusableElements(_activeModalTrap);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    function openModal(modal) {
        _lastFocusedElement = document.activeElement;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Set up ARIA attributes
        if (!modal.getAttribute('role')) modal.setAttribute('role', 'dialog');
        if (!modal.getAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');

        // Set up focus trap
        _activeModalTrap = modal;
        document.addEventListener('keydown', _trapFocus);

        // Focus first focusable element
        requestAnimationFrame(() => {
            const focusable = _getFocusableElements(modal);
            if (focusable.length > 0) {
                focusable[0].focus();
            }
        });
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Remove focus trap
        _activeModalTrap = null;
        document.removeEventListener('keydown', _trapFocus);

        // Restore focus
        if (_lastFocusedElement && typeof _lastFocusedElement.focus === 'function') {
            _lastFocusedElement.focus();
            _lastFocusedElement = null;
        }
    }

    // ── Debounce ──
    function debounce(fn, ms = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    // ── Format relative time ──
    function timeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }

    // ── Escape HTML ──
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Get initials from a name ──
    function getInitials(name) {
        return (name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    }

    // ── Format a YYYY-MM-DD date string for display (e.g. "Jan 2024") ──
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // ── WhatsApp Share ──
    function shareWhatsApp(url, message) {
        const text = encodeURIComponent(message || `Check out my portfolio: ${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    // ── Email Share ──
    function shareEmail(url, name) {
        const subject = encodeURIComponent(`${name}'s Portfolio — KePolio`);
        const body = encodeURIComponent(`Hi,\n\nCheck out my portfolio:\n${url}\n\nBuilt with KePolio — kepolio.app`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    return {
        toast,
        copyToClipboard,
        initCopyButton,
        generateQR,
        animateCount,
        staggerReveal,
        sequenceReveal,
        openModal,
        closeModal,
        debounce,
        formatDate,
        timeAgo,
        escapeHTML,
        getInitials,
        shareWhatsApp,
        shareEmail,
    };
})();

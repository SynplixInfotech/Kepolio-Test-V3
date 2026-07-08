/* ═══════════════════════════════════════════════════
   KePolio — Main JavaScript
   Entry animations, particles, scroll reveal, interactions
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── DOM References ───
    const DOM = {
        navbar: document.getElementById('navbar'),
        heroContent: document.getElementById('heroContent'),
        heroMockup: document.getElementById('heroMockup'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        navLinks: document.getElementById('navLinks'),
        scrollIndicator: document.getElementById('scrollIndicator'),
        themeToggle: document.getElementById('themeToggle'),
        themeToggleIcon: document.getElementById('themeToggleIcon'),
        themeToggleText: document.getElementById('themeToggleText'),
    };

    // ─── Theme Controls ───
    const THEME_KEY = 'kepolio-theme';

    function updateThemeControlState(theme) {
        if (DOM.themeToggleIcon) DOM.themeToggleIcon.textContent = theme === 'dark' ? '☀' : '🌙';
        if (DOM.themeToggleText) DOM.themeToggleText.textContent = theme === 'dark' ? 'Light' : 'Dark';
        if (DOM.themeToggle) DOM.themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);

        document.querySelectorAll('[data-theme-choice]').forEach((button) => {
            const active = button.dataset.themeChoice === theme;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function applyTheme(theme, persist = true) {
        const finalTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', finalTheme);
        updateThemeControlState(finalTheme);

        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            const color = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
            if (color) metaTheme.setAttribute('content', color);
        }

        if (persist) localStorage.setItem(THEME_KEY, finalTheme);
    }

    function initTheme() {
        const storedTheme = localStorage.getItem(THEME_KEY);
        applyTheme(storedTheme || 'light', false);

        DOM.themeToggle?.addEventListener('click', () => {
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        });

        document.querySelectorAll('[data-theme-choice]').forEach((button) => {
            button.addEventListener('click', () => {
                applyTheme(button.dataset.themeChoice || 'light');
            });
        });
    }

    // ─── Scroll Reveal Observer ───
    function initScrollReveal() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }

    // ─── Navbar Scroll Effect ───
    function initNavbarScroll() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    DOM.navbar.classList.toggle('scrolled', window.scrollY > 60);
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ─── Smooth Scroll for Anchor Links ───
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(a.getAttribute('href'));
                if (target) {
                    // Close mobile menu first if open
                    if (DOM.mobileMenuBtn && DOM.navLinks && DOM.navLinks.classList.contains('open')) {
                        DOM.mobileMenuBtn.classList.remove('active');
                        DOM.navLinks.classList.remove('open');
                        const backdrop = document.querySelector('.mobile-menu-backdrop');
                        if (backdrop) backdrop.classList.remove('visible');
                        document.body.classList.remove('menu-open');
                        document.body.style.top = '';
                    }
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ─── Mobile Menu Toggle ───
    function initMobileMenu() {
        if (!DOM.mobileMenuBtn || !DOM.navLinks) return;

        // Create backdrop element
        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-menu-backdrop';
        document.body.appendChild(backdrop);

        let scrollY = 0;

        function openMenu() {
            scrollY = window.scrollY;
            DOM.mobileMenuBtn.classList.add('active');
            DOM.navLinks.classList.add('open');
            backdrop.classList.add('visible');
            document.body.classList.add('menu-open');
            document.body.style.top = `-${scrollY}px`;
        }

        function closeMenu() {
            DOM.mobileMenuBtn.classList.remove('active');
            DOM.navLinks.classList.remove('open');
            backdrop.classList.remove('visible');
            document.body.classList.remove('menu-open');
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
        }

        function isMenuOpen() {
            return DOM.navLinks.classList.contains('open');
        }

        DOM.mobileMenuBtn.addEventListener('click', () => {
            if (isMenuOpen()) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close on backdrop click
        backdrop.addEventListener('click', closeMenu);

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen()) {
                closeMenu();
            }
        });
    }

    // ─── Scroll Indicator Hide ───
    function initScrollIndicator() {
        if (!DOM.scrollIndicator) return;
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                DOM.scrollIndicator.style.opacity = '0';
                DOM.scrollIndicator.style.pointerEvents = 'none';
            } else {
                DOM.scrollIndicator.style.opacity = '0.6';
                DOM.scrollIndicator.style.pointerEvents = 'auto';
            }
        }, { passive: true });
    }

    // ─── Entry Animation Sequence ───
    async function runEntrySequence() {
        // Make everything visible immediately
        DOM.navbar.classList.add('visible');
        DOM.heroContent.classList.add('visible');
        DOM.heroMockup.classList.add('visible');
        document.body.style.overflowY = 'auto';
    }

    // ─── Init ───
    function init() {
        // Show everything immediately
        document.body.style.overflowY = 'auto';
        initTheme();

        // Start everything
        runEntrySequence();
        initScrollReveal();
        initNavbarScroll();
        initSmoothScroll();
        initMobileMenu();
        initScrollIndicator();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

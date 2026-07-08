/* ═══════════════════════════════════════════════════
   KePolio — Profile Loader  v2.0
   Minimal branded loading bar — replaces cinematic animation.
   Keeps the same public API: window.CaseLoader.dismiss()
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const MIN_SHOW_MS = 800;   // minimum time to show loader (ms)
    const BOOT_TIME = Date.now();

    /* ═══════════ DOM ═══════════ */
    const loader   = document.getElementById('caseLoader');
    const barEl    = document.getElementById('loaderBar');
    const phraseEl = document.getElementById('loaderPhrase');
    const hudPct   = document.getElementById('hudPct');
    const hudStatus = document.getElementById('hudStatus');
    if (!loader) return;

    /* ═══════════ PROGRESS BAR ═══════════ */
    const STATUSES = ['FETCHING', 'PARSING', 'RENDERING', 'COMPLETE'];
    let pct = 0, progressTimer = null;

    function tickProgress() {
        const ratio = Math.min((Date.now() - BOOT_TIME) / MIN_SHOW_MS, 1);
        const soft = ratio * 88;
        if (pct < soft) pct += (soft - pct) * 0.14 + 0.2;
        pct = Math.min(pct, 88);
        if (barEl)     barEl.style.width = `${pct}%`;
        if (hudPct)    hudPct.textContent = `${Math.round(pct)}%`;
        if (hudStatus) hudStatus.textContent = STATUSES[pct < 25 ? 0 : pct < 55 ? 1 : pct < 85 ? 2 : 3];
        progressTimer = setTimeout(tickProgress, 60);
    }

    /* ═══════════ PHRASES ═══════════ */
    const PHRASES = [
        'Fetching profile…',
        'Loading portfolio…',
        'Almost ready…',
    ];
    let phraseIdx = 0, phraseTimer = null;

    function cyclePhrases() {
        if (phraseEl) phraseEl.textContent = PHRASES[phraseIdx % PHRASES.length];
        phraseIdx++;
        phraseTimer = setTimeout(cyclePhrases, 1400);
    }

    /* ═══════════ PUBLIC API ═══════════ */
    window.CaseLoader = {
        dismiss() {
            return new Promise(resolve => {
                const remaining = Math.max(0, MIN_SHOW_MS - (Date.now() - BOOT_TIME));
                setTimeout(() => {
                    if (progressTimer) clearTimeout(progressTimer);
                    if (phraseTimer)   clearTimeout(phraseTimer);

                    pct = 100;
                    if (barEl)     barEl.style.width = '100%';
                    if (hudPct)    hudPct.textContent = '100%';
                    if (hudStatus) hudStatus.textContent = 'COMPLETE';
                    if (phraseEl)  phraseEl.textContent = 'Ready ✓';

                    setTimeout(() => {
                        const c = document.getElementById('profileContainer');
                        if (c) c.style.display = '';
                        if (loader) loader.classList.add('case-loader--exit');
                        setTimeout(() => {
                            if (loader) loader.remove();
                            resolve();
                        }, 500);
                    }, 250);
                }, remaining);
            });
        },
    };

    /* ═══════════ KICK OFF ═══════════ */
    cyclePhrases();
    tickProgress();

})();

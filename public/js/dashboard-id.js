/* ═══════════════════════════════════════════════════
   KePolio — Digital ID Card  (Front + Back)
   Front : 638 × 1013 px  |  Profile photo : 300 × 400 px
   Back  : 638 × 1013 px  |  QR code : 450 × 450 px
   PDF   : html2canvas + jsPDF, two-page portrait
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $ } = Dashboard;

    /* ─── Export artwork dimensions. Runtime display size is screen-driven. ─── */
    const CARD_W  = 638;
    const CARD_H  = 1013;
    const PHOTO_W = 300;
    const PHOTO_H = 400;
    const QR_SIZE = 450;
    const DISPLAY_MIN_SCALE = 0.28;
    const DISPLAY_MAX_SCALE = 1;

    /* ─── Module state ─── */
    let _user = null;
    let _face = 'front';   // 'front' | 'back'
    let _resizeObserver = null;
    let _isCapturingForExport = false;

    /* ════════════════════════════════════════════════
       INLINE ASSETS
    ════════════════════════════════════════════════ */

    /* Fallback avatar SVG (no external deps) */
    const FALLBACK_SVG = `<svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="300" height="400" fill="url(#fbg)"/>
      <circle cx="150" cy="148" r="72" fill="#7170FF" fill-opacity="0.15"/>
      <circle cx="150" cy="148" r="48" fill="#7170FF" fill-opacity="0.25"/>
      <circle cx="150" cy="148" r="28" fill="#7170FF" fill-opacity="0.48"/>
      <path d="M38 390C38 308 88 265 150 265C212 265 262 308 262 390" stroke="#7170FF" stroke-width="7" stroke-opacity="0.38" stroke-linecap="round"/>
      <defs>
        <linearGradient id="fbg" x1="0" y1="0" x2="300" y2="400" gradientUnits="userSpaceOnUse">
          <stop stop-color="#eeeeff"/>
          <stop offset="1" stop-color="#e4e4ff"/>
        </linearGradient>
      </defs>
    </svg>`;

    /* Shared background decoration */
    function _bgSvg() {
        return `<svg class="kep-id2__waves" viewBox="0 0 638 1013"
             preserveAspectRatio="xMidYMid slice"
             xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="kbg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stop-color="#7170FF" stop-opacity="0.07"/>
              <stop offset="100%" stop-color="#5e6ad2" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <path d="M-80 140 Q160 60 320 180 Q480 300 720 140"  fill="none" stroke="url(#kbg)" stroke-width="100" opacity="0.8"/>
          <path d="M-80 380 Q160 300 320 420 Q480 540 720 380" fill="none" stroke="url(#kbg)" stroke-width="80"  opacity="0.6"/>
          <path d="M-80 640 Q160 560 320 680 Q480 800 720 640" fill="none" stroke="url(#kbg)" stroke-width="60"  opacity="0.4"/>
          <path d="M-80 900 Q160 820 320 940 Q480 1060 720 900" fill="none" stroke="url(#kbg)" stroke-width="50" opacity="0.3"/>
          <!-- corner particles top-left -->
          <circle cx="22"  cy="22"  r="3.5" fill="#7170FF" opacity="0.07"/>
          <circle cx="50"  cy="14"  r="2"   fill="#7170FF" opacity="0.05"/>
          <circle cx="10"  cy="58"  r="2.5" fill="#7170FF" opacity="0.06"/>
          <circle cx="76"  cy="30"  r="1.5" fill="#7170FF" opacity="0.04"/>
          <!-- corner particles bottom-right -->
          <circle cx="616" cy="991" r="3.5" fill="#7170FF" opacity="0.07"/>
          <circle cx="590" cy="999" r="2"   fill="#7170FF" opacity="0.05"/>
          <circle cx="628" cy="960" r="2.5" fill="#7170FF" opacity="0.06"/>
          <!-- corner particles top-right + bottom-left -->
          <circle cx="614" cy="24"  r="2.5" fill="#7170FF" opacity="0.05"/>
          <circle cx="24"  cy="989" r="2.5" fill="#7170FF" opacity="0.05"/>
        </svg>`;
    }

    /* ════════════════════════════════════════════════
       SHARED PARTIALS
    ════════════════════════════════════════════════ */

    function _headerHtml(kepCode) {
        return `
          <header class="kep-id2__header">
            <div class="kep-id2__brand">
              <span class="kep-id2__logo" aria-label="KePolio">
                <span class="kep-id2__logo-ke">Ke</span><span
                  class="kep-id2__logo-p">P</span><span
                  class="kep-id2__logo-rest">olio</span>
              </span>
              <p class="kep-id2__tagline">Know Everyone's Portfolio</p>
            </div>
            <div class="kep-id2__id-label" aria-label="KEP ID ${_esc(kepCode)}">
              <span class="kep-id2__id-prefix">KEP ID</span>
              <span class="kep-id2__id-code">${_esc(kepCode)}</span>
            </div>
          </header>`;
    }

    function _footerHtml(username) {
        return `
          <footer class="kep-id2__footer">
            <div class="kep-id2__footer-line"></div>
            <p class="kep-id2__footer-url">kepolio.app/@${_esc(username)}</p>
          </footer>`;
    }

    /* ════════════════════════════════════════════════
       FRONT FACE HTML
    ════════════════════════════════════════════════ */

    function _frontHtml(user) {
        const kepCode  = user.caseCode || '---';
        const fullName = user.fullName || 'Your Name';
        const username = user.username || 'username';
        const headline = user.role     || user.bio || 'KePolio Member';
        const verified = !!user.caseCode;
        const photoURL = _safeImageUrl(user.photoURL);

        const photoMarkup = photoURL
            ? `<img
                 src="${_esc(photoURL)}"
                 alt="Profile photo of ${_esc(fullName)}"
                 class="kep-id2__photo-img"
                 loading="lazy"
                 crossorigin="anonymous"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"/>
               <span class="kep-id2__photo-fallback" style="display:none;" aria-hidden="true">${FALLBACK_SVG}</span>`
            : `<span class="kep-id2__photo-fallback" aria-hidden="true">${FALLBACK_SVG}</span>`;

        const verifiedBadge = verified
            ? `<div class="kep-id2__verified" role="img" aria-label="Verified Portfolio">
                 <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true">
                   <path d="M10 1.5L12.39 5.26L16.5 4.5L15.74 8.61L19.5 11L15.74 13.39L16.5 17.5L12.39 16.74L10 20.5L7.61 16.74L3.5 17.5L4.26 13.39L0.5 11L4.26 8.61L3.5 4.5L7.61 5.26L10 1.5Z"
                         fill="#7170FF" stroke="white" stroke-width="0.5"/>
                   <polyline points="6.5,11 9,13.5 13.5,8.5" stroke="white" stroke-width="1.5"
                             stroke-linecap="round" stroke-linejoin="round"/>
                 </svg>
                 Verified Portfolio
               </div>`
            : '';

        return `
          <article class="kep-id2 kep-id2--front" id="kep-card-front"
                   aria-label="KePolio ID – Front">
            <div class="kep-id2__bg" aria-hidden="true">${_bgSvg()}</div>

            ${_headerHtml(kepCode)}

            <section class="kep-id2__photo-section" aria-label="Profile photo">
              <div class="kep-id2__photo-wrap"
                   role="img"
                   aria-label="${photoURL ? `Photo of ${_esc(fullName)}` : 'Default avatar'}"
                   style="width:${PHOTO_W}px;height:${PHOTO_H}px;">
                ${photoMarkup}
              </div>
              ${verifiedBadge}
            </section>

            <section class="kep-id2__identity" aria-label="User identity">
              <h2 class="kep-id2__name">${_esc(fullName)}</h2>
              <p class="kep-id2__username" aria-label="Username @${_esc(username)}">@${_esc(username)}</p>
              <p class="kep-id2__headline">${_esc(headline)}</p>
            </section>

            <section class="kep-id2__code-section" aria-label="KEP Code">
              <div class="kep-id2__code-label">My KeP Code</div>
              <div class="kep-id2__code-value" aria-label="KEP Code: ${_esc(kepCode)}">${_esc(kepCode)}</div>
            </section>

            ${_footerHtml(username)}
          </article>`;
    }

    /* ════════════════════════════════════════════════
       BACK FACE HTML
    ════════════════════════════════════════════════ */

    function _backHtml(user) {
        const kepCode  = user.caseCode || '---';
        const username = user.username || 'username';

        return `
          <article class="kep-id2 kep-id2--back" id="kep-card-back"
                   aria-label="KePolio ID – Back" style="display:none;">
            <div class="kep-id2__bg" aria-hidden="true">${_bgSvg()}</div>

            ${_headerHtml(kepCode)}

            <section class="kep-id2__qr-section" aria-label="Portfolio QR code">
              <p class="kep-id2__qr-label">Scan to view</p>
              <div class="kep-id2__qr-wrap"
                   id="kep-back-qr"
                   role="img"
                   aria-label="QR code for ${_esc(username)}'s portfolio"
                   style="width:${QR_SIZE}px;height:${QR_SIZE}px;"></div>
            </section>

            ${_footerHtml(username)}
          </article>`;
    }

    /* ════════════════════════════════════════════════
       SCALE COMPUTATION
    ════════════════════════════════════════════════ */

    function _applyScale() {
        if (_isCapturingForExport) return;

        const viewer = $('#kepIdViewer');
        if (!viewer) return;

        const section = viewer.closest('.kep-id-section') || viewer.parentElement;
        const rect = section ? section.getBoundingClientRect() : { top: 0 };
        const horizontalPadding = window.innerWidth <= 480 ? 20 : 48;
        const bottomReserve = window.innerWidth <= 768 ? 190 : 170;
        const availableWidth = Math.max(0, (section ? section.clientWidth : window.innerWidth) - horizontalPadding);
        const availableHeight = Math.max(0, window.innerHeight - rect.top - bottomReserve);
        const scale = Math.min(
            DISPLAY_MAX_SCALE,
            Math.max(DISPLAY_MIN_SCALE, availableWidth / CARD_W),
            Math.max(DISPLAY_MIN_SCALE, availableHeight / CARD_H)
        );

        viewer.style.width  = `${CARD_W  * scale}px`;
        viewer.style.height = `${CARD_H  * scale}px`;

        const stage = $('#kepIdStage');
        if (stage) stage.style.transform = `scale(${scale})`;
    }

    /* ════════════════════════════════════════════════
       FACE TOGGLE
    ════════════════════════════════════════════════ */

    function _syncFaceDisplay() {
        const front   = $('#kep-card-front');
        const back    = $('#kep-card-back');
        const flipBtn = $('#kepIdFlipBtn');
        if (!front || !back) return;

        if (_face === 'front') {
            front.style.display = '';
            back.style.display  = 'none';
        } else {
            front.style.display = 'none';
            back.style.display  = '';
        }
        if (flipBtn) {
            flipBtn.textContent = _face === 'front' ? '↺  View Back' : '↺  View Front';
        }
    }

    async function _waitForStableCapture() {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    async function _captureFace(face, front, back, stage, captureOpts) {
        if (face === 'front') {
            if (front) front.style.display = '';
            if (back) back.style.display = 'none';
        } else {
            if (front) front.style.display = 'none';
            if (back) back.style.display = '';
        }

        await _waitForStableCapture();
        /* Capture the fixed-size stage — not the absolutely positioned face —
           so html2canvas uses a stable origin without transform offsets. */
        return html2canvas(stage, captureOpts);
    }

    /* ════════════════════════════════════════════════
       SKELETON
    ════════════════════════════════════════════════ */

    function _renderSkeleton(container) {
        container.innerHTML = `
          <div class="kep-id2-viewer" id="kepIdViewer">
            <div class="kep-id2-stage" id="kepIdStage">
              <div class="kep-id2 kep-id2--skeleton" aria-busy="true" aria-label="Loading ID card">
                <div class="kep-id2__header">
                  <div class="kep-sk kep-sk--logo"></div>
                  <div class="kep-sk kep-sk--code"></div>
                </div>
                <div class="kep-id2__photo-section">
                  <div class="kep-sk kep-sk--photo" style="width:${PHOTO_W}px;height:${PHOTO_H}px;"></div>
                </div>
                <div class="kep-id2__identity">
                  <div class="kep-sk kep-sk--name"></div>
                  <div class="kep-sk kep-sk--user"></div>
                  <div class="kep-sk kep-sk--headline"></div>
                </div>
                <div class="kep-id2__code-section">
                  <div class="kep-sk kep-sk--code-label"></div>
                  <div class="kep-sk kep-sk--code-val"></div>
                </div>
              </div>
            </div>
          </div>`;
        _applyScale();
    }

    /* ════════════════════════════════════════════════
       RENDER BOTH FACES
    ════════════════════════════════════════════════ */

    function _renderCards(user) {
        const container = $('#kep-id-card-container');
        if (!container) return;

        container.innerHTML = `
          <div class="kep-id2-viewer" id="kepIdViewer">
            <div class="kep-id2-stage" id="kepIdStage">
              ${_frontHtml(user)}
              ${_backHtml(user)}
            </div>
          </div>`;

        /* Generate QR on back face */
        const qrEl = $('#kep-back-qr');
        if (qrEl) {
            const profileUrl = `${window.location.origin}/@${encodeURIComponent(user.username || '')}`;
            Utils.generateQR(qrEl, profileUrl, QR_SIZE);
        }

        /* Apply screen-driven preview scale. PDF export keeps the fixed artwork size. */
        _applyScale();

        /* Watch container for resize */
        if (window.ResizeObserver) {
            _resizeObserver?.disconnect();
            _resizeObserver = new ResizeObserver(_applyScale);
            _resizeObserver.observe(container);
        } else {
            window.addEventListener('resize', _applyScale);
        }

        /* Start on front face */
        _face = 'front';
        _syncFaceDisplay();
    }

    /* ════════════════════════════════════════════════
       PDF DOWNLOAD
    ════════════════════════════════════════════════ */

    async function _downloadPdf(user) {
        const dlBtn = $('#kepIdDownloadBtn');
        const stage  = $('#kepIdStage');
        const viewer = $('#kepIdViewer');
        const front  = $('#kep-card-front');
        const back   = $('#kep-card-back');

        if (dlBtn) {
            dlBtn.disabled = true;
            dlBtn.textContent = 'Generating PDF…';
        }

        _isCapturingForExport = true;

        try {
            if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
                Utils.toast('PDF library not ready. Please wait a moment and try again.', 'error');
                return;
            }
            const { jsPDF } = window.jspdf;

            if (!stage) {
                Utils.toast('ID card not ready. Please try again.', 'error');
                return;
            }

            /* Render at full artwork size with no CSS transform so html2canvas
               captures the stage bounding box exactly. */
            stage.style.transform = 'none';
            if (viewer) {
                viewer.style.width    = `${CARD_W}px`;
                viewer.style.height   = `${CARD_H}px`;
                viewer.style.overflow = 'visible';
            }

            const captureOpts = {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width:  CARD_W,
                height: CARD_H,
                scrollX: 0,
                scrollY: 0,
            };

            const frontCanvas = await _captureFace('front', front, back, stage, captureOpts);
            const backCanvas = await _captureFace('back', front, back, stage, captureOpts);

            /* Build PDF — card px → mm at 96 dpi */
            const MM   = 25.4 / 96;
            const pdfW = CARD_W * MM;   // ≈ 168.7 mm
            const pdfH = CARD_H * MM;   // ≈ 268.2 mm

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfW, pdfH] });

            /* Page 1 – Front */
            pdf.addImage(frontCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH);

            /* Page 2 – Back */
            pdf.addPage([pdfW, pdfH], 'portrait');
            pdf.addImage(backCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH);

            const filename = `KePolio-ID-${(user.username || 'card').replace(/[^a-z0-9]/gi, '_')}.pdf`;
            pdf.save(filename);

            Utils.toast('ID card downloaded!', 'success');

        } catch (err) {
            console.error('[KePolioID] PDF error:', err);
            Utils.toast('Download failed. Please try again.', 'error');

        } finally {
            _isCapturingForExport = false;
            _syncFaceDisplay();
            if (viewer) viewer.style.overflow = '';
            _applyScale();

            if (dlBtn) {
                dlBtn.disabled = false;
                dlBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                  stroke-width="1.5" width="14" height="14" aria-hidden="true">
                  <path d="M8 1v9M4 7l4 4 4-4"/><path d="M2 13h12"/>
                </svg> Download PDF`;
            }
        }
    }

    /* ════════════════════════════════════════════════
       WIRE BUTTONS
    ════════════════════════════════════════════════ */

    function _wireActions(user) {
        /* Copy KEP Code */
        const copyBtn = $('#kepIdCopyCode');
        if (copyBtn && !copyBtn._kepInit) {
            copyBtn._kepInit = true;
            copyBtn.addEventListener('click', async () => {
                await Utils.copyToClipboard(_user?.caseCode || '');
                Utils.toast('KEP Code copied!', 'success');
            });
        }

        /* Flip card */
        const flipBtn = $('#kepIdFlipBtn');
        if (flipBtn && !flipBtn._kepInit) {
            flipBtn._kepInit = true;
            flipBtn.addEventListener('click', () => {
                _face = _face === 'front' ? 'back' : 'front';
                _syncFaceDisplay();
            });
        }

        /* Download PDF */
        const dlBtn = $('#kepIdDownloadBtn');
        if (dlBtn && !dlBtn._kepInit) {
            dlBtn._kepInit = true;
            dlBtn.addEventListener('click', () => _downloadPdf(_user || user));
        }
    }

    /* ════════════════════════════════════════════════
       UTILITIES
    ════════════════════════════════════════════════ */

    function _esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#39;');
    }

    function _safeImageUrl(raw) {
        const value = String(raw || '').trim();
        if (!value) return '';

        try {
            const url = new URL(value, window.location.origin);
            const isLocalHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
            if (url.protocol === 'https:' || isLocalHttp) {
                return url.href;
            }
        } catch (_) {
            // Fall through to empty string; broken or unsafe photo URLs use the fallback avatar.
        }

        return '';
    }

    /* ════════════════════════════════════════════════
       PUBLIC INIT
    ════════════════════════════════════════════════ */

    Dashboard.initKepId = async function () {
        const container = $('#kep-id-card-container');
        if (!container) return;

        _renderSkeleton(container);

        try {
            const user = await DataService.getUser();

            if (!user) {
                container.innerHTML = `
                  <div class="empty-state">
                    <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="1.5">
                      <circle cx="12" cy="8" r="5"/>
                      <path d="M3 21a9 9 0 0 1 18 0"/>
                    </svg>
                    <p class="empty-state__text">
                      Could not load your profile. Please try again.
                    </p>
                  </div>`;
                return;
            }

            _user = user;
            _renderCards(user);

            /* Show action bar + hint */
            const actionsEl = $('#kepIdActions');
            const hintEl    = $('#kepIdHint');
            if (actionsEl) actionsEl.style.display = '';
            if (hintEl)    hintEl.style.display    = '';

            _wireActions(user);

        } catch (err) {
            console.error('[KePolioID] Failed to load:', err);
            const container2 = $('#kep-id-card-container');
            if (container2) {
                container2.innerHTML = `
                  <div class="empty-state">
                    <p class="empty-state__text">
                      Failed to load your KePolio ID. Please refresh.
                    </p>
                  </div>`;
            }
        }
    };

})();

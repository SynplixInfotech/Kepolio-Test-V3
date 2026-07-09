/* ═══════════════════════════════════════════════════
   KePolio — Dashboard My KEP Code
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $ } = Dashboard;

    let caseCodeListenersAttached = false;

    function updatePreviewCard(user, projects, certs) {
        const initials = (user.fullName || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        if (user.photoURL) {
            $('#previewAvatar').innerHTML = `<img src="${user.photoURL}" alt="Profile" />`;
        } else {
            $('#previewInitials').textContent = initials;
        }

        $('#previewName').textContent = user.fullName || 'Your Name';
        $('#previewBio').textContent = user.bio || user.role || 'Your bio';
        $('#previewProjects').textContent = projects.length;
        $('#previewCerts').textContent = certs.length;
    }

    Dashboard.loadCaseCode = async function () {
        const [user, projects, certs] = await Promise.all([
            DataService.getUser(),
            DataService.getProjects(),
            DataService.getCertificates(),
        ]);
        const profileUrl = `kepolio.app/@${user.username}`;
        const fullUrl = window.location.origin + `/@${user.username}`;

        $('#caseCodeDisplay').textContent = user.caseCode || '---';
        $('#caseCodeLink').textContent = profileUrl;

        Utils.initCopyButton($('#caseCodeCopy'), () => user.caseCode);
        Utils.initCopyButton($('#caseCodeCopyLink'), () => profileUrl);

        Utils.generateQR($('#caseCodeQR'), fullUrl, 160);

        if (!caseCodeListenersAttached) {
            caseCodeListenersAttached = true;

            $('#caseShareWA')?.addEventListener('click', () => {
                Utils.shareWhatsApp(profileUrl, `Check out my portfolio: ${profileUrl}`);
            });
            $('#caseShareEmail')?.addEventListener('click', () => {
                Utils.shareEmail(profileUrl, user.fullName);
            });
            $('#caseDownloadQR')?.addEventListener('click', () => {
                const qrCanvas = $('#caseCodeQR canvas');
                if (qrCanvas) {
                    const link = document.createElement('a');
                    link.download = `KEP-QR-${user.username}.png`;
                    link.href = qrCanvas.toDataURL();
                    link.click();
                }
            });
        }

        updatePreviewCard(user, projects, certs);
    };
})();

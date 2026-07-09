/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Init
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    async function init() {
        const user = await AuthService.requireAuth();
        if (!user) return;

        Dashboard.initNav();
        Dashboard.initShareDropdown();
        Dashboard.initEditProfile();
        Dashboard.initProjectModal();
        Dashboard.initCertificates();
        Dashboard.initQualifications();
        Dashboard.initExperiences();
        Dashboard.initDeleteModal();

        Promise.all([
            DataService.getUser(),
            DataService.getProjects(),
            DataService.getCertificates(),
            DataService.getQualifications(),
            DataService.getExperiences(),
        ]).then(() => Dashboard.loadOverview());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

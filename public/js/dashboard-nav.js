/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Navigation
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $, $$, state } = Dashboard;

    function closeSidebar() {
        $('#sidebar')?.classList.remove('open');
        document.querySelector('.sidebar-backdrop')?.classList.remove('visible');
        const toggle = $('#sidebarToggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.textContent = '☰';
        }
    }

    function openSidebar() {
        $('#sidebar')?.classList.add('open');
        document.querySelector('.sidebar-backdrop')?.classList.add('visible');
        const toggle = $('#sidebarToggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.textContent = '✕';
        }
    }

    function switchSection(section) {
        state.currentSection = section;
        $$('.sidebar__link[data-section]').forEach(l => l.classList.remove('active'));
        $(`.sidebar__link[data-section="${section}"]`)?.classList.add('active');
        $$('.main__section').forEach(s => s.classList.remove('active'));
        $(`#sec-${section}`)?.classList.add('active');
        closeSidebar();
        Dashboard.loadSectionData(section);
    }

    Dashboard.switchSection = switchSection;

    Dashboard.loadSectionData = function (section) {
        const loaders = {
            overview: Dashboard.loadOverview,
            'edit-profile': Dashboard.loadEditProfile,
            projects: Dashboard.loadProjects,
            certificates: Dashboard.loadCertificates,
            qualifications: Dashboard.loadQualifications,
            experiences: Dashboard.loadExperiences,
            'case-code': Dashboard.loadCaseCode,
            'kepolio-id': Dashboard.initKepId,
        };
        const fn = loaders[section];
        if (fn) fn();
    };

    Dashboard.initNav = function () {
        $$('.sidebar__link[data-section]').forEach(link => {
            link.addEventListener('click', () => switchSection(link.dataset.section));
        });

        $$('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => switchSection(btn.dataset.action));
        });

        const toggle = $('#sidebarToggle');
        const sidebar = $('#sidebar');
        if (toggle && sidebar) {
            const sidebarBackdrop = document.createElement('div');
            sidebarBackdrop.className = 'sidebar-backdrop';
            document.body.appendChild(sidebarBackdrop);

            toggle.addEventListener('click', () => {
                if (sidebar.classList.contains('open')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            });

            sidebarBackdrop.addEventListener('click', closeSidebar);

            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                    closeSidebar();
                }
            });
        }

        $('#logoutBtn')?.addEventListener('click', async () => {
            await AuthService.logout();
            Utils.toast('Logged out', 'success');
            setTimeout(() => window.location.href = '/auth', 800);
        });
    };
})();

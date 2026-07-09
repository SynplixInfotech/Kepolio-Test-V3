/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Overview
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $, switchSection } = Dashboard;

    Dashboard.loadOverview = async function () {
        const [user, projects, certs] = await Promise.all([
            DataService.getUser(),
            DataService.getProjects(),
            DataService.getCertificates(),
        ]);
        const completion = await DataService.getProfileCompletion();

        $('#welcomeGreeting').textContent = `Welcome back, ${user.fullName.split(' ')[0]} 👋`;
        $('#welcomePercent').textContent = `${completion.percent}%`;
        $('#welcomeBarFill').style.width = `${completion.percent}%`;

        const chipsEl = $('#welcomeChips');
        chipsEl.innerHTML = '';
        if (completion.percent >= 100) {
            chipsEl.innerHTML = '<span class="welcome__complete">✓ Profile Complete</span>';
        } else {
            const missing = completion.missing;
            if (missing.photo) chipsEl.innerHTML += '<button class="welcome__chip" data-action="edit-profile">+ Add Photo</button>';
            if (missing.bio) chipsEl.innerHTML += '<button class="welcome__chip" data-action="edit-profile">+ Add Bio</button>';
            if (missing.project) chipsEl.innerHTML += '<button class="welcome__chip" data-action="projects">+ Add Project</button>';
            if (missing.certificate) chipsEl.innerHTML += '<button class="welcome__chip" data-action="certificates">+ Add Certificate</button>';
            if (missing.social) chipsEl.innerHTML += '<button class="welcome__chip" data-action="edit-profile">+ Add Social Link</button>';

            chipsEl.querySelectorAll('.welcome__chip').forEach(chip => {
                chip.addEventListener('click', () => switchSection(chip.dataset.action));
            });
        }

        ['#statCard1','#statCard2','#statCard3'].forEach(id => $(id)?.classList.remove('skeleton-card'));
        Utils.animateCount($('#statViews'), user.stats?.profileViews || 0);
        Utils.animateCount($('#statProjects'), projects.length);
        Utils.animateCount($('#statCerts'), certs.length);

        const profileUrl = `kepolio.app/@${user.username}`;
        $('#overviewCode').textContent = user.caseCode || '---';
        $('#overviewLink').textContent = profileUrl;
        $('#overviewLink').href = `/@${user.username}`;
        $('#viewProfileBtn').href = `/@${user.username}`;

        Utils.generateQR($('#overviewQR'), window.location.origin + `/@${user.username}`, 100);

        Utils.initCopyButton($('#overviewCopyCode'), () => user.caseCode);
        Utils.initCopyButton($('#overviewCopyLink'), () => profileUrl);
    };

    Dashboard.initShareDropdown = function () {
        const dropdown = $('#shareDropdown');
        const toggle = $('#shareToggle');

        toggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', () => dropdown?.classList.remove('open'));

        $('#shareLink')?.addEventListener('click', async () => {
            const user = await DataService.getUser();
            await Utils.copyToClipboard(`kepolio.app/@${user.username}`);
            Utils.toast('Link copied!', 'success');
            dropdown.classList.remove('open');
        });

        $('#shareWhatsApp')?.addEventListener('click', async () => {
            const user = await DataService.getUser();
            Utils.shareWhatsApp(`kepolio.app/@${user.username}`);
            dropdown.classList.remove('open');
        });

        $('#shareEmail')?.addEventListener('click', async () => {
            const user = await DataService.getUser();
            await Utils.copyToClipboard(`Check out my portfolio: kepolio.app/@${user.username}\n\nBuilt with KePolio — kepolio.app`);
            Utils.toast('Email text copied!', 'success');
            dropdown.classList.remove('open');
        });
    };
})();

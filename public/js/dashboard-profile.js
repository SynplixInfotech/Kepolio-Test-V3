/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Edit Profile
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $ } = Dashboard;

    function updateAvatarPreview(user) {
        const preview = $('#avatarPreview');
        if (user.photoURL) {
            preview.innerHTML = `<img src="${user.photoURL}" alt="Profile" />`;
        } else {
            const initials = (user.fullName || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            preview.innerHTML = `<span class="avatar-upload__initials">${initials}</span>`;
        }
    }

    Dashboard.loadEditProfile = async function () {
        const user = await DataService.getUser();

        $('#inputName').value = user.fullName || '';
        $('#inputUsername').value = user.username || '';
        $('#inputBio').value = user.bio || '';
        $('#inputRole').value = user.role || '';
        $('#inputGithub').value = user.socialLinks?.github || '';
        $('#inputLinkedin').value = user.socialLinks?.linkedin || '';
        $('#inputPortfolio').value = user.socialLinks?.portfolio || '';
        $('#inputTwitter').value = user.socialLinks?.twitter || '';
        $('#inputInstagram').value = user.socialLinks?.instagram || '';
        $('#inputYoutube').value = user.socialLinks?.youtube || '';
        $('#inputLeetcode').value = user.socialLinks?.leetcode || '';
        $('#inputHackerrank').value = user.socialLinks?.hackerrank || '';
        $('#inputWhatsapp').value = user.socialLinks?.whatsapp || '';
        $('#inputTelegram').value = user.socialLinks?.telegram || '';

        $('#bioCount').textContent = (user.bio || '').length;
        updateAvatarPreview(user);
        $('#usernamePreview').textContent = user.username || 'username';
    };

    Dashboard.initEditProfile = function () {
        $('#avatarBtn')?.addEventListener('click', () => $('#avatarInput').click());
        $('#avatarInput')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const btn = $('#avatarBtn');
            btn.textContent = 'Uploading...';
            btn.disabled = true;
            try {
                const user = await DataService.getUser();
                const url = await uploadProfilePhoto(file, user.uid);
                await DataService.updateUser({ photoURL: url });
                const updated = await DataService.getUser();
                updateAvatarPreview(updated);
                Utils.toast('Photo updated', 'success');
            } catch (err) {
                Utils.toast(err.message || 'Upload failed', 'error');
            } finally {
                btn.textContent = 'Change Photo';
                btn.disabled = false;
            }
        });

        $('#inputBio')?.addEventListener('input', (e) => {
            $('#bioCount').textContent = e.target.value.length;
        });

        const usernameInput = $('#inputUsername');
        const usernameCheck = $('#usernameCheck');
        if (usernameInput) {
            usernameInput.addEventListener('input', Utils.debounce(async () => {
                const val = usernameInput.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                usernameInput.value = val;
                $('#usernamePreview').textContent = val || 'username';

                if (val.length < 3) {
                    usernameCheck.textContent = 'Min 3 characters';
                    usernameCheck.className = 'username-check username-check--taken';
                    return;
                }

                const result = await DataService.checkUsername(val);
                if (result.available) {
                    usernameCheck.textContent = '✓ Available';
                    usernameCheck.className = 'username-check username-check--available';
                } else {
                    usernameCheck.textContent = '✗ Taken';
                    usernameCheck.className = 'username-check username-check--taken';
                }
            }, 500));
        }

        $('#profileForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = $('#saveProfileBtn');
            saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
            saveBtn.disabled = true;

            try {
                await DataService.updateUser({
                    fullName: $('#inputName').value.trim(),
                    username: $('#inputUsername').value.trim(),
                    bio: $('#inputBio').value.trim(),
                    role: $('#inputRole').value.trim(),
                    socialLinks: {
                        github: $('#inputGithub').value.trim(),
                        linkedin: $('#inputLinkedin').value.trim(),
                        portfolio: $('#inputPortfolio').value.trim(),
                        twitter: $('#inputTwitter').value.trim(),
                        instagram: $('#inputInstagram').value.trim(),
                        youtube: $('#inputYoutube').value.trim(),
                        leetcode: $('#inputLeetcode').value.trim(),
                        hackerrank: $('#inputHackerrank').value.trim(),
                        whatsapp: $('#inputWhatsapp').value.trim(),
                        telegram: $('#inputTelegram').value.trim(),
                    },
                });

                Utils.toast('Profile updated', 'success');
            } catch (err) {
                Utils.toast('Something went wrong. Try again.', 'error');
            } finally {
                saveBtn.innerHTML = 'Save Changes';
                saveBtn.disabled = false;
            }
        });

        initDeleteAccount();
    };

    /* ═══════════════ Delete Account ═══════════════ */
    function initDeleteAccount() {
        const openBtn = $('#deleteAccountBtn');
        const modal = $('#deleteAccountModal');
        const usernameLabel = $('#deleteAccountUsername');
        const confirmInput = $('#deleteAccountConfirmInput');
        const passwordField = $('#deleteAccountPasswordField');
        const passwordInput = $('#deleteAccountPasswordInput');
        const confirmBtn = $('#deleteAccountModalConfirm');
        if (!openBtn || !modal) return;

        let expectedUsername = '';

        function refreshConfirmState() {
            const usernameOk = confirmInput.value.trim() === expectedUsername && expectedUsername !== '';
            const passwordOk = passwordField.style.display === 'none' || passwordInput.value.length > 0;
            confirmBtn.disabled = !(usernameOk && passwordOk);
        }

        function closeModal() {
            Utils.closeModal(modal);
            confirmInput.value = '';
            passwordInput.value = '';
            confirmBtn.textContent = 'Delete My Account';
            confirmBtn.disabled = true;
        }

        openBtn.addEventListener('click', async () => {
            const user = await DataService.getUser();
            expectedUsername = user?.username || '';
            usernameLabel.textContent = expectedUsername;

            const provider = AuthService.getSignInProvider();
            passwordField.style.display = provider === 'password' ? '' : 'none';

            confirmInput.value = '';
            passwordInput.value = '';
            confirmBtn.disabled = true;
            Utils.openModal(modal);
        });

        $('#deleteAccountModalClose')?.addEventListener('click', closeModal);
        $('#deleteAccountModalCancel')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        confirmInput.addEventListener('input', refreshConfirmState);
        passwordInput.addEventListener('input', refreshConfirmState);

        confirmBtn.addEventListener('click', async () => {
            if (confirmInput.value.trim() !== expectedUsername) return;

            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Deleting...';

            try {
                // Reauthenticate first — Firebase requires a "recent" login
                // before it will allow deleting the account.
                const provider = AuthService.getSignInProvider();
                if (provider === 'password') {
                    await AuthService.reauthenticateWithPassword(passwordInput.value);
                } else if (provider === 'google.com') {
                    await AuthService.reauthenticateWithGoogle();
                }

                // Delete all Firestore data first (while still authenticated),
                // then the Auth account itself (this ends the session).
                await DataService.deleteAccountData();
                await AuthService.deleteAuthAccount();

                Utils.toast('Account deleted', 'success');
                setTimeout(() => { window.location.href = '/'; }, 800);
            } catch (err) {
                Utils.toast(AuthService.getErrorMessage(err), 'error');
                confirmBtn.textContent = 'Delete My Account';
                refreshConfirmState();
            }
        });
    }
})();

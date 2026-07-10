/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Certificates
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $ } = Dashboard;

    Dashboard.loadCertificates = async function () {
        const certs = await DataService.getCertificates();
        const list = $('#certList');
        const limitNotice = $('#certsLimit');
        const addForm = $('#certsAddForm');

        if (certs.length >= 10) {
            limitNotice.style.display = 'block';
            addForm.style.display = 'none';
        } else {
            limitNotice.style.display = 'none';
            addForm.style.display = 'flex';
        }

        if (certs.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div style="font-size:40px;opacity:0.4">🏅</div>
                    <div class="empty-state__text">No certificates added yet.</div>
                </div>
            `;
            setTimeout(() => $('#certName')?.focus(), 200);
            return;
        }

        list.innerHTML = certs.map(c => `
            <div class="cert-row" data-cert-id="${c.id}">
                <div class="cert-row__thumb">
                    <img src="${Utils.escapeHTML(c.imageUrl)}" alt="${Utils.escapeHTML(c.name)}" loading="lazy" />
                </div>
                <div class="cert-row__info">
                    <div class="cert-row__name">${Utils.escapeHTML(c.name)}</div>
                    <div class="cert-row__meta">
                        ${c.organization ? `<span>${Utils.escapeHTML(c.organization)}</span>` : ''}
                        ${c.date ? `<span>· ${Utils.escapeHTML(Utils.formatDate ? Utils.formatDate(c.date) : c.date)}</span>` : ''}
                    </div>
                </div>
                <div class="cert-row__actions">
                    <a href="${Utils.escapeHTML(c.imageUrl)}" target="_blank" rel="noopener" class="btn btn--secondary btn--small">View</a>
                    <button class="btn btn--danger btn--small" data-delete-cert="${c.id}">Delete</button>
                </div>
            </div>
        `).join('');

        Dashboard.attachInlineDelete({
            listEl: list,
            selector: 'delete-cert',
            rowClass: 'cert-row',
            deleteService: DataService.deleteCertificate.bind(DataService),
            reloadFn: Dashboard.loadCertificates,
            toastLabel: 'Certificate',
        });
    };

    Dashboard.initCertificates = function () {
        $('#addCertBtn')?.addEventListener('click', async () => {
            const name  = $('#certName').value.trim();
            const organization = $('#certOrg')?.value.trim() || '';
            const date  = $('#certDate')?.value || '';
            const file  = $('#certImage')?.files[0];

            const errors = ValidationUtils.validateCertificate({ name, organization, date });
            if (errors.length) { Utils.toast(errors[0], 'error'); return; }
            if (!file) { Utils.toast('Please select a certificate image', 'error'); return; }

            const btn = $('#addCertBtn');
            btn.textContent = 'Uploading...';
            btn.disabled = true;

            try {
                const user    = await DataService.getUser();
                const certId  = `cert_${Date.now()}`;
                const imageUrl = await uploadCertificateImage(file, user.uid, certId);
                await DataService.addCertificate({ name, organization, date, imageUrl });
                $('#certName').value = '';
                $('#certOrg').value = '';
                $('#certDate').value = '';
                $('#certImage').value = '';
                await Dashboard.loadCertificates();
                Utils.toast('Certificate added', 'success');
            } catch (err) {
                Utils.toast(err.message || 'Something went wrong', 'error');
            } finally {
                btn.textContent = 'Add';
                btn.disabled = false;
            }
        });
    };
})();

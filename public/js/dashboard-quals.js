/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Qualifications
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $ } = Dashboard;

    Dashboard.loadQualifications = async function () {
        const quals = await DataService.getQualifications();
        const list = $('#qualList');
        const limitNotice = $('#qualsLimit');
        const addForm = $('#qualsAddForm');

        if (quals.length >= 10) {
            limitNotice.style.display = 'block';
            addForm.style.display = 'none';
        } else {
            limitNotice.style.display = 'none';
            addForm.style.display = '';
        }

        if (quals.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div style="font-size:40px;opacity:0.4">📚</div>
                    <div class="empty-state__text">No qualifications added yet.</div>
                </div>
            `;
            setTimeout(() => $('#qualDegree')?.focus(), 200);
            return;
        }

        list.innerHTML = quals.map(q => `
            <div class="qual-row" data-qual-id="${q.id}">
                <div class="qual-row__icon">🎓</div>
                <div class="qual-row__info">
                    <div class="qual-row__degree">${Utils.escapeHTML(q.degree)}</div>
                    <div class="qual-row__institution">${Utils.escapeHTML(q.institution)}</div>
                    <div class="qual-row__meta">
                        ${q.year ? `<span>${Utils.escapeHTML(q.year)}</span>` : ''}
                        ${q.grade ? `<span>· ${Utils.escapeHTML(q.grade)}</span>` : ''}
                    </div>
                </div>
                <div class="qual-row__actions">
                    <button class="btn btn--danger btn--small" data-delete-qual="${q.id}">Delete</button>
                </div>
            </div>
        `).join('');

        Dashboard.attachInlineDelete({
            listEl: list,
            selector: 'delete-qual',
            rowClass: 'qual-row',
            deleteService: DataService.deleteQualification.bind(DataService),
            reloadFn: Dashboard.loadQualifications,
            toastLabel: 'Qualification',
        });
    };

    Dashboard.initQualifications = function () {
        $('#addQualBtn')?.addEventListener('click', async () => {
            const degree = $('#qualDegree').value.trim();
            const institution = $('#qualInstitution').value.trim();
            const year = $('#qualYear').value.trim();
            const grade = $('#qualGrade').value.trim();

            if (!degree || !institution) {
                Utils.toast('Please fill degree and institution', 'error');
                return;
            }

            try {
                await DataService.addQualification({ degree, institution, year, grade });
                $('#qualDegree').value = '';
                $('#qualInstitution').value = '';
                $('#qualYear').value = '';
                $('#qualGrade').value = '';
                await Dashboard.loadQualifications();
                Utils.toast('Qualification added', 'success');
            } catch (err) {
                Utils.toast(err.message || 'Something went wrong', 'error');
            }
        });
    };
})();

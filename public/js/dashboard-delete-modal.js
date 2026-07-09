/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Delete Modal
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $, state } = Dashboard;

    function closeDeleteModal() {
        Utils.closeModal($('#deleteModal'));
        state.deletingId = null;
        state.deletingType = null;
    }

    Dashboard.confirmDelete = function (type, id) {
        state.deletingType = type;
        state.deletingId = id;
        $('#deleteModalMsg').textContent = `Are you sure you want to delete this ${type}? This can't be undone.`;
        Utils.openModal($('#deleteModal'));
    };

    Dashboard.initDeleteModal = function () {
        $('#deleteModalClose')?.addEventListener('click', closeDeleteModal);
        $('#deleteModalCancel')?.addEventListener('click', closeDeleteModal);
        $('#deleteModal')?.addEventListener('click', (e) => {
            if (e.target === $('#deleteModal')) closeDeleteModal();
        });

        $('#deleteModalConfirm')?.addEventListener('click', async () => {
            if (!state.deletingId) return;
            try {
                if (state.deletingType === 'project') {
                    await DataService.deleteProject(state.deletingId);
                    await Dashboard.loadProjects();
                    Utils.toast('Project deleted', 'success');
                }
            } catch (err) {
                Utils.toast('Something went wrong', 'error');
            }
            closeDeleteModal();
        });
    };
})();

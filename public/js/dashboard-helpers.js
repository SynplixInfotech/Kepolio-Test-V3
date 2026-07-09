/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Helpers
   ═══════════════════════════════════════════════════ */

window.Dashboard = window.Dashboard || {};

Dashboard.$ = (sel) => document.querySelector(sel);
Dashboard.$$ = (sel) => document.querySelectorAll(sel);

Dashboard.state = {
    currentSection: 'overview',
    editingProjectId: null,
    deletingId: null,
    deletingType: null,
    modalTags: [],
};

Dashboard.attachInlineDelete = function ({ listEl, selector, rowClass, deleteService, reloadFn, toastLabel }) {
    listEl.querySelectorAll(`[data-${selector}]`).forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest(`.${rowClass}`);
            const camelKey = selector.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            const id = btn.dataset[camelKey];

            if (row.classList.contains(`${rowClass}--confirm`)) {
                row.classList.add(`${rowClass}--deleting`);
                setTimeout(async () => {
                    await deleteService(id);
                    await reloadFn();
                    Utils.toast(`${toastLabel} removed`, 'success');
                }, 300);
            } else {
                row.classList.add(`${rowClass}--confirm`);
                const actions = row.querySelector(`.${rowClass}__actions`);
                actions.innerHTML = `
                    <span style="color:var(--danger);font-size:13px;margin-right:8px">Are you sure?</span>
                    <button class="btn btn--secondary btn--small ${rowClass}-cancel">No</button>
                    <button class="btn btn--danger btn--small ${rowClass}-confirm" data-${selector}="${id}">Yes</button>
                `;
                actions.querySelector(`.${rowClass}-cancel`).addEventListener('click', () => reloadFn());
                actions.querySelector(`.${rowClass}-confirm`).addEventListener('click', async () => {
                    row.classList.add(`${rowClass}--deleting`);
                    setTimeout(async () => {
                        await deleteService(id);
                        await reloadFn();
                        Utils.toast(`${toastLabel} removed`, 'success');
                    }, 300);
                });
            }
        });
    });
};

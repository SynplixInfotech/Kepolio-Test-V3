/* ═══════════════════════════════════════════════════
   KePolio — Dashboard Projects
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const { $, state } = Dashboard;

    function clearProjectImgPreview() {
        $('#projImgInput').value = '';
        $('#projImgPreviewImg').src = '';
        $('#projImgPreview').style.display = 'none';
        $('#projImgZone').style.display = '';
    }

    function setProjectImgPreview(url) {
        $('#projImgPreviewImg').src = url;
        $('#projImgPreview').style.display = 'block';
        $('#projImgZone').style.display = 'none';
    }

    function renderTags() {
        const container = $('#tagInput');
        const field = $('#tagField');
        container.querySelectorAll('.tag').forEach(t => t.remove());

        state.modalTags.forEach((tag, i) => {
            const el = document.createElement('span');
            el.className = 'tag';
            el.innerHTML = `${Utils.escapeHTML(tag)} <span class="tag__remove" data-tag-idx="${i}">×</span>`;
            container.insertBefore(el, field);
        });

        container.querySelectorAll('.tag__remove').forEach(btn => {
            btn.addEventListener('click', () => {
                state.modalTags.splice(parseInt(btn.dataset.tagIdx), 1);
                renderTags();
            });
        });
    }

    Dashboard.openAddProject = function () {
        state.editingProjectId = null;
        state.modalTags = [];
        $('#projectModalTitle').textContent = 'Add Project';
        $('#projName').value = '';
        $('#projDesc').value = '';
        $('#projUrl').value = '';
        $('#projHasLink').value = '';
        $('#projLinkFields').style.display = 'none';
        $('#projNoLinkMsg').style.display = 'none';
        $('#projTutorialVideo').src = '';
        $('#projDescCount').textContent = '0';
        clearProjectImgPreview();
        renderTags();
        Utils.openModal($('#projectModal'));
    };

    Dashboard.openEditProject = async function (id) {
        const projects = await DataService.getProjects();
        const proj = projects.find(p => p.id === id);
        if (!proj) return;

        state.editingProjectId = id;
        state.modalTags = [...(proj.techStack || [])];
        $('#projectModalTitle').textContent = 'Edit Project';
        $('#projName').value = proj.name;
        $('#projDesc').value = proj.description;
        $('#projUrl').value = proj.liveUrl;
        if (proj.liveUrl) {
            $('#projHasLink').value = 'yes';
            $('#projLinkFields').style.display = 'block';
            $('#projNoLinkMsg').style.display = 'none';
        } else {
            $('#projHasLink').value = 'no';
            $('#projLinkFields').style.display = 'none';
            $('#projNoLinkMsg').style.display = 'block';
            $('#projTutorialVideo').src = 'https://www.youtube.com/embed/oIsf9zE-TRI?si=j-3TiAmlTNU9frxP';
        }
        $('#projDescCount').textContent = proj.description.length;
        clearProjectImgPreview();
        if (proj.previewUrl) setProjectImgPreview(proj.previewUrl);
        renderTags();
        Utils.openModal($('#projectModal'));
    };

    function closeProjectModal() {
        Utils.closeModal($('#projectModal'));
        state.editingProjectId = null;
        state.modalTags = [];
        $('#projTutorialVideo').src = '';
        clearProjectImgPreview();
    }

    async function saveProject() {
        const name = $('#projName').value.trim();
        const description = $('#projDesc').value.trim();
        const hasLink = $('#projHasLink').value;
        const liveUrl = $('#projUrl').value.trim();

        if (!name || !description) {
            Utils.toast('Please fill project name and description', 'error');
            return;
        }

        if (!hasLink) {
            Utils.toast('Please select whether you have a project link', 'error');
            return;
        }

        const saveBtn = $('#projectModalSave');
        saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
        saveBtn.disabled = true;

        try {
            const user = await DataService.getUser();
            const projectId = state.editingProjectId || `proj_${Date.now()}`;

            let previewUrl = '';
            if (state.editingProjectId) {
                const existing = (await DataService.getProjects()).find(p => p.id === state.editingProjectId);
                previewUrl = existing?.previewUrl || '';
            }
            const imgFile = $('#projImgInput')?.files[0];
            if (imgFile) {
                previewUrl = await uploadProjectPreview(imgFile, user.uid, projectId);
            }

            if (state.editingProjectId) {
                await DataService.updateProject(state.editingProjectId, { name, description, liveUrl, techStack: state.modalTags, previewUrl });
            } else {
                await DataService.addProject({ name, description, liveUrl, techStack: state.modalTags, previewUrl });
            }
            const wasEditing = !!state.editingProjectId;
            closeProjectModal();
            await Dashboard.loadProjects();
            Utils.toast(wasEditing ? 'Project updated' : 'Project added', 'success');
        } catch (err) {
            Utils.toast(err.message || 'Something went wrong', 'error');
        } finally {
            saveBtn.innerHTML = 'Save Project';
            saveBtn.disabled = false;
        }
    }

    Dashboard.loadProjects = async function () {
        const projects = await DataService.getProjects();
        const grid = $('#projectsGrid');

        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <div class="empty-state__text">No projects yet. Add your first one.</div>
                    <button class="btn btn--primary btn--small" id="emptyAddProject">+ Add Project</button>
                </div>
            `;
            grid.querySelector('#emptyAddProject')?.addEventListener('click', Dashboard.openAddProject);
            return;
        }

        grid.innerHTML = projects.map(p => `
            <div class="project-card" data-id="${p.id}">
                ${p.previewUrl ? `<div class="project-card__preview"><img src="${Utils.escapeHTML(p.previewUrl)}" alt="${Utils.escapeHTML(p.name)}" loading="lazy" /></div>` : ''}
                <div class="project-card__name">${Utils.escapeHTML(p.name)}</div>
                <div class="project-card__desc">${Utils.escapeHTML(p.description)}</div>
                <div class="project-card__tags">
                    ${(p.techStack || []).map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
                </div>
                <div class="project-card__actions">
                    ${p.liveUrl ? `<a href="${Utils.escapeHTML(p.liveUrl)}" target="_blank" rel="noopener">🔗 View Live</a>` : '<span style="color:var(--text-muted);font-size:13px">No link added</span>'}
                    <span style="flex:1"></span>
                    <button class="btn--icon" data-edit="${p.id}" title="Edit">✏️</button>
                    <button class="btn--icon" data-delete-project="${p.id}" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');

        Utils.staggerReveal('.project-card', 80);

        grid.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => Dashboard.openEditProject(btn.dataset.edit));
        });
        grid.querySelectorAll('[data-delete-project]').forEach(btn => {
            btn.addEventListener('click', () => Dashboard.confirmDelete('project', btn.dataset.deleteProject));
        });
    };

    Dashboard.initProjectModal = function () {
        $('#addProjectBtn')?.addEventListener('click', Dashboard.openAddProject);
        $('#projectModalClose')?.addEventListener('click', closeProjectModal);
        $('#projectModalCancel')?.addEventListener('click', closeProjectModal);
        $('#projectModal')?.addEventListener('click', (e) => {
            if (e.target === $('#projectModal')) closeProjectModal();
        });

        const tagField = $('#tagField');
        tagField?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = tagField.value.trim();
                if (val && !state.modalTags.includes(val)) {
                    state.modalTags.push(val);
                    renderTags();
                }
                tagField.value = '';
            }
        });

        $('#projDesc')?.addEventListener('input', (e) => {
            $('#projDescCount').textContent = e.target.value.length;
        });

        $('#projectModalSave')?.addEventListener('click', saveProject);

        $('#projHasLink')?.addEventListener('change', (e) => {
            const val = e.target.value;
            $('#projLinkFields').style.display = val === 'yes' ? 'block' : 'none';
            $('#projNoLinkMsg').style.display = val === 'no' ? 'block' : 'none';
            if (val === 'no') {
                $('#projUrl').value = '';
                $('#projTutorialVideo').src = 'https://www.youtube.com/embed/oIsf9zE-TRI?si=j-3TiAmlTNU9frxP';
            } else {
                $('#projTutorialVideo').src = '';
            }
        });

        $('#projImgInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setProjectImgPreview(URL.createObjectURL(file));
        });
        $('#projImgRemove')?.addEventListener('click', (e) => {
            e.stopPropagation();
            clearProjectImgPreview();
        });
    };
})();

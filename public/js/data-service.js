/* ═══════════════════════════════════════════════════
   KePolio — Data Service (Firebase Firestore)
   All CRUD operations against Firestore.
   Requires firebase-config.js to be loaded first.
   ═══════════════════════════════════════════════════ */

const DataService = (() => {
    'use strict';

    const db = FirebaseConfig.db;
    const auth = FirebaseConfig.auth;

    // ── Helpers ──
    function _uid() {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        return user.uid;
    }

    function _userRef() {
        return db.collection('users').doc(_uid());
    }

    function _usernameRef(username) {
        return db.collection('usernames').doc(username);
    }

    function _caseCodeRef(code) {
        return db.collection('caseCodes').doc(code);
    }

    function _generateId() {
        return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function _generateCaseCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return 'KEP-' + code;
    }

    // ── Session Cache ──
    // Invalidated on every mutation; scoped to the current browser session.
    const _cache = Object.create(null);
    function _cacheGet(key) { return Object.prototype.hasOwnProperty.call(_cache, key) ? _cache[key] : null; }
    function _cacheSet(key, data) { _cache[key] = data; }
    function _cacheInvalidate(...keys) { keys.forEach(k => { delete _cache[k]; }); }

    // ═══════════════════════════════════════
    //  USER / PROFILE
    // ═══════════════════════════════════════

    /**
     * Get the current user's profile from Firestore.
     * @returns {Promise<Object|null>} user document data
     */
    async function getUser() {
        const cached = _cacheGet('user');
        if (cached) return cached;
        const snap = await _userRef().get();
        if (!snap.exists) return null;
        const data = { uid: snap.id, ...snap.data() };
        _cacheSet('user', data);
        return data;
    }

    /**
     * Create a new user document after sign-up.
     * Also registers the username and CASE code in lookup collections.
     * @param {Object} userData — initial profile fields
     * @returns {Promise<Object>} created user
     */
    async function createUser(userData) {
        const uid = _uid();
        const username = ValidationUtils.normalizeUsername(userData.username || uid.slice(0, 10));
        if (!ValidationUtils.isValidUsername(username)) {
            throw new Error('Username must be 3-20 characters: lowercase letters, numbers, underscores only.');
        }

        let createdUser = null;
        await db.runTransaction(async (tx) => {
            const userRef = db.collection('users').doc(uid);
            const usernameRef = _usernameRef(username);

            const [userSnap, usernameSnap] = await Promise.all([
                tx.get(userRef),
                tx.get(usernameRef),
            ]);

            if (userSnap.exists) {
                throw new Error('Profile already exists for this account.');
            }
            if (usernameSnap.exists) {
                throw new Error('Username is already taken. Try another one.');
            }

            let caseCode = null;
            for (let attempt = 0; attempt < 5; attempt += 1) {
                const candidate = _generateCaseCode();
                const codeRef = _caseCodeRef(candidate);
                const codeSnap = await tx.get(codeRef);
                if (!codeSnap.exists) {
                    caseCode = candidate;
                    tx.set(codeRef, { uid });
                    break;
                }
            }

            if (!caseCode) {
                throw new Error('Could not reserve a unique KEP code. Please try again.');
            }

            const user = {
                fullName: userData.fullName || '',
                username,
                bio: '',
                role: '',
                photoURL: userData.photoURL || null,
                socialLinks: { github: '', linkedin: '', portfolio: '', twitter: '', instagram: '', youtube: '', leetcode: '', hackerrank: '', whatsapp: '', telegram: '' },
                caseCode,
                stats: { profileViews: 0 },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };

            tx.set(userRef, user);
            tx.set(usernameRef, { uid });
            createdUser = { uid, ...user };
        });

        _cacheInvalidate('user');
        return createdUser;
    }

    /**
     * Update the current user's profile.
     * Handles username changes by updating the usernames collection.
     * @param {Object} updates — partial user fields to merge
     * @returns {Promise<Object>} updated user
     */
    async function updateUser(updates) {
        const uid = _uid();
        const ref = _userRef();
        const normalizedUpdates = { ...updates };

        if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'username')) {
            normalizedUpdates.username = ValidationUtils.normalizeUsername(normalizedUpdates.username);
            if (!ValidationUtils.isValidUsername(normalizedUpdates.username)) {
                throw new Error('Username must be 3-20 characters: lowercase letters, numbers, underscores only.');
            }
        }

        if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'socialLinks')) {
            normalizedUpdates.socialLinks = ValidationUtils.normalizeSocialLinks(normalizedUpdates.socialLinks || {});
        }

        // If username is changing, update the usernames collection
        if (normalizedUpdates.username) {
            await db.runTransaction(async (tx) => {
                const userSnap = await tx.get(ref);
                if (!userSnap.exists) {
                    throw new Error('Profile not found.');
                }

                const oldUsername = userSnap.data()?.username;
                if (oldUsername && oldUsername !== normalizedUpdates.username) {
                    const nextUsernameRef = _usernameRef(normalizedUpdates.username);
                    const nextUsernameSnap = await tx.get(nextUsernameRef);
                    if (nextUsernameSnap.exists && nextUsernameSnap.data()?.uid !== uid) {
                        throw new Error('Username is already taken. Try another one.');
                    }

                    tx.delete(_usernameRef(oldUsername));
                    tx.set(nextUsernameRef, { uid });
                }

                tx.update(ref, {
                    ...normalizedUpdates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            });
            _cacheInvalidate('user');
            return { uid, ...normalizedUpdates };
        }

        await ref.update({
            ...normalizedUpdates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        _cacheInvalidate('user');
        return { uid, ...normalizedUpdates };
    }

    /**
     * Compute profile completion percentage.
     * @returns {Promise<Object>} { percent, missing }
     */
    async function getProfileCompletion() {
        const [user, projects, certs] = await Promise.all([getUser(), getProjects(), getCertificates()]);

        if (!user) return { percent: 0, missing: {} };

        const checks = [
            !!user.fullName,
            !!user.username,
            !!user.bio,
            !!user.role,
            !!user.photoURL,
            !!user.socialLinks?.github || !!user.socialLinks?.linkedin,
            projects.length > 0,
            certs.length > 0,
        ];
        const done = checks.filter(Boolean).length;
        return {
            percent: Math.round((done / checks.length) * 100),
            missing: {
                photo: !user.photoURL,
                bio: !user.bio,
                project: projects.length === 0,
                certificate: certs.length === 0,
                social: !user.socialLinks?.github && !user.socialLinks?.linkedin,
            },
        };
    }

    /**
     * Check if a username is available.
     * @param {string} username
     * @returns {Promise<Object>} { available: boolean }
     */
    async function checkUsername(username) {
        const normalized = ValidationUtils.normalizeUsername(username);
        if (!ValidationUtils.isValidUsername(normalized)) {
            return { available: false, reason: 'Invalid format (3-20 lowercase letters, numbers, underscores)' };
        }

        // If user is logged in, allow them to keep their own username
        try {
            const user = await getUser();
            if (user && user.username === normalized) return { available: true };
        } catch (_) {
            // Not authenticated — that's fine for signup, continue checking
        }

        const snap = await _usernameRef(normalized).get();
        return { available: !snap.exists };
    }

    /**
     * Increment profile views (called when someone views a public profile).
     * Uses Firestore increment for atomicity.
     * @param {string} uid — the profile owner's uid
     */
    async function incrementViews(uid) {
        await db.collection('users').doc(uid).update({
            'stats.profileViews': firebase.firestore.FieldValue.increment(1),
        });
    }

    const VIEW_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Decide whether this browser should count as a new view of `uid`'s
     * profile. Dedupes per-visitor (localStorage) for 24h so repeat/refresh
     * views from the same visitor don't inflate the counter; after the
     * window elapses the next view counts again.
     *
     * Note: this is a client-side (per-browser) dedupe, not a true
     * server-verified per-IP check — the app has no backend to read the
     * real client IP from. It's easily bypassed by a different browser,
     * incognito mode, or clearing storage, but covers normal repeat visits.
     * @param {string} uid
     * @returns {boolean}
     */
    function _shouldCountView(uid) {
        try {
            const key = `kp_view_${uid}`;
            const last = window.localStorage.getItem(key);
            const now = Date.now();
            if (last && (now - parseInt(last, 10)) < VIEW_DEDUPE_WINDOW_MS) {
                return false;
            }
            window.localStorage.setItem(key, String(now));
            return true;
        } catch (_) {
            // localStorage unavailable (private mode, disabled, etc.) —
            // fall back to always counting rather than losing the view.
            return true;
        }
    }

    // ═══════════════════════════════════════
    //  PROJECTS (subcollection)
    // ═══════════════════════════════════════

    /**
     * Get all projects for the current user.
     * @returns {Promise<Array>}
     */
    async function getProjects() {
        const cached = _cacheGet('projects');
        if (cached) return cached;
        const snap = await _userRef()
            .collection('projects')
            .orderBy('createdAt', 'desc')
            .get();
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        _cacheSet('projects', data);
        return data;
    }

    /**
     * Add a new project.
     * @param {Object} project — { name, description, liveUrl, techStack }
     * @returns {Promise<Object>} created project with id
     */
    async function addProject(project) {
        const id = _generateId();
        const data = {
            name: project.name || '',
            description: project.description || '',
            liveUrl: ValidationUtils.normalizeExternalUrl(project.liveUrl || '', { errorMessage: 'Project link must be a valid HTTPS URL.' }),
            techStack: project.techStack || [],
            previewUrl: project.previewUrl || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await _userRef().collection('projects').doc(id).set(data);
        _cacheInvalidate('projects');
        return { id, ...data };
    }

    /**
     * Update an existing project.
     * @param {string} id — project document id
     * @param {Object} updates — fields to merge
     * @returns {Promise<Object>}
     */
    async function updateProject(id, updates) {
        const ref = _userRef().collection('projects').doc(id);
        const normalizedUpdates = { ...updates };
        if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'liveUrl')) {
            normalizedUpdates.liveUrl = ValidationUtils.normalizeExternalUrl(normalizedUpdates.liveUrl || '', { errorMessage: 'Project link must be a valid HTTPS URL.' });
        }
        await ref.update({
            ...normalizedUpdates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        _cacheInvalidate('projects');
        return { id, ...normalizedUpdates };
    }

    /**
     * Delete a project.
     * @param {string} id
     */
    async function deleteProject(id) {
        await _userRef().collection('projects').doc(id).delete();
        _cacheInvalidate('projects');
    }

    // ═══════════════════════════════════════
    //  CERTIFICATES (subcollection)
    // ═══════════════════════════════════════

    /**
     * Get all certificates for the current user.
     * @returns {Promise<Array>}
     */
    async function getCertificates() {
        const cached = _cacheGet('certificates');
        if (cached) return cached;
        const snap = await _userRef()
            .collection('certificates')
            .orderBy('createdAt', 'desc')
            .get();
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        _cacheSet('certificates', data);
        return data;
    }

    /**
     * Add a new certificate.
     * @param {Object} cert — { name, organization, date, imageUrl }
     * @returns {Promise<Object>}
     */
    async function addCertificate(cert) {
        const certs = await getCertificates();
        if (certs.length >= 10) throw new Error('Maximum 10 certificates. Remove one to add more.');

        const id = _generateId();
        const data = {
            name: cert.name || '',
            organization: cert.organization || '',
            date: cert.date || '',
            imageUrl: cert.imageUrl || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await _userRef().collection('certificates').doc(id).set(data);
        _cacheInvalidate('certificates');
        return { id, ...data };
    }

    /**
     * Delete a certificate.
     * @param {string} id
     */
    async function deleteCertificate(id) {
        await _userRef().collection('certificates').doc(id).delete();
        _cacheInvalidate('certificates');
    }

    // ═══════════════════════════════════════
    //  QUALIFICATIONS (subcollection)
    // ═══════════════════════════════════════

    /**
     * Get all qualifications for the current user.
     * @returns {Promise<Array>}
     */
    async function getQualifications() {
        const cached = _cacheGet('qualifications');
        if (cached) return cached;
        const snap = await _userRef()
            .collection('qualifications')
            .orderBy('createdAt', 'desc')
            .get();
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        _cacheSet('qualifications', data);
        return data;
    }

    /**
     * Add a new qualification.
     * @param {Object} qual — { degree, institution, year, grade }
     * @returns {Promise<Object>} created qualification with id
     */
    async function addQualification(qual) {
        const quals = await getQualifications();
        if (quals.length >= 10) throw new Error('Maximum 10 qualifications. Remove one to add more.');

        const id = _generateId();
        const data = {
            degree: qual.degree || '',
            institution: qual.institution || '',
            year: qual.year || '',
            grade: qual.grade || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await _userRef().collection('qualifications').doc(id).set(data);
        _cacheInvalidate('qualifications');
        return { id, ...data };
    }

    /**
     * Update an existing qualification.
     * @param {string} id — qualification document id
     * @param {Object} updates — fields to merge
     * @returns {Promise<Object>}
     */
    async function updateQualification(id, updates) {
        const ref = _userRef().collection('qualifications').doc(id);
        await ref.update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        _cacheInvalidate('qualifications');
        return { id, ...updates };
    }

    /**
     * Delete a qualification.
     * @param {string} id
     */
    async function deleteQualification(id) {
        await _userRef().collection('qualifications').doc(id).delete();
        _cacheInvalidate('qualifications');
    }

    // ═══════════════════════════════════════
    //  EXPERIENCES (subcollection)
    // ═══════════════════════════════════════

    /**
     * Get all experiences for the current user.
     * @returns {Promise<Array>}
     */
    async function getExperiences() {
        const cached = _cacheGet('experiences');
        if (cached) return cached;
        const snap = await _userRef()
            .collection('experiences')
            .orderBy('createdAt', 'desc')
            .get();
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        _cacheSet('experiences', data);
        return data;
    }

    /**
     * Add a new experience.
     * @param {Object} exp — { title, company, duration, description }
     * @returns {Promise<Object>} created experience with id
     */
    async function addExperience(exp) {
        const exps = await getExperiences();
        if (exps.length >= 10) throw new Error('Maximum 10 experiences. Remove one to add more.');

        const id = _generateId();
        const data = {
            title: exp.title || '',
            company: exp.company || '',
            duration: exp.duration || '',
            description: exp.description || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await _userRef().collection('experiences').doc(id).set(data);
        _cacheInvalidate('experiences');
        return { id, ...data };
    }

    /**
     * Update an existing experience.
     * @param {string} id — experience document id
     * @param {Object} updates — fields to merge
     * @returns {Promise<Object>}
     */
    async function updateExperience(id, updates) {
        const ref = _userRef().collection('experiences').doc(id);
        await ref.update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        _cacheInvalidate('experiences');
        return { id, ...updates };
    }

    /**
     * Delete an experience.
     * @param {string} id
     */
    async function deleteExperience(id) {
        await _userRef().collection('experiences').doc(id).delete();
        _cacheInvalidate('experiences');
    }

    // ═══════════════════════════════════════
    //  CASE CODE / PUBLIC PROFILE LOOKUP
    // ═══════════════════════════════════════

    /**
     * Lookup a user by CASE code or username.
     * @param {string} query — CASE code (e.g., "CASE-ABC12") or username
     * @returns {Promise<Object>} { found, username, user }
     */
    async function lookupProfile(query) {
        const code = query.toUpperCase().replace(/\s/g, '');
        let uid = null;

        // Try CASE code lookup first
        const codeSnap = await db.collection('caseCodes').doc(code).get();
        if (codeSnap.exists) {
            uid = codeSnap.data().uid;
        }

        // If not found by code, try username
        if (!uid) {
            const usernameSnap = await db.collection('usernames').doc(query.toLowerCase()).get();
            if (usernameSnap.exists) {
                uid = usernameSnap.data().uid;
            }
        }

        if (!uid) return { found: false };

        // Fetch user profile
        const userSnap = await db.collection('users').doc(uid).get();
        if (!userSnap.exists) return { found: false };

        const user = { uid: userSnap.id, ...userSnap.data() };
        return {
            found: true,
            username: user.username,
            user,
        };
    }

    /**
     * Get a full public profile by username (includes projects & certs).
     * Called when viewing /profile?u=username
     * @param {string} username
     * @returns {Promise<Object>} { found, user, projects, certificates }
     */
    async function getPublicProfile(username) {
        // Resolve uid — try username first, then fall back to CASE code lookup
        let uid = null;

        const usernameSnap = await db.collection('usernames').doc(username.toLowerCase()).get();
        if (usernameSnap.exists) {
            uid = usernameSnap.data().uid;
        }

        // Fall back to CASE code (e.g. ?u=CASE-AB3XY shared directly)
        if (!uid) {
            const code = username.toUpperCase().replace(/\s/g, '');
            const codeSnap = await db.collection('caseCodes').doc(code).get();
            if (codeSnap.exists) {
                uid = codeSnap.data().uid;
            }
        }

        if (!uid) return { found: false };

        const userSnap = await db.collection('users').doc(uid).get();
        if (!userSnap.exists) return { found: false };

        // Increment view count (fire-and-forget — never block profile load),
        // deduped per-visitor for 24h so refreshes/repeat visits don't inflate it.
        if (_shouldCountView(uid)) {
            incrementViews(uid).catch(() => {});
        }

        // Fetch projects, certificates, qualifications & experiences in parallel
        const [projSnap, certSnap, qualSnap, expSnap] = await Promise.all([
            db.collection('users').doc(uid).collection('projects').orderBy('createdAt', 'desc').get(),
            db.collection('users').doc(uid).collection('certificates').orderBy('createdAt', 'desc').get(),
            db.collection('users').doc(uid).collection('qualifications').orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
            db.collection('users').doc(uid).collection('experiences').orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
        ]);

        const user = { uid, ...userSnap.data() };
        const projects = projSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const certificates = certSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const qualifications = qualSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const experiences = expSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return { found: true, user, projects, certificates, qualifications, experiences };
    }

    // ═══════════════════════════════════════
    //  PUBLIC API
    // ═══════════════════════════════════════

    return {
        getUser,
        createUser,
        updateUser,
        getProfileCompletion,
        checkUsername,
        incrementViews,
        getProjects,
        addProject,
        updateProject,
        deleteProject,
        getCertificates,
        addCertificate,
        deleteCertificate,
        getQualifications,
        addQualification,
        updateQualification,
        deleteQualification,
        getExperiences,
        addExperience,
        updateExperience,
        deleteExperience,
        lookupProfile,
        getPublicProfile,
    };
})();

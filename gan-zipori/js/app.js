// ===== Main Application Controller =====
const App = {
    tree: null,
    navStack: [],
    currentFolderId: null,

    init() {
        TTS.preload();
        TTS.init();
        this.tree = Storage.getOrInitTree();
        this.bindGlobalEvents();
        this.handleRoute();
        window.addEventListener('hashchange', () => this.handleRoute());
    },

    bindGlobalEvents() {
        // Back button
        document.getElementById('btn-back').addEventListener('click', () => {
            TTS.speak('חזרה');
            this.goBack();
        });

        // Home button
        document.getElementById('btn-home').addEventListener('click', () => {
            TTS.speak('דף הבית');
            this.goHome();
        });

        // Sound toggle
        document.getElementById('btn-sound').addEventListener('click', () => {
            TTS.toggle();
        });

        // Editor button
        document.getElementById('btn-editor').addEventListener('click', () => {
            Editor.open();
        });

        // Password modal
        document.getElementById('btn-password-ok').addEventListener('click', () => {
            Editor.checkPassword();
        });
        document.getElementById('btn-password-cancel').addEventListener('click', () => {
            document.getElementById('password-overlay').classList.add('hidden');
        });
        document.getElementById('password-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') Editor.checkPassword();
        });
    },

    handleRoute() {
        const hash = window.location.hash.slice(1);
        this.tree = Storage.getOrInitTree();

        if (!hash || hash === '/') {
            this.showHome();
        } else if (hash.startsWith('/folder/')) {
            const folderId = hash.replace('/folder/', '');
            this.showFolder(folderId);
        } else if (hash.startsWith('/coloring/')) {
            const folderId = hash.replace('/coloring/', '');
            this.currentFolderId = folderId;
            this.showNav();
            Coloring.show(folderId);
        } else if (hash.startsWith('/puzzle/')) {
            const folderId = hash.replace('/puzzle/', '');
            this.currentFolderId = folderId;
            this.showNav();
            Puzzle.show(folderId);
        } else if (hash.startsWith('/tracing/')) {
            const type = hash.replace('/tracing/', '');
            this.showNav();
            Tracing.show(type);
        } else {
            this.showHome();
        }
    },

    showHome() {
        this.navStack = [];
        this.currentFolderId = null;
        window.location.hash = '/';
        this.hideNav();
        SeasonalEffects.stop();
        Dashboard.renderHome(this.tree);
        document.body.classList.remove('has-breadcrumb');
    },

    showFolder(folderId) {
        const folder = Storage.findFolderById(this.tree, folderId);
        if (!folder) { this.showHome(); return; }

        // Update nav stack
        if (this.currentFolderId !== folderId) {
            if (this.currentFolderId) {
                // Check if going back or forward
                const stackIdx = this.navStack.indexOf(folderId);
                if (stackIdx >= 0) {
                    this.navStack = this.navStack.slice(0, stackIdx);
                } else if (this.currentFolderId) {
                    this.navStack.push(this.currentFolderId);
                }
            }
        }
        this.currentFolderId = folderId;

        if (window.location.hash !== `#/folder/${folderId}`) {
            window.location.hash = `/folder/${folderId}`;
            return; // hashchange will re-trigger
        }

        this.showNav();
        this.updateBreadcrumb(folder);
        Dashboard.renderFolder(this.tree, folderId, this.navStack);
    },

    navigateTo(folderId) {
        this.showFolder(folderId);
    },

    goBack() {
        if (this.navStack.length > 0) {
            const prev = this.navStack.pop();
            this.currentFolderId = prev;
            window.location.hash = `/folder/${prev}`;
        } else {
            this.showHome();
        }
    },

    goHome() {
        this.showHome();
        window.location.hash = '/';
    },

    showColoring(folderId) {
        if (this.currentFolderId) this.navStack.push(this.currentFolderId);
        this.currentFolderId = folderId;
        window.location.hash = `/coloring/${folderId}`;
    },

    showPuzzle(folderId) {
        if (this.currentFolderId) this.navStack.push(this.currentFolderId);
        this.currentFolderId = folderId;
        window.location.hash = `/puzzle/${folderId}`;
    },

    showTracing(type) {
        window.location.hash = `/tracing/${type}`;
    },

    showContent(item) {
        if (this.currentFolderId) this.navStack.push(this.currentFolderId);
        this.showNav();
        Dashboard.showContentViewer(item);
    },

    showNav() {
        document.getElementById('nav-bar').classList.remove('hidden');
    },

    hideNav() {
        document.getElementById('nav-bar').classList.add('hidden');
        document.getElementById('breadcrumb').classList.add('hidden');
        document.body.classList.remove('has-breadcrumb');
    },

    updateBreadcrumb(folder) {
        const bc = document.getElementById('breadcrumb');
        const inner = bc.querySelector('.breadcrumb-inner');
        bc.classList.remove('hidden');
        document.body.classList.add('has-breadcrumb');

        inner.innerHTML = '';

        // Home
        const home = document.createElement('span');
        home.textContent = '🏠 בית';
        home.addEventListener('click', () => this.goHome());
        inner.appendChild(home);

        // Build path
        const path = this.getPathTo(this.tree, folder.id);
        path.forEach(node => {
            const sep = document.createElement('span');
            sep.className = 'breadcrumb-sep';
            sep.textContent = ' ◂ ';
            inner.appendChild(sep);

            const crumb = document.createElement('span');
            crumb.textContent = `${node.icon} ${node.name}`;
            if (node.id !== folder.id) {
                crumb.addEventListener('click', () => this.navigateTo(node.id));
            } else {
                crumb.style.opacity = '0.7';
                crumb.style.cursor = 'default';
            }
            inner.appendChild(crumb);
        });
    },

    getPathTo(tree, targetId) {
        for (const folder of tree.folders) {
            const path = this._findPath(folder, targetId, []);
            if (path) return path;
        }
        return [];
    },

    _findPath(node, targetId, currentPath) {
        const newPath = [...currentPath, node];
        if (node.id === targetId) return newPath;
        if (node.children) {
            for (const child of node.children) {
                const result = this._findPath(child, targetId, newPath);
                if (result) return result;
            }
        }
        return null;
    },

    refresh() {
        this.tree = Storage.getOrInitTree();
        this.handleRoute();
    }
};

// ===== Initialize on DOM ready =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

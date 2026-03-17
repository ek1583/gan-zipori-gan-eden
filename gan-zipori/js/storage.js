// ===== Storage Layer =====
const Storage = {
    TREE_KEY: 'gan_zipori_tree',
    SETTINGS_KEY: 'gan_zipori_settings',

    getTree() {
        try {
            const saved = localStorage.getItem(this.TREE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Storage: failed to load tree', e);
        }
        return null;
    },

    saveTree(tree) {
        try {
            localStorage.setItem(this.TREE_KEY, JSON.stringify(tree));
        } catch (e) {
            console.warn('Storage: failed to save tree', e);
        }
    },

    getSettings() {
        try {
            const saved = localStorage.getItem(this.SETTINGS_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.warn('Storage: failed to load settings', e);
        }
        return { soundEnabled: true, password: '1234' };
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Storage: failed to save settings', e);
        }
    },

    getOrInitTree() {
        let tree = this.getTree();
        if (!tree) {
            tree = JSON.parse(JSON.stringify(DEFAULT_DATA));
            this.saveTree(tree);
        }
        return tree;
    },

    findFolderById(tree, id) {
        for (const folder of tree.folders) {
            const found = this._findRecursive(folder, id);
            if (found) return found;
        }
        return null;
    },

    _findRecursive(node, id) {
        if (node.id === id) return node;
        if (node.children) {
            for (const child of node.children) {
                const found = this._findRecursive(child, id);
                if (found) return found;
            }
        }
        return null;
    },

    findParent(tree, targetId) {
        for (const folder of tree.folders) {
            if (folder.id === targetId) return { node: tree, isRoot: true };
            const found = this._findParentRecursive(folder, targetId);
            if (found) return found;
        }
        return null;
    },

    _findParentRecursive(node, targetId) {
        if (node.children) {
            for (const child of node.children) {
                if (child.id === targetId) return { node, isRoot: false };
                const found = this._findParentRecursive(child, targetId);
                if (found) return found;
            }
        }
        return null;
    },

    addFolder(tree, parentId, newFolder) {
        if (!parentId) {
            tree.folders.push(newFolder);
        } else {
            const parent = this.findFolderById(tree, parentId);
            if (parent) {
                if (!parent.children) parent.children = [];
                parent.children.push(newFolder);
            }
        }
        this.saveTree(tree);
    },

    deleteFolder(tree, folderId) {
        const parentInfo = this.findParent(tree, folderId);
        if (!parentInfo) return;
        if (parentInfo.isRoot) {
            tree.folders = tree.folders.filter(f => f.id !== folderId);
        } else {
            parentInfo.node.children = parentInfo.node.children.filter(f => f.id !== folderId);
        }
        this.saveTree(tree);
    },

    addContent(tree, folderId, contentItem) {
        const folder = this.findFolderById(tree, folderId);
        if (folder) {
            if (!folder.content) folder.content = [];
            folder.content.push(contentItem);
            this.saveTree(tree);
        }
    },

    deleteContent(tree, folderId, contentId) {
        const folder = this.findFolderById(tree, folderId);
        if (folder && folder.content) {
            folder.content = folder.content.filter(c => c.id !== contentId);
            this.saveTree(tree);
        }
    },

    generateId() {
        return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    }
};

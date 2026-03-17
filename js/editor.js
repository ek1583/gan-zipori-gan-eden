// ===== Editor Panel =====
const Editor = {
  selectedFolderId: null,

  open() {
    const overlay = document.getElementById('password-overlay');
    overlay.classList.remove('hidden');
    document.getElementById('password-input').value = '';
    document.getElementById('password-error').classList.add('hidden');
    document.getElementById('password-input').focus();
  },

  checkPassword() {
    const input = document.getElementById('password-input').value;
    const settings = Storage.getSettings();
    if (input === settings.password) {
      document.getElementById('password-overlay').classList.add('hidden');
      this.showEditorPanel();
    } else {
      const err = document.getElementById('password-error');
      err.classList.remove('hidden');
      err.style.animation = 'shake 0.4s ease';
      setTimeout(() => err.style.animation = '', 400);
    }
  },

  closeEditor() {
    document.getElementById('editor-overlay').classList.add('hidden');
    App.refresh();
  },

  showEditorPanel() {
    const overlay = document.getElementById('editor-overlay');
    overlay.classList.remove('hidden');
    const panel = document.getElementById('editor-panel');
    const tree = Storage.getOrInitTree();

    panel.innerHTML = `
      <div class="editor-header">
        <h2>⚙️ פאנל ניהול</h2>
        <button class="editor-close-btn" id="editor-close">✕</button>
      </div>
      <div class="editor-body">
        <div class="editor-section">
          <h3 class="editor-section-title">📁 מבנה תיקיות</h3>
          <div id="editor-tree-container"></div>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn-primary" id="btn-add-root" style="font-size:0.9rem;padding:8px 18px">➕ תיקייה ראשית חדשה</button>
          </div>
        </div>
        <div class="editor-section">
          <h3 class="editor-section-title">👤 אזור אישי</h3>
          <div class="settings-row">
            <label>סיסמה:</label>
            <input type="text" id="settings-password" value="${Storage.getSettings().password}">
            <button class="btn-save" id="btn-save-password">שמור</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('editor-close').addEventListener('click', () => this.closeEditor());
    document.getElementById('btn-add-root').addEventListener('click', () => this.showPopupForm('add', null));
    document.getElementById('btn-save-password').addEventListener('click', () => {
      const settings = Storage.getSettings();
      settings.password = document.getElementById('settings-password').value || '1234';
      Storage.saveSettings(settings);
      TTS.speak('הסיסמה נשמרה');
    });

    this.renderTree(tree);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeEditor();
    });
  },

  renderTree(tree) {
    const container = document.getElementById('editor-tree-container');
    if (!container) return;
    container.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'editor-tree';
    tree.folders.forEach(folder => {
      ul.appendChild(this.createTreeItem(folder, tree));
    });
    container.appendChild(ul);
  },

  createTreeItem(folder, tree) {
    const li = document.createElement('li');
    const item = document.createElement('div');
    item.className = 'tree-item' + (this.selectedFolderId === folder.id ? ' selected' : '');
    item.innerHTML = `
      <span class="tree-item-icon">${folder.icon}</span>
      <span class="tree-item-name">${folder.name}</span>
      <div class="tree-item-actions">
        <button class="tree-action-btn add" title="הוסף תת-תיקייה">+</button>
        <button class="tree-action-btn edit" title="ערוך">✎</button>
        <button class="tree-action-btn delete" title="מחק">✕</button>
      </div>
    `;

    // Add subfolder — opens popup
    item.querySelector('.add').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showPopupForm('add', folder.id);
    });

    // Edit — opens popup
    item.querySelector('.edit').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showPopupForm('edit', folder.id, folder, tree);
    });

    // Delete — opens styled confirmation popup
    item.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showDeletePopup(folder);
    });

    // Click row to edit
    item.addEventListener('click', () => {
      this.selectedFolderId = folder.id;
      this.showPopupForm('edit', folder.id, folder, tree);
      document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });

    li.appendChild(item);

    if (folder.children && folder.children.length > 0) {
      const subUl = document.createElement('ul');
      folder.children.forEach(child => {
        subUl.appendChild(this.createTreeItem(child, tree));
      });
      li.appendChild(subUl);
    }

    return li;
  },

  // ===== POPUP FORM (replaces inline form) =====
  showPopupForm(mode, folderId, folder, tree) {
    // Remove existing popup
    const existing = document.getElementById('editor-popup-overlay');
    if (existing) existing.remove();

    if (!tree) tree = Storage.getOrInitTree();
    if (mode === 'edit' && !folder) {
      folder = Storage.findFolderById(tree, folderId);
    }

    const popupOverlay = document.createElement('div');
    popupOverlay.id = 'editor-popup-overlay';
    popupOverlay.className = 'editor-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'editor-popup';

    const isAdd = mode === 'add';
    const titleText = isAdd
      ? (folderId ? '➕ תת-תיקייה חדשה' : '➕ תיקייה ראשית חדשה')
      : `✏️ עריכת: ${folder.name}`;

    popup.innerHTML = `
      <div class="editor-popup-header">
        <h3>${titleText}</h3>
        <button class="editor-popup-close">✕</button>
      </div>
      <div class="editor-popup-body">
        <div class="form-group">
          <label>שם התיקייה:</label>
          <input type="text" id="popup-folder-name" value="${isAdd ? '' : folder.name}" placeholder="הקלידו שם...">
        </div>
        <div class="form-group">
          <label>טקסט הקראה:</label>
          <input type="text" id="popup-folder-tts" value="${isAdd ? '' : (folder.ttsText || '')}" placeholder="הטקסט שיוקרא בקול...">
        </div>
        <div class="form-group">
          <label>אייקון:</label>
          <div class="icon-picker" id="popup-icon-picker"></div>
        </div>
        ${!isAdd ? `
        <hr style="margin:16px 0;border:1px solid #eee">
        <h4 style="margin-bottom:10px">📎 תוכן</h4>
        <div class="upload-area" id="popup-upload-area">
          <span class="upload-icon">📤</span>
          <p class="upload-text">גררו קבצים לכאן או לחצו להעלאה</p>
          <p class="upload-hint">תמונות (JPG, PNG) • סרטונים (MP4)</p>
          <input type="file" class="upload-input" id="popup-file-upload" accept="image/*,video/mp4" multiple>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label>הוסף קישור:</label>
          <input type="text" id="popup-link-url" placeholder="https://...">
          <input type="text" id="popup-link-name" placeholder="שם הקישור" style="margin-top:6px">
          <button class="btn-primary" id="popup-btn-add-link" style="margin-top:8px;font-size:0.85rem;padding:6px 16px">➕ הוסף קישור</button>
        </div>
        <div class="content-list" id="popup-content-list"></div>
        ` : ''}
      </div>
      <div class="editor-popup-footer">
        <button class="btn-save" id="popup-btn-save">💾 ${isAdd ? 'שמור' : 'עדכון'}</button>
        <button class="btn-secondary" id="popup-btn-cancel">ביטול</button>
      </div>
    `;

    popupOverlay.appendChild(popup);
    document.body.appendChild(popupOverlay);

    // Close handlers
    popup.querySelector('.editor-popup-close').addEventListener('click', () => popupOverlay.remove());
    document.getElementById('popup-btn-cancel').addEventListener('click', () => popupOverlay.remove());
    popupOverlay.addEventListener('click', (e) => {
      if (e.target === popupOverlay) popupOverlay.remove();
    });

    // Icon picker
    const picker = document.getElementById('popup-icon-picker');
    let selectedIcon = isAdd ? '📁' : folder.icon;
    ICON_OPTIONS.forEach(icon => {
      const opt = document.createElement('div');
      opt.className = 'icon-option' + (icon === selectedIcon ? ' selected' : '');
      opt.textContent = icon;
      opt.addEventListener('click', () => {
        picker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedIcon = icon;
      });
      picker.appendChild(opt);
    });

    // Save button
    document.getElementById('popup-btn-save').addEventListener('click', () => {
      const name = document.getElementById('popup-folder-name').value.trim();
      if (!name) return;
      const tts = document.getElementById('popup-folder-tts').value.trim() || name;
      const currentTree = Storage.getOrInitTree();

      if (isAdd) {
        const newFolder = {
          id: Storage.generateId(), name, icon: selectedIcon,
          ttsText: tts, colorTheme: 'default', children: [], content: []
        };
        Storage.addFolder(currentTree, folderId, newFolder);
        TTS.speak('התיקייה נוספה');
      } else {
        const f = Storage.findFolderById(currentTree, folder.id);
        if (f) {
          f.name = name;
          f.ttsText = tts;
          f.icon = selectedIcon;
          Storage.saveTree(currentTree);
        }
        TTS.speak('התיקייה עודכנה');
      }
      this.renderTree(currentTree);
      popupOverlay.remove();
    });

    // Edit mode: file upload & links
    if (!isAdd && folder) {
      const uploadArea = document.getElementById('popup-upload-area');
      const fileInput = document.getElementById('popup-file-upload');
      if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', (e) => {
          if (e.target === fileInput) return;
          fileInput.click();
        });
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
          e.preventDefault(); uploadArea.classList.remove('dragover');
          this.handleFilesPopup(e.dataTransfer.files, folder, tree);
        });
        fileInput.addEventListener('change', () => {
          this.handleFilesPopup(fileInput.files, folder, tree);
        });
      }

      const addLinkBtn = document.getElementById('popup-btn-add-link');
      if (addLinkBtn) {
        addLinkBtn.addEventListener('click', () => {
          const url = document.getElementById('popup-link-url').value.trim();
          const name = document.getElementById('popup-link-name').value.trim() || 'קישור';
          if (!url) return;
          const type = url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'link';
          const currentTree = Storage.getOrInitTree();
          Storage.addContent(currentTree, folder.id, { id: Storage.generateId(), name, type, url });
          folder = Storage.findFolderById(currentTree, folder.id);
          this.renderContentListPopup(folder, currentTree);
        });
      }

      this.renderContentListPopup(folder, tree);
    }

    // Focus name input
    document.getElementById('popup-folder-name').focus();
  },

  handleFilesPopup(files, folder, tree) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const currentTree = Storage.getOrInitTree();
        Storage.addContent(currentTree, folder.id, {
          id: Storage.generateId(), name: file.name.replace(/\.[^.]+$/, ''),
          type, data: e.target.result
        });
        folder = Storage.findFolderById(currentTree, folder.id);
        this.renderContentListPopup(folder, currentTree);
      };
      reader.readAsDataURL(file);
    });
  },

  renderContentListPopup(folder, tree) {
    const list = document.getElementById('popup-content-list');
    if (!list || !folder.content) return;
    list.innerHTML = '';
    folder.content.forEach(item => {
      const div = document.createElement('div');
      div.className = 'content-list-item';
      const icons = { image: '🖼️', video: '🎬', youtube: '▶️', link: '🔗' };
      div.innerHTML = `
        <span style="font-size:1.5rem">${icons[item.type] || '📄'}</span>
        <div class="content-list-info">
          <div class="content-list-name">${item.name}</div>
          <div class="content-list-type">${item.type}</div>
        </div>
        <button class="content-list-delete" data-id="${item.id}">✕</button>
      `;
      div.querySelector('.content-list-delete').addEventListener('click', () => {
        const currentTree = Storage.getOrInitTree();
        Storage.deleteContent(currentTree, folder.id, item.id);
        folder = Storage.findFolderById(currentTree, folder.id);
        this.renderContentListPopup(folder, currentTree);
      });
      list.appendChild(div);
    });
  },

  // ===== DELETE CONFIRMATION POPUP =====
  showDeletePopup(folder) {
    // Remove existing popup
    const existing = document.getElementById('delete-popup-overlay');
    if (existing) existing.remove();

    const popupOverlay = document.createElement('div');
    popupOverlay.id = 'delete-popup-overlay';
    popupOverlay.className = 'editor-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'editor-popup';
    popup.style.maxWidth = '420px';
    popup.innerHTML = `
      <div class="editor-popup-header" style="background: linear-gradient(135deg, #FF6B6B, #EE5A24);">
        <h3>🗑️ מחיקת תיקייה</h3>
        <button class="editor-popup-close" id="delete-popup-close">✕</button>
      </div>
      <div class="editor-popup-body" style="text-align:center;padding:30px 20px;">
        <div style="font-size:3rem;margin-bottom:12px;">${folder.icon}</div>
        <h3 style="font-size:1.3rem;color:#2D3436;margin-bottom:8px;">${folder.name}</h3>
        <p style="color:#636E72;font-size:1rem;margin-bottom:6px;">האם למחוק את התיקייה וכל התוכן שבה?</p>
        <p style="color:#FF6B6B;font-size:0.85rem;font-weight:700;">⚠️ פעולה זו אינה ניתנת לביטול</p>
      </div>
      <div class="editor-popup-footer" style="gap:14px;">
        <button class="btn-primary" id="delete-popup-confirm" style="background:linear-gradient(135deg,#FF6B6B,#EE5A24);font-size:1rem;padding:12px 28px;">🗑️ אישור מחיקה</button>
        <button class="btn-secondary" id="delete-popup-cancel" style="font-size:1rem;padding:12px 28px;">ביטול</button>
      </div>
    `;

    popupOverlay.appendChild(popup);
    document.body.appendChild(popupOverlay);

    // Close / Cancel
    const closePopup = () => popupOverlay.remove();
    document.getElementById('delete-popup-close').addEventListener('click', closePopup);
    document.getElementById('delete-popup-cancel').addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', (e) => {
      if (e.target === popupOverlay) closePopup();
    });

    // Confirm delete
    document.getElementById('delete-popup-confirm').addEventListener('click', () => {
      const currentTree = Storage.getOrInitTree();
      Storage.deleteFolder(currentTree, folder.id);
      this.renderTree(currentTree);
      TTS.speak('התיקייה נמחקה');
      closePopup();
    });

    TTS.speak(`למחוק את ${folder.name}?`);
  }
};

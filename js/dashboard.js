// ===== Dashboard & Folder Rendering =====
const Dashboard = {
    // IDs of folders that should NOT show coloring button
    NO_COLORING_IDS: ['holidays', 'tishrei', 'seasons', 'learning', 'resilience'],

    renderHome(tree) {
        const app = document.getElementById('app');
        app.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'dashboard-grid';

        tree.folders.forEach((folder, i) => {
            const card = this.createFolderCard(folder, true);
            card.style.animationDelay = `${i * 0.08}s`;
            grid.appendChild(card);
        });

        app.appendChild(grid);
    },

    renderFolder(tree, folderId, navStack) {
        const folder = Storage.findFolderById(tree, folderId);
        if (!folder) return;

        const app = document.getElementById('app');
        app.innerHTML = '';

        // Section title
        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = `${folder.icon} ${folder.name}`;
        app.appendChild(title);

        // Activity buttons
        const actBar = document.createElement('div');
        actBar.className = 'activities-bar';
        let hasActivities = false;

        // Only show coloring on leaf folders (not main/structural ones)
        if (!this.NO_COLORING_IDS.includes(folder.id)) {
            const colorBtn = this.createActivityBtn('🎨', 'דפי צביעה', 'activity-btn-coloring', () => {
                App.showColoring(folderId);
            });
            actBar.appendChild(colorBtn);
            hasActivities = true;
        }

        if (folder.content && folder.content.some(c => c.type === 'image')) {
            const puzzleBtn = this.createActivityBtn('🧩', 'פאזלים', 'activity-btn-puzzle', () => {
                App.showPuzzle(folderId);
            });
            actBar.appendChild(puzzleBtn);
            hasActivities = true;
        }

        if (folder.activityType === 'tracing-letters' || folder.activityType === 'tracing-numbers') {
            const tracingBtn = this.createActivityBtn('✍️', folder.activityType === 'tracing-letters' ? 'תרגול אותיות' : 'תרגול מספרים', 'activity-btn-tracing', () => {
                App.showTracing(folder.activityType);
            });
            actBar.appendChild(tracingBtn);
            hasActivities = true;
        }

        if (hasActivities) {
            app.appendChild(actBar);
        }

        // Sub-folders
        if (folder.children && folder.children.length > 0) {
            const subGrid = document.createElement('div');
            subGrid.className = 'subfolder-grid';
            folder.children.forEach((child, i) => {
                const card = this.createFolderCard(child, false);
                card.style.animationDelay = `${i * 0.06}s`;
                subGrid.appendChild(card);
            });
            app.appendChild(subGrid);
        }

        // Content items
        if (folder.content && folder.content.length > 0) {
            const contentGrid = document.createElement('div');
            contentGrid.className = 'content-grid';
            folder.content.forEach((item, i) => {
                const card = this.createContentCard(item);
                card.style.animationDelay = `${i * 0.05}s`;
                contentGrid.appendChild(card);
            });
            app.appendChild(contentGrid);
        }

        // Empty state
        if ((!folder.children || folder.children.length === 0) && (!folder.content || folder.content.length === 0) && !folder.activityType) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.innerHTML = '<span class="empty-state-icon">📂</span><span class="empty-state-text">התיקייה ריקה כרגע</span>';
            app.appendChild(empty);
        }

        // Seasonal effects
        if (folder.seasonEffect) {
            SeasonalEffects.start(folder.seasonEffect);
        } else {
            SeasonalEffects.stop();
        }
    },

    createFolderCard(folder, isMain) {
        const card = document.createElement('div');
        card.className = isMain ? 'folder-card' : 'subfolder-card';
        card.setAttribute('data-color', folder.colorTheme || 'default');
        card.setAttribute('data-id', folder.id);
        card.setAttribute('data-tts', folder.ttsText || folder.name);

        card.innerHTML = `
      <span class="folder-icon">${folder.icon}</span>
      <span class="folder-name">${folder.name}</span>
    `;

        // Click handler
        card.addEventListener('click', (e) => {
            this.addRipple(card, e);
            TTS.speak(folder.ttsText || folder.name);
            setTimeout(() => App.navigateTo(folder.id), 200);
        });

        // Hover TTS
        card.addEventListener('mouseenter', () => {
            TTS.speak(folder.ttsText || folder.name);
        });

        return card;
    },

    createActivityBtn(icon, label, className, onClick) {
        const btn = document.createElement('button');
        btn.className = `activity-btn ${className}`;
        btn.innerHTML = `<span class="activity-icon">${icon}</span><span>${label}</span>`;
        btn.addEventListener('click', () => {
            TTS.speak(label);
            onClick();
        });
        btn.addEventListener('mouseenter', () => TTS.speak(label));
        return btn;
    },

    createContentCard(item) {
        const card = document.createElement('div');
        card.className = 'content-card';

        const typeLabels = { 'image': 'תמונה', 'video': 'סרטון', 'youtube': 'YouTube', 'link': 'קישור' };
        const typeIcons = { 'image': '🖼️', 'video': '🎬', 'youtube': '▶️', 'link': '🔗' };

        if (item.type === 'image' && item.data) {
            card.innerHTML = `
        <span class="content-type-badge">${typeLabels[item.type]}</span>
        <img class="content-card-image" src="${item.data}" alt="${item.name}">
        <div class="content-card-body">
          <span class="content-card-title">${item.name}</span>
        </div>
      `;
        } else {
            card.innerHTML = `
        <span class="content-type-badge">${typeLabels[item.type] || item.type}</span>
        <span class="content-card-icon">${typeIcons[item.type] || '📄'}</span>
        <div class="content-card-body">
          <span class="content-card-title">${item.name}</span>
        </div>
      `;
        }

        card.addEventListener('click', () => {
            TTS.speak(item.name);
            App.showContent(item);
        });
        card.addEventListener('mouseenter', () => TTS.speak(item.name));

        return card;
    },

    addRipple(element, event) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        element.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    },

    showContentViewer(item) {
        const app = document.getElementById('app');
        app.innerHTML = '';

        if (item.type === 'video') {
            app.innerHTML = `
        <div class="video-viewer">
          <div class="video-wrapper">
            <video controls autoplay><source src="${item.data}" type="video/mp4"></video>
          </div>
          <p class="video-title">${item.name}</p>
        </div>`;
        } else if (item.type === 'youtube') {
            const videoId = this.extractYouTubeId(item.url);
            app.innerHTML = `
        <div class="video-viewer">
          <div class="video-wrapper">
            <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
          </div>
          <p class="video-title">${item.name}</p>
        </div>`;
        } else if (item.type === 'image') {
            app.innerHTML = `
        <div class="image-viewer">
          <div class="image-display"><img src="${item.data}" alt="${item.name}"></div>
          <p class="video-title">${item.name}</p>
        </div>`;
        } else if (item.type === 'link') {
            app.innerHTML = `
        <div class="link-viewer">
          <div class="link-card-large">
            <span class="link-icon">🔗</span>
            <h3 class="link-title">${item.name}</h3>
            <a href="${item.url}" target="_blank" rel="noopener" class="link-open-btn">פתח קישור ↗</a>
          </div>
        </div>`;
        }
    },

    extractYouTubeId(url) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
        return match ? match[1] : '';
    }
};

// ===== Seasonal Effects =====
const SeasonalEffects = {
    interval: null,

    start(type) {
        this.stop();
        const container = document.getElementById('seasonal-effects');
        container.innerHTML = '';

        switch (type) {
            case 'rain': this.startRain(container); break;
            case 'leaves': this.startLeaves(container); break;
            case 'sun': this.startSun(container); break;
            case 'flowers': this.startFlowers(container); break;
        }
    },

    stop() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
        const container = document.getElementById('seasonal-effects');
        if (container) container.innerHTML = '';
    },

    startRain(container) {
        this.interval = setInterval(() => {
            if (container.children.length > 30) return;
            const drop = document.createElement('div');
            drop.className = 'seasonal-particle';
            drop.textContent = '💧';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.top = '-5%';
            drop.style.fontSize = (0.6 + Math.random() * 0.8) + 'rem';
            drop.style.animation = `rainDrop ${1.5 + Math.random() * 2}s linear forwards`;
            drop.style.animationDelay = Math.random() * 0.3 + 's';
            container.appendChild(drop);
            setTimeout(() => drop.remove(), 4000);
        }, 200);
    },

    startLeaves(container) {
        const leaves = ['🍂', '🍁', '🍃'];
        this.interval = setInterval(() => {
            if (container.children.length > 15) return;
            const leaf = document.createElement('div');
            leaf.className = 'seasonal-particle';
            leaf.textContent = leaves[Math.floor(Math.random() * leaves.length)];
            leaf.style.left = Math.random() * 100 + '%';
            leaf.style.top = '-5%';
            leaf.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
            leaf.style.animation = `leafFall ${4 + Math.random() * 4}s linear forwards`;
            container.appendChild(leaf);
            setTimeout(() => leaf.remove(), 9000);
        }, 600);
    },

    startSun(container) {
        const sun = document.createElement('div');
        sun.className = 'seasonal-particle';
        sun.textContent = '☀️';
        sun.style.position = 'fixed';
        sun.style.top = '120px';
        sun.style.right = '20px';
        sun.style.fontSize = '4rem';
        sun.style.animation = 'sunPulse 3s ease-in-out infinite';
        container.appendChild(sun);
    },

    startFlowers(container) {
        const flowers = ['🌸', '🌺', '🌼', '🦋', '🐝'];
        this.interval = setInterval(() => {
            if (container.children.length > 12) return;
            const flower = document.createElement('div');
            flower.className = 'seasonal-particle';
            flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
            flower.style.left = Math.random() * 100 + '%';
            flower.style.top = '-5%';
            flower.style.fontSize = (1 + Math.random() * 1) + 'rem';
            flower.style.animation = `leafFall ${5 + Math.random() * 5}s linear forwards`;
            container.appendChild(flower);
            setTimeout(() => flower.remove(), 11000);
        }, 800);
    }
};

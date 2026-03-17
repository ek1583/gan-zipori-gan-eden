// ===== Digital Coloring Engine =====
const Coloring = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentColor: '#FF0000',
    brushSize: 8,
    mode: 'brush', // brush or fill

    COLORS: [
        '#FF0000', '#FF6B35', '#FECA57', '#2ED573', '#48DBFB',
        '#6C5CE7', '#FF9FF3', '#FD79A8', '#A29BFE', '#00B894',
        '#E17055', '#636E72'
    ],

    show(folderId) {
        const app = document.getElementById('app');
        app.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'activity-container';

        // Title
        container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">🎨 דפי צביעה</h2>
        <p class="activity-subtitle">בחרו צבע והתחילו לצבוע!</p>
      </div>
    `;

        // Canvas
        const wrapper = document.createElement('div');
        wrapper.className = 'canvas-wrapper';
        const canvas = document.createElement('canvas');
        canvas.id = 'coloring-canvas';
        canvas.width = 600;
        canvas.height = 500;
        wrapper.appendChild(canvas);
        container.appendChild(wrapper);

        // Tool bar
        const toolBar = document.createElement('div');
        toolBar.className = 'tool-bar';
        toolBar.innerHTML = `
      <button class="tool-btn active" data-tool="brush">✏️ מכחול</button>
      <button class="tool-btn" data-tool="fill">🪣 מילוי</button>
      <button class="tool-btn" data-tool="clear">🗑️ נקה</button>
    `;
        container.appendChild(toolBar);

        // Brush size
        const brushCtrl = document.createElement('div');
        brushCtrl.className = 'brush-controls';
        brushCtrl.innerHTML = `
      <span class="brush-size-label">גודל מכחול:</span>
      <input type="range" class="brush-size-slider" min="2" max="30" value="8">
    `;
        container.appendChild(brushCtrl);

        // Color palette
        const palette = document.createElement('div');
        palette.className = 'color-palette';
        this.COLORS.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (color === this.currentColor ? ' active' : '');
            swatch.style.background = color;
            swatch.addEventListener('click', () => {
                palette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.currentColor = color;
                this.mode = 'brush';
                toolBar.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                toolBar.querySelector('[data-tool="brush"]').classList.add('active');
            });
            palette.appendChild(swatch);
        });
        // Eraser
        const eraser = document.createElement('div');
        eraser.className = 'color-swatch eraser';
        eraser.addEventListener('click', () => {
            palette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            eraser.classList.add('active');
            this.currentColor = '#FFFFFF';
            this.mode = 'brush';
        });
        palette.appendChild(eraser);
        container.appendChild(palette);

        app.appendChild(container);

        // Init canvas
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.drawTemplate(folderId);
        this.bindEvents(canvas, toolBar, brushCtrl);
    },

    drawTemplate(folderId) {
        const ctx = this.ctx;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Find template
        let template = COLORING_TEMPLATES['default'];
        if (COLORING_TEMPLATES[folderId]) {
            template = COLORING_TEMPLATES[folderId];
        }

        // Draw paths
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const [, , vw, vh] = template.viewBox.split(' ').map(Number);
        const scaleX = this.canvas.width / vw;
        const scaleY = this.canvas.height / vh;

        template.paths.forEach(pathStr => {
            const path = new Path2D(pathStr);
            ctx.save();
            ctx.scale(scaleX, scaleY);
            ctx.stroke(path);
            ctx.restore();
        });
    },

    bindEvents(canvas, toolBar, brushCtrl) {
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
        };

        const startDraw = (e) => {
            e.preventDefault();
            if (this.mode === 'fill') {
                const pos = getPos(e);
                this.floodFill(Math.round(pos.x), Math.round(pos.y), this.currentColor);
                return;
            }
            this.isDrawing = true;
            const pos = getPos(e);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        };

        const draw = (e) => {
            e.preventDefault();
            if (!this.isDrawing || this.mode !== 'brush') return;
            const pos = getPos(e);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        };

        const endDraw = () => { this.isDrawing = false; };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseleave', endDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', endDraw);

        // Tools
        toolBar.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                if (tool === 'clear') {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    this.drawTemplate(App.currentFolderId || 'default');
                    return;
                }
                this.mode = tool;
                toolBar.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Brush size
        const slider = brushCtrl.querySelector('.brush-size-slider');
        slider.addEventListener('input', () => {
            this.brushSize = parseInt(slider.value);
        });
    },

    floodFill(startX, startY, fillColor) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const h = canvas.height;

        const hex = fillColor.replace('#', '');
        const fr = parseInt(hex.substr(0, 2), 16);
        const fg = parseInt(hex.substr(2, 2), 16);
        const fb = parseInt(hex.substr(4, 2), 16);

        const idx = (startY * w + startX) * 4;
        const sr = data[idx], sg = data[idx + 1], sb = data[idx + 2];

        if (sr === fr && sg === fg && sb === fb) return;

        const tolerance = 30;
        const match = (i) => {
            return Math.abs(data[i] - sr) <= tolerance &&
                Math.abs(data[i + 1] - sg) <= tolerance &&
                Math.abs(data[i + 2] - sb) <= tolerance;
        };

        const stack = [[startX, startY]];
        const visited = new Set();
        let count = 0;
        const maxPixels = w * h;

        while (stack.length > 0 && count < maxPixels) {
            const [x, y] = stack.pop();
            const key = y * w + x;
            if (x < 0 || x >= w || y < 0 || y >= h || visited.has(key)) continue;
            const i = key * 4;
            if (!match(i)) continue;
            visited.add(key);
            data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = 255;
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            count++;
        }

        ctx.putImageData(imageData, 0, 0);
    }
};

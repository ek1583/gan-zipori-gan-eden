// ===== Letter & Number Tracing Engine =====
const Tracing = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentChar: '',
    mode: 'letters', // letters or numbers
    penColor: '#6C5CE7',
    penSize: 6,
    completedChars: new Set(),
    charSnapshots: {},  // Store canvas snapshots per character
    drawPoints: [],     // Track drawing points for accuracy check

    show(activityType) {
        this.mode = activityType === 'tracing-numbers' ? 'numbers' : 'letters';
        this.completedChars = new Set();
        this.charSnapshots = {};
        this.drawPoints = [];
        const chars = this.mode === 'letters' ? HEBREW_LETTERS : DIGITS;
        this.currentChar = chars[0];

        const app = document.getElementById('app');
        app.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'activity-container';
        container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">${this.mode === 'letters' ? '✨ קסם האותיות' : '🔢 עולם המספרים'}</h2>
        <p class="activity-subtitle">${this.mode === 'letters' ? 'עקבו אחרי האותיות וכתבו!' : 'עקבו אחרי המספרים וכתבו!'}</p>
      </div>
    `;

        // Character selector
        const selector = document.createElement('div');
        selector.className = 'letter-selector';
        selector.id = 'char-selector';
        chars.forEach(ch => {
            const btn = document.createElement('button');
            btn.className = 'letter-btn' + (ch === this.currentChar ? ' active' : '');
            btn.textContent = ch;
            btn.addEventListener('click', () => {
                // Save current before switching
                this.saveCurrentSnapshot();
                this.currentChar = ch;
                selector.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // If we have a snapshot, restore it; else draw fresh template
                if (this.charSnapshots[ch]) {
                    this.restoreSnapshot(ch);
                } else {
                    this.drawCharTemplate();
                }
                this.drawPoints = [];
                TTS.speak(ch);
                document.getElementById('tracing-feedback').innerHTML = '';
            });
            selector.appendChild(btn);
        });
        container.appendChild(selector);

        // Canvas area
        const canvasArea = document.createElement('div');
        canvasArea.className = 'tracing-canvas-area';
        const canvas = document.createElement('canvas');
        canvas.id = 'tracing-canvas';
        canvas.width = 600;
        canvas.height = 400;
        canvasArea.appendChild(canvas);
        container.appendChild(canvasArea);

        // Tool bar
        const tools = document.createElement('div');
        tools.className = 'tool-bar';
        tools.innerHTML = `
      <button class="tool-btn" data-action="clear">🗑️ נקה</button>
      <button class="tool-btn" data-action="done">✅ סיימתי</button>
    `;
        container.appendChild(tools);

        // Feedback area
        const feedback = document.createElement('div');
        feedback.className = 'tracing-feedback';
        feedback.id = 'tracing-feedback';
        container.appendChild(feedback);

        app.appendChild(container);

        // Init
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.drawCharTemplate();
        this.bindEvents(canvas, tools);
    },

    drawCharTemplate() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);

        // Draw guidelines
        ctx.strokeStyle = '#E8E8E8';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.moveTo(0, h * 0.25);
        ctx.lineTo(w, h * 0.25);
        ctx.moveTo(0, h * 0.75);
        ctx.lineTo(w, h * 0.75);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw character as dotted template
        ctx.font = '280px Heebo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow / guide
        ctx.strokeStyle = '#D5D5D5';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.strokeText(this.currentChar, w / 2, h / 2);
        ctx.setLineDash([]);

        // Faint fill
        ctx.fillStyle = 'rgba(108, 92, 231, 0.08)';
        ctx.fillText(this.currentChar, w / 2, h / 2);

        this.drawPoints = [];
    },

    saveCurrentSnapshot() {
        if (this.canvas && this.currentChar) {
            this.charSnapshots[this.currentChar] = this.canvas.toDataURL();
        }
    },

    restoreSnapshot(ch) {
        const data = this.charSnapshots[ch];
        if (!data) return;
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = data;
    },

    bindEvents(canvas, tools) {
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
        };

        const start = (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const pos = getPos(e);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.drawPoints.push(pos);
        };

        const move = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.strokeStyle = this.penColor;
            this.ctx.lineWidth = this.penSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.setLineDash([]);
            this.ctx.stroke();
            this.drawPoints.push(pos);
        };

        const end = () => { this.isDrawing = false; };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', end);
        canvas.addEventListener('mouseleave', end);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', end);

        // Tools
        tools.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'clear') {
                    this.drawCharTemplate();
                    document.getElementById('tracing-feedback').innerHTML = '';
                } else if (action === 'done') {
                    this.evaluateAndComplete();
                }
            });
        });
    },

    // Check if drawing stays within the character bounds
    checkAccuracy() {
        if (this.drawPoints.length < 10) return false; // Too few points

        const w = this.canvas.width;
        const h = this.canvas.height;

        // Render the character in an offscreen canvas to get its pixel mask
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const offCtx = offscreen.getContext('2d');

        offCtx.fillStyle = '#000000';
        offCtx.font = '280px Heebo';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(this.currentChar, w / 2, h / 2);

        const imageData = offCtx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Check how many draw points are outside the character area
        // We add a generous margin (40px) around the character shape
        const margin = 40;
        let outsideCount = 0;

        for (const point of this.drawPoints) {
            const px = Math.round(point.x);
            const py = Math.round(point.y);

            // Check if any pixel in the margin area around the point is part of the character
            let nearChar = false;
            for (let dy = -margin; dy <= margin && !nearChar; dy += 4) {
                for (let dx = -margin; dx <= margin && !nearChar; dx += 4) {
                    const cx = px + dx;
                    const cy = py + dy;
                    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
                    const idx = (cy * w + cx) * 4;
                    if (data[idx + 3] > 50) { // Has opacity = part of the character
                        nearChar = true;
                    }
                }
            }

            if (!nearChar) outsideCount++;
        }

        const outsideRatio = outsideCount / this.drawPoints.length;
        return outsideRatio < 0.35; // Allow up to 35% outside points
    },

    evaluateAndComplete() {
        const feedback = document.getElementById('tracing-feedback');

        if (this.drawPoints.length < 10) {
            feedback.innerHTML = '✏️ עוד לא כתבתם מספיק, נסו לעקוב אחרי האות!';
            TTS.speak('נסו לעקוב אחרי האות');
            return;
        }

        const isAccurate = this.checkAccuracy();

        if (isAccurate) {
            this.markCompleted();
        } else {
            // Not accurate enough — show "try again"
            feedback.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <span style="font-size:1.5rem">😊 נסו שוב!</span>
          <button class="tool-btn" id="btn-try-again" style="background:rgba(255,107,107,0.3);border-color:rgba(255,107,107,0.6)">
            🔄 נסה שוב
          </button>
        </div>`;
            TTS.speak('נסו שוב, עקבו אחרי הקווים');

            document.getElementById('btn-try-again').addEventListener('click', () => {
                this.drawCharTemplate();
                feedback.innerHTML = '';
            });
        }
    },

    markCompleted() {
        this.completedChars.add(this.currentChar);
        this.saveCurrentSnapshot();  // Save the drawing
        const feedback = document.getElementById('tracing-feedback');
        feedback.innerHTML = '🌟 יפה מאוד! כל הכבוד! 🌟';
        TTS.speak('יפה מאוד! כל הכבוד!');

        // Mark button as completed
        const selector = document.getElementById('char-selector');
        if (selector) {
            selector.querySelectorAll('.letter-btn').forEach(btn => {
                if (btn.textContent === this.currentChar) {
                    btn.classList.add('completed');
                }
            });
        }

        // Auto-advance after brief delay
        const chars = this.mode === 'letters' ? HEBREW_LETTERS : DIGITS;
        const currentIdx = chars.indexOf(this.currentChar);
        if (currentIdx < chars.length - 1) {
            setTimeout(() => {
                this.saveCurrentSnapshot();
                this.currentChar = chars[currentIdx + 1];
                this.drawCharTemplate();
                if (selector) {
                    selector.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
                    selector.querySelectorAll('.letter-btn')[currentIdx + 1].classList.add('active');
                }
                TTS.speak(this.currentChar);
                feedback.innerHTML = '';
            }, 2000);
        } else {
            // All completed!
            setTimeout(() => {
                feedback.innerHTML = '🏆 סיימתם את כולם! 🏆';
                TTS.speak('מדהים! סיימתם את כל התרגול!');
            }, 1000);
        }
    }
};

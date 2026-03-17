// ===== Interactive Puzzle Engine =====
const Puzzle = {
    pieces: [],
    boardSize: 0,
    cols: 0,
    rows: 0,
    pieceW: 0,
    pieceH: 0,
    placedCount: 0,
    totalPieces: 0,
    dragging: null,
    dragOffset: { x: 0, y: 0 },
    image: null,

    show(folderId) {
        const tree = Storage.getOrInitTree();
        const folder = Storage.findFolderById(tree, folderId);
        const images = folder && folder.content ? folder.content.filter(c => c.type === 'image') : [];

        const app = document.getElementById('app');
        app.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'activity-container';
        container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">🧩 פאזלים</h2>
        <p class="activity-subtitle">גררו את החלקים למקומם!</p>
      </div>
    `;

        if (images.length === 0) {
            container.innerHTML += `
        <div class="empty-state">
          <span class="empty-state-icon">🧩</span>
          <span class="empty-state-text">אין תמונות בתיקייה זו. הוסיפו תמונות דרך פאנל העריכה!</span>
        </div>`;
            app.appendChild(container);
            return;
        }

        // Difficulty selector
        const diffDiv = document.createElement('div');
        diffDiv.className = 'puzzle-difficulty';
        [4, 9, 12, 16, 20].forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'difficulty-btn' + (n === 9 ? ' active' : '');
            btn.textContent = n + ' חלקים';
            btn.addEventListener('click', () => {
                diffDiv.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.startPuzzle(this.image, n, boardEl);
            });
            diffDiv.appendChild(btn);
        });
        container.appendChild(diffDiv);

        // Board
        const boardEl = document.createElement('div');
        boardEl.className = 'puzzle-board';
        boardEl.id = 'puzzle-board';
        container.appendChild(boardEl);

        app.appendChild(container);

        // Load first image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.image = img;
            this.startPuzzle(img, 9, boardEl);
        };
        img.src = images[0].data;
    },

    startPuzzle(img, numPieces, boardEl) {
        this.placedCount = 0;
        this.totalPieces = numPieces;
        this.pieces = [];

        // Calculate grid
        const aspect = img.width / img.height;
        if (numPieces <= 4) { this.cols = 2; this.rows = 2; }
        else if (numPieces <= 9) { this.cols = 3; this.rows = 3; }
        else if (numPieces <= 12) { this.cols = 4; this.rows = 3; }
        else if (numPieces <= 16) { this.cols = 4; this.rows = 4; }
        else { this.cols = 5; this.rows = 4; }

        this.totalPieces = this.cols * this.rows;
        const maxW = Math.min(600, window.innerWidth - 40);
        const boardW = maxW;
        const boardH = boardW / aspect;
        this.pieceW = boardW / this.cols;
        this.pieceH = boardH / this.rows;

        boardEl.style.width = boardW + 'px';
        boardEl.style.height = boardH + 'px';
        boardEl.innerHTML = '';

        // Create ghost positions
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const ghost = document.createElement('div');
                ghost.className = 'puzzle-ghost';
                ghost.style.width = this.pieceW + 'px';
                ghost.style.height = this.pieceH + 'px';
                ghost.style.left = c * this.pieceW + 'px';
                ghost.style.top = r * this.pieceH + 'px';
                boardEl.appendChild(ghost);
            }
        }

        // Create pieces and shuffle
        const positions = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                positions.push({ r, c });
            }
        }

        // Shuffle positions for placement
        const shuffled = [...positions].sort(() => Math.random() - 0.5);

        positions.forEach((pos, i) => {
            const piece = document.createElement('canvas');
            piece.className = 'puzzle-piece';
            piece.width = this.pieceW * 2; // higher res
            piece.height = this.pieceH * 2;
            piece.style.width = this.pieceW + 'px';
            piece.style.height = this.pieceH + 'px';

            const pCtx = piece.getContext('2d');
            const sx = pos.c * (img.width / this.cols);
            const sy = pos.r * (img.height / this.rows);
            const sw = img.width / this.cols;
            const sh = img.height / this.rows;
            pCtx.drawImage(img, sx, sy, sw, sh, 0, 0, piece.width, piece.height);

            // Random starting position
            const startX = shuffled[i].c * this.pieceW;
            const startY = shuffled[i].r * this.pieceH;
            piece.style.left = startX + 'px';
            piece.style.top = startY + 'px';

            piece.dataset.targetCol = pos.c;
            piece.dataset.targetRow = pos.r;

            this.bindDrag(piece, boardEl);
            boardEl.appendChild(piece);
            this.pieces.push(piece);
        });
    },

    bindDrag(piece, board) {
        const startDrag = (e) => {
            e.preventDefault();
            if (piece.classList.contains('placed')) return;
            this.dragging = piece;
            piece.style.zIndex = 100;

            const rect = board.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            this.dragOffset.x = clientX - rect.left - parseFloat(piece.style.left);
            this.dragOffset.y = clientY - rect.top - parseFloat(piece.style.top);
        };

        const moveDrag = (e) => {
            if (this.dragging !== piece) return;
            e.preventDefault();
            const rect = board.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            piece.style.left = (clientX - rect.left - this.dragOffset.x) + 'px';
            piece.style.top = (clientY - rect.top - this.dragOffset.y) + 'px';
        };

        const endDrag = () => {
            if (this.dragging !== piece) return;
            this.dragging = null;
            piece.style.zIndex = 10;

            const targetX = parseInt(piece.dataset.targetCol) * this.pieceW;
            const targetY = parseInt(piece.dataset.targetRow) * this.pieceH;
            const curX = parseFloat(piece.style.left);
            const curY = parseFloat(piece.style.top);

            const snapDist = this.pieceW * 0.35;
            if (Math.abs(curX - targetX) < snapDist && Math.abs(curY - targetY) < snapDist) {
                piece.style.left = targetX + 'px';
                piece.style.top = targetY + 'px';
                piece.classList.add('placed');
                this.placedCount++;

                if (this.placedCount >= this.totalPieces) {
                    this.celebrate();
                }
            }
        };

        piece.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('mouseup', endDrag);
        piece.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', moveDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
    },

    celebrate() {
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        overlay.innerHTML = `
      <div class="celebration-content">
        <span class="celebration-emoji">🎉</span>
        <p class="celebration-text">כל הכבוד!</p>
      </div>
    `;

        // Confetti
        const emojis = ['⭐', '🌟', '🎊', '🎈', '💖', '✨'];
        for (let i = 0; i < 15; i++) {
            const conf = document.createElement('span');
            conf.className = 'celebration-confetti';
            conf.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            conf.style.left = Math.random() * 100 + '%';
            conf.style.top = Math.random() * 100 + '%';
            conf.style.animationDelay = Math.random() * 1 + 's';
            overlay.appendChild(conf);
        }

        document.body.appendChild(overlay);
        TTS.speak('כל הכבוד! הצלחתם!');
        overlay.addEventListener('click', () => overlay.remove());
        setTimeout(() => overlay.remove(), 4000);
    }
};

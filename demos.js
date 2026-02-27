// ============================================
// demos.js — Use-Case Playground Logic
// Fixed: canvas sizing, training convergence
// ============================================

const DemoContent = {
  hub: {
    title: 'Explore: What Can Neural Networks Do?',
    subtitle: 'Now that you understand the basics, try neural networks on real tasks!',
    render(container) {
      container.innerHTML = `
        <div class="content-card">
          <div class="content-card__text">
            Neural networks aren't just math exercises — they power everything from image recognition to language translation.
            Pick a demo below to see them in action. Each one is fully interactive!
          </div>
        </div>
        <div class="demo-grid">
          <div class="demo-card" data-demo="classification">
            <div class="demo-card__icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="8" cy="8" r="4" fill="#a78bfa" opacity="0.7"/><circle cx="20" cy="20" r="4" fill="#67e8f9" opacity="0.7"/><line x1="4" y1="24" x2="24" y2="4" stroke="#5a5b67" stroke-width="1.5" stroke-dasharray="3 3"/></svg></div>
            <div class="demo-card__title">Classification</div>
            <div class="demo-card__desc">Separate data points into two groups. Watch the decision boundary evolve as the network learns which points belong where.</div>
          </div>
          <div class="demo-card" data-demo="regression">
            <div class="demo-card__icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M3 22 C8 18 14 6 25 4" stroke="#a78bfa" stroke-width="2" fill="none"/><circle cx="6" cy="20" r="2.5" fill="#67e8f9" opacity="0.6"/><circle cx="14" cy="10" r="2.5" fill="#67e8f9" opacity="0.6"/><circle cx="22" cy="6" r="2.5" fill="#67e8f9" opacity="0.6"/></svg></div>
            <div class="demo-card__title">Function Fitting</div>
            <div class="demo-card__desc">Draw data points on a canvas. The network learns to draw a smooth curve through your points — like magic curve-fitting!</div>
          </div>
          <div class="demo-card" data-demo="digits">
            <div class="demo-card__icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="3" width="20" height="22" rx="3" stroke="#a78bfa" stroke-width="1.5"/><text x="14" y="20" text-anchor="middle" fill="#67e8f9" font-size="14" font-weight="700" font-family="var(--font-mono)">7</text></svg></div>
            <div class="demo-card__title">Digit Recognition</div>
            <div class="demo-card__desc">Draw digits on a tiny 8x8 grid. Train the network with your drawings, then test if it can recognize new ones!</div>
          </div>
          <div class="demo-card" data-demo="colors">
            <div class="demo-card__icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="10" cy="10" r="6" fill="#a78bfa" opacity="0.45"/><circle cx="18" cy="10" r="6" fill="#67e8f9" opacity="0.45"/><circle cx="14" cy="17" r="6" fill="#34d399" opacity="0.45"/></svg></div>
            <div class="demo-card__title">Color Mixer</div>
            <div class="demo-card__desc">Pick target colors and teach the network to produce them. Can it learn to match your palette?</div>
          </div>
        </div>
      `;
      container.querySelectorAll('.demo-card').forEach(card => {
        card.addEventListener('click', () => window.activeApp.showDemo(card.dataset.demo));
      });
    }
  },

  // ===== Classification =====
  classification: {
    title: 'Classification',
    subtitle: 'Train a network to separate data into two classes. The colored background shows what the network "thinks" about every possible point.',
    render(container) {
      container.innerHTML = `
        <div class="sandbox">
          <div class="sandbox__main">
            <div class="stats-bar">
              <div class="stat"><div class="stat__value" id="cls-epoch">0</div><div class="stat__label">Epoch</div></div>
              <div class="stat"><div class="stat__value" id="cls-loss">—</div><div class="stat__label">Loss</div></div>
              <div class="stat"><div class="stat__value" id="cls-acc">50%</div><div class="stat__label">Accuracy</div></div>
            </div>

            <div class="viz-area" style="height: 320px;">
              <div class="viz-area__label">Decision Boundary — Blue class vs Orange class</div>
              <canvas id="cls-boundary" style="width: 100%; height: 290px;"></canvas>
            </div>

            <div class="controls-row">
              <div class="control-group">
                <div class="control-label"><span>Dataset</span></div>
                <select id="cls-dataset"><option value="xor">XOR (easy)</option><option value="circle">Circle (medium)</option><option value="spiral">Spiral (hard)</option><option value="gaussian">Gaussian</option></select>
              </div>
              <div class="control-group">
                <div class="control-label"><span>Hidden Neurons</span><span class="control-label__value" id="cls-hn-val">6</span></div>
                <input type="range" id="cls-hn" min="2" max="12" step="1" value="6">
              </div>
              <div class="control-group">
                <div class="control-label"><span>Learning Rate</span><span class="control-label__value" id="cls-lr-val">0.50</span></div>
                <input type="range" id="cls-lr" min="0.01" max="2" step="0.01" value="0.5">
              </div>
            </div>

            <div class="btn-group">
              <button class="btn btn--primary" id="cls-train">▶  Train</button>
              <button class="btn btn--danger btn--small" id="cls-reset">↺  Reset</button>
            </div>
          </div>

          <div class="sandbox__side">
            <div class="sandbox-section">
              <div class="sandbox-section__title">Network</div>
              <div style="height: 200px;"><canvas id="cls-net" style="width: 100%; height: 200px;"></canvas></div>
            </div>
            <div class="sandbox-section">
              <div class="sandbox-section__title">Loss Over Time</div>
              <div class="loss-chart-wrap"><canvas id="cls-loss-chart"></canvas></div>
            </div>
          </div>
        </div>
      `;

      let nn, data, isTraining = false, lr = 0.5, hn = 6, dataset = 'xor';
      let viz, chart;

      function build() {
        nn = new NeuralNetwork([2, hn, hn, 1], 'sigmoid');
        data = Datasets[dataset].generate();
        chart = new LossChart(document.getElementById('cls-loss-chart'));
        viz = new NetworkVisualizer(document.getElementById('cls-net'));
        setTimeout(() => { viz.setNetwork(nn); viz.draw(performance.now()); drawBoundary(); }, 50);
        isTraining = false;
        document.getElementById('cls-train').textContent = '▶  Train';
        updateUI();
      }

      function updateUI() {
        if (!document.getElementById('cls-epoch')) return;
        document.getElementById('cls-epoch').textContent = nn.epoch;
        document.getElementById('cls-loss').textContent = nn.totalLoss.toFixed(4);
        let c = 0;
        for (const s of data) { if ((nn.forward(s.input)[0] > 0.5 ? 1 : 0) === s.target[0]) c++; }
        document.getElementById('cls-acc').textContent = ((c / data.length) * 100).toFixed(0) + '%';
      }

      function drawBoundary() {
        const canvas = document.getElementById('cls-boundary');
        if (!canvas || !nn) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 10 || h < 10) return;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const res = 4;
        for (let px = 0; px < w; px += res) {
          for (let py = 0; py < h; py += res) {
            const out = nn.forward([-1.2 + (px / w) * 2.4, -1.2 + (py / h) * 2.4])[0];
            const r = Math.round(20 + out * 60), g = Math.round(40 + out * 120), b = Math.round(180 - out * 100);
            ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
            ctx.fillRect(px, py, res, res);
          }
        }
        for (const s of data) {
          const px = ((s.input[0] + 1.2) / 2.4) * w, py = ((s.input[1] + 1.2) / 2.4) * h;
          ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = s.target[0] > 0.5 ? '#4f8fff' : '#ff8c32';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }

      document.getElementById('cls-dataset').addEventListener('change', e => { dataset = e.target.value; build(); });
      document.getElementById('cls-hn').addEventListener('input', e => { hn = parseInt(e.target.value); document.getElementById('cls-hn-val').textContent = hn; build(); });
      document.getElementById('cls-lr').addEventListener('input', e => { lr = parseFloat(e.target.value); document.getElementById('cls-lr-val').textContent = lr.toFixed(2); });
      document.getElementById('cls-train').addEventListener('click', () => {
        isTraining = !isTraining;
        document.getElementById('cls-train').textContent = isTraining ? 'Pause' : '▶  Train';
      });
      document.getElementById('cls-reset').addEventListener('click', () => { isTraining = false; build(); });

      let fc = 0;
      function animate(time) {
        if (!document.getElementById('cls-net')) return;
        if (isTraining && nn) {
          for (let i = 0; i < 5; i++) { nn.trainEpoch(data, lr); chart.addPoint(nn.totalLoss); }
          nn.forward(data[Math.floor(Math.random() * data.length)].input);
          updateUI();
          if (fc++ % 3 === 0) drawBoundary();
        }
        if (viz) viz.draw(time);
        if (chart) chart.draw();
        requestAnimationFrame(animate);
      }
      build(); requestAnimationFrame(animate);
    }
  },

  // ===== Function Fitting =====
  regression: {
    title: 'Function Fitting (Regression)',
    subtitle: 'Draw data points and watch the network learn to fit a smooth curve through them.',
    render(container) {
      container.innerHTML = `
        <div class="content-card">
          <div class="content-card__text">
            <strong>Regression</strong> means predicting a number instead of a category.
            Click on the dark canvas below to add data points, or pick a preset. Then hit Train!
          </div>
        </div>

        <div class="controls-row">
          <div class="control-group">
            <div class="control-label"><span>Preset Data</span></div>
            <select id="reg-preset"><option value="custom">Draw Your Own</option><option value="sine">Sine Wave</option><option value="quadratic">Quadratic</option><option value="step">Step Function</option></select>
          </div>
          <div class="control-group">
            <div class="control-label"><span>Neurons</span><span class="control-label__value" id="reg-hn-val">8</span></div>
            <input type="range" id="reg-hn" min="3" max="16" step="1" value="8">
          </div>
          <div class="control-group">
            <div class="control-label"><span>Learning Rate</span><span class="control-label__value" id="reg-lr-val">0.05</span></div>
            <input type="range" id="reg-lr" min="0.005" max="0.5" step="0.005" value="0.05">
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat"><div class="stat__value" id="reg-epoch">0</div><div class="stat__label">Epoch</div></div>
          <div class="stat"><div class="stat__value" id="reg-loss">—</div><div class="stat__label">Loss</div></div>
          <div class="stat"><div class="stat__value" id="reg-pts">0</div><div class="stat__label">Data Points</div></div>
        </div>

        <div class="viz-area" style="height: 350px; cursor: crosshair;">
          <div class="viz-area__label">Click to add data points · Blue line = network's prediction</div>
          <canvas id="reg-canvas" style="width:100%; height: 320px;"></canvas>
        </div>

        <div class="btn-group">
          <button class="btn btn--primary" id="reg-train">▶  Train</button>
          <button class="btn btn--secondary btn--small" id="reg-clear">Clear Points</button>
          <button class="btn btn--danger btn--small" id="reg-reset">↺  Reset Network</button>
        </div>
      `;

      let points = [];
      let nn, isTraining = false, lr = 0.05, hn = 8;

      function buildReg() {
        nn = new NeuralNetwork([1, hn, hn, 1], 'tanh');
        isTraining = false;
        if (document.getElementById('reg-train')) document.getElementById('reg-train').textContent = '▶  Train';
      }

      function resizeAndDraw() {
        const canvas = document.getElementById('reg-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 10) return;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(79,143,255,0.06)';
        for (let i = 0; i <= 4; i++) {
          ctx.beginPath(); ctx.moveTo(0, (i / 4) * h); ctx.lineTo(w, (i / 4) * h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo((i / 4) * w, 0); ctx.lineTo((i / 4) * w, h); ctx.stroke();
        }

        // Y axis labels
        ctx.fillStyle = 'rgba(138,143,168,0.3)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('+1', 20, 14); ctx.fillText('0', 20, h / 2 + 4); ctx.fillText('-1', 20, h - 4);

        // Network curve (blue line)
        if (nn) {
          ctx.beginPath(); ctx.strokeStyle = '#4f8fff'; ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(79,143,255,0.4)'; ctx.shadowBlur = 6;
          for (let px = 0; px < w; px += 2) {
            const x = (px / w) * 2 - 1;
            const rawOut = nn.forward([x])[0]; // 0-1 from sigmoid output
            const y = rawOut * 2 - 1; // map to -1..1
            const py = (1 - (y + 1) / 2) * h;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke(); ctx.shadowBlur = 0;
        }

        // Data points
        for (const p of points) {
          const px = ((p[0] + 1) / 2) * w;
          const py = (1 - (p[1] + 1) / 2) * h;
          ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ff8c32'; ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();
        }

        if (document.getElementById('reg-pts')) document.getElementById('reg-pts').textContent = points.length;
      }

      const canvas = document.getElementById('reg-canvas');
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = 1 - ((e.clientY - rect.top) / rect.height) * 2;
        points.push([x, y]);
        resizeAndDraw();
      });

      document.getElementById('reg-preset').addEventListener('change', (e) => {
        points = [];
        const v = e.target.value;
        if (v === 'sine') { for (let i = 0; i < 30; i++) { const x = (i / 29) * 2 - 1; points.push([x, Math.sin(x * Math.PI) * 0.8]); } }
        else if (v === 'quadratic') { for (let i = 0; i < 30; i++) { const x = (i / 29) * 2 - 1; points.push([x, x * x * 1.5 - 0.5]); } }
        else if (v === 'step') { for (let i = 0; i < 30; i++) { const x = (i / 29) * 2 - 1; points.push([x, x > 0 ? 0.6 : -0.6]); } }
        buildReg(); resizeAndDraw();
      });

      document.getElementById('reg-hn').addEventListener('input', e => { hn = parseInt(e.target.value); document.getElementById('reg-hn-val').textContent = hn; buildReg(); resizeAndDraw(); });
      document.getElementById('reg-lr').addEventListener('input', e => { lr = parseFloat(e.target.value); document.getElementById('reg-lr-val').textContent = lr.toFixed(3); });
      document.getElementById('reg-train').addEventListener('click', () => {
        isTraining = !isTraining;
        document.getElementById('reg-train').textContent = isTraining ? 'Pause' : '▶  Train';
      });
      document.getElementById('reg-clear').addEventListener('click', () => { points = []; resizeAndDraw(); });
      document.getElementById('reg-reset').addEventListener('click', () => { buildReg(); resizeAndDraw(); });

      function animateReg() {
        if (!document.getElementById('reg-canvas')) return;
        if (isTraining && points.length > 1 && nn) {
          const data = points.map(p => ({ input: [p[0]], target: [(p[1] + 1) / 2] })); // normalize Y to 0-1
          for (let i = 0; i < 10; i++) nn.trainEpoch(data, lr);
          if (document.getElementById('reg-epoch')) document.getElementById('reg-epoch').textContent = nn.epoch;
          if (document.getElementById('reg-loss')) document.getElementById('reg-loss').textContent = nn.totalLoss.toFixed(4);
          resizeAndDraw();
        }
        requestAnimationFrame(animateReg);
      }

      buildReg(); setTimeout(resizeAndDraw, 50);
      requestAnimationFrame(animateReg);
    }
  },

  // ===== Digit Recognition =====
  digits: {
    title: 'Digit Recognition',
    subtitle: 'Draw digits on a tiny grid, train the network with your own handwriting, then test it!',
    render(container) {
      container.innerHTML = `
        <div class="content-card">
          <div class="content-card__text">
            <strong>How to use:</strong><br>
            1. Select a digit (0-9) from the dropdown<br>
            2. Draw it on the 8×8 grid<br>
            3. Click "Add to Training Set" to save it<br>
            4. Repeat for several digits (3-5 drawings each works best)<br>
            5. Click "Train" and then draw new digits to test!
          </div>
        </div>

        <div class="controls-row" style="align-items: center;">
          <div class="control-group" style="max-width: 120px;">
            <div class="control-label"><span>I'm drawing:</span></div>
            <select id="digit-label">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<option value="${d}">${d}</option>`).join('')}</select>
          </div>
          <div class="btn-group" style="margin:0; flex-wrap: nowrap;">
            <button class="btn btn--secondary btn--small" id="digit-add">+ Add Sample</button>
            <button class="btn btn--primary btn--small" id="digit-train">Train (100 epochs)</button>
            <button class="btn btn--secondary btn--small" id="digit-clear">Clear Grid</button>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat"><div class="stat__value" id="digit-samples">0</div><div class="stat__label">Training Samples</div></div>
          <div class="stat"><div class="stat__value" id="digit-epochs">0</div><div class="stat__label">Epochs Trained</div></div>
          <div class="stat"><div class="stat__value" id="digit-guess" style="font-size: 1.5rem;">—</div><div class="stat__label">Network's Guess</div></div>
        </div>

        <div style="display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.7rem; color: var(--text-dim); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em;">Draw Here (8×8 grid)</div>
            <canvas id="digit-canvas" width="160" height="160" class="draw-pad" style="width:160px;height:160px;"></canvas>
          </div>
          <div style="flex: 1; min-width: 200px;">
            <div style="font-size: 0.7rem; color: var(--text-dim); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em;">Confidence per digit</div>
            <div class="confidence-bars" id="digit-bars">
              ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `
                <div class="confidence-row" id="conf-row-${d}">
                  <div class="confidence-row__label">${d}</div>
                  <div class="confidence-row__bar"><div class="confidence-row__fill" id="conf-fill-${d}" style="width:10%"></div></div>
                  <div class="confidence-row__val" id="conf-val-${d}">0%</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="callout callout--tip" style="margin-top: 16px;">
          <strong>Tip:</strong> Draw simple, centered digits. Add at least 3 examples per digit for best results. The network has 64 inputs (one per pixel), so simple shapes work best!
        </div>
      `;

      const gridSize = 8, cellSize = 20;
      const cnv = document.getElementById('digit-canvas');
      const ctx = cnv.getContext('2d');
      let grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
      let isDrawing = false;
      let trainingData = [];
      let nn = new NeuralNetwork([64, 32, 16, 10], 'relu');

      function drawGrid() {
        ctx.clearRect(0, 0, 160, 160);
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const v = grid[y][x];
            ctx.fillStyle = `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})`;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.strokeStyle = 'rgba(79,143,255,0.1)'; ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }

      function paint(e) {
        const rect = cnv.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
        grid[y][x] = 1;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize) grid[ny][nx] = Math.max(grid[ny][nx], 0.3);
        }
        drawGrid(); predict();
      }

      cnv.addEventListener('mousedown', e => { isDrawing = true; paint(e); });
      cnv.addEventListener('mousemove', e => { if (isDrawing) paint(e); });
      cnv.addEventListener('mouseup', () => isDrawing = false);
      cnv.addEventListener('mouseleave', () => isDrawing = false);

      function getFlat() { return grid.flat(); }

      function predict() {
        const out = nn.forward(getFlat());
        let maxIdx = 0, maxVal = 0;
        for (let i = 0; i < 10; i++) {
          const v = out[i];
          if (v > maxVal) { maxVal = v; maxIdx = i; }
          document.getElementById(`conf-fill-${i}`).style.width = (v * 100) + '%';
          document.getElementById(`conf-val-${i}`).textContent = (v * 100).toFixed(0) + '%';
          document.getElementById(`conf-row-${i}`).className = 'confidence-row';
        }
        document.getElementById(`conf-row-${maxIdx}`).className = 'confidence-row confidence-row--top';
        document.getElementById('digit-guess').textContent = maxIdx;
      }

      document.getElementById('digit-add').addEventListener('click', () => {
        const label = parseInt(document.getElementById('digit-label').value);
        const target = Array(10).fill(0); target[label] = 1;
        trainingData.push({ input: getFlat(), target });
        document.getElementById('digit-samples').textContent = trainingData.length;
        grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
        drawGrid();
      });

      document.getElementById('digit-train').addEventListener('click', () => {
        if (trainingData.length === 0) return;
        for (let i = 0; i < 100; i++) nn.trainEpoch(trainingData, 0.1);
        document.getElementById('digit-epochs').textContent = nn.epoch;
        predict();
      });

      document.getElementById('digit-clear').addEventListener('click', () => {
        grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
        drawGrid(); predict();
      });

      drawGrid(); predict();
    }
  },

  // ===== Color Mixer =====
  colors: {
    title: 'Color Mixer',
    subtitle: 'Pick target colors and teach the network to reproduce them from scratch!',
    render(container) {
      container.innerHTML = `
        <div class="content-card">
          <div class="content-card__text">
            <strong>How it works:</strong> The network takes a color's <em>index number</em> as input and tries to output the correct R, G, B values.
            Add some colors, then train. The "Network" swatch shows what the network currently produces for each index.
          </div>
        </div>

        <div class="controls-row" style="align-items: center;">
          <div class="control-group" style="max-width: 160px;">
            <div class="control-label"><span>Pick a Color</span></div>
            <input type="color" id="color-picker" value="#4f8fff" style="width:100%; height: 38px; border: 1px solid var(--border-glass); border-radius: var(--radius-sm); background: var(--bg-card); cursor: pointer; padding: 2px;">
          </div>
          <div class="btn-group" style="margin: 0;">
            <button class="btn btn--secondary btn--small" id="color-add">+ Add Color</button>
            <button class="btn btn--primary btn--small" id="color-train">Train (500 epochs)</button>
            <button class="btn btn--danger btn--small" id="color-reset">↺ Reset</button>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat"><div class="stat__value" id="color-count">0</div><div class="stat__label">Colors Added</div></div>
          <div class="stat"><div class="stat__value" id="color-epochs">0</div><div class="stat__label">Epochs</div></div>
          <div class="stat"><div class="stat__value" id="color-loss">—</div><div class="stat__label">Loss</div></div>
        </div>

        <div id="color-pairs" style="display:flex; flex-wrap:wrap; gap:20px; margin-top:16px;"></div>

        <div class="callout callout--info" style="margin-top: 16px;" id="color-tip">
          Add some colors and click Train to see the network learn to reproduce them!
        </div>
      `;

      let colors = [];
      let nn = new NeuralNetwork([1, 16, 12, 3], 'sigmoid');

      function hexToRGB(hex) { return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255]; }

      function renderColors() {
        const cont = document.getElementById('color-pairs');
        if (!cont) return;
        cont.innerHTML = '';
        colors.forEach((color, idx) => {
          const predicted = nn.forward([idx / Math.max(colors.length - 1, 1)]);
          const pr = Math.round(predicted[0] * 255), pg = Math.round(predicted[1] * 255), pb = Math.round(predicted[2] * 255);
          cont.innerHTML += `
            <div style="display:flex; flex-direction:column; align-items:center;">
              <div class="color-preview-row">
                <div><div class="color-swatch" style="background:${color}"></div><div class="color-swatch__label">Target</div></div>
                <div class="color-arrow">→</div>
                <div><div class="color-swatch" style="background:rgb(${pr},${pg},${pb})"></div><div class="color-swatch__label">Network</div></div>
              </div>
            </div>
          `;
        });
        document.getElementById('color-count').textContent = colors.length;
      }

      document.getElementById('color-add').addEventListener('click', () => { colors.push(document.getElementById('color-picker').value); renderColors(); });
      document.getElementById('color-train').addEventListener('click', () => {
        if (!colors.length) return;
        const data = colors.map((hex, idx) => ({ input: [idx / Math.max(colors.length - 1, 1)], target: hexToRGB(hex) }));
        for (let i = 0; i < 500; i++) nn.trainEpoch(data, 0.5);
        document.getElementById('color-epochs').textContent = nn.epoch;
        document.getElementById('color-loss').textContent = nn.totalLoss.toFixed(4);
        renderColors();
        document.getElementById('color-tip').innerHTML = nn.totalLoss < 0.01
          ? '<strong>The network learned your colors!</strong> Try adding more.'
          : '<strong>Getting closer!</strong> Click Train again for more epochs.';
      });
      document.getElementById('color-reset').addEventListener('click', () => {
        colors = []; nn = new NeuralNetwork([1, 16, 12, 3], 'sigmoid');
        renderColors();
        document.getElementById('color-epochs').textContent = '0';
        document.getElementById('color-loss').textContent = '—';
      });

      renderColors();
    }
  }
};

window.DemoContent = DemoContent;

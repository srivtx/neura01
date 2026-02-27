// ============================================
// chapters.js — 9-Chapter Builder's Guide
// ============================================

// Helpers
function cb(title, badge, code) {
  return `<div class="code-block"><div class="code-block__header"><span class="code-block__title">${title}</span>${badge ? `<span class="code-block__badge">${badge}</span>` : ''}</div><pre>${code}</pre></div>`;
}
function initViz(id, sizes, act) {
  const c = document.getElementById(id); if (!c) return {};
  const nn = new NeuralNetwork(sizes, act || 'sigmoid');
  const viz = new NetworkVisualizer(c);
  setTimeout(() => { viz.setNetwork(nn); viz.draw(performance.now()); }, 60);
  return { viz, nn };
}
function sandbox(prefix, opts) {
  const o = Object.assign({ ds: 'xor', arch: [2, 6, 4, 1], act: 'sigmoid', outMode: 'sigmoid' }, opts);
  let nn, data, isT = false, lr = 0.5, viz, chart, fc = 0;
  function init() {
    nn = new NeuralNetwork(o.arch, o.act, o.outMode);
    data = Datasets[o.ds].generate();
    chart = new LossChart(document.getElementById(prefix + '-chart'));
    viz = new NetworkVisualizer(document.getElementById(prefix + '-net'));
    setTimeout(() => { viz.setNetwork(nn); viz.draw(performance.now()); drawB(); }, 60);
    isT = false; const tb = document.getElementById(prefix + '-train'); if (tb) tb.textContent = '▶ Train'; upd();
  }
  function upd() {
    const ep = document.getElementById(prefix + '-epoch'), lo = document.getElementById(prefix + '-loss'), ac = document.getElementById(prefix + '-acc');
    if (!ep) return;
    ep.textContent = nn.epoch; lo.textContent = nn.totalLoss.toFixed(4);
    if (ac) { let c = 0; for (const s of data) { const p = nn.forward(s.input); if (o.outMode === 'softmax') { const pi = p.indexOf(Math.max(...p)), ti = s.target.indexOf(Math.max(...s.target)); if (pi === ti) c++; } else { if ((p[0] > 0.5 ? 1 : 0) === s.target[0]) c++; } } ac.textContent = ((c / data.length) * 100).toFixed(0) + '%'; }
  }
  function drawB() {
    const cv = document.getElementById(prefix + '-bdry'); if (!cv || !nn) return;
    const ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), w = r.width, h = r.height;
    if (w < 10) return; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const res = 4;
    for (let px = 0; px < w; px += res)for (let py = 0; py < h; py += res) {
      const out = nn.forward([-1.2 + (px / w) * 2.4, -1.2 + (py / h) * 2.4])[0];
      ctx.fillStyle = `rgba(${Math.round(20 + out * 60)},${Math.round(40 + out * 120)},${Math.round(180 - out * 100)},0.85)`;
      ctx.fillRect(px, py, res, res);
    }
    for (const s of data) {
      const px = ((s.input[0] + 1.2) / 2.4) * w, py = ((s.input[1] + 1.2) / 2.4) * h;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fillStyle = s.target[0] > 0.5 ? '#4f8fff' : '#ff8c32'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  function anim(t) {
    if (!document.getElementById(prefix + '-net')) return;
    if (isT && nn) {
      for (let i = 0; i < 5; i++) { nn.trainEpoch(data, lr); chart.addPoint(nn.totalLoss); }
      nn.forward(data[Math.floor(Math.random() * data.length)].input);
      if (fc % 5 === 0) viz.triggerForwardAnimation(); upd(); if (fc % 6 === 0) drawB(); fc++;
    }
    if (viz) viz.draw(t); if (chart) chart.draw(); requestAnimationFrame(anim);
  }
  return { init, upd, drawB, anim, get nn() { return nn; }, set isT(v) { isT = v; }, get isT() { return isT; }, set lr(v) { lr = v; }, set ds(v) { o.ds = v; }, set arch(v) { o.arch = v; } };
}
function sandboxHTML(prefix, extraControls = '') {
  return `<div class="sandbox">
    <div class="sandbox__main">
      <div class="stats-bar">
        <div class="stat"><div class="stat__value" id="${prefix}-epoch">0</div><div class="stat__label">Epoch</div></div>
        <div class="stat"><div class="stat__value" id="${prefix}-loss">—</div><div class="stat__label">Loss</div></div>
        <div class="stat"><div class="stat__value" id="${prefix}-acc">50%</div><div class="stat__label">Accuracy</div></div>
      </div>
      <div class="viz-area" style="height:280px;"><div class="viz-area__label">Network</div><canvas id="${prefix}-net" style="width:100%;height:240px;"></canvas></div>
      ${extraControls}
      <div class="btn-group"><button class="btn btn--primary" id="${prefix}-train">▶ Train</button><button class="btn btn--danger" id="${prefix}-reset">↺ Reset</button></div>
    </div>
    <div class="sandbox__side">
      <div class="sandbox-section"><div class="sandbox-section__title">Decision Boundary</div><div class="boundary-canvas-wrap"><canvas id="${prefix}-bdry"></canvas></div></div>
      <div class="sandbox-section"><div class="sandbox-section__title">Loss Chart</div><div class="loss-chart-wrap"><canvas id="${prefix}-chart"></canvas></div></div>
    </div>
  </div>`;
}
function wireTrainBtn(prefix, sb) {
  document.getElementById(prefix + '-train').addEventListener('click', () => { sb.isT = !sb.isT; document.getElementById(prefix + '-train').textContent = sb.isT ? '⏸ Pause' : '▶ Train'; });
  document.getElementById(prefix + '-reset').addEventListener('click', () => { sb.isT = false; sb.init(); });
}

const ChapterContent = {
  // ===== PART 1: BUILDING BLOCKS =====
  ch1: {
    number: 'Chapter 1', title: 'The Neuron', subtitle: 'The smallest building block of intelligence — and surprisingly simple.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🤔 Start With an Analogy</div>
        <div class="content-card__text">Imagine you're deciding whether to bring an umbrella. You check two things:<br><br>
        📡 <strong>Signal 1:</strong> How cloudy is it? (let's say 0.8 = very cloudy)<br>
        📻 <strong>Signal 2:</strong> What did the forecast say? (0.6 = 60% chance of rain)<br><br>
        But you trust the forecast <em>more than your eyes</em>. So you give it more <strong>weight</strong>. Maybe cloudiness gets weight 0.3, but the forecast gets weight 0.7.<br><br>
        You multiply each signal by its weight, add them up, and get a single number. That number tells you: bring the umbrella or don't.</div>
        <div class="callout callout--tip"><strong>💡 That's literally what a neuron does.</strong> It takes inputs, weighs how much each one matters, adds them up, and produces one output.</div>
      </div>

      <div class="content-card"><div class="content-card__title">🔍 What's Actually Happening — Step by Step</div>
        <div class="content-card__text">A neuron has 4 parts. Here's <em>what each does and why it exists</em>:</div>
        <div class="math-block">output = sigmoid( x₁×w₁ + x₂×w₂ + bias )</div>
        <div class="content-card__text">
        <strong>Step 1: Inputs (x₁, x₂)</strong> — the raw signals entering the neuron. Could be anything: pixel values, sensor data, or outputs from other neurons.<br><br>
        <strong>Step 2: Weights (w₁, w₂)</strong> — these are the neuron's <em>opinion</em> about each input. A large positive weight means "I trust this input a lot." A negative weight means "this input pushes me in the opposite direction." <strong>Why random at first?</strong> Because the neuron hasn't learned yet — it starts with guesses and adjusts over time.<br><br>
        <strong>Step 3: Bias (b)</strong> — this is the neuron's <em>default tendency</em>. A positive bias means "I lean toward saying yes, even before seeing any data." Think of it as your personality — are you an optimist or pessimist about rain? <strong>Why do we need this?</strong> Without bias, the neuron can only draw decision lines that pass through the origin. Bias lets it shift the line anywhere.<br><br>
        <strong>Step 4: Activation (sigmoid)</strong> — the weighted sum could be ANY number (-∞ to +∞). Sigmoid squishes it into 0-1, giving us a clean probability. <strong>Why not just use the raw sum?</strong> Because "42.7" isn't a useful answer — we want "87% confident it will rain."</div>
      </div>

      <div class="content-card"><div class="content-card__title">⚡ Play With a Live Neuron</div>
        <div class="content-card__text" style="font-size:.82rem;color:var(--text-secondary);">Drag the sliders to see how each part affects the output. Try: make w₁ negative — what happens? Set bias to 2 — what changes?</div>
        <div class="viz-area" style="min-height:240px;"><div class="neuron-viz" id="n1-viz">
          <div class="neuron-inputs">
            <div class="neuron-input-row"><label>x₁</label><input type="range" min="-2" max="2" step="0.1" value="1" data-t="i" data-i="0"><span class="val" data-d="i0">1.0</span></div>
            <div class="neuron-input-row"><label>w₁</label><input type="range" min="-2" max="2" step="0.1" value="0.5" data-t="w" data-i="0"><span class="val" data-d="w0">0.5</span></div>
            <div class="neuron-input-row"><label>x₂</label><input type="range" min="-2" max="2" step="0.1" value="0.5" data-t="i" data-i="1"><span class="val" data-d="i1">0.5</span></div>
            <div class="neuron-input-row"><label>w₂</label><input type="range" min="-2" max="2" step="0.1" value="-0.3" data-t="w" data-i="1"><span class="val" data-d="w1">-0.3</span></div>
            <div class="neuron-input-row"><label>b</label><input type="range" min="-2" max="2" step="0.1" value="0" data-t="b"><span class="val" data-d="b">0.0</span></div>
          </div>
          <div class="neuron-body"><div class="neuron-circle" id="n1-circ"><span class="neuron-circle__label">Σ→σ</span><span class="neuron-circle__value" id="n1-raw">0.35</span></div></div>
          <div class="neuron-output"><div class="neuron-output__label">Output</div><div class="neuron-output__value" id="n1-out">0.587</div><div class="neuron-output__bar"><div class="neuron-output__bar-fill" id="n1-bar" style="width:58.7%"></div></div></div>
        </div></div>
      </div>

      <div class="content-card"><div class="content-card__title">💻 Now Let's Write It in Code</div>
        <div class="content-card__text" style="font-size:.82rem;color:var(--text-secondary);">Now that you understand each piece, here's how to express it as code. Notice how each line maps to a step above.</div>
        ${cb('sigmoid — the confidence meter', 'step 4', `<span class="cm">// Why sigmoid? It turns any number into a probability (0 to 1)</span>
<span class="cm">// Input: -∞ to +∞  →  Output: 0 to 1</span>
<span class="cm">// -5 → 0.007 (very unlikely)  |  0 → 0.5 (coin flip)  |  5 → 0.993 (very likely)</span>
<span class="kw">function</span> <span class="fn">sigmoid</span>(x) {
  <span class="kw">return</span> <span class="num">1</span> / (<span class="num">1</span> + Math.<span class="fn">exp</span>(-x));
}`)}
        ${cb('the neuron — all 4 steps together', 'complete', `<span class="kw">class</span> <span class="fn">Neuron</span> {
  <span class="fn">constructor</span>(numInputs) {
    <span class="cm">// Step 2: Start with random weights (the neuron's initial guesses)</span>
    <span class="cm">// Why random? If all weights were the same, every neuron</span>
    <span class="cm">// would learn the exact same thing — useless!</span>
    <span class="this">this</span>.<span class="prop">weights</span> = Array.from({length: numInputs},
      () <span class="op">=></span> Math.<span class="fn">random</span>() * <span class="num">2</span> - <span class="num">1</span>);
    <span class="cm">// Step 3: Bias starts at 0 (no default tendency yet)</span>
    <span class="this">this</span>.<span class="prop">bias</span> = <span class="num">0</span>;
  }
  <span class="fn">forward</span>(inputs) {
    <span class="cm">// Step 1+2: Multiply each input by its weight, sum them</span>
    <span class="kw">let</span> sum = <span class="this">this</span>.<span class="prop">bias</span>; <span class="cm">// start with bias (step 3)</span>
    <span class="kw">for</span> (<span class="kw">let</span> i = <span class="num">0</span>; i < inputs.length; i++)
      sum += inputs[i] * <span class="this">this</span>.<span class="prop">weights</span>[i];
    <span class="cm">// Step 4: Squish through sigmoid to get probability</span>
    <span class="kw">return</span> <span class="fn">sigmoid</span>(sum);
  }
}`)}
      </div>`;
      const s = { i: [1, .5], w: [.5, -.3], b: 0 }, sig = x => 1 / (1 + Math.exp(-x));
      function upd() { const r = s.i[0] * s.w[0] + s.i[1] * s.w[1] + s.b, o = sig(r); document.getElementById('n1-raw').textContent = r.toFixed(2); document.getElementById('n1-out').textContent = o.toFixed(3); document.getElementById('n1-bar').style.width = (o * 100) + '%'; const cr = Math.round(30 + o * 200), cg = Math.round(60 + (1 - Math.abs(o - .5) * 2) * 140), cb = Math.round(200 - o * 160); const ci = document.getElementById('n1-circ'); ci.style.background = `rgb(${cr},${cg},${cb})`; ci.style.boxShadow = `0 0 30px rgba(${cr},${cg},${cb},0.4)`; }
      c.querySelectorAll('input[type="range"]').forEach(sl => { sl.addEventListener('input', e => { const t = e.target.dataset.t, i = +e.target.dataset.i, v = +e.target.value; if (t === 'i') { s.i[i] = v; c.querySelector(`[data-d="i${i}"]`).textContent = v.toFixed(1); } else if (t === 'w') { s.w[i] = v; c.querySelector(`[data-d="w${i}"]`).textContent = v.toFixed(1); } else { s.b = v; c.querySelector('[data-d="b"]').textContent = v.toFixed(1); } upd(); }); }); upd();
    }
  },

  ch2: {
    number: 'Chapter 2', title: 'Wiring a Network', subtitle: 'One neuron is smart. A group of connected neurons is brilliant.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🤔 Why Not Just One Neuron?</div>
        <div class="content-card__text">A single neuron can only draw a <strong>straight line</strong> to separate things. It can tell apart "big vs small" — but it CAN'T solve anything that requires a <em>curved</em> boundary.<br><br>
        Think of it like this: one worker in a factory can only do one simple task. But if you <strong>organize workers into an assembly line</strong>, each doing one step, they can build something complex.<br><br>
        That's what layers do. Each layer transforms the data a little bit, and together they can learn incredibly complex patterns.</div>
      </div>

      <div class="content-card"><div class="content-card__title">🔍 The Three Layer Types</div>
        <div class="content-card__text">
        🟢 <strong>Input Layer</strong> — doesn't compute anything. It just passes your raw data in. Think of it as the factory's loading dock — data arrives here.<br><br>
        🔵 <strong>Hidden Layers</strong> — the "workers." Each neuron here takes ALL outputs from the previous layer (that's why it's called "fully connected"), processes them, and passes its output forward. <strong>Why ALL inputs?</strong> Because each neuron might discover a different useful combination. One might learn "cloudiness + humidity", another might learn "wind speed - temperature."<br><br>
        🟠 <strong>Output Layer</strong> — the final answer. For yes/no: 1 neuron. For "is it a cat, dog, or bird?": 3 neurons (one per class).<br><br>
        <strong>Why hidden layers learn different things at different depths:</strong><br>
        • Layer 1: learns simple features (edges, basic patterns)<br>
        • Layer 2: combines those into complex features (shapes, curves)<br>
        • Layer 3: combines THOSE into even higher-level concepts (faces, objects)</div>
      </div>

      <div class="content-card"><div class="content-card__title">💻 Code: Building Layers</div>
        <div class="content-card__text" style="font-size:.82rem;color:var(--text-secondary);">A Layer is just a group of neurons. A Network is just a stack of layers. The magic is in the connections.</div>
        ${cb('layer — a row of neurons', 'factory workers', `<span class="kw">class</span> <span class="fn">Layer</span> {
  <span class="fn">constructor</span>(numNeurons, inputsPerNeuron) {
    <span class="cm">// Each neuron in this layer receives ALL outputs</span>
    <span class="cm">// from the previous layer — that's "fully connected"</span>
    <span class="this">this</span>.<span class="prop">neurons</span> = [];
    <span class="kw">for</span> (<span class="kw">let</span> i = <span class="num">0</span>; i < numNeurons; i++)
      <span class="this">this</span>.<span class="prop">neurons</span>.<span class="fn">push</span>(<span class="kw">new</span> <span class="fn">Neuron</span>(inputsPerNeuron));
  }
  <span class="fn">forward</span>(inputs) {
    <span class="cm">// Ask every neuron: "what do YOU think about this data?"</span>
    <span class="kw">return</span> <span class="this">this</span>.<span class="prop">neurons</span>.<span class="fn">map</span>(n <span class="op">=></span> n.<span class="fn">forward</span>(inputs));
  }
}`)}
        ${cb('neural network — the assembly line', 'complete', `<span class="kw">class</span> <span class="fn">NeuralNetwork</span> {
  <span class="fn">constructor</span>(sizes) { <span class="cm">// e.g. [2, 4, 1] = 2 inputs, 4 hidden, 1 output</span>
    <span class="this">this</span>.<span class="prop">layers</span> = [];
    <span class="kw">for</span> (<span class="kw">let</span> i = <span class="num">1</span>; i < sizes.length; i++)
      <span class="cm">// Each layer's neurons need as many inputs as</span>
      <span class="cm">// the previous layer has neurons (fully connected!)</span>
      <span class="this">this</span>.<span class="prop">layers</span>.<span class="fn">push</span>(<span class="kw">new</span> <span class="fn">Layer</span>(sizes[i], sizes[i-<span class="num">1</span>]));
  }
  <span class="fn">forward</span>(inputs) {
    <span class="cm">// Pass data through each layer in sequence</span>
    <span class="cm">// Output of layer 1 becomes input to layer 2, etc.</span>
    <span class="kw">let</span> out = inputs;
    <span class="kw">for</span> (<span class="kw">const</span> layer <span class="kw">of</span> <span class="this">this</span>.<span class="prop">layers</span>)
      out = layer.<span class="fn">forward</span>(out);
    <span class="kw">return</span> out;
  }
}`)}
      </div>

      <div class="content-card"><div class="content-card__title">🔧 Build Your Own Architecture</div>
        <div class="content-card__text" style="font-size:.82rem;color:var(--text-secondary);">Add layers, change sizes — watch how the network structure changes. More neurons = more connections = more capacity to learn patterns.</div>
        <div id="ch2-layers"></div>
        <button class="btn btn--secondary btn--small" id="ch2-add" style="margin:8px 0;">+ Add Layer</button>
        <div class="viz-area" style="height:280px;"><div class="viz-area__label">Your Network</div><canvas id="ch2-canvas" style="width:100%;height:240px;"></canvas></div>
        <div class="stats-bar">
          <div class="stat"><div class="stat__value" id="ch2-n">7</div><div class="stat__label">Neurons</div></div>
          <div class="stat"><div class="stat__value" id="ch2-w">12</div><div class="stat__label">Connections</div></div>
        </div>
      </div>`;
      let hl = [4];
      function rebuild() { const sz = [2, ...hl, 1]; initViz('ch2-canvas', sz); let n = sz.reduce((a, b) => a + b, 0), w = 0; for (let i = 0; i < sz.length - 1; i++)w += sz[i] * sz[i + 1]; document.getElementById('ch2-n').textContent = n; document.getElementById('ch2-w').textContent = w; renderL(); }
      function renderL() { const el = document.getElementById('ch2-layers'); el.innerHTML = ''; hl.forEach((s, i) => { const r = document.createElement('div'); r.className = 'layer-row'; r.innerHTML = `<span class="layer-row__label">Hidden ${i + 1}</span><input type="range" class="layer-row__slider" min="1" max="8" value="${s}"><span class="layer-row__value">${s}</span>${hl.length > 1 ? '<button class="layer-row__remove">✕</button>' : ''}`; el.appendChild(r); r.querySelector('.layer-row__slider').addEventListener('input', e => { hl[i] = +e.target.value; r.querySelector('.layer-row__value').textContent = e.target.value; rebuild(); }); const rm = r.querySelector('.layer-row__remove'); if (rm) rm.addEventListener('click', () => { hl.splice(i, 1); rebuild(); }); }); }
      document.getElementById('ch2-add').addEventListener('click', () => { if (hl.length < 5) { hl.push(3); rebuild(); } }); rebuild();
    }
  },

  ch3: {
    number: 'Chapter 3', title: 'How Networks Learn', subtitle: 'The network starts dumb. Loss, gradients, and backpropagation make it smart.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🤔 The Big Picture</div>
        <div class="content-card__text">Right now, our network has <strong>random weights</strong>. It's like a student who guesses randomly on a test. Learning means:<br><br>
        1️⃣ <strong>Take the test</strong> (run data through the network)<br>
        2️⃣ <strong>Grade it</strong> (measure how wrong the answers are)<br>
        3️⃣ <strong>Review mistakes</strong> (figure out WHICH weights caused the errors)<br>
        4️⃣ <strong>Study & improve</strong> (adjust those weights slightly)<br><br>
        That's it. The entire field of deep learning is just these 4 steps, repeated millions of times.</div>
      </div>

      <div class="content-card"><div class="content-card__title">📏 Step 1: Measure the Error (Loss)</div>
        <div class="content-card__text"><strong>Loss = how wrong is the prediction.</strong> We compare what the network outputs to what the correct answer should be.<br><br>
        <strong>Why square the difference?</strong> Two reasons: (1) It makes all errors positive — a prediction of 0.3 when the answer is 1.0 is just as "wrong" as 1.7. (2) It punishes big mistakes more than small ones — being off by 0.5 is penalized 4× more than being off by 0.25.</div>
        <div class="math-block">Loss = (predicted − actual)²</div>
        ${cb('loss function — the grader', 'grading the test', `<span class="cm">// How far off is our prediction from the truth?</span>
<span class="cm">// Lower = better.  0 = perfect!</span>
<span class="kw">function</span> <span class="fn">loss</span>(predicted, actual) {
  <span class="kw">let</span> sum = <span class="num">0</span>;
  <span class="kw">for</span> (<span class="kw">let</span> i = <span class="num">0</span>; i < predicted.length; i++)
    sum += (predicted[i] - actual[i]) ** <span class="num">2</span>;
  <span class="kw">return</span> sum / predicted.length;
}
<span class="cm">// loss([0.9], [1.0]) → 0.01  (close! good job)</span>
<span class="cm">// loss([0.2], [1.0]) → 0.64  (way off! needs work)</span>`)}
        <div class="content-card__text" style="font-size:.82rem;color:var(--text-secondary);">Try it — drag the predicted value and watch the loss change:</div>
        <div style="display:flex;align-items:center;gap:30px;padding:20px;justify-content:center;">
          <div style="text-align:center;"><div style="font-size:.65rem;color:var(--text-dim);">TARGET</div><div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;color:var(--accent-green);">1.0</div></div>
          <div style="text-align:center;"><div style="font-size:.65rem;color:var(--text-dim);">PREDICTED</div><div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;color:var(--accent-blue);" id="c3p">0.50</div><input type="range" id="c3s" min="0" max="1" step="0.01" value="0.5" style="width:120px;"></div>
          <div style="text-align:center;"><div style="font-size:.65rem;color:var(--text-dim);">LOSS</div><div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;" id="c3l">0.250</div></div>
        </div>
      </div>

      <div class="content-card"><div class="content-card__title">⏪ Step 2: Backpropagation (Blame Assignment)</div>
        <div class="content-card__text">We know the output is wrong. But the network has <em>hundreds</em> of weights. <strong>Which ones caused the mistake?</strong><br><br>
        Think of a GPS: you took a wrong turn and ended up lost. The GPS doesn't just say "you're wrong" — it traces back through your route to find <em>exactly which turn</em> was the bad one, and tells you how much to correct.<br><br>
        <strong>That's backpropagation.</strong> Starting from the output (where we know the error), we trace backwards through each layer using calculus (the chain rule). Each weight gets a <strong>gradient</strong> — a number that says "this is how much YOU contributed to the error, and which direction to adjust."</div>
        ${cb('backward pass — assigning blame', 'the GPS', `<span class="cm">// Output layer: we know the error directly</span>
<span class="cm">// gradient = (predicted - target) × sigmoid_derivative</span>
<span class="cm">// This tells the output neuron: "you were THIS wrong,</span>
<span class="cm">// and you were THIS sensitive to changes"</span>
<span class="kw">const</span> gradient = (predicted - target) * sigmoidDeriv(predicted);

<span class="cm">// Hidden layers: trace the blame backwards</span>
<span class="cm">// Each hidden neuron's gradient = sum of downstream blame</span>
<span class="cm">// × how much this neuron affected those downstream neurons</span>
<span class="kw">for</span> (<span class="kw">each</span> hidden neuron) {
  gradient = sumOf(next.gradient * weight) * sigmoidDeriv(output);
}

<span class="cm">// Update: nudge each weight OPPOSITE to its gradient</span>
<span class="cm">// Why opposite? Because the gradient points toward MORE error</span>
<span class="cm">// — we want to go the other way, toward LESS error</span>
weight -= learningRate * gradient * input;`)}
        <div class="callout callout--tip"><strong>💡 The learning rate</strong> controls how big each adjustment is. Too big = you overshoot the answer and bounce around. Too small = learning takes forever. It's like the GPS saying "turn 90°" vs "turn 5°."</div>
      </div>`;
      document.getElementById('c3s').addEventListener('input', e => { const p = +e.target.value, l = (p - 1) ** 2; document.getElementById('c3p').textContent = p.toFixed(2); document.getElementById('c3l').textContent = l.toFixed(3); document.getElementById('c3l').style.color = l < .01 ? 'var(--accent-green)' : l < .1 ? 'var(--accent-orange)' : 'var(--accent-red)'; });
    }
  },

  ch4: {
    number: 'Chapter 4', title: 'The Training Recipe', subtitle: 'Forward → Loss → Backward → Update → Repeat. This is the loop that makes AI work.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🤔 Why a Loop?</div>
        <div class="content-card__text">Think of learning a sport. You don't become good after one try. You <strong>practice</strong> — try a shot, see if it missed, adjust your technique, try again. Over hundreds of repetitions, you get better.<br><br>
        A neural network learns the exact same way. One pass through the data barely changes anything. But <strong>thousands of passes</strong> (called <em>epochs</em>), each making tiny improvements, eventually produce something that works.</div>
      </div>

      <div class="content-card"><div class="content-card__title">🔄 The Complete Loop</div>
        <div class="content-card__text" style="font-size:.82rem;color:var(--text-secondary);">This code ties together everything from Chapters 1-3. Each line maps to a concept you already understand:</div>
        ${cb('the training loop', 'everything together', `<span class="kw">function</span> <span class="fn">train</span>(network, data, lr, epochs) {
  <span class="kw">for</span> (<span class="kw">let</span> e = <span class="num">0</span>; e < epochs; e++) {
    <span class="kw">let</span> totalLoss = <span class="num">0</span>;
    <span class="cm">// Why shuffle? If data always comes in the same order,</span>
    <span class="cm">// the network might memorize the ORDER instead of</span>
    <span class="cm">// learning the actual PATTERNS. Shuffling prevents this.</span>
    <span class="kw">for</span> (<span class="kw">const</span> sample <span class="kw">of</span> <span class="fn">shuffle</span>(data)) {
      <span class="cm">// 1. FORWARD: feed data through the network (Ch1-2)</span>
      <span class="cm">//    Input → hidden layers → output prediction</span>
      <span class="kw">const</span> pred = network.<span class="fn">forward</span>(sample.input);
      <span class="cm">// 2. LOSS: how wrong was the prediction? (Ch3)</span>
      <span class="cm">//    Compares prediction to the correct answer</span>
      totalLoss += <span class="fn">loss</span>(pred, sample.target);
      <span class="cm">// 3. BACKWARD: which weights caused the error? (Ch3)</span>
      <span class="cm">//    Traces blame back through every layer</span>
      network.<span class="fn">backward</span>(sample.target);
      <span class="cm">// 4. UPDATE: nudge weights to reduce error</span>
      <span class="cm">//    lr = how big of a step to take</span>
      network.<span class="fn">updateWeights</span>(lr);
    }
    console.<span class="fn">log</span>(<span class="str">\`Epoch \${e}: \${totalLoss}\`</span>);
  }
}`)}
        <div class="content-card__text"><strong>The three decisions you make before training:</strong><br><br>
        📊 <strong>Learning rate (lr)</strong> — the step size. Too high? You overshoot and never converge. Too low? Training is painfully slow. Most people start at 0.01-0.5 and adjust.<br><br>
        🔁 <strong>Epochs</strong> — how many times to loop through all data. More epochs = more learning, but too many = the network memorizes the data instead of learning general patterns (overfitting).<br><br>
        🔀 <strong>Shuffle</strong> — randomize data order each epoch so the network can't cheat by memorizing sequences.</div>
      </div>

      <div class="content-card"><div class="content-card__title">🚀 Watch It Learn in Real-Time</div>
        <div class="content-card__text" style="font-size:.82rem;color:var(--text-secondary);">Hit Train and watch all 4 steps happen live. The loss drops, accuracy rises, and the decision boundary forms. Try changing the learning rate mid-training!</div>
        ${sandboxHTML('c4', `<div class="controls-row"><div class="control-group"><div class="control-label"><span>Learning Rate</span><span class="control-label__value" id="c4-lrv">0.50</span></div><input type="range" id="c4-lr" min="0.01" max="2" step="0.01" value="0.5"></div></div>`)}
      </div>`;
      const sb = sandbox('c4'); sb.init();
      document.getElementById('c4-lr').addEventListener('input', e => { sb.lr = +e.target.value; document.getElementById('c4-lrv').textContent = (+e.target.value).toFixed(2); });
      wireTrainBtn('c4', sb); requestAnimationFrame(sb.anim);
    }
  },

  // ===== PART 2: THE DECISION FRAMEWORK =====
  ch5: {
    number: 'Chapter 5', title: 'The Decision Framework', subtitle: 'I have a problem. What neural network should I build?',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🗺️ Choose Your Architecture</div>
        <div class="content-card__text">Every neural network design starts with <strong>3 questions</strong>:</div>
      </div>
      <div class="content-card"><div class="content-card__title">❓ Q1: What's your INPUT?</div>
        <div class="content-card__text" style="line-height:2.2;">
        📊 <strong>Numbers / table data</strong> → Feedforward network (this guide!)<br>
        🖼️ <strong>Images</strong> → Convolutional Neural Network (CNN)<br>
        📝 <strong>Text / sequences</strong> → Recurrent Neural Network (RNN) / Transformer<br>
        🔊 <strong>Audio</strong> → CNN on spectrograms or RNN</div>
      </div>
      <div class="content-card"><div class="content-card__title">❓ Q2: What's your OUTPUT?</div>
        <table style="width:100%;font-size:.85rem;border-collapse:collapse;">
          <tr style="border-bottom:1px solid var(--border-glass);"><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">OUTPUT TYPE</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">EXAMPLE</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">LAST LAYER</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">LOSS FUNCTION</th></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:10px;">Yes / No</td><td style="padding:10px;color:var(--text-secondary);">Spam detection</td><td style="padding:10px;"><code>1 neuron + sigmoid</code></td><td style="padding:10px;"><code>MSE or BCE</code></td></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:10px;">One of N classes</td><td style="padding:10px;color:var(--text-secondary);">Digit 0-9</td><td style="padding:10px;"><code>N neurons + softmax</code></td><td style="padding:10px;"><code>Cross-entropy</code></td></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:10px;">A number</td><td style="padding:10px;color:var(--text-secondary);">House price</td><td style="padding:10px;"><code>1 neuron + linear</code></td><td style="padding:10px;"><code>MSE</code></td></tr>
          <tr><td style="padding:10px;">Multiple numbers</td><td style="padding:10px;color:var(--text-secondary);">RGB color</td><td style="padding:10px;"><code>3 neurons + sigmoid</code></td><td style="padding:10px;"><code>MSE</code></td></tr>
        </table>
      </div>
      <div class="content-card"><div class="content-card__title">❓ Q3: How DEEP should it be?</div>
        <table style="width:100%;font-size:.85rem;border-collapse:collapse;">
          <tr style="border-bottom:1px solid var(--border-glass);"><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">PROBLEM</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">HIDDEN LAYERS</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">NEURONS</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">ACTIVATION</th></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:10px;">Simple (linear)</td><td style="padding:10px;">0-1</td><td style="padding:10px;">4-8</td><td style="padding:10px;">Sigmoid</td></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:10px;">Medium (XOR, circles)</td><td style="padding:10px;">1-2</td><td style="padding:10px;">6-16</td><td style="padding:10px;">ReLU or Sigmoid</td></tr>
          <tr><td style="padding:10px;">Complex (spirals)</td><td style="padding:10px;">2-4</td><td style="padding:10px;">16-64</td><td style="padding:10px;">ReLU</td></tr>
        </table>
      </div>
      <div class="content-card"><div class="content-card__title">🔧 Activation Functions Compared</div>
        <table style="width:100%;font-size:.85rem;border-collapse:collapse;">
          <tr style="border-bottom:1px solid var(--border-glass);"><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">FUNCTION</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">RANGE</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">GOOD FOR</th><th style="text-align:left;padding:10px;color:var(--text-dim);font-size:.7rem;">WATCH OUT</th></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:10px;"><strong>Sigmoid</strong></td><td style="padding:10px;">0 to 1</td><td style="padding:10px;">Output layer (probability)</td><td style="padding:10px;">Vanishing gradients in deep nets</td></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:10px;"><strong>ReLU</strong></td><td style="padding:10px;">0 to ∞</td><td style="padding:10px;">Hidden layers, deep networks</td><td style="padding:10px;">Dead neurons (output stuck at 0)</td></tr>
          <tr><td style="padding:10px;"><strong>Tanh</strong></td><td style="padding:10px;">-1 to 1</td><td style="padding:10px;">Hidden layers, centered data</td><td style="padding:10px;">Also vanishing gradients</td></tr>
        </table>
      </div>
      <div class="callout callout--info"><strong>🎯 Rule of thumb:</strong> Start simple. If it doesn't learn, add more layers or neurons. If it overfits, reduce size or add regularization.</div>`;
    }
  },

  // ===== PART 3: BUILD FROM SCRATCH =====
  ch6: {
    number: 'Project 1', title: 'XOR Classifier', subtitle: 'The "Hello World" of neural networks — teach a network to solve XOR.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🎯 The Problem</div>
        <div class="content-card__text"><strong>XOR</strong> (exclusive or): output 1 when inputs differ, 0 when they're the same.<br>A single neuron CAN'T solve this — you need a hidden layer. This is why neural networks exist!</div>
        <table style="width:200px;font-size:.85rem;border-collapse:collapse;margin:12px 0;">
          <tr style="border-bottom:1px solid var(--border-glass);"><th style="padding:8px;">x₁</th><th style="padding:8px;">x₂</th><th style="padding:8px;">Target</th></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:8px;text-align:center;">0</td><td style="padding:8px;text-align:center;">0</td><td style="padding:8px;text-align:center;color:var(--accent-red);">0</td></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:8px;text-align:center;">0</td><td style="padding:8px;text-align:center;">1</td><td style="padding:8px;text-align:center;color:var(--accent-green);">1</td></tr>
          <tr style="border-bottom:1px solid var(--border-glass);"><td style="padding:8px;text-align:center;">1</td><td style="padding:8px;text-align:center;">0</td><td style="padding:8px;text-align:center;color:var(--accent-green);">1</td></tr>
          <tr><td style="padding:8px;text-align:center;">1</td><td style="padding:8px;text-align:center;">1</td><td style="padding:8px;text-align:center;color:var(--accent-red);">0</td></tr>
        </table>
      </div>
      <div class="content-card"><div class="content-card__title">🏗️ Design Decisions</div>
        <div class="content-card__text">
        <strong>Architecture:</strong> [2, 6, 4, 1] — 2 inputs, two hidden layers (6 and 4), 1 output<br>
        <strong>Activation:</strong> Sigmoid (outputs are 0-1 probabilities)<br>
        <strong>Loss:</strong> MSE (comparing to 0 or 1)<br>
        <strong>Learning rate:</strong> 0.5 (aggressive, because the problem is small)</div>
        ${cb('setup', 'project', `<span class="kw">const</span> nn = <span class="kw">new</span> <span class="fn">NeuralNetwork</span>([<span class="num">2</span>, <span class="num">6</span>, <span class="num">4</span>, <span class="num">1</span>]);
<span class="kw">const</span> data = [
  { input: [<span class="num">0</span>,<span class="num">0</span>], target: [<span class="num">0</span>] },
  { input: [<span class="num">0</span>,<span class="num">1</span>], target: [<span class="num">1</span>] },
  { input: [<span class="num">1</span>,<span class="num">0</span>], target: [<span class="num">1</span>] },
  { input: [<span class="num">1</span>,<span class="num">1</span>], target: [<span class="num">0</span>] },
];
<span class="fn">train</span>(nn, data, <span class="num">0.5</span>, <span class="num">1000</span>);`)}
      </div>
      <div class="content-card"><div class="content-card__title">🚀 Train It</div>
        ${sandboxHTML('c6', `<div class="controls-row"><div class="control-group"><div class="control-label"><span>Learning Rate</span><span class="control-label__value" id="c6-lrv">0.50</span></div><input type="range" id="c6-lr" min="0.01" max="2" step="0.01" value="0.5"></div></div>`)}
      </div>`;
      const sb = sandbox('c6'); sb.init();
      document.getElementById('c6-lr').addEventListener('input', e => { sb.lr = +e.target.value; document.getElementById('c6-lrv').textContent = (+e.target.value).toFixed(2); });
      wireTrainBtn('c6', sb); requestAnimationFrame(sb.anim);
    }
  },

  ch7: {
    number: 'Project 2', title: 'Spiral Separator', subtitle: 'A harder problem that shows why DEPTH matters — and why ReLU beats Sigmoid.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🌊 The Problem</div>
        <div class="content-card__text">Two intertwined spirals — the network must learn a complex, curving decision boundary. This is <strong>impossible</strong> for shallow networks!</div>
      </div>
      <div class="content-card"><div class="content-card__title">🏗️ Design Decisions</div>
        <div class="content-card__text">
        <strong>Architecture:</strong> [2, 16, 16, 1] — deep and wide for complex patterns<br>
        <strong>Activation:</strong> Tanh or ReLU — sigmoid fails here (vanishing gradients!)<br>
        <strong>Learning rate:</strong> 0.3 — moderate for complex data<br>
        <strong>Why deeper?</strong> Each layer captures more abstract features. Layer 1 learns curves, Layer 2 learns combinations of curves.</div>
        ${cb('spiral setup', 'project', `<span class="cm">// More layers + ReLU = can learn complex patterns</span>
<span class="kw">const</span> nn = <span class="kw">new</span> <span class="fn">NeuralNetwork</span>(
  [<span class="num">2</span>, <span class="num">16</span>, <span class="num">16</span>, <span class="num">1</span>],
  <span class="str">'tanh'</span>  <span class="cm">// tanh works well for centered data</span>
);`)}
      </div>
      <div class="content-card"><div class="content-card__title">🚀 Train It</div>
        ${sandboxHTML('c7', `<div class="controls-row">
          <div class="control-group"><div class="control-label"><span>Activation</span></div><select id="c7-act"><option value="tanh">Tanh</option><option value="relu">ReLU</option><option value="sigmoid">Sigmoid (try it!)</option></select></div>
          <div class="control-group"><div class="control-label"><span>Learning Rate</span><span class="control-label__value" id="c7-lrv">0.30</span></div><input type="range" id="c7-lr" min="0.01" max="1" step="0.01" value="0.3"></div></div>`)}
      </div>`;
      let act = 'tanh';
      const sb = sandbox('c7', { ds: 'spiral', arch: [2, 16, 16, 1], act: 'tanh' }); sb.init();
      document.getElementById('c7-lr').addEventListener('input', e => { sb.lr = +e.target.value; document.getElementById('c7-lrv').textContent = (+e.target.value).toFixed(2); });
      document.getElementById('c7-act').addEventListener('change', e => { sb.isT = false; sb.arch = [2, 16, 16, 1]; sb.ds = 'spiral'; act = e.target.value; const o = sandbox('c7', { ds: 'spiral', arch: [2, 16, 16, 1], act }); o.init(); wireTrainBtn('c7', o); requestAnimationFrame(o.anim); });
      wireTrainBtn('c7', sb); requestAnimationFrame(sb.anim);
    }
  },

  ch8: {
    number: 'Project 3', title: 'Digit Reader', subtitle: 'Multi-class classification with softmax — recognize handwritten digits.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">✍️ The Problem</div>
        <div class="content-card__text">Draw a digit on an 8×8 grid. The network outputs <strong>10 probabilities</strong> (one per digit 0-9). The highest probability is the prediction.</div>
      </div>
      <div class="content-card"><div class="content-card__title">🏗️ Design Decisions</div>
        <div class="content-card__text">
        <strong>Input:</strong> 64 pixels (8×8 grid, each 0 or 1)<br>
        <strong>Output:</strong> 10 neurons with <strong>softmax</strong> (probabilities that sum to 1)<br>
        <strong>Loss:</strong> Cross-entropy (better for classification than MSE)<br>
        <strong>One-hot encoding:</strong> digit "3" → [0,0,0,1,0,0,0,0,0,0]</div>
        ${cb('softmax', 'key concept', `<span class="cm">// Softmax: turn raw scores into probabilities</span>
<span class="kw">function</span> <span class="fn">softmax</span>(values) {
  <span class="kw">const</span> max = Math.<span class="fn">max</span>(...values);
  <span class="kw">const</span> exps = values.<span class="fn">map</span>(v <span class="op">=></span> Math.<span class="fn">exp</span>(v - max));
  <span class="kw">const</span> sum = exps.<span class="fn">reduce</span>((a,b) <span class="op">=></span> a+b);
  <span class="kw">return</span> exps.<span class="fn">map</span>(e <span class="op">=></span> e / sum);
}
<span class="cm">// [2.0, 1.0, 0.1] → [0.66, 0.24, 0.10]</span>`)}
        ${cb('cross-entropy loss', 'new', `<span class="cm">// Cross-entropy: better loss for classification</span>
<span class="kw">function</span> <span class="fn">crossEntropy</span>(predicted, target) {
  <span class="kw">let</span> loss = <span class="num">0</span>;
  <span class="kw">for</span> (<span class="kw">let</span> i = <span class="num">0</span>; i < predicted.length; i++)
    loss -= target[i] * Math.<span class="fn">log</span>(predicted[i] + <span class="num">1e-8</span>);
  <span class="kw">return</span> loss;
}`)}
      </div>
      <div class="content-card"><div class="content-card__title">🎨 Draw & Recognize</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
          <div>
            <div style="font-size:.7rem;color:var(--text-dim);margin-bottom:8px;">DRAW A DIGIT (click cells)</div>
            <div id="c8-grid" style="display:grid;grid-template-columns:repeat(8,28px);gap:1px;"></div>
            <div class="btn-group"><button class="btn btn--secondary btn--small" id="c8-clear">Clear</button><button class="btn btn--primary btn--small" id="c8-train">Train (100 epochs)</button></div>
          </div>
          <div style="flex:1;min-width:200px;">
            <div style="font-size:.7rem;color:var(--text-dim);margin-bottom:8px;">PREDICTIONS</div>
            <div id="c8-bars"></div>
            <div id="c8-status" class="callout callout--info" style="margin-top:12px;">Draw a digit and click Train!</div>
          </div>
        </div>
      </div>`;
      // Grid
      const grid = new Array(64).fill(0), gridEl = document.getElementById('c8-grid');
      for (let i = 0; i < 64; i++) { const cell = document.createElement('div'); cell.style.cssText = 'width:28px;height:28px;background:rgba(79,143,255,0.06);border-radius:3px;cursor:pointer;transition:background 0.15s;'; cell.addEventListener('click', () => { grid[i] = grid[i] ? 0 : 1; cell.style.background = grid[i] ? 'var(--accent-blue)' : 'rgba(79,143,255,0.06)'; predict(); }); gridEl.appendChild(cell); }
      // Bars
      const barsEl = document.getElementById('c8-bars'); for (let i = 0; i < 10; i++) { const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;'; row.innerHTML = `<span style="font-family:var(--font-mono);font-size:.8rem;width:16px;color:var(--text-dim);">${i}</span><div style="flex:1;height:18px;background:rgba(79,143,255,0.06);border-radius:4px;overflow:hidden;"><div id="c8-b${i}" style="height:100%;background:var(--accent-gradient);border-radius:4px;transition:width 0.3s;width:10%;"></div></div><span id="c8-v${i}" style="font-family:var(--font-mono);font-size:.75rem;width:40px;text-align:right;color:var(--text-secondary);">10%</span>`; barsEl.appendChild(row); }
      // Network
      let nn8 = new NeuralNetwork([64, 32, 16, 10], 'relu', 'softmax');
      // Simple training data (predefined patterns for digits 0-9)
      const patterns = {
        0: [0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0],
        1: [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
        2: [0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
        3: [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0],
      };
      function makeTrainData() { const d = []; for (const [digit, pat] of Object.entries(patterns)) { const t = new Array(10).fill(0); t[+digit] = 1; for (let v = 0; v < 15; v++) { const noisy = pat.map(p => Math.random() < 0.15 ? (1 - p) : p); d.push({ input: noisy, target: t }); } } return d; }
      function predict() { const out = nn8.forward(grid); for (let i = 0; i < 10; i++) { document.getElementById('c8-b' + i).style.width = (out[i] * 100) + '%'; document.getElementById('c8-v' + i).textContent = (out[i] * 100).toFixed(0) + '%'; } }
      document.getElementById('c8-clear').addEventListener('click', () => { grid.fill(0); gridEl.querySelectorAll('div').forEach(d => d.style.background = 'rgba(79,143,255,0.06)'); predict(); });
      document.getElementById('c8-train').addEventListener('click', () => { const td = makeTrainData(); document.getElementById('c8-status').innerHTML = '<strong>Training...</strong>'; setTimeout(() => { for (let i = 0; i < 100; i++)nn8.trainEpoch(td, 0.01); predict(); document.getElementById('c8-status').innerHTML = `<strong>✅ Done!</strong> Loss: ${nn8.totalLoss.toFixed(4)} after ${nn8.epoch} epochs. Draw a digit!`; }, 50); });
      predict();
    }
  },

  ch9: {
    number: 'Project 4', title: 'Curve Fitter', subtitle: 'Regression — teach a network to approximate any function.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">📈 The Problem</div>
        <div class="content-card__text">Given (x, y) points, train a network to <strong>predict y from x</strong>. Unlike classification, the output is a continuous number — this is <strong>regression</strong>.</div>
      </div>
      <div class="content-card"><div class="content-card__title">🏗️ Design Decisions</div>
        <div class="content-card__text">
        <strong>Output:</strong> Linear (no activation!) — we need any number, not just 0-1<br>
        <strong>Loss:</strong> MSE — measures distance from the curve<br>
        <strong>Architecture:</strong> [1, 16, 8, 1] — 1 input (x), 1 output (y)</div>
        ${cb('regression setup', 'project', `<span class="kw">const</span> nn = <span class="kw">new</span> <span class="fn">NeuralNetwork</span>(
  [<span class="num">1</span>, <span class="num">16</span>, <span class="num">8</span>, <span class="num">1</span>],
  <span class="str">'tanh'</span>,    <span class="cm">// hidden activation</span>
  <span class="str">'linear'</span>  <span class="cm">// output: no squishing!</span>
);`)}
      </div>
      <div class="content-card"><div class="content-card__title">🚀 Watch It Fit a Curve</div>
        <div class="controls-row">
          <div class="control-group"><div class="control-label"><span>Target Function</span></div><select id="c9-fn"><option value="sin">sin(x)</option><option value="quad">x²</option><option value="abs">|x|</option><option value="step">step</option></select></div>
          <div class="control-group"><div class="control-label"><span>Learning Rate</span><span class="control-label__value" id="c9-lrv">0.01</span></div><input type="range" id="c9-lr" min="0.001" max="0.1" step="0.001" value="0.01"></div>
        </div>
        <div class="viz-area" style="height:300px;"><canvas id="c9-canvas" style="width:100%;height:100%;"></canvas></div>
        <div class="stats-bar">
          <div class="stat"><div class="stat__value" id="c9-epoch">0</div><div class="stat__label">Epoch</div></div>
          <div class="stat"><div class="stat__value" id="c9-loss">—</div><div class="stat__label">Loss</div></div>
        </div>
        <div class="btn-group"><button class="btn btn--primary" id="c9-train">▶ Train</button><button class="btn btn--danger" id="c9-reset">↺ Reset</button></div>
      </div>`;
      const fns = { sin: x => Math.sin(x * Math.PI), quad: x => x * x, abs: x => Math.abs(x), step: x => x > 0 ? 0.8 : -0.8 };
      let fnName = 'sin', lr9 = 0.01, nn9, data9, isT9 = false;
      function makeData() { data9 = []; const fn = fns[fnName]; for (let i = 0; i < 80; i++) { const x = -1 + Math.random() * 2; data9.push({ input: [x], target: [fn(x)] }); } }
      function init9() { nn9 = new NeuralNetwork([1, 16, 8, 1], 'tanh', 'linear'); makeData(); isT9 = false; document.getElementById('c9-train').textContent = '▶ Train'; upd9(); }
      function upd9() { document.getElementById('c9-epoch').textContent = nn9.epoch; document.getElementById('c9-loss').textContent = nn9.totalLoss.toFixed(4); }
      function drawCurve() {
        const cv = document.getElementById('c9-canvas'); if (!cv) return;
        const ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), w = r.width, h = r.height;
        if (w < 10) return; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = 'rgba(14,14,24,1)'; ctx.fillRect(0, 0, w, h);
        // Axes
        ctx.strokeStyle = 'rgba(79,143,255,0.1)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
        const toX = v => (v + 1.2) / 2.4 * w, toY = v => h / 2 - v * (h / 2.8);
        // Data points
        for (const s of data9) { ctx.beginPath(); ctx.arc(toX(s.input[0]), toY(s.target[0]), 3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(79,143,255,0.5)'; ctx.fill(); }
        // Target function
        ctx.beginPath(); ctx.strokeStyle = 'rgba(34,197,94,0.4)'; ctx.lineWidth = 2; const fn = fns[fnName];
        for (let px = 0; px < w; px++) { const x = -1.2 + (px / w) * 2.4, y = fn(Math.max(-1, Math.min(1, x))); if (px === 0) ctx.moveTo(px, toY(y)); else ctx.lineTo(px, toY(y)); } ctx.stroke();
        // Network prediction
        ctx.beginPath(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(245,158,11,0.3)'; ctx.shadowBlur = 6;
        for (let px = 0; px < w; px += 2) { const x = -1.2 + (px / w) * 2.4, y = nn9.forward([x])[0]; if (px === 0) ctx.moveTo(px, toY(y)); else ctx.lineTo(px, toY(y)); } ctx.stroke(); ctx.shadowBlur = 0;
        // Legend
        ctx.font = '500 11px Inter'; ctx.fillStyle = 'rgba(34,197,94,0.6)'; ctx.fillText('● Target', 10, 20); ctx.fillStyle = '#f59e0b'; ctx.fillText('● Network', 10, 36); ctx.fillStyle = 'rgba(79,143,255,0.5)'; ctx.fillText('● Data', 10, 52);
      }
      function anim9(t) { if (!document.getElementById('c9-canvas')) return; if (isT9 && nn9) { for (let i = 0; i < 10; i++)nn9.trainEpoch(data9, lr9); upd9(); drawCurve(); } requestAnimationFrame(anim9); }
      document.getElementById('c9-fn').addEventListener('change', e => { fnName = e.target.value; init9(); });
      document.getElementById('c9-lr').addEventListener('input', e => { lr9 = +e.target.value; document.getElementById('c9-lrv').textContent = lr9.toFixed(3); });
      document.getElementById('c9-train').addEventListener('click', () => { isT9 = !isT9; document.getElementById('c9-train').textContent = isT9 ? '⏸ Pause' : '▶ Train'; });
      document.getElementById('c9-reset').addEventListener('click', () => { init9(); });
      init9(); setTimeout(drawCurve, 80); requestAnimationFrame(anim9);
    }
  },

  // ===== PART 4: ADVANCED PROJECTS =====

  ch10: {
    number: 'Advanced 1', title: 'Music Pattern AI', subtitle: 'Teach a network to predict the next note in a melody — your first sequence model.',
    render(c) {
      const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const melodies = {
        'scale': [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1],
        'twinkle': [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0],
        'ode': [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1]
      };
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🎵 The Problem</div>
        <div class="content-card__text">Given a <strong>window of 3 notes</strong>, predict the <strong>next note</strong>. This is called <strong>sequence prediction</strong> — the foundation of language models, music generation, and time series forecasting.</div>
        <div class="content-card__text"><strong>Key insight:</strong> We turn sequences into supervised learning by using sliding windows:<br>
        <code>[C, D, E] → F</code> &nbsp; <code>[D, E, F] → G</code> &nbsp; <code>[E, F, G] → A</code></div>
      </div>
      <div class="content-card"><div class="content-card__title">🏗️ Design</div>
        <div class="content-card__text"><strong>Input:</strong> 3 notes × 7 one-hot = 21 features<br><strong>Output:</strong> 7 neurons + softmax (probability of each note)<br><strong>Architecture:</strong> [21, 16, 7]</div>
        ${cb('sequence prep', 'key concept', `<span class="cm">// Sliding window: turn sequences into training pairs</span>
<span class="kw">const</span> windowSize = <span class="num">3</span>;
<span class="kw">for</span> (<span class="kw">let</span> i = <span class="num">0</span>; i < melody.length - windowSize; i++) {
  <span class="kw">const</span> input = melody.<span class="fn">slice</span>(i, i + windowSize);  <span class="cm">// [C,D,E]</span>
  <span class="kw">const</span> target = melody[i + windowSize];       <span class="cm">// F</span>
  data.<span class="fn">push</span>({ input: <span class="fn">oneHot</span>(input), target: <span class="fn">oneHot</span>(target) });
}`)}
      </div>
      <div class="content-card"><div class="content-card__title">🎶 Train & Generate</div>
        <div class="controls-row">
          <div class="control-group"><div class="control-label"><span>Melody</span></div><select id="c10-mel"><option value="scale">Scale</option><option value="twinkle">Twinkle</option><option value="ode">Ode to Joy</option></select></div>
        </div>
        <div style="margin:12px 0;"><div style="font-size:.7rem;color:var(--text-dim);margin-bottom:6px;">MELODY</div><div id="c10-notes" style="display:flex;gap:3px;flex-wrap:wrap;"></div></div>
        <div class="btn-group"><button class="btn btn--primary" id="c10-train">▶ Train (200 epochs)</button><button class="btn btn--secondary" id="c10-gen">🎵 Generate Next 8</button><button class="btn btn--danger" id="c10-reset">↺ Reset</button></div>
        <div style="margin:12px 0;"><div style="font-size:.7rem;color:var(--text-dim);margin-bottom:6px;">GENERATED</div><div id="c10-gen-notes" style="display:flex;gap:3px;flex-wrap:wrap;"></div></div>
        <div id="c10-status" class="callout callout--info">Pick a melody and click Train!</div>
        <div style="margin:12px 0;"><div style="font-size:.7rem;color:var(--text-dim);margin-bottom:6px;">NEXT NOTE PROBABILITIES</div><div id="c10-bars"></div></div>
      </div>`;
      // Build bars
      const barsEl = document.getElementById('c10-bars');
      for (let i = 0; i < 7; i++) { const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:3px;'; row.innerHTML = `<span style="font-family:var(--font-mono);font-size:.8rem;width:16px;color:var(--text-dim);">${notes[i]}</span><div style="flex:1;height:16px;background:rgba(79,143,255,0.06);border-radius:4px;overflow:hidden;"><div id="c10-b${i}" style="height:100%;background:var(--accent-gradient);border-radius:4px;transition:width .3s;width:14.3%;"></div></div><span id="c10-pv${i}" style="font-family:var(--font-mono);font-size:.7rem;width:35px;text-align:right;color:var(--text-secondary);">14%</span>`; barsEl.appendChild(row); }
      let nn10, melName = 'scale';
      function oneHot(idx, len = 7) { const a = new Array(len).fill(0); a[idx] = 1; return a; }
      function makeData() { const mel = melodies[melName], d = []; for (let i = 0; i < mel.length - 3; i++) { const inp = [...oneHot(mel[i]), ...oneHot(mel[i + 1]), ...oneHot(mel[i + 2])]; d.push({ input: inp, target: oneHot(mel[i + 3]) }); } return d; }
      function renderMelody() { const el = document.getElementById('c10-notes'); el.innerHTML = ''; const mel = melodies[melName]; mel.forEach(n => { const d = document.createElement('span'); d.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(79,143,255,0.12);border-radius:6px;font-family:var(--font-mono);font-size:.75rem;font-weight:600;color:var(--accent-blue);'; d.textContent = notes[n]; el.appendChild(d); }); }
      function showProbs(probs) { for (let i = 0; i < 7; i++) { document.getElementById('c10-b' + i).style.width = (probs[i] * 100) + '%'; document.getElementById('c10-pv' + i).textContent = (probs[i] * 100).toFixed(0) + '%'; } }
      function init10() { nn10 = new NeuralNetwork([21, 16, 7], 'relu', 'softmax'); renderMelody(); document.getElementById('c10-gen-notes').innerHTML = ''; document.getElementById('c10-status').innerHTML = 'Pick a melody and click Train!'; showProbs(new Array(7).fill(1 / 7)); }
      init10();
      document.getElementById('c10-mel').addEventListener('change', e => { melName = e.target.value; init10(); });
      document.getElementById('c10-reset').addEventListener('click', init10);
      document.getElementById('c10-train').addEventListener('click', () => { const d = makeData(); document.getElementById('c10-status').innerHTML = '<strong>Training...</strong>'; setTimeout(() => { for (let i = 0; i < 200; i++)nn10.trainEpoch(d, 0.05); const mel = melodies[melName]; const last3 = [...oneHot(mel[mel.length - 3]), ...oneHot(mel[mel.length - 2]), ...oneHot(mel[mel.length - 1])]; const p = nn10.forward(last3); showProbs(p); document.getElementById('c10-status').innerHTML = `<strong>✅ Trained!</strong> Loss: ${nn10.totalLoss.toFixed(4)}. Click Generate!`; }, 50); });
      document.getElementById('c10-gen').addEventListener('click', () => { if (!nn10) return; const mel = melodies[melName]; let window3 = [mel[mel.length - 3], mel[mel.length - 2], mel[mel.length - 1]]; const el = document.getElementById('c10-gen-notes'); el.innerHTML = ''; for (let g = 0; g < 8; g++) { const inp = [...oneHot(window3[0]), ...oneHot(window3[1]), ...oneHot(window3[2])]; const p = nn10.forward(inp); showProbs(p); const next = p.indexOf(Math.max(...p)); const d = document.createElement('span'); d.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(245,158,11,0.15);border-radius:6px;font-family:var(--font-mono);font-size:.75rem;font-weight:600;color:#f59e0b;'; d.textContent = notes[next]; el.appendChild(d); window3 = [window3[1], window3[2], next]; } });
    }
  },

  ch11: {
    number: 'Advanced 2', title: 'Shape Classifier', subtitle: 'Draw shapes on a canvas, train a network to recognize them — real pattern recognition.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🔺 The Problem</div>
        <div class="content-card__text">Classify <strong>3 types of shapes</strong>: circles, squares, and triangles. The network uses simple geometric features (aspect ratio, fill ratio, corners) to make predictions.</div>
      </div>
      <div class="content-card"><div class="content-card__title">🏗️ Design</div>
        <div class="content-card__text"><strong>Input:</strong> 4 features (roundness, symmetry, pointiness, fill ratio)<br><strong>Output:</strong> 3 neurons + softmax → [circle, square, triangle]<br><strong>Architecture:</strong> [4, 12, 8, 3]</div>
        ${cb('feature engineering', 'key concept', `<span class="cm">// Instead of raw pixels, extract meaningful features</span>
<span class="cm">// This is how real ML works before deep learning</span>
features = {
  roundness: perimeter² / (<span class="num">4</span> * π * area),  <span class="cm">// 1.0 = perfect circle</span>
  symmetry:  leftHalf ≈ rightHalf,       <span class="cm">// high = symmetric</span>
  pointiness: numCorners / <span class="num">10</span>,          <span class="cm">// more corners = pointier</span>
  fillRatio: filledPixels / totalPixels  <span class="cm">// how full is the bounding box</span>
}`)}
      </div>
      <div class="content-card"><div class="content-card__title">🎨 Train & Classify</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;">
          <div>
            <div style="font-size:.7rem;color:var(--text-dim);margin-bottom:8px;">TRAINING DATA (auto-generated)</div>
            <canvas id="c11-shapes" width="240" height="180" style="background:rgba(14,14,24,1);border-radius:8px;border:1px solid var(--border-glass);"></canvas>
            <div class="btn-group"><button class="btn btn--primary btn--small" id="c11-train">▶ Train (300 epochs)</button><button class="btn btn--danger btn--small" id="c11-reset">↺ Reset</button></div>
          </div>
          <div style="flex:1;min-width:200px;">
            <div style="font-size:.7rem;color:var(--text-dim);margin-bottom:8px;">TEST: ADJUST FEATURES</div>
            <div class="neuron-input-row"><label>Roundness</label><input type="range" id="c11-f0" min="0" max="1" step="0.05" value="0.9"><span class="val" id="c11-v0">0.90</span></div>
            <div class="neuron-input-row"><label>Symmetry</label><input type="range" id="c11-f1" min="0" max="1" step="0.05" value="0.8"><span class="val" id="c11-v1">0.80</span></div>
            <div class="neuron-input-row"><label>Pointiness</label><input type="range" id="c11-f2" min="0" max="1" step="0.05" value="0.1"><span class="val" id="c11-v2">0.10</span></div>
            <div class="neuron-input-row"><label>Fill Ratio</label><input type="range" id="c11-f3" min="0" max="1" step="0.05" value="0.75"><span class="val" id="c11-v3">0.75</span></div>
            <div style="margin-top:12px;"><div style="font-size:.7rem;color:var(--text-dim);margin-bottom:6px;">PREDICTION</div><div id="c11-pred" style="font-family:var(--font-mono);font-size:1.5rem;font-weight:700;color:var(--accent-blue);">—</div><div id="c11-bars"></div></div>
          </div>
        </div>
        <div id="c11-status" class="callout callout--info" style="margin-top:12px;">Click Train to teach the network!</div>
      </div>`;
      const labels = ['🔵 Circle', '🟥 Square', '🔺 Triangle'];
      // Build bars
      const bEl = document.getElementById('c11-bars');
      for (let i = 0; i < 3; i++) { const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:3px;'; r.innerHTML = `<span style="font-size:.75rem;width:80px;color:var(--text-dim);">${labels[i]}</span><div style="flex:1;height:16px;background:rgba(79,143,255,0.06);border-radius:4px;overflow:hidden;"><div id="c11-pb${i}" style="height:100%;background:var(--accent-gradient);border-radius:4px;transition:width .3s;width:33%;"></div></div><span id="c11-pp${i}" style="font-family:var(--font-mono);font-size:.7rem;width:35px;text-align:right;color:var(--text-secondary);">33%</span>`; bEl.appendChild(r); }
      // Generate training data: circles(high roundness,high symmetry,low pointiness,high fill), squares(medium,high,low,high), triangles(low,medium,high,low)
      let nn11;
      function makeData11() {
        const d = []; for (let i = 0; i < 60; i++) {
          d.push({ input: [.8 + Math.random() * .2, .7 + Math.random() * .3, Math.random() * .2, .7 + Math.random() * .2], target: [1, 0, 0] }); // circle
          d.push({ input: [.3 + Math.random() * .2, .7 + Math.random() * .3, .1 + Math.random() * .2, .8 + Math.random() * .15], target: [0, 1, 0] }); // square
          d.push({ input: [Math.random() * .3, .3 + Math.random() * .3, .6 + Math.random() * .4, .3 + Math.random() * .2], target: [0, 0, 1] }); // triangle
        } return d;
      }
      function predict11() { const f = [+document.getElementById('c11-f0').value, +document.getElementById('c11-f1').value, +document.getElementById('c11-f2').value, +document.getElementById('c11-f3').value]; if (!nn11) return; const p = nn11.forward(f); for (let i = 0; i < 3; i++) { document.getElementById('c11-pb' + i).style.width = (p[i] * 100) + '%'; document.getElementById('c11-pp' + i).textContent = (p[i] * 100).toFixed(0) + '%'; } const best = p.indexOf(Math.max(...p)); document.getElementById('c11-pred').textContent = labels[best] + ' (' + (p[best] * 100).toFixed(0) + '%)'; }
      // Draw shapes on canvas
      function drawShapes() {
        const cv = document.getElementById('c11-shapes'); if (!cv) return; const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, 240, 180); ctx.fillStyle = 'rgba(14,14,24,1)'; ctx.fillRect(0, 0, 240, 180);
        // circle
        ctx.beginPath(); ctx.arc(50, 60, 25, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(79,143,255,0.7)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(79,143,255,0.08)'; ctx.fill();
        ctx.font = '500 10px Inter'; ctx.fillStyle = 'rgba(79,143,255,0.5)'; ctx.textAlign = 'center'; ctx.fillText('Circle', 50, 105);
        // square
        ctx.strokeStyle = 'rgba(34,197,94,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(100, 35, 50, 50); ctx.fillStyle = 'rgba(34,197,94,0.08)'; ctx.fillRect(100, 35, 50, 50);
        ctx.fillStyle = 'rgba(34,197,94,0.5)'; ctx.fillText('Square', 125, 105);
        // triangle
        ctx.beginPath(); ctx.moveTo(195, 35); ctx.lineTo(170, 85); ctx.lineTo(220, 85); ctx.closePath(); ctx.strokeStyle = 'rgba(245,158,11,0.7)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(245,158,11,0.08)'; ctx.fill();
        ctx.fillStyle = 'rgba(245,158,11,0.5)'; ctx.fillText('Triangle', 195, 105);
        // legend
        ctx.font = '500 9px Inter'; ctx.fillStyle = 'rgba(138,143,168,0.4)'; ctx.textAlign = 'left'; ctx.fillText('Training shapes (60 each with noise)', 10, 170);
      }
      function init11() { nn11 = new NeuralNetwork([4, 12, 8, 3], 'relu', 'softmax'); drawShapes(); predict11(); }
      init11();
      for (let i = 0; i < 4; i++) { document.getElementById('c11-f' + i).addEventListener('input', e => { document.getElementById('c11-v' + i).textContent = (+e.target.value).toFixed(2); predict11(); }); }
      document.getElementById('c11-reset').addEventListener('click', init11);
      document.getElementById('c11-train').addEventListener('click', () => { const d = makeData11(); document.getElementById('c11-status').innerHTML = '<strong>Training...</strong>'; setTimeout(() => { for (let i = 0; i < 300; i++)nn11.trainEpoch(d, 0.02); predict11(); document.getElementById('c11-status').innerHTML = `<strong>✅ Done!</strong> Loss: ${nn11.totalLoss.toFixed(4)}. Try different feature values!`; }, 50); });
    }
  },

  ch12: {
    number: 'Advanced 3', title: 'Auto-Encoder', subtitle: 'Compress data into a tiny representation, then reconstruct it — unsupervised learning!',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🗜️ The Concept</div>
        <div class="content-card__text">An <strong>auto-encoder</strong> learns to <strong>compress → decompress</strong> data. The network is forced through a "bottleneck" (fewer neurons), so it must learn the most important features.</div>
        <div class="math-block">Input(8) → Encoder(4) → Bottleneck(2) → Decoder(4) → Output(8)</div>
        <div class="content-card__text"><strong>Target = Input!</strong> The network tries to reconstruct its own input. If it can, the bottleneck has learned a useful compressed representation.</div>
        ${cb('auto-encoder', 'key concept', `<span class="cm">// The trick: target === input!</span>
<span class="kw">const</span> ae = <span class="kw">new</span> <span class="fn">NeuralNetwork</span>(
  [<span class="num">8</span>, <span class="num">4</span>, <span class="num">2</span>, <span class="num">4</span>, <span class="num">8</span>], <span class="cm">// bottleneck at 2!</span>
  <span class="str">'sigmoid'</span>
);
<span class="cm">// Train: input → same as output</span>
data.<span class="fn">forEach</span>(sample <span class="op">=></span> {
  ae.<span class="fn">forward</span>(sample);
  ae.<span class="fn">backward</span>(sample); <span class="cm">// target = input</span>
});`)}
      </div>
      <div class="content-card"><div class="content-card__title">🔬 Try It: Compress & Reconstruct</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
          <div>
            <div style="font-size:.7rem;color:var(--text-dim);margin-bottom:8px;">INPUT (click to toggle, 8 values)</div>
            <div id="c12-input" style="display:flex;gap:3px;"></div>
          </div>
          <div style="text-align:center;padding:10px;"><div style="font-size:.65rem;color:var(--text-dim);">BOTTLENECK</div><div id="c12-bn" style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:var(--accent-orange);">—</div><div style="font-size:.55rem;color:var(--text-dim);margin-top:4px;">2 values = compressed!</div></div>
          <div>
            <div style="font-size:.7rem;color:var(--text-dim);margin-bottom:8px;">RECONSTRUCTED OUTPUT</div>
            <div id="c12-output" style="display:flex;gap:3px;"></div>
          </div>
        </div>
        <div class="btn-group" style="margin-top:12px;"><button class="btn btn--primary" id="c12-train">▶ Train (500 epochs)</button><button class="btn btn--danger" id="c12-reset">↺ Reset</button></div>
        <div id="c12-status" class="callout callout--info" style="margin-top:12px;">Click Train to learn compression!</div>
        <div class="stats-bar" style="margin-top:12px;">
          <div class="stat"><div class="stat__value" id="c12-loss">—</div><div class="stat__label">Loss (lower=better)</div></div>
          <div class="stat"><div class="stat__value" id="c12-comp">75%</div><div class="stat__label">Compression</div></div>
        </div>
      </div>`;
      const input = new Array(8).fill(0); input[0] = 1; input[3] = 1; input[7] = 1;
      let nn12;
      // Build input cells
      const inEl = document.getElementById('c12-input'), outEl = document.getElementById('c12-output');
      for (let i = 0; i < 8; i++) {
        const d = document.createElement('div'); d.style.cssText = 'width:32px;height:32px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:.75rem;transition:all .2s;'; d.id = 'c12-i' + i; d.addEventListener('click', () => { input[i] = input[i] ? 0 : 1; renderIO(); }); inEl.appendChild(d);
        const o = document.createElement('div'); o.style.cssText = 'width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:.75rem;transition:all .2s;'; o.id = 'c12-o' + i; outEl.appendChild(o);
      }
      function renderIO() {
        for (let i = 0; i < 8; i++) { const d = document.getElementById('c12-i' + i); d.style.background = input[i] ? 'var(--accent-blue)' : 'rgba(79,143,255,0.08)'; d.style.color = input[i] ? '#fff' : 'var(--text-dim)'; d.textContent = input[i] ? '1' : '0'; }
        if (nn12) {
          const out = nn12.forward(input);// Show bottleneck
          const bnLayer = nn12.layers[2]; const bn = [bnLayer.neurons[0].value.toFixed(2), bnLayer.neurons[1].value.toFixed(2)]; document.getElementById('c12-bn').textContent = `[${bn[0]}, ${bn[1]}]`;
          for (let i = 0; i < 8; i++) { const v = out[i]; const d = document.getElementById('c12-o' + i); const rounded = v > 0.5 ? 1 : 0; d.style.background = v > 0.5 ? `rgba(34,197,94,${0.3 + v * 0.7})` : 'rgba(239,68,68,0.15)'; d.textContent = v.toFixed(1); d.style.color = v > 0.5 ? '#fff' : 'var(--text-dim)'; }
        }
      }
      function makeData12() {
        const patterns = [[1, 0, 0, 0, 0, 0, 0, 1], [0, 1, 0, 0, 0, 0, 1, 0], [0, 0, 1, 0, 0, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [1, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 1, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1, 0, 1], [1, 1, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1, 1]];
        const d = []; for (const p of patterns) for (let v = 0; v < 8; v++) { const noisy = p.map(x => Math.random() < 0.1 ? (1 - x) : x); d.push({ input: noisy, target: p }); } return d;
      }
      function init12() { nn12 = new NeuralNetwork([8, 4, 2, 4, 8], 'sigmoid'); renderIO(); }
      init12();
      document.getElementById('c12-reset').addEventListener('click', init12);
      document.getElementById('c12-train').addEventListener('click', () => { document.getElementById('c12-status').innerHTML = '<strong>Training...</strong>'; setTimeout(() => { const d = makeData12(); for (let i = 0; i < 500; i++)nn12.trainEpoch(d, 0.5); renderIO(); document.getElementById('c12-loss').textContent = nn12.totalLoss.toFixed(4); document.getElementById('c12-status').innerHTML = `<strong>✅ Trained!</strong> Loss: ${nn12.totalLoss.toFixed(4)}. Toggle input bits to see reconstruction!`; }, 50); });
    }
  },

  ch13: {
    number: 'Advanced 4', title: 'Noise Reducer', subtitle: 'Train a network to clean up corrupted data — denoising in action.',
    render(c) {
      c.innerHTML = `
      <div class="content-card"><div class="content-card__title">🧹 The Concept</div>
        <div class="content-card__text">A <strong>denoising network</strong> takes corrupted (noisy) input and learns to output the clean version. This is used in image restoration, audio cleaning, and data preprocessing.</div>
        <div class="math-block">Noisy Input → Network → Clean Output</div>
        <div class="content-card__text"><strong>Key idea:</strong> Train with <code>input = noisy version</code>, <code>target = clean version</code>. The network learns what "clean" looks like.</div>
        ${cb('denoising setup', 'project', `<span class="cm">// Add random noise to clean data</span>
<span class="kw">function</span> <span class="fn">addNoise</span>(clean, amount) {
  <span class="kw">return</span> clean.<span class="fn">map</span>(v <span class="op">=></span>
    Math.<span class="fn">max</span>(<span class="num">0</span>, Math.<span class="fn">min</span>(<span class="num">1</span>,
      v + (Math.<span class="fn">random</span>() - <span class="num">0.5</span>) * amount
    ))
  );
}
<span class="cm">// Train: noisy → clean</span>
data.<span class="fn">push</span>({ input: <span class="fn">addNoise</span>(clean, <span class="num">0.3</span>), target: clean });`)}
      </div>
      <div class="content-card"><div class="content-card__title">🔬 Denoise a Signal</div>
        <div style="margin-bottom:12px;"><div class="controls-row"><div class="control-group"><div class="control-label"><span>Noise Level</span><span class="control-label__value" id="c13-nv">0.30</span></div><input type="range" id="c13-noise" min="0.05" max="0.8" step="0.05" value="0.3"></div></div></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;"><div style="font-size:.7rem;color:var(--text-dim);margin-bottom:6px;">CLEAN SIGNAL</div><canvas id="c13-clean" width="300" height="120" style="width:100%;height:120px;background:rgba(14,14,24,1);border-radius:8px;"></canvas></div>
          <div style="flex:1;min-width:200px;"><div style="font-size:.7rem;color:var(--text-dim);margin-bottom:6px;">NOISY INPUT</div><canvas id="c13-noisy" width="300" height="120" style="width:100%;height:120px;background:rgba(14,14,24,1);border-radius:8px;"></canvas></div>
          <div style="flex:1;min-width:200px;"><div style="font-size:.7rem;color:var(--text-dim);margin-bottom:6px;">DENOISED OUTPUT</div><canvas id="c13-denoised" width="300" height="120" style="width:100%;height:120px;background:rgba(14,14,24,1);border-radius:8px;"></canvas></div>
        </div>
        <div class="btn-group" style="margin-top:12px;"><button class="btn btn--primary" id="c13-train">▶ Train (300 epochs)</button><button class="btn btn--secondary" id="c13-regen">🔀 New Noise</button><button class="btn btn--danger" id="c13-reset">↺ Reset</button></div>
        <div id="c13-status" class="callout callout--info" style="margin-top:12px;">Click Train to teach noise removal!</div>
        <div class="stats-bar" style="margin-top:8px;">
          <div class="stat"><div class="stat__value" id="c13-loss">—</div><div class="stat__label">Loss</div></div>
          <div class="stat"><div class="stat__value" id="c13-snr">—</div><div class="stat__label">Noise Reduced</div></div>
        </div>
      </div>`;
      const sigLen = 20;
      let nn13, noiseAmt = 0.3, cleanSig, noisySig;
      function makeClean() { cleanSig = []; for (let i = 0; i < sigLen; i++)cleanSig.push(0.5 + 0.4 * Math.sin(i / sigLen * Math.PI * 2)); }
      function makeNoisy() { noisySig = cleanSig.map(v => Math.max(0, Math.min(1, v + (Math.random() - 0.5) * noiseAmt * 2))); }
      function drawSignal(canvasId, sig, color) {
        const cv = document.getElementById(canvasId); if (!cv) return; const ctx = cv.getContext('2d'), w = cv.width, h = cv.height; ctx.clearRect(0, 0, w, h); ctx.fillStyle = 'rgba(14,14,24,1)'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(79,143,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        for (let i = 0; i < sig.length; i++) { const x = (i / (sig.length - 1)) * w, y = h - sig[i] * h; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        for (let i = 0; i < sig.length; i++) { const x = (i / (sig.length - 1)) * w, y = h - sig[i] * h; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
      }
      function renderAll() {
        drawSignal('c13-clean', cleanSig, 'rgba(34,197,94,0.7)'); drawSignal('c13-noisy', noisySig, 'rgba(239,68,68,0.7)');
        if (nn13) { const out = nn13.forward(noisySig); drawSignal('c13-denoised', out, 'rgba(79,143,255,0.9)'); }
      }
      function makeData13() { const d = []; for (let v = 0; v < 80; v++) { const noisy = cleanSig.map(x => Math.max(0, Math.min(1, x + (Math.random() - 0.5) * noiseAmt * 2))); d.push({ input: noisy, target: [...cleanSig] }); } return d; }
      function init13() { nn13 = new NeuralNetwork([sigLen, 32, 16, sigLen], 'tanh'); makeClean(); makeNoisy(); renderAll(); }
      init13();
      document.getElementById('c13-noise').addEventListener('input', e => { noiseAmt = +e.target.value; document.getElementById('c13-nv').textContent = noiseAmt.toFixed(2); makeNoisy(); renderAll(); });
      document.getElementById('c13-regen').addEventListener('click', () => { makeNoisy(); renderAll(); });
      document.getElementById('c13-reset').addEventListener('click', init13);
      document.getElementById('c13-train').addEventListener('click', () => {
        document.getElementById('c13-status').innerHTML = '<strong>Training...</strong>'; setTimeout(() => {
          const d = makeData13(); for (let i = 0; i < 300; i++)nn13.trainEpoch(d, 0.01); const out = nn13.forward(noisySig); renderAll();
          let noiseDist = 0, denoiseDist = 0; for (let i = 0; i < sigLen; i++) { noiseDist += (noisySig[i] - cleanSig[i]) ** 2; denoiseDist += (out[i] - cleanSig[i]) ** 2; }
          const reduction = ((1 - denoiseDist / Math.max(noiseDist, 0.001)) * 100).toFixed(0);
          document.getElementById('c13-loss').textContent = nn13.totalLoss.toFixed(4); document.getElementById('c13-snr').textContent = reduction + '%';
          document.getElementById('c13-status').innerHTML = `<strong>✅ Trained!</strong> Noise reduced by ${reduction}%. Try different noise levels!`;
        }, 50);
      });
    }
  }
};

window.ChapterContent = ChapterContent;

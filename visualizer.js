// ============================================
// visualizer.js — Smooth Canvas Network Renderer
// Fixed: reduced particle spam, smoother animation
// ============================================

class NetworkVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.network = null;
        this.hoveredNeuron = null;
        this.neuronPositions = [];
        this.animationParticles = [];
        this.dpr = window.devicePixelRatio || 1;
        this.width = 0;
        this.height = 0;
        this._lastDrawTime = 0;

        canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        canvas.addEventListener('mouseleave', () => { this.hoveredNeuron = null; });
        requestAnimationFrame(() => this._resize());
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const el = this.canvas.parentElement || this.canvas;
        const rect = el.getBoundingClientRect();
        const w = Math.max(rect.width, 200);
        const h = Math.max(rect.height, 150);
        if (Math.abs(this.width - w) < 2 && Math.abs(this.height - h) < 2) return; // skip if no real change
        this.width = w; this.height = h;
        this.canvas.width = w * this.dpr; this.canvas.height = h * this.dpr;
        this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        if (this.network) this._computePositions();
    }

    setNetwork(network) {
        this.network = network;
        requestAnimationFrame(() => { this._resize(); this._computePositions(); this.draw(performance.now()); });
    }

    _computePositions() {
        if (!this.network || this.width < 10) return;
        this.neuronPositions = [];
        const layers = this.network.layers, numL = layers.length, padX = 60, padY = 40;
        const usableW = this.width - padX * 2, usableH = this.height - padY * 2;
        for (let l = 0; l < numL; l++) {
            const pos = [], n = layers[l].neurons.length;
            const x = numL === 1 ? this.width / 2 : padX + (usableW / (numL - 1)) * l;
            const spacing = Math.min(usableH / Math.max(n, 1), 50);
            const totalH = spacing * (n - 1), startY = (this.height - totalH) / 2;
            for (let i = 0; i < n; i++) pos.push({ x, y: startY + spacing * i });
            this.neuronPositions.push(pos);
        }
    }

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        this.hoveredNeuron = null;
        for (let l = 0; l < this.neuronPositions.length; l++)
            for (let n = 0; n < this.neuronPositions[l].length; n++) {
                const p = this.neuronPositions[l][n];
                if ((mx - p.x) ** 2 + (my - p.y) ** 2 < 324) { this.hoveredNeuron = { layerIdx: l, neuronIdx: n }; return; }
            }
    }

    triggerForwardAnimation() {
        if (!this.network) return;
        // Limit particles to prevent glitchiness
        if (this.animationParticles.length > 40) return;
        for (let l = 0; l < this.network.layers.length - 1; l++) {
            const nI = this.network.layers[l].neurons.length;
            const nJ = this.network.layers[l + 1].neurons.length;
            const sampleRate = Math.min(0.15, 8 / (nI * nJ)); // fewer particles for big networks
            for (let i = 0; i < nI; i++)
                for (let j = 0; j < nJ; j++)
                    if (Math.random() < sampleRate) {
                        const from = this.neuronPositions[l]?.[i], to = this.neuronPositions[l + 1]?.[j];
                        if (from && to) this.animationParticles.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, progress: 0, speed: 0.025 + Math.random() * 0.02 });
                    }
        }
    }

    draw(time) {
        if (this.width < 10 || this.height < 10) { this._resize(); return; }
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        if (!this.network || this.neuronPositions.length === 0) return;
        this._drawWeights(ctx);
        this._drawParticles(ctx);
        this._drawNeurons(ctx, time || 0);
        this._drawLabels(ctx);
    }

    _drawWeights(ctx) {
        const layers = this.network.layers;
        for (let l = 0; l < layers.length - 1; l++)
            for (let i = 0; i < layers[l].neurons.length; i++)
                for (let j = 0; j < layers[l + 1].neurons.length; j++) {
                    const w = layers[l].weights[i][j];
                    const from = this.neuronPositions[l][i], to = this.neuronPositions[l + 1][j];
                    if (!from || !to) continue;
                    const absW = Math.min(Math.abs(w), 3), alpha = 0.08 + (absW / 3) * 0.45, lw = 0.5 + (absW / 3) * 2;
                    let hl = false;
                    if (this.hoveredNeuron) { const h = this.hoveredNeuron; hl = (h.layerIdx === l && h.neuronIdx === i) || (h.layerIdx === l + 1 && h.neuronIdx === j); }
                    ctx.strokeStyle = w > 0 ? `rgba(34,197,94,${hl ? Math.min(alpha * 2.5, 1) : alpha})` : `rgba(239,68,68,${hl ? Math.min(alpha * 2.5, 1) : alpha})`;
                    ctx.lineWidth = hl ? lw * 1.8 : lw;
                    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
                }
    }

    _drawNeurons(ctx, time) {
        const layers = this.network.layers;
        for (let l = 0; l < layers.length; l++)
            for (let n = 0; n < layers[l].neurons.length; n++) {
                const neuron = layers[l].neurons[n], pos = this.neuronPositions[l][n];
                if (!pos) continue;
                const val = neuron.value;
                const r = Math.round(30 + val * 225), g = Math.round(60 + (1 - Math.abs(val - 0.5) * 2) * 140), b = Math.round(200 - val * 160);
                const isH = this.hoveredNeuron && this.hoveredNeuron.layerIdx === l && this.hoveredNeuron.neuronIdx === n;
                const baseR = 14, radius = isH ? baseR + 4 : baseR;
                const pulse = Math.sin(time * 0.002 + l + n * 0.5) * 1.5; // gentler pulse

                ctx.save();
                ctx.shadowColor = `rgba(${r},${g},${b},${0.15 + Math.abs(val) * 0.2})`;
                ctx.shadowBlur = isH ? 20 : 8;
                ctx.beginPath(); ctx.arc(pos.x, pos.y, radius + pulse, 0, Math.PI * 2);
                ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill();
                ctx.strokeStyle = isH ? 'rgba(255,255,255,0.6)' : `rgba(255,255,255,${0.1 + Math.abs(val) * 0.12})`;
                ctx.lineWidth = isH ? 2 : 1; ctx.stroke();
                ctx.restore();

                ctx.fillStyle = val > 0.6 ? '#000' : '#fff';
                ctx.font = `600 ${isH ? 10 : 9}px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(val.toFixed(2), pos.x, pos.y);
            }
    }

    _drawParticles(ctx) {
        const remaining = [];
        for (const p of this.animationParticles) {
            p.progress += p.speed;
            if (p.progress >= 1) continue;
            const x = p.x + (p.tx - p.x) * p.progress, y = p.y + (p.ty - p.y) * p.progress;
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(79,143,255,${(1 - p.progress) * 0.6})`;
            ctx.fill(); remaining.push(p);
        }
        this.animationParticles = remaining;
    }

    _drawLabels(ctx) {
        const layers = this.network.layers;
        const labels = ['Input']; for (let i = 1; i < layers.length - 1; i++) labels.push(`Hidden ${i}`); labels.push('Output');
        ctx.font = '500 11px Inter, sans-serif'; ctx.textAlign = 'center';
        for (let l = 0; l < this.neuronPositions.length; l++) {
            const pos = this.neuronPositions[l]; if (!pos.length) continue;
            ctx.fillStyle = 'rgba(138,143,168,0.6)'; ctx.fillText(labels[l], pos[0].x, pos[0].y - 26);
        }
    }
}

window.NetworkVisualizer = NetworkVisualizer;

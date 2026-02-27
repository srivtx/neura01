// ============================================
// chart.js — Tiny Canvas-based Loss Chart
// ============================================

class LossChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.data = [];
        this.maxPoints = 500;
        this.dpr = window.devicePixelRatio || 1;
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    addPoint(value) {
        this.data.push(value);
        if (this.data.length > this.maxPoints) {
            this.data.shift();
        }
    }

    reset() {
        this.data = [];
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const pad = { top: 20, right: 12, bottom: 24, left: 42 };

        ctx.clearRect(0, 0, w, h);

        if (this.data.length < 2) {
            ctx.fillStyle = 'rgba(138, 143, 168, 0.3)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Start training to see loss', w / 2, h / 2);
            return;
        }

        const plotW = w - pad.left - pad.right;
        const plotH = h - pad.top - pad.bottom;

        // Auto-scale Y
        let maxVal = 0;
        for (const v of this.data) {
            if (v > maxVal) maxVal = v;
        }
        maxVal = Math.max(maxVal, 0.01);
        // Round up to nice number
        const niceMax = Math.ceil(maxVal * 10) / 10;

        // Grid lines
        ctx.strokeStyle = 'rgba(79, 143, 255, 0.06)';
        ctx.lineWidth = 1;
        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = pad.top + (plotH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(w - pad.right, y);
            ctx.stroke();

            // Y-axis labels
            const label = (niceMax * (1 - i / gridLines)).toFixed(2);
            ctx.fillStyle = 'rgba(138, 143, 168, 0.4)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, pad.left - 6, y);
        }

        // X-axis label
        ctx.fillStyle = 'rgba(138, 143, 168, 0.3)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Epoch', w / 2, h - 4);

        // Build path
        const points = [];
        for (let i = 0; i < this.data.length; i++) {
            const x = pad.left + (i / (this.data.length - 1)) * plotW;
            const y = pad.top + (1 - this.data[i] / niceMax) * plotH;
            points.push({ x, y });
        }

        // Gradient fill under line
        const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
        gradient.addColorStop(0, 'rgba(79, 143, 255, 0.15)');
        gradient.addColorStop(1, 'rgba(79, 143, 255, 0.0)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, pad.top + plotH);
        for (const p of points) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.lineTo(points[points.length - 1].x, pad.top + plotH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line with glow
        ctx.save();
        ctx.shadowColor = 'rgba(79, 143, 255, 0.4)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#4f8fff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();

        // Current value dot
        const last = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#4f8fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79, 143, 255, 0.2)';
        ctx.fill();

        // Current loss label
        ctx.fillStyle = '#4f8fff';
        ctx.font = '600 10px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(this.data[this.data.length - 1].toFixed(4), last.x - 8, last.y - 8);
    }
}

window.LossChart = LossChart;

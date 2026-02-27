// ============================================
// nn.js — Neural Network Engine (from scratch)
// Supports: sigmoid, relu, tanh, softmax
// Loss: MSE, cross-entropy
// ============================================

const Activations = {
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
    dfn: (out) => out * (1 - out),
    name: 'Sigmoid'
  },
  relu: {
    fn: (x) => Math.max(0, x),
    dfn: (out) => out > 0 ? 1 : 0.01, // leaky ReLU derivative for stability
    name: 'ReLU'
  },
  tanh: {
    fn: (x) => Math.tanh(x),
    dfn: (out) => 1 - out * out,
    name: 'Tanh'
  }
};

// Softmax applied to an array of values
function softmax(values) {
  const max = Math.max(...values);
  const exps = values.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

class Neuron {
  constructor() {
    this.value = 0;
    this.rawValue = 0;
    this.bias = (Math.random() - 0.5) * 0.5;
    this.gradient = 0;
    this.biasGrad = 0;
  }
}

class Layer {
  constructor(neuronCount) {
    this.neurons = [];
    for (let i = 0; i < neuronCount; i++) this.neurons.push(new Neuron());
    this.weights = [];
    this.weightGrads = [];
  }

  initWeights(nextSize) {
    const scale = Math.sqrt(2 / (this.neurons.length + nextSize));
    this.weights = []; this.weightGrads = [];
    for (let i = 0; i < this.neurons.length; i++) {
      this.weights[i] = []; this.weightGrads[i] = [];
      for (let j = 0; j < nextSize; j++) {
        this.weights[i][j] = (Math.random() * 2 - 1) * scale;
        this.weightGrads[i][j] = 0;
      }
    }
  }
}

class NeuralNetwork {
  constructor(layerSizes, activationName = 'sigmoid', outputMode = 'sigmoid') {
    this.layerSizes = layerSizes;
    this.activation = Activations[activationName] || Activations.sigmoid;
    this.activationName = activationName;
    this.outputMode = outputMode; // 'sigmoid', 'softmax', 'linear'
    this.layers = [];
    this.epoch = 0;
    this.totalLoss = 0;

    for (let i = 0; i < layerSizes.length; i++) this.layers.push(new Layer(layerSizes[i]));
    for (let i = 0; i < this.layers.length - 1; i++) this.layers[i].initWeights(layerSizes[i + 1]);
  }

  forward(inputs) {
    const inputLayer = this.layers[0];
    for (let i = 0; i < inputLayer.neurons.length; i++) {
      inputLayer.neurons[i].value = inputs[i];
      inputLayer.neurons[i].rawValue = inputs[i];
    }

    for (let l = 1; l < this.layers.length; l++) {
      const prev = this.layers[l - 1], curr = this.layers[l];
      const isOutput = (l === this.layers.length - 1);

      // Compute raw sums
      for (let j = 0; j < curr.neurons.length; j++) {
        let sum = curr.neurons[j].bias;
        for (let i = 0; i < prev.neurons.length; i++) sum += prev.neurons[i].value * prev.weights[i][j];
        curr.neurons[j].rawValue = sum;
      }

      // Apply activation
      if (isOutput && this.outputMode === 'softmax') {
        const rawVals = curr.neurons.map(n => n.rawValue);
        const sm = softmax(rawVals);
        for (let j = 0; j < curr.neurons.length; j++) curr.neurons[j].value = sm[j];
      } else if (isOutput && this.outputMode === 'linear') {
        for (let j = 0; j < curr.neurons.length; j++) curr.neurons[j].value = curr.neurons[j].rawValue;
      } else if (isOutput) {
        for (let j = 0; j < curr.neurons.length; j++) curr.neurons[j].value = Activations.sigmoid.fn(curr.neurons[j].rawValue);
      } else {
        const act = this.activation;
        for (let j = 0; j < curr.neurons.length; j++) curr.neurons[j].value = act.fn(curr.neurons[j].rawValue);
      }
    }
    return this.layers[this.layers.length - 1].neurons.map(n => n.value);
  }

  loss(predicted, targets) {
    if (this.outputMode === 'softmax') {
      // Cross-entropy loss
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) sum -= targets[i] * Math.log(Math.max(predicted[i], 1e-8));
      return sum;
    }
    // MSE
    let sum = 0;
    for (let i = 0; i < predicted.length; i++) sum += (predicted[i] - targets[i]) ** 2;
    return sum / predicted.length;
  }

  backward(targets) {
    const outLayer = this.layers[this.layers.length - 1];

    if (this.outputMode === 'softmax') {
      // Softmax + cross-entropy: gradient = predicted - target
      for (let j = 0; j < outLayer.neurons.length; j++) {
        outLayer.neurons[j].gradient = outLayer.neurons[j].value - targets[j];
      }
    } else if (this.outputMode === 'linear') {
      for (let j = 0; j < outLayer.neurons.length; j++) {
        outLayer.neurons[j].gradient = (outLayer.neurons[j].value - targets[j]) * 2 / outLayer.neurons.length;
      }
    } else {
      for (let j = 0; j < outLayer.neurons.length; j++) {
        const out = outLayer.neurons[j].value;
        outLayer.neurons[j].gradient = (out - targets[j]) * Activations.sigmoid.dfn(out);
      }
    }

    // Hidden layers
    for (let l = this.layers.length - 2; l >= 1; l--) {
      const curr = this.layers[l], next = this.layers[l + 1];
      for (let i = 0; i < curr.neurons.length; i++) {
        let errSum = 0;
        for (let j = 0; j < next.neurons.length; j++) errSum += next.neurons[j].gradient * curr.weights[i][j];
        curr.neurons[i].gradient = errSum * this.activation.dfn(curr.neurons[i].value);
      }
    }

    // Weight gradients
    for (let l = 0; l < this.layers.length - 1; l++) {
      const curr = this.layers[l], next = this.layers[l + 1];
      for (let i = 0; i < curr.neurons.length; i++)
        for (let j = 0; j < next.neurons.length; j++)
          curr.weightGrads[i][j] += curr.neurons[i].value * next.neurons[j].gradient;
      for (let j = 0; j < next.neurons.length; j++)
        next.neurons[j].biasGrad += next.neurons[j].gradient;
    }
  }

  updateWeights(lr, batchSize = 1) {
    for (let l = 0; l < this.layers.length - 1; l++) {
      const curr = this.layers[l], next = this.layers[l + 1];
      for (let i = 0; i < curr.neurons.length; i++)
        for (let j = 0; j < next.neurons.length; j++) {
          curr.weights[i][j] -= lr * (curr.weightGrads[i][j] / batchSize);
          curr.weightGrads[i][j] = 0;
        }
      for (let j = 0; j < next.neurons.length; j++) {
        next.neurons[j].bias -= lr * (next.neurons[j].biasGrad / batchSize);
        next.neurons[j].biasGrad = 0;
      }
    }
  }

  trainEpoch(data, lr) {
    let total = 0;
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    for (const s of shuffled) {
      for (const l of this.layers) { for (const n of l.neurons) n.biasGrad = 0; for (let i = 0; i < l.weightGrads.length; i++) for (let j = 0; j < l.weightGrads[i].length; j++) l.weightGrads[i][j] = 0; }
      const pred = this.forward(s.input);
      total += this.loss(pred, s.target);
      this.backward(s.target);
      this.updateWeights(lr, 1);
    }
    this.epoch++;
    this.totalLoss = total / data.length;
    return this.totalLoss;
  }
}

// Datasets
const Datasets = {
  xor: {
    name: 'XOR', generate() {
      const base = [{ input: [0, 0], target: [0] }, { input: [0, 1], target: [1] }, { input: [1, 0], target: [1] }, { input: [1, 1], target: [0] }];
      const d = []; for (let i = 0; i < 25; i++) for (const s of base) d.push({ input: [s.input[0] + (Math.random() - .5) * .1, s.input[1] + (Math.random() - .5) * .1], target: [...s.target] }); return d;
    }
  },
  circle: {
    name: 'Circle', generate() {
      const d = []; for (let i = 0; i < 200; i++) { const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1; d.push({ input: [x, y], target: [x * x + y * y < 0.5 ? 1 : 0] }); } return d;
    }
  },
  spiral: {
    name: 'Spiral', generate() {
      const d = [], n = 100; for (let c = 0; c < 2; c++) for (let i = 0; i < n; i++) { const r = (i / n) * .8, t = (i / n) * Math.PI * 3 + c * Math.PI + (Math.random() - .5) * .3; d.push({ input: [r * Math.cos(t), r * Math.sin(t)], target: [c] }); } return d;
    }
  },
  gaussian: {
    name: 'Gaussian', generate() {
      const d = [], rn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      for (let i = 0; i < 100; i++) { d.push({ input: [rn() * .3 + .4, rn() * .3 + .4], target: [1] }); d.push({ input: [rn() * .3 - .4, rn() * .3 - .4], target: [0] }); } return d;
    }
  }
};

window.NeuralNetwork = NeuralNetwork;
window.Activations = Activations;
window.Datasets = Datasets;
window.softmax = softmax;

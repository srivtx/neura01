# x-n-net

An interactive guide to building neural networks from scratch. No frameworks, no dependencies beyond Three.js for the 3D stuff. Everything runs in the browser.

## What is this

x-n-net walks you through how neural networks actually work, from a single neuron all the way to autoencoders and denoising networks. Each concept comes with live, interactive visualizations you can poke at — train networks in real time, watch decision boundaries form, tweak learning rates mid-training, and draw digits for a classifier to recognize.

The neural network engine (`nn.js`) is written from scratch in plain JavaScript. Supports forward pass, backpropagation, and multiple activation functions (sigmoid, ReLU, tanh) and output modes (sigmoid, softmax, linear).

## Structure

```
index.html      — entry point, layout, sidebar navigation
style.css       — all styling
nn.js           — neural network engine (neurons, layers, forward/backward, training)
visualizer.js   — 2D network visualization (renders the node-and-edge diagrams)
chart.js        — loss chart rendering
chapters.js     — the 13 chapters of content, code examples, and interactive widgets
demos.js        — standalone playgrounds (classification, regression, digits, color mixer)
lab3d.js        — 3D visualizations (loss landscape, decision boundaries, network view)
app.js          — app controller, navigation, routing between sections
```

## Content

**Part 1 — Building Blocks** (Chapters 1–4)
Covers what a neuron is, how layers connect, loss functions, backpropagation, and the training loop.

**Part 2 — Choose Your Weapon** (Chapter 5)
A decision framework: given a problem, how to pick your architecture, output layer, activation function, and loss.

**Part 3 — Build from Scratch** (Chapters 6–9)
Hands-on projects: XOR classifier, spiral separator, digit reader (8x8 grid + softmax), and curve fitter (regression with linear output).

**Part 4 — Advanced** (Chapters 10–13)
Music pattern prediction (sequence model), shape classifier (feature engineering), autoencoder (compression), and denoising network.

There are also standalone demo playgrounds for classification, function fitting, digit recognition, and color mixing, plus a 3D lab with loss landscape, decision boundary, and network visualizations.

## Running it

Open `index.html` in a browser. That's it.

If you want a local server (to avoid any file:// quirks):

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Dependencies

- [Three.js](https://threejs.org/) r128 (loaded from CDN) — used only for the 3D lab visualizations
- Everything else is vanilla HTML, CSS, and JavaScript

## License

Do whatever you want with it.

// ============================================
// lab3d.js — Interactive 3D Visualizations
// ============================================

const LabContent = {

    // ===== 3D LOSS LANDSCAPE =====
    'loss-landscape': {
        title: '3D Loss Landscape',
        subtitle: 'See gradient descent from above — a ball rolling downhill toward the lowest loss.',
        render(container) {
            container.innerHTML = `
      <div class="content-card"><div class="content-card__title">🤔 What Am I Looking At?</div>
        <div class="content-card__text">This is the <strong>loss surface</strong> — a 3D landscape where:<br><br>
        • <strong>X and Z axes</strong> = two weights in the network<br>
        • <strong>Y axis (height)</strong> = the loss (error) for those weight values<br>
        • <strong>The ball</strong> = where gradient descent currently is<br><br>
        <strong>Why is this useful?</strong> Training a neural network is literally finding the lowest point on this surface. The gradient tells the ball which direction is "downhill," and it rolls there step by step. The learning rate controls how fast it rolls.</div>
      </div>
      <div class="content-card">
        <div style="width:100%;height:450px;border-radius:8px;overflow:hidden;" id="lab-loss-canvas"></div>
        <div class="controls-row" style="margin-top:12px;">
          <div class="control-group"><div class="control-label"><span>Learning Rate</span><span class="control-label__value" id="lab-lr-v">0.05</span></div><input type="range" id="lab-lr" min="0.005" max="0.3" step="0.005" value="0.05"></div>
          <div class="control-group"><div class="control-label"><span>Surface</span></div><select id="lab-surface"><option value="bowl">Simple Bowl</option><option value="saddle">Saddle Point</option><option value="bumpy">Local Minima</option></select></div>
        </div>
        <div class="btn-group"><button class="btn btn--primary" id="lab-loss-run">▶ Start Descent</button><button class="btn btn--danger" id="lab-loss-reset">↺ Reset</button></div>
      </div>`;

            const el = document.getElementById('lab-loss-canvas');
            if (!el || typeof THREE === 'undefined') return;

            const W = el.clientWidth, H = 450;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0e0e18);
            const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
            camera.position.set(4, 5, 4);
            camera.lookAt(0, 0, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            el.appendChild(renderer.domElement);

            // Surface functions
            const surfaces = {
                bowl: (x, z) => (x * x + z * z) * 0.5,
                saddle: (x, z) => (x * x - z * z) * 0.3,
                bumpy: (x, z) => (x * x + z * z) * 0.3 + Math.sin(x * 3) * 0.3 + Math.cos(z * 3) * 0.3
            };
            const grads = {
                bowl: (x, z) => [x, z],
                saddle: (x, z) => [x * 0.6, -z * 0.6],
                bumpy: (x, z) => [x * 0.6 + Math.cos(x * 3) * 0.9, z * 0.6 - Math.sin(z * 3) * 0.9]
            };

            let surfaceName = 'bowl', surfaceMesh, ballMesh, trailLine;
            let ballPos = { x: 1.8, z: 1.8 }, running = false, lr = 0.05;
            let trailPoints = [];

            function buildSurface() {
                if (surfaceMesh) scene.remove(surfaceMesh);
                const fn = surfaces[surfaceName];
                const geo = new THREE.PlaneGeometry(4, 4, 60, 60);
                geo.rotateX(-Math.PI / 2);
                const pos = geo.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i), z = pos.getZ(i);
                    pos.setY(i, fn(x, z));
                }
                geo.computeVertexNormals();
                const mat = new THREE.MeshStandardMaterial({
                    color: 0x4f8fff, wireframe: false, transparent: true, opacity: 0.6,
                    side: THREE.DoubleSide, metalness: 0.3, roughness: 0.7
                });
                surfaceMesh = new THREE.Mesh(geo, mat);
                scene.add(surfaceMesh);

                // Wireframe overlay
                const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
                    color: 0x4f8fff, wireframe: true, transparent: true, opacity: 0.15
                }));
                surfaceMesh.add(wire);
            }

            // Ball
            const ballGeo = new THREE.SphereGeometry(0.08, 16, 16);
            const ballMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, emissive: 0xff4500, emissiveIntensity: 0.5 });
            ballMesh = new THREE.Mesh(ballGeo, ballMat);
            scene.add(ballMesh);

            // Trail
            const trailGeo = new THREE.BufferGeometry();
            const trailMat = new THREE.LineBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0.6 });
            trailLine = new THREE.Line(trailGeo, trailMat);
            scene.add(trailLine);

            // Lights
            scene.add(new THREE.AmbientLight(0x404060, 0.8));
            const dl = new THREE.DirectionalLight(0xffffff, 0.8);
            dl.position.set(3, 5, 3);
            scene.add(dl);
            scene.add(new THREE.PointLight(0x4f8fff, 0.4, 10));

            // Grid
            const grid = new THREE.GridHelper(4, 10, 0x222240, 0x1a1a30);
            grid.position.y = -0.01;
            scene.add(grid);

            function resetBall() {
                ballPos = { x: 1.5 + Math.random() * 0.5, z: 1.5 + Math.random() * 0.5 };
                trailPoints = [];
                running = false;
                document.getElementById('lab-loss-run').textContent = '▶ Start Descent';
            }

            function updateBall() {
                const fn = surfaces[surfaceName];
                const y = fn(ballPos.x, ballPos.z);
                ballMesh.position.set(ballPos.x, y + 0.08, ballPos.z);
            }

            function stepGD() {
                const g = grads[surfaceName](ballPos.x, ballPos.z);
                ballPos.x -= lr * g[0];
                ballPos.z -= lr * g[1];
                ballPos.x = Math.max(-2, Math.min(2, ballPos.x));
                ballPos.z = Math.max(-2, Math.min(2, ballPos.z));
                trailPoints.push(new THREE.Vector3(ballPos.x, surfaces[surfaceName](ballPos.x, ballPos.z) + 0.05, ballPos.z));
                if (trailPoints.length > 200) trailPoints.shift();
                trailLine.geometry.dispose();
                trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
            }

            buildSurface();
            updateBall();

            let angle = 0;
            function animate() {
                if (!document.getElementById('lab-loss-canvas')) return;
                angle += 0.003;
                camera.position.x = Math.cos(angle) * 5;
                camera.position.z = Math.sin(angle) * 5;
                camera.position.y = 4;
                camera.lookAt(0, 0.5, 0);
                if (running) { stepGD(); updateBall(); }
                renderer.render(scene, camera);
                requestAnimationFrame(animate);
            }
            animate();

            document.getElementById('lab-loss-run').addEventListener('click', () => {
                running = !running;
                document.getElementById('lab-loss-run').textContent = running ? '⏸ Pause' : '▶ Start Descent';
            });
            document.getElementById('lab-loss-reset').addEventListener('click', () => { resetBall(); buildSurface(); updateBall(); });
            document.getElementById('lab-lr').addEventListener('input', e => { lr = +e.target.value; document.getElementById('lab-lr-v').textContent = lr.toFixed(3); });
            document.getElementById('lab-surface').addEventListener('change', e => { surfaceName = e.target.value; resetBall(); buildSurface(); updateBall(); });
        }
    },

    // ===== 3D DECISION BOUNDARY =====
    'decision-3d': {
        title: '3D Decision Boundary',
        subtitle: 'Watch a neural network carve up 3D space to separate data points.',
        render(container) {
            container.innerHTML = `
      <div class="content-card"><div class="content-card__title">🤔 What Am I Looking At?</div>
        <div class="content-card__text">When your data has 2 features, the decision boundary is a <strong>line</strong>. With 3 features, it becomes a <strong>surface in 3D space</strong>.<br><br>
        The blue and orange dots are two classes. The network learns a surface that separates them. Rotate to see it from different angles!</div>
      </div>
      <div class="content-card">
        <div style="width:100%;height:450px;border-radius:8px;overflow:hidden;" id="lab-3d-boundary"></div>
        <div class="btn-group" style="margin-top:12px;"><button class="btn btn--primary" id="lab-3d-train">▶ Train (watch boundary form)</button><button class="btn btn--danger" id="lab-3d-reset">↺ Reset</button></div>
        <div class="stats-bar" style="margin-top:8px;">
          <div class="stat"><div class="stat__value" id="lab-3d-epoch">0</div><div class="stat__label">Epoch</div></div>
          <div class="stat"><div class="stat__value" id="lab-3d-acc">50%</div><div class="stat__label">Accuracy</div></div>
        </div>
      </div>`;

            const el = document.getElementById('lab-3d-boundary');
            if (!el || typeof THREE === 'undefined') return;

            const W = el.clientWidth, H = 450;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0e0e18);
            const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
            camera.position.set(3, 3, 3);
            camera.lookAt(0, 0, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            el.appendChild(renderer.domElement);

            scene.add(new THREE.AmbientLight(0x404060, 0.6));
            const dl = new THREE.DirectionalLight(0xffffff, 0.8);
            dl.position.set(3, 5, 3);
            scene.add(dl);

            // Generate 3D data — two clusters
            const data = [];
            for (let i = 0; i < 40; i++) {
                data.push({ input: [0.5 + Math.random() * 0.8, 0.5 + Math.random() * 0.8, 0.5 + Math.random() * 0.8], target: [1] });
                data.push({ input: [-0.5 - Math.random() * 0.8, -0.5 - Math.random() * 0.8, -0.5 - Math.random() * 0.8], target: [0] });
            }

            // Draw data points
            data.forEach(d => {
                const geo = new THREE.SphereGeometry(0.05, 8, 8);
                const mat = new THREE.MeshStandardMaterial({
                    color: d.target[0] > 0.5 ? 0x4f8fff : 0xff8c32,
                    emissive: d.target[0] > 0.5 ? 0x2244aa : 0xaa4400,
                    emissiveIntensity: 0.3
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(d.input[0], d.input[1], d.input[2]);
                scene.add(mesh);
            });

            // Network for 3D classification
            let nn3d = new NeuralNetwork([3, 8, 4, 1], 'relu');
            let running3d = false, epoch3d = 0;

            // Boundary visualization (plane of cubes)
            let boundaryMeshes = [];
            function drawBoundary() {
                boundaryMeshes.forEach(m => scene.remove(m));
                boundaryMeshes = [];
                const res = 8, size = 3;
                for (let xi = 0; xi < res; xi++) for (let yi = 0; yi < res; yi++) for (let zi = 0; zi < res; zi++) {
                    const x = -1.5 + (xi / (res - 1)) * size;
                    const y = -1.5 + (yi / (res - 1)) * size;
                    const z = -1.5 + (zi / (res - 1)) * size;
                    const out = nn3d.forward([x, y, z])[0];
                    if (Math.abs(out - 0.5) < 0.15) {
                        const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
                        const mat = new THREE.MeshStandardMaterial({
                            color: out > 0.5 ? 0x4f8fff : 0xff8c32,
                            transparent: true, opacity: 0.2
                        });
                        const mesh = new THREE.Mesh(geo, mat);
                        mesh.position.set(x, y, z);
                        scene.add(mesh);
                        boundaryMeshes.push(mesh);
                    }
                }
            }

            let angle3d = 0;
            function animate3d() {
                if (!document.getElementById('lab-3d-boundary')) return;
                angle3d += 0.005;
                camera.position.x = Math.cos(angle3d) * 4;
                camera.position.z = Math.sin(angle3d) * 4;
                camera.position.y = 2.5;
                camera.lookAt(0, 0, 0);
                if (running3d) {
                    for (let i = 0; i < 5; i++) nn3d.trainEpoch(data, 0.3);
                    epoch3d += 5;
                    if (epoch3d % 20 === 0) drawBoundary();
                    let correct = 0;
                    for (const s of data) { if ((nn3d.forward(s.input)[0] > 0.5 ? 1 : 0) === s.target[0]) correct++; }
                    document.getElementById('lab-3d-epoch').textContent = epoch3d;
                    document.getElementById('lab-3d-acc').textContent = ((correct / data.length) * 100).toFixed(0) + '%';
                }
                renderer.render(scene, camera);
                requestAnimationFrame(animate3d);
            }
            animate3d();
            drawBoundary();

            document.getElementById('lab-3d-train').addEventListener('click', () => {
                running3d = !running3d;
                document.getElementById('lab-3d-train').textContent = running3d ? '⏸ Pause' : '▶ Train';
            });
            document.getElementById('lab-3d-reset').addEventListener('click', () => {
                running3d = false; epoch3d = 0;
                nn3d = new NeuralNetwork([3, 8, 4, 1], 'relu');
                document.getElementById('lab-3d-train').textContent = '▶ Train';
                document.getElementById('lab-3d-epoch').textContent = '0';
                document.getElementById('lab-3d-acc').textContent = '50%';
                drawBoundary();
            });
        }
    },

    // ===== 3D NETWORK VIEW =====
    'network-3d': {
        title: '3D Network View',
        subtitle: 'See your neural network as a 3D structure with animated data flowing through.',
        render(container) {
            container.innerHTML = `
      <div class="content-card"><div class="content-card__title">🤔 What Am I Looking At?</div>
        <div class="content-card__text">This is a neural network rendered in 3D. Each sphere is a neuron, each line is a connection (weight).<br><br>
        • <strong>Green neurons</strong> = high activation (this neuron is "firing")<br>
        • <strong>Dark neurons</strong> = low activation (this neuron is quiet)<br>
        • <strong>Bright connections</strong> = strong weights (important connections)<br>
        • <strong>Dim connections</strong> = weak weights (less important)<br><br>
        Watch the colored particles flow through the network — that's data being processed!</div>
      </div>
      <div class="content-card">
        <div style="width:100%;height:450px;border-radius:8px;overflow:hidden;" id="lab-3d-network"></div>
        <div class="controls-row" style="margin-top:12px;">
          <div class="control-group"><div class="control-label"><span>Architecture</span></div><select id="lab-nn-arch"><option value="simple">[2, 4, 1]</option><option value="medium" selected>[2, 6, 4, 1]</option><option value="deep">[2, 8, 8, 4, 1]</option><option value="wide">[2, 16, 8, 1]</option></select></div>
        </div>
        <div class="btn-group"><button class="btn btn--primary" id="lab-nn-pulse">⚡ Send Data Through</button><button class="btn btn--danger" id="lab-nn-reset">↺ New Weights</button></div>
      </div>`;

            const el = document.getElementById('lab-3d-network');
            if (!el || typeof THREE === 'undefined') return;

            const W = el.clientWidth, H = 450;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0e0e18);
            const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            el.appendChild(renderer.domElement);

            scene.add(new THREE.AmbientLight(0x303050, 0.6));
            const dl = new THREE.DirectionalLight(0xffffff, 0.6);
            dl.position.set(5, 5, 5);
            scene.add(dl);

            const archs = {
                simple: [2, 4, 1],
                medium: [2, 6, 4, 1],
                deep: [2, 8, 8, 4, 1],
                wide: [2, 16, 8, 1]
            };

            let neuronMeshes = [], connectionLines = [], particles = [], nn, currentSizes;

            function buildNetwork(archName) {
                neuronMeshes.forEach(m => scene.remove(m));
                connectionLines.forEach(m => scene.remove(m));
                particles.forEach(m => scene.remove(m));
                neuronMeshes = []; connectionLines = []; particles = [];

                currentSizes = archs[archName];
                nn = new NeuralNetwork(currentSizes, 'sigmoid');
                nn.forward([Math.random(), Math.random()]);

                const layerSpacing = 3 / (currentSizes.length - 1);
                const positions = [];

                // nn.layers[l] = each Layer object. layers[0] = input layer, etc.
                for (let l = 0; l < currentSizes.length; l++) {
                    positions[l] = [];
                    const n = currentSizes[l];
                    const ySpread = Math.min(n * 0.5, 3);
                    for (let i = 0; i < n; i++) {
                        const x = (l - (currentSizes.length - 1) / 2) * layerSpacing;
                        const y = (i - (n - 1) / 2) * (ySpread / Math.max(n - 1, 1));

                        // Get neuron activation value from nn.layers
                        const val = nn.layers[l].neurons[i].value;
                        const clampVal = Math.max(0, Math.min(1, Math.abs(val)));
                        const geo = new THREE.SphereGeometry(0.12, 16, 16);
                        const color = new THREE.Color().setHSL(0.35 * clampVal + 0.55, 0.7, 0.3 + clampVal * 0.4);
                        const mat = new THREE.MeshStandardMaterial({
                            color, emissive: color, emissiveIntensity: 0.3 + clampVal * 0.4
                        });
                        const mesh = new THREE.Mesh(geo, mat);
                        mesh.position.set(x, y, 0);
                        scene.add(mesh);
                        neuronMeshes.push(mesh);
                        positions[l][i] = new THREE.Vector3(x, y, 0);
                    }
                }

                // Connections: nn.layers[l].weights[i][j] = weight from neuron i in layer l to neuron j in layer l+1
                for (let l = 0; l < currentSizes.length - 1; l++) {
                    if (!nn.layers[l].weights) continue;
                    for (let i = 0; i < currentSizes[l]; i++) {
                        for (let j = 0; j < currentSizes[l + 1]; j++) {
                            const w = nn.layers[l].weights[i] ? Math.abs(nn.layers[l].weights[i][j] || 0) : 0.1;
                            const geo = new THREE.BufferGeometry().setFromPoints([positions[l][i], positions[l + 1][j]]);
                            const mat = new THREE.LineBasicMaterial({
                                color: 0x4f8fff, transparent: true, opacity: Math.min(0.1 + w * 0.4, 0.6)
                            });
                            const line = new THREE.Line(geo, mat);
                            scene.add(line);
                            connectionLines.push(line);
                        }
                    }
                }
            }

            function sendPulse() {
                if (!nn) return;
                nn.forward([Math.random() * 2 - 1, Math.random() * 2 - 1]);
                let idx = 0;
                for (let l = 0; l < currentSizes.length; l++) {
                    for (let i = 0; i < currentSizes[l]; i++) {
                        const val = nn.layers[l].neurons[i].value;
                        const clampVal = Math.max(0, Math.min(1, Math.abs(val)));
                        const color = new THREE.Color().setHSL(0.35 * clampVal + 0.55, 0.7, 0.3 + clampVal * 0.4);
                        neuronMeshes[idx].material.color = color;
                        neuronMeshes[idx].material.emissive = color;
                        neuronMeshes[idx].material.emissiveIntensity = 0.3 + clampVal * 0.5;
                        idx++;
                    }
                }
                // Animated particles
                for (let p = 0; p < 8; p++) {
                    const geo = new THREE.SphereGeometry(0.04, 8, 8);
                    const mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8, transparent: true });
                    const mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(-3 + Math.random() * 0.5, Math.random() * 2 - 1, 0);
                    mesh.userData = { speed: 0.02 + Math.random() * 0.03, life: 0 };
                    scene.add(mesh);
                    particles.push(mesh);
                }
            }

            buildNetwork('medium');

            let angleNN = 0;
            function animateNN() {
                if (!document.getElementById('lab-3d-network')) return;
                angleNN += 0.005;
                camera.position.x = Math.cos(angleNN) * 5;
                camera.position.z = Math.sin(angleNN) * 5;
                camera.position.y = 1;
                camera.lookAt(0, 0, 0);

                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.position.x += p.userData.speed;
                    p.userData.life++;
                    p.material.opacity = Math.max(0, 1 - p.userData.life / 80);
                    if (p.userData.life > 80) {
                        scene.remove(p);
                        particles.splice(i, 1);
                    }
                }

                renderer.render(scene, camera);
                requestAnimationFrame(animateNN);
            }
            animateNN();

            document.getElementById('lab-nn-pulse').addEventListener('click', sendPulse);
            document.getElementById('lab-nn-reset').addEventListener('click', () => {
                buildNetwork(document.getElementById('lab-nn-arch').value);
            });
            document.getElementById('lab-nn-arch').addEventListener('change', e => buildNetwork(e.target.value));
        }
    }
};

window.LabContent = LabContent;

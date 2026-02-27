
(function () {
    'use strict';

    const allChapters = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'ch11', 'ch12', 'ch13'];

    const app = {
        currentMode: 'learn',
        currentChapter: 'ch1',
        currentDemo: 'hub',
        currentLab: 'loss-landscape',

        init() {
            window.activeApp = this;

            document.getElementById('nav-learn').addEventListener('click', () => this.setMode('learn'));
            document.getElementById('nav-explore').addEventListener('click', () => this.setMode('explore'));
            document.getElementById('nav-lab').addEventListener('click', () => this.setMode('lab'));

            document.querySelectorAll('.sidebar__item[data-chapter]').forEach(item => {
                item.addEventListener('click', () => { this.setMode('learn'); this.showChapter(item.dataset.chapter); });
            });
            document.querySelectorAll('.sidebar__item[data-demo]').forEach(item => {
                item.addEventListener('click', () => { this.setMode('explore'); this.showDemo(item.dataset.demo); });
            });
            document.querySelectorAll('.sidebar__item[data-lab]').forEach(item => {
                item.addEventListener('click', () => { this.setMode('lab'); this.showLab(item.dataset.lab); });
            });

            this.showChapter('ch1');
        },

        setMode(mode) {
            this.currentMode = mode;
            document.getElementById('nav-learn').classList.toggle('header__nav-btn--active', mode === 'learn');
            document.getElementById('nav-explore').classList.toggle('header__nav-btn--active', mode === 'explore');
            document.getElementById('nav-lab').classList.toggle('header__nav-btn--active', mode === 'lab');

            document.getElementById('sidebar-learn').style.display = mode === 'learn' ? 'flex' : 'none';
            document.getElementById('sidebar-explore').style.display = mode === 'explore' ? 'flex' : 'none';
            document.getElementById('sidebar-lab').style.display = mode === 'lab' ? 'flex' : 'none';

            if (mode === 'learn') this.showChapter(this.currentChapter);
            else if (mode === 'explore') this.showDemo(this.currentDemo);
            else if (mode === 'lab') this.showLab(this.currentLab);
        },

        showChapter(chapterId) {
            this.currentChapter = chapterId;
            document.querySelectorAll('.sidebar__item[data-chapter]').forEach(item => {
                item.classList.toggle('sidebar__item--active', item.dataset.chapter === chapterId);
            });

            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = '';

            const chapterEl = document.createElement('div');
            chapterEl.className = 'chapter chapter--active';

            const chapter = ChapterContent[chapterId];
            if (!chapter) return;

            chapterEl.innerHTML = `
        <div class="chapter__header">
          <div class="chapter__number">${chapter.number}</div>
          <h2 class="chapter__title">${chapter.title}</h2>
          <p class="chapter__subtitle">${chapter.subtitle}</p>
        </div>
        <div id="chapter-body"></div>
      `;
            mainContent.appendChild(chapterEl);
            chapter.render(document.getElementById('chapter-body'));

            // Navigation footer
            const footer = document.createElement('div');
            footer.className = 'chapter__footer';
            const idx = allChapters.indexOf(chapterId);
            const prevId = idx > 0 ? allChapters[idx - 1] : null;
            const nextId = idx < allChapters.length - 1 ? allChapters[idx + 1] : null;

            footer.innerHTML = `
        ${prevId ? `<button class="btn btn--secondary" id="prev-chapter-btn">← Previous</button>` : '<div></div>'}
        <span style="font-size: 0.78rem; color: var(--text-dim);">${idx + 1} / ${allChapters.length}</span>
        ${nextId
                    ? `<button class="btn btn--primary" id="next-chapter-btn">Next Chapter →</button>`
                    : `<button class="btn btn--primary" id="goto-explore-btn">Explore Use Cases →</button>`
                }
      `;
            chapterEl.appendChild(footer);

            if (prevId) {
                document.getElementById('prev-chapter-btn').addEventListener('click', () => {
                    const ci = document.querySelector(`.sidebar__item[data-chapter="${chapterId}"]`);
                    if (ci) ci.classList.add('sidebar__item--completed');
                    this.showChapter(prevId);
                });
            }
            if (nextId) {
                document.getElementById('next-chapter-btn').addEventListener('click', () => {
                    const ci = document.querySelector(`.sidebar__item[data-chapter="${chapterId}"]`);
                    if (ci) ci.classList.add('sidebar__item--completed');
                    this.showChapter(nextId);
                });
            }
            if (!nextId) {
                document.getElementById('goto-explore-btn').addEventListener('click', () => {
                    const ci = document.querySelector(`.sidebar__item[data-chapter="${chapterId}"]`);
                    if (ci) ci.classList.add('sidebar__item--completed');
                    this.setMode('explore');
                });
            }
            mainContent.scrollTop = 0;
        },

        showDemo(demoId) {
            this.currentDemo = demoId;
            document.querySelectorAll('.sidebar__item[data-demo]').forEach(item => {
                item.classList.toggle('sidebar__item--active', item.dataset.demo === demoId);
            });

            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = '';

            const demo = DemoContent[demoId];
            if (!demo) return;

            const demoEl = document.createElement('div');
            demoEl.className = 'chapter chapter--active';
            demoEl.innerHTML = `
        <div class="chapter__header">
          <h2 class="chapter__title">${demo.title}</h2>
          <p class="chapter__subtitle">${demo.subtitle}</p>
        </div>
        <div id="demo-body"></div>
      `;
            mainContent.appendChild(demoEl);
            demo.render(document.getElementById('demo-body'));

            if (demoId !== 'hub') {
                const backBtn = document.createElement('button');
                backBtn.className = 'btn btn--secondary btn--small';
                backBtn.textContent = '← Back to All Demos';
                backBtn.style.marginTop = '20px';
                backBtn.addEventListener('click', () => this.showDemo('hub'));
                document.getElementById('demo-body').appendChild(backBtn);
            }
            mainContent.scrollTop = 0;
        },

        showLab(labId) {
            this.currentLab = labId;
            document.querySelectorAll('.sidebar__item[data-lab]').forEach(item => {
                item.classList.toggle('sidebar__item--active', item.dataset.lab === labId);
            });

            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = '';

            if (typeof LabContent !== 'undefined' && LabContent[labId]) {
                const lab = LabContent[labId];
                const labEl = document.createElement('div');
                labEl.className = 'chapter chapter--active';
                labEl.innerHTML = `
          <div class="chapter__header">
            <h2 class="chapter__title">${lab.title}</h2>
            <p class="chapter__subtitle">${lab.subtitle}</p>
          </div>
          <div id="lab-body"></div>
        `;
                mainContent.appendChild(labEl);
                lab.render(document.getElementById('lab-body'));
            }
            mainContent.scrollTop = 0;
        }
    };

    app.init();
})();

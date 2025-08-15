class PathFinderApp {
    constructor() {
        this.currentTab = 'visualizer';
        this.timer = 0;
        this.timerInterval = null;
        this.gameMode = 'free';
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.initializeApp();
    }

    initializeApp() {
        this.setupTabSwitching();
        this.setupTheoryNavigation();
        this.setupGameControls();
        this.setupModals();
        this.setupCodeTabs();
        this.updateDisplay();
        this.loadGameData();
        console.log('PathFinder Pro initialized successfully!');
    }

    setupTabSwitching() {
        const navTabs = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                navTabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
                this.currentTab = targetTab;
                tab.classList.add('pulse');
                setTimeout(() => tab.classList.remove('pulse'), 600);
            });
        });
    }

    setupTheoryNavigation() {
        const theoryLinks = document.querySelectorAll('.theory-link');
        const theorySections = document.querySelectorAll('.theory-section');

        theoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('href').substring(1);
                
                theoryLinks.forEach(l => l.classList.remove('active'));
                theorySections.forEach(section => section.classList.remove('active'));
                
                link.classList.add('active');
                const activeSection = document.getElementById(targetSection);
                if (activeSection) {
                    activeSection.classList.add('active');
                    const firstTab = activeSection.querySelector('.code-tab-button');
                    if (firstTab) {
                        firstTab.click();
                    }
                }
                
                document.getElementById(targetSection).scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }

    setupCodeTabs() {
        const theoryContent = document.querySelector('.theory-content');
        if (!theoryContent) return;

        theoryContent.addEventListener('click', (event) => {
            const button = event.target.closest('.code-tab-button');
            if (!button) return;

            const lang = button.dataset.lang;
            const container = button.closest('.code-tabs-container');
            if (!container) return;

            const tabButtons = container.querySelectorAll('.code-tab-button');
            const codeSnippets = container.querySelectorAll('.code-snippet');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            codeSnippets.forEach(snippet => snippet.classList.remove('active'));

            button.classList.add('active');
            const activeSnippet = container.querySelector(`.code-snippet[data-lang="${lang}"]`);
            if (activeSnippet) {
                activeSnippet.classList.add('active');
            }
        });
    }

    setupGameControls() {
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            const speed = e.target.value;
            speedValue.textContent = `${speed}x`;
            if (window.visualizer) {
                window.visualizer.setSpeed(parseInt(speed));
            }
        });

        const algorithmSelect = document.getElementById('algorithm-select');
        algorithmSelect.addEventListener('change', (e) => {
            const algorithm = e.target.value;
            if (window.visualizer) {
                window.visualizer.setAlgorithm(algorithm);
            }
            this.highlightAlgorithmTheory(algorithm);
        });

        const gameModeSelect = document.getElementById('game-mode');
        gameModeSelect.addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            this.setupGameMode(this.gameMode);
        });

        this.setupControlButtons();
    }

    setupControlButtons() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const generateMazeBtn = document.getElementById('generate-maze-btn');

        startBtn.addEventListener('click', () => this.startVisualization());
        pauseBtn.addEventListener('click', () => {
            if (this.isPaused) {
                this.resumeVisualization();
            } else {
                this.pauseVisualization();
            }
        });
        resetBtn.addEventListener('click', () => this.resetVisualization());
        generateMazeBtn.addEventListener('click', () => this.generateMaze());

        document.addEventListener('keydown', (e) => {
            if (this.currentTab === 'visualizer') {
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        if (!this.isRunning) {
                            this.startVisualization();
                        } else if (this.isPaused) {
                            this.resumeVisualization();
                        } else {
                            this.pauseVisualization();
                        }
                        break;
                    case 'KeyR':
                        if (e.ctrlKey) {
                            e.preventDefault();
                            this.resetVisualization();
                        }
                        break;
                    case 'KeyM':
                        if (e.ctrlKey) {
                            e.preventDefault();
                            this.generateMaze();
                        }
                        break;
                }
            }
        });
    }

    startVisualization() {
        if (!window.visualizer) {
            this.showNotification('Visualizer not ready!', 'error');
            if (window.soundManager) window.soundManager.play('error');
            return;
        }

        if (this.isRunning) {
            this.showNotification('Visualization already running!', 'warning');
            if (window.soundManager) window.soundManager.play('error');
            return;
        }

        if (window.soundManager) window.soundManager.play('algorithmStart');

        this.startTimer();
        
        this.isRunning = true;
        this.isPaused = false;
        this.updateControlButtons();
        
        window.visualizer.start().then((result) => {
            this.onVisualizationComplete(result);
        }).catch((error) => {
            this.onVisualizationError(error);
        });

        this.showNotification('Visualization started!', 'success');
    }

    pauseVisualization() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        this.pauseTimer();
        if (window.visualizer) {
            window.visualizer.pause();
        }
        this.showNotification('Visualization paused', 'info');
        this.updateControlButtons();
    }

    resumeVisualization() {
        if (!this.isRunning || !this.isPaused) return;

        this.isPaused = false;
        this.resumeTimer();
        if (window.visualizer) {
            window.visualizer.resume();
        }
        this.showNotification('Visualization resumed', 'success');
        this.updateControlButtons();
    }

    resetVisualization() {
        this.isRunning = false;
        this.isPaused = false;
        this.stopTimer();
        
        if (window.soundManager) window.soundManager.play('reset');
        
        if (window.visualizer) {
            window.visualizer.reset();
        }
        
        this.updateControlButtons();

        this.showNotification('Grid reset!', 'info');
    }

    generateMaze() {
        if (this.isRunning) {
            this.showNotification('Cannot generate maze while running!', 'error');
            if (window.soundManager) window.soundManager.play('error');
            return;
        }

        if (window.soundManager) window.soundManager.play('mazeGenerate');

        if (window.visualizer) {
            window.visualizer.generateMaze();
            this.showNotification('Maze generated!', 'success');
        }
    }

    onVisualizationComplete(result) {
        this.isRunning = false;
        this.isPaused = false;
        this.stopTimer();

        const message = result.pathFound ? 'Path found!' : 'No path could be found.';
        this.showNotification(message, result.pathFound ? 'success' : 'error');

        if (window.soundManager) {
            if (result.pathFound) {
                window.soundManager.play('pathFound');
            } else {
                window.soundManager.play('error');
            }
        }

        this.showStatsModal(result);
    }

    onVisualizationError(error) {
        this.isRunning = false;
        this.isPaused = false;
        this.stopTimer();
        this.updateControlButtons();
        
        this.showNotification(error.message, 'error');
    }

    setupModals() {
        const modal = document.getElementById('stats-modal');
        const closeBtn = document.getElementById('stats-close-btn');

        if (!modal || !closeBtn) return;

        const closeModal = () => modal.classList.remove('active');

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    showStatsModal(stats) {
        const modal = document.getElementById('stats-modal');
        if (!modal) return;

        if (stats.pathFound) {
            modal.querySelector('h2').textContent = 'Algorithm Complete!';
            document.getElementById('stat-path-length').textContent = stats.pathLength;
            document.getElementById('stat-nodes-visited').textContent = stats.nodesVisited;
            document.getElementById('stat-time-taken').textContent = `${stats.timeTaken}s`;
            document.getElementById('stat-efficiency').textContent = `${stats.efficiency.toFixed(2)}%`;
        } else {
            modal.querySelector('h2').textContent = 'No Path Found!';
            document.getElementById('stat-path-length').textContent = 'N/A';
            document.getElementById('stat-nodes-visited').textContent = stats.nodesVisited;
            document.getElementById('stat-time-taken').textContent = `${stats.timeTaken}s`;
            document.getElementById('stat-efficiency').textContent = 'N/A';
        }

        modal.classList.add('active');
    }

    startTimer() {
        this.timer = 0;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resumeTimer() {
        if (!this.timerInterval) {
            this.timerInterval = setInterval(() => {
                this.timer++;
                this.updateTimerDisplay();
            }, 1000);
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timer = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = timeString;
    }

    updateControlButtons() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            if (this.isPaused) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            }
        } else {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
            startBtn.disabled = false;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            pauseBtn.disabled = true;
        }
    }

    setupGameMode(mode) {
        switch(mode) {
            case 'challenge':
                this.setupChallengeMode();
                break;
            case 'maze':
                this.setupMazeMode();
                break;
            case 'race':
                this.setupRaceMode();
                break;
            default:
                this.setupFreeMode();
        }
    }

    setupFreeMode() {
        this.showNotification('Free Play Mode: Explore algorithms at your own pace!', 'info');
    }

    setupChallengeMode() {
        this.showNotification('Challenge Mode: Complete objectives for bonus points!', 'info');
    }

    setupMazeMode() {
        this.showNotification('Maze Runner: Navigate through complex mazes!', 'info');
        // Auto-generate a maze
        setTimeout(() => this.generateMaze(), 1000);
    }

    setupRaceMode() {
        this.showNotification('Time Race: Find the path as quickly as possible!', 'info');
    }

    highlightAlgorithmTheory(algorithm) {
        const theoryLinks = document.querySelectorAll('.theory-link');
        const theorySections = document.querySelectorAll('.theory-section');
        
        // Remove active classes
        theoryLinks.forEach(link => link.classList.remove('active'));
        theorySections.forEach(section => section.classList.remove('active'));
        
        // Activate corresponding theory section
        const targetLink = document.querySelector(`[href="#${algorithm}-theory"]`);
        const targetSection = document.getElementById(`${algorithm}-theory`);
        
        if (targetLink && targetSection) {
            targetLink.classList.add('active');
            targetSection.classList.add('active');
        }
    }

    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container') || document.createElement('div');
        if (!notificationContainer.id) {
            notificationContainer.id = 'notification-container';
            Object.assign(notificationContainer.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '1002',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            });
            document.body.appendChild(notificationContainer);
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas fa-${this.getNotificationIcon(type)}"></i><span>${message}</span>`;
        Object.assign(notification.style, {
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });
        document.body.appendChild(notification);
        setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = { 'success': 'check-circle', 'error': 'exclamation-circle', 'warning': 'exclamation-triangle', 'info': 'info-circle' };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = { 'success': 'linear-gradient(45deg, #4caf50, #45a049)', 'error': 'linear-gradient(45deg, #f44336, #d32f2f)', 'warning': 'linear-gradient(45deg, #ff9800, #f57c00)', 'info': 'linear-gradient(45deg, #00d4ff, #0099cc)' };
        return colors[type] || colors.info;
    }

    saveGameData() {
        const gameData = { gameMode: this.gameMode, timestamp: Date.now() };
        try { localStorage.setItem('pathfinder-game-data', JSON.stringify(gameData)); } catch (error) { console.warn('Could not save game data:', error); }
    }

    loadGameData() {
        try {
            const savedData = localStorage.getItem('pathfinder-game-data');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                this.gameMode = gameData.gameMode || 'free';
                document.getElementById('game-mode').value = this.gameMode;
            }
        } catch (error) { console.warn('Could not load game data:', error); }
    }

    updateDisplay() {
        this.updateTimerDisplay();
        document.getElementById('score').textContent = this.score.toLocaleString();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pathFinderApp = new PathFinderApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathFinderApp;
}

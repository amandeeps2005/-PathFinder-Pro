// PathFinder Pro - Main Application Logic
class PathFinderApp {
    constructor() {
        this.currentTab = 'visualizer';
        this.score = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.gameMode = 'free';
        this.isRunning = false;
        this.isPaused = false;
        
        this.initializeApp();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeApp() {
        // Initialize tab switching
        this.setupTabSwitching();
        
        // Initialize theory navigation
        this.setupTheoryNavigation();
        
        // Initialize leaderboard filters
        this.setupLeaderboardFilters();
        
        // Initialize game controls
        this.setupGameControls();
        
        // Load saved data
        this.loadGameData();
        
        console.log('PathFinder Pro initialized successfully!');
    }

    setupTabSwitching() {
        const navTabs = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Remove active class from all tabs and contents
                navTabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
                
                this.currentTab = targetTab;
                
                // Add visual feedback
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
                
                // Remove active class from all links and sections
                theoryLinks.forEach(l => l.classList.remove('active'));
                theorySections.forEach(section => section.classList.remove('active'));
                
                // Add active class to clicked link and corresponding section
                link.classList.add('active');
                document.getElementById(targetSection).classList.add('active');
                
                // Smooth scroll effect
                document.getElementById(targetSection).scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }

    setupLeaderboardFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all filter buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                this.filterLeaderboard(filter);
                
                // Add visual feedback
                btn.classList.add('bounce');
                setTimeout(() => btn.classList.remove('bounce'), 600);
            });
        });
    }

    setupGameControls() {
        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        
        speedSlider.addEventListener('input', (e) => {
            const speed = e.target.value;
            speedValue.textContent = `${speed}x`;
            
            if (window.visualizer) {
                window.visualizer.setSpeed(parseInt(speed));
            }
        });

        // Algorithm selection
        const algorithmSelect = document.getElementById('algorithm-select');
        algorithmSelect.addEventListener('change', (e) => {
            const algorithm = e.target.value;
            
            if (window.visualizer) {
                window.visualizer.setAlgorithm(algorithm);
            }
            
            // Update theory section to match selected algorithm
            this.highlightAlgorithmTheory(algorithm);
        });

        // Game mode selection
        const gameModeSelect = document.getElementById('game-mode');
        gameModeSelect.addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            this.setupGameMode(this.gameMode);
        });

        // Control buttons
        this.setupControlButtons();
    }

    setupControlButtons() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const generateMazeBtn = document.getElementById('generate-maze-btn');

        startBtn.addEventListener('click', () => this.startVisualization());
        pauseBtn.addEventListener('click', () => this.pauseVisualization());
        resetBtn.addEventListener('click', () => this.resetVisualization());
        generateMazeBtn.addEventListener('click', () => this.generateMaze());

        // Keyboard shortcuts
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

        // Play start sound
        if (window.soundManager) window.soundManager.play('algorithmStart');

        // Start timer
        this.startTimer();
        
        // Update UI
        this.isRunning = true;
        this.isPaused = false;
        this.updateControlButtons();
        
        // Start visualization
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
        
        this.updateControlButtons();
        this.showNotification('Visualization paused', 'info');
    }

    resumeVisualization() {
        if (!this.isRunning || !this.isPaused) return;

        this.isPaused = false;
        this.resumeTimer();
        
        if (window.visualizer) {
            window.visualizer.resume();
        }
        
        this.updateControlButtons();
        this.showNotification('Visualization resumed', 'success');
    }

    resetVisualization() {
        this.isRunning = false;
        this.isPaused = false;
        this.stopTimer();
        
        // Play reset sound
        if (window.soundManager) window.soundManager.play('reset');
        
        if (window.visualizer) {
            window.visualizer.reset();
        }
        
        this.updateControlButtons();
        this.resetStats();
        this.showNotification('Grid reset!', 'info');
    }

    generateMaze() {
        if (this.isRunning) {
            this.showNotification('Cannot generate maze while running!', 'error');
            if (window.soundManager) window.soundManager.play('error');
            return;
        }

        // Play maze generation sound
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
        
        // Play success sound
        if (window.soundManager) window.soundManager.play('pathFound');
        
        // Update statistics
        this.updateStats(result);
        
        // Calculate and update score
        const newScore = this.calculateScore(result);
        this.updateScore(newScore);
        
        // Update control buttons
        this.updateControlButtons();
        
        // Save game data
        this.saveGameData();
        
        this.showNotification(`Path found! Score: +${newScore}`, 'success');
    }

    onVisualizationError(error) {
        this.isRunning = false;
        this.isPaused = false;
        this.stopTimer();
        
        this.updateControlButtons();
        this.showNotification(`Error: ${error.message}`, 'error');
    }

    calculateScore(result) {
        const baseScore = 100;
        const timeBonus = Math.max(0, 300 - result.timeTaken);
        const efficiencyBonus = Math.floor(result.efficiency * 50);
        const algorithmMultiplier = this.getAlgorithmMultiplier();
        const gameModeMultiplier = this.getGameModeMultiplier();
        
        return Math.floor(
            (baseScore + timeBonus + efficiencyBonus) * 
            algorithmMultiplier * 
            gameModeMultiplier
        );
    }

    getAlgorithmMultiplier() {
        const algorithm = document.getElementById('algorithm-select').value;
        const multipliers = {
            'dijkstra': 1.2,
            'astar': 1.5,
            'bfs': 1.0,
            'dfs': 0.8
        };
        return multipliers[algorithm] || 1.0;
    }

    getGameModeMultiplier() {
        const multipliers = {
            'free': 1.0,
            'challenge': 1.5,
            'maze': 2.0,
            'race': 2.5
        };
        return multipliers[this.gameMode] || 1.0;
    }

    updateScore(newScore) {
        this.score += newScore;
        document.getElementById('score').textContent = this.score.toLocaleString();
        
        // Add visual feedback
        const scoreElement = document.getElementById('score');
        scoreElement.classList.add('pulse');
        setTimeout(() => scoreElement.classList.remove('pulse'), 600);
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

    updateStats(result) {
        document.getElementById('path-length').textContent = result.pathLength || '-';
        document.getElementById('nodes-visited').textContent = result.nodesVisited || '-';
        document.getElementById('time-taken').textContent = result.timeTaken ? `${result.timeTaken}s` : '-';
        document.getElementById('efficiency').textContent = result.efficiency ? `${Math.round(result.efficiency)}%` : '-';
    }

    resetStats() {
        document.getElementById('path-length').textContent = '-';
        document.getElementById('nodes-visited').textContent = '-';
        document.getElementById('time-taken').textContent = '-';
        document.getElementById('efficiency').textContent = '-';
    }

    updateControlButtons() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isRunning && !this.isPaused) {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Running...';
            startBtn.disabled = true;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            pauseBtn.disabled = false;
        } else if (this.isRunning && this.isPaused) {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            startBtn.disabled = false;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Paused';
            pauseBtn.disabled = true;
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

    filterLeaderboard(filter) {
        // This would filter the leaderboard based on algorithm or time period
        console.log(`Filtering leaderboard by: ${filter}`);
        
        // For now, just show a notification
        const filterText = filter === 'all' ? 'All Time' : filter.toUpperCase();
        this.showNotification(`Showing ${filterText} leaderboard`, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
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
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            'success': 'linear-gradient(45deg, #4caf50, #45a049)',
            'error': 'linear-gradient(45deg, #f44336, #d32f2f)',
            'warning': 'linear-gradient(45deg, #ff9800, #f57c00)',
            'info': 'linear-gradient(45deg, #00d4ff, #0099cc)'
        };
        return colors[type] || colors.info;
    }

    saveGameData() {
        const gameData = {
            score: this.score,
            gameMode: this.gameMode,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('pathfinder-game-data', JSON.stringify(gameData));
        } catch (error) {
            console.warn('Could not save game data:', error);
        }
    }

    loadGameData() {
        try {
            const savedData = localStorage.getItem('pathfinder-game-data');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                this.score = gameData.score || 0;
                this.gameMode = gameData.gameMode || 'free';
                
                // Update UI
                document.getElementById('score').textContent = this.score.toLocaleString();
                document.getElementById('game-mode').value = this.gameMode;
            }
        } catch (error) {
            console.warn('Could not load game data:', error);
        }
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

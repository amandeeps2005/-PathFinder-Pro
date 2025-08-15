// PathFinder Pro - Advanced Grid Visualizer
class GridVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Grid settings
        this.rows = 30;
        this.cols = 40;
        this.cellWidth = this.width / this.cols;
        this.cellHeight = this.height / this.rows;
        
        // Grid state
        this.grid = [];
        this.startNode = null;
        this.endNode = null;
        this.isDrawing = false;
        this.drawMode = 'wall';
        
        // Animation settings
        this.speed = 5;
        this.isRunning = false;
        this.isPaused = false;
        this.currentAlgorithm = 'dijkstra';
        
        // Algorithm state
        this.visitedNodes = [];
        this.pathNodes = [];
        this.currentStep = 0;
        this.animationId = null;
        
        // Colors and effects
        this.colors = {
            empty: '#000000',
            wall: '#333333',
            start: '#4caf50',
            end: '#f44336',
            visited: '#9c27b0',
            path: '#ffeb3b',
            current: '#00d4ff',
            frontier: '#ff9800'
        };
        
        this.initializeGrid();
        this.bindEvents();
        this.render();
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    row,
                    col,
                    type: 'empty',
                    distance: Infinity,
                    heuristic: 0,
                    fScore: Infinity,
                    gScore: Infinity,
                    parent: null,
                    visited: false,
                    inPath: false,
                    weight: 1
                };
            }
        }
        
        // Set default start and end positions
        this.setStartNode(5, 5);
        this.setEndNode(this.rows - 6, this.cols - 6);
    }

    bindEvents() {
        let isMouseDown = false;
        let currentDrawMode = 'wall';
        let isDragging = false;
        let dragTarget = null;

        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            const { row, col } = this.getGridPosition(e);
            
            if (this.grid[row] && this.grid[row][col]) {
                const node = this.grid[row][col];
                
                if (node.type === 'start') {
                    currentDrawMode = 'start';
                    isDragging = true;
                    dragTarget = 'start';
                    this.canvas.style.cursor = 'grabbing';
                    if (window.soundManager) window.soundManager.play('startMove');
                } else if (node.type === 'end') {
                    currentDrawMode = 'end';
                    isDragging = true;
                    dragTarget = 'end';
                    this.canvas.style.cursor = 'grabbing';
                    if (window.soundManager) window.soundManager.play('endMove');
                } else if (node.type === 'wall') {
                    currentDrawMode = 'erase';
                } else {
                    currentDrawMode = 'wall';
                }
                
                if (!isDragging) {
                    this.handleCellClick(row, col, currentDrawMode);
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                const { row, col } = this.getGridPosition(e);
                if (this.grid[row] && this.grid[row][col]) {
                    if (isDragging && dragTarget) {
                        // Handle dragging start/end points
                        const targetNode = this.grid[row][col];
                        if (targetNode.type === 'empty' || targetNode.type === 'visited' || targetNode.type === 'path') {
                            if (dragTarget === 'start') {
                                this.setStartNode(row, col);
                            } else if (dragTarget === 'end') {
                                this.setEndNode(row, col);
                            }
                            this.render();
                        }
                    } else {
                        this.handleCellClick(row, col, currentDrawMode);
                    }
                }
            } else if (!isMouseDown) {
                // Show hover cursor for draggable elements
                const { row, col } = this.getGridPosition(e);
                if (this.grid[row] && this.grid[row][col]) {
                    const node = this.grid[row][col];
                    if (node.type === 'start' || node.type === 'end') {
                        this.canvas.style.cursor = 'grab';
                    } else {
                        this.canvas.style.cursor = 'crosshair';
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
            isDragging = false;
            dragTarget = null;
            this.canvas.style.cursor = 'crosshair';
        });

        this.canvas.addEventListener('mouseleave', () => {
            isMouseDown = false;
            isDragging = false;
            dragTarget = null;
            this.canvas.style.cursor = 'crosshair';
        });

        // Context menu for special actions
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const { row, col } = this.getGridPosition(e);
            this.showContextMenu(e.clientX, e.clientY, row, col);
        });
    }

    getGridPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        const col = Math.floor(x / this.cellWidth);
        const row = Math.floor(y / this.cellHeight);
        
        return { 
            row: Math.max(0, Math.min(row, this.rows - 1)), 
            col: Math.max(0, Math.min(col, this.cols - 1)) 
        };
    }

    handleCellClick(row, col, mode) {
        if (this.isRunning) return;
        
        const node = this.grid[row][col];
        
        switch(mode) {
            case 'start':
                if (node.type !== 'end') {
                    this.setStartNode(row, col);
                    if (window.soundManager) window.soundManager.play('startMove');
                }
                break;
            case 'end':
                if (node.type !== 'start') {
                    this.setEndNode(row, col);
                    if (window.soundManager) window.soundManager.play('endMove');
                }
                break;
            case 'wall':
                if (node.type === 'empty') {
                    node.type = 'wall';
                    if (window.soundManager) window.soundManager.play('wallPlace');
                }
                break;
            case 'erase':
                if (node.type === 'wall') {
                    node.type = 'empty';
                    if (window.soundManager) window.soundManager.play('wallRemove');
                }
                break;
        }
        
        this.render();
    }

    setStartNode(row, col) {
        // Clear previous start node
        if (this.startNode) {
            this.startNode.type = 'empty';
        }
        
        this.startNode = this.grid[row][col];
        this.startNode.type = 'start';
    }

    setEndNode(row, col) {
        // Clear previous end node
        if (this.endNode) {
            this.endNode.type = 'empty';
        }
        
        this.endNode = this.grid[row][col];
        this.endNode.type = 'end';
    }

    setAlgorithm(algorithm) {
        this.currentAlgorithm = algorithm;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    async start() {
        if (this.isRunning) return;
        
        if (!this.startNode || !this.endNode) {
            throw new Error('Please set both start and end points');
        }

        this.isRunning = true;
        this.isPaused = false;
        this.clearVisualization();
        
        const startTime = Date.now();
        
        try {
            const result = await this.runAlgorithm();
            const endTime = Date.now();
            
            result.timeTaken = Math.round((endTime - startTime) / 1000 * 100) / 100;
            result.efficiency = this.calculateEfficiency(result);
            
            return result;
        } catch (error) {
            this.isRunning = false;
            throw error;
        }
    }

    pause() {
        this.isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    resume() {
        this.isPaused = false;
        this.continueAnimation();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.clearWalls();
        this.clearVisualization();
        this.render();
    }

    clearVisualization() {
        this.visitedNodes = [];
        this.pathNodes = [];
        this.currentStep = 0;
        
        // Reset node states from previous runs, but keep walls
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node.type === 'visited' || node.type === 'path' || node.type === 'current' || node.type === 'frontier') {
                    node.type = 'empty';
                }
                node.distance = Infinity;
                node.heuristic = 0;
                node.fScore = Infinity;
                node.gScore = Infinity;
                node.parent = null;
                node.visited = false;
                node.inPath = false;
            }
        }
    }

    clearWalls() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node.type === 'wall') {
                    node.type = 'empty';
                }
            }
        }
    }

    async runAlgorithm() {
        switch (this.currentAlgorithm) {
            case 'dijkstra': return this.dijkstra();
            case 'astar': return this.aStar();
            case 'bfs': return this.bfs();
            case 'dfs': return this.dfs();
            case 'greedy-bfs': return this.greedyBestFirstSearch();
            default: 
                this.showComingSoon();
                return Promise.resolve({ pathFound: false, path: [], visitedCount: 0 });
        }
    }

    async dijkstra() {
        const unvisited = [];
        const visited = [];
        
        // Initialize distances
        this.startNode.distance = 0;
        
        // Add all nodes to unvisited
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col].type !== 'wall') {
                    unvisited.push(this.grid[row][col]);
                }
            }
        }

        while (unvisited.length > 0) {
            if (this.isPaused) {
                await this.waitForResume();
            }

            // Sort by distance and get closest node
            unvisited.sort((a, b) => a.distance - b.distance);
            const currentNode = unvisited.shift();
            
            if (currentNode.distance === Infinity) break;
            
            currentNode.visited = true;
            visited.push(currentNode);
            
            // Animate current node
            await this.animateNode(currentNode, 'visited');
            
            if (currentNode === this.endNode) {
                const path = this.reconstructPath(currentNode);
                await this.animatePath(path);
                
                return {
                    pathLength: path.length,
                    nodesVisited: visited.length,
                    pathFound: true
                };
            }
            
            // Update neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (!neighbor.visited && neighbor.type !== 'wall') {
                    const tentativeDistance = currentNode.distance + neighbor.weight;
                    
                    if (tentativeDistance < neighbor.distance) {
                        neighbor.distance = tentativeDistance;
                        neighbor.parent = currentNode;
                    }
                }
            }
        }
        
        return {
            pathLength: 0,
            nodesVisited: visited.length,
            pathFound: false
        };
    }

    async aStar() {
        const openSet = [this.startNode];
        const closedSet = [];
        
        this.startNode.gScore = 0;
        this.startNode.fScore = this.heuristic(this.startNode, this.endNode);

        while (openSet.length > 0) {
            if (this.isPaused) {
                await this.waitForResume();
            }

            // Get node with lowest fScore
            openSet.sort((a, b) => a.fScore - b.fScore);
            const currentNode = openSet.shift();
            
            closedSet.push(currentNode);
            currentNode.visited = true;
            
            // Animate current node
            await this.animateNode(currentNode, 'visited');
            
            if (currentNode === this.endNode) {
                const path = this.reconstructPath(currentNode);
                await this.animatePath(path);
                
                return {
                    pathLength: path.length,
                    nodesVisited: closedSet.length,
                    pathFound: true
                };
            }
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.type === 'wall' || closedSet.includes(neighbor)) {
                    continue;
                }
                
                const tentativeGScore = currentNode.gScore + neighbor.weight;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= neighbor.gScore) {
                    continue;
                }
                
                neighbor.parent = currentNode;
                neighbor.gScore = tentativeGScore;
                neighbor.fScore = neighbor.gScore + this.heuristic(neighbor, this.endNode);
            }
        }
        
        return {
            pathLength: 0,
            nodesVisited: closedSet.length,
            pathFound: false
        };
    }

    async bfs() {
        const queue = [this.startNode];
        const visited = [];
        
        this.startNode.visited = true;

        while (queue.length > 0) {
            if (this.isPaused) {
                await this.waitForResume();
            }

            const currentNode = queue.shift();
            visited.push(currentNode);
            
            // Animate current node
            await this.animateNode(currentNode, 'visited');
            
            if (currentNode === this.endNode) {
                const path = this.reconstructPath(currentNode);
                await this.animatePath(path);
                
                return {
                    pathLength: path.length,
                    nodesVisited: visited.length,
                    pathFound: true
                };
            }
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (!neighbor.visited && neighbor.type !== 'wall') {
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    queue.push(neighbor);
                }
            }
        }
        
        return {
            pathLength: 0,
            nodesVisited: visited.length,
            pathFound: false
        };
    }

    async dfs() {
        const stack = [this.startNode];
        const visited = [];
        
        while (stack.length > 0) {
            if (this.isPaused) {
                await this.waitForResume();
            }

            const currentNode = stack.pop();
            
            if (currentNode.visited) continue;
            
            currentNode.visited = true;
            visited.push(currentNode);
            
            // Animate current node
            await this.animateNode(currentNode, 'visited');
            
            if (currentNode === this.endNode) {
                const path = this.reconstructPath(currentNode);
                await this.animatePath(path);
                
                return {
                    pathLength: path.length,
                    nodesVisited: visited.length,
                    pathFound: true
                };
            }
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (!neighbor.visited && neighbor.type !== 'wall') {
                    neighbor.parent = currentNode;
                    stack.push(neighbor);
                }
            }
        }
        
        return {
            pathLength: 0,
            nodesVisited: visited.length,
            pathFound: false
        };
    }

    async greedyBestFirstSearch() {
        const openSet = new PriorityQueue((a, b) => a.heuristic < b.heuristic);
        const visited = [];

        this.startNode.heuristic = this.heuristic(this.startNode, this.endNode);
        openSet.push(this.startNode);

        const openSetMap = new Map();
        openSetMap.set(this.startNode, true);

        while (!openSet.isEmpty()) {
            await this.waitForResume();
            const currentNode = openSet.pop();
            openSetMap.delete(currentNode);

            if (currentNode.visited) continue;

            visited.push(currentNode);
            currentNode.visited = true;

            if (currentNode !== this.startNode && currentNode !== this.endNode) {
                await this.animateNode(currentNode, 'visited');
            }

            if (currentNode === this.endNode) {
                const path = this.reconstructPath(currentNode);
                await this.animatePath(path);
                return { pathLength: path.length, nodesVisited: visited.length, pathFound: true };
            }

            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (!neighbor.visited) {
                    neighbor.parent = currentNode;
                    neighbor.heuristic = this.heuristic(neighbor, this.endNode);
                    
                    if (!openSetMap.has(neighbor)) {
                        openSet.push(neighbor);
                        openSetMap.set(neighbor, true);
                        if (neighbor !== this.endNode) {
                            await this.animateNode(neighbor, 'frontier');
                        }
                    }
                }
            }
        }

        return { pathLength: 0, nodesVisited: visited.length, pathFound: false };
    }



    showComingSoon() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '30px "Orbitron", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Algorithm Coming Soon!', this.width / 2, this.height / 2);
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal directions
            [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal directions
        ];
        
        for (const [dRow, dCol] of directions) {
            const newRow = node.row + dRow;
            const newCol = node.col + dCol;

            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols && this.grid[newRow][newCol].type !== 'wall') {
                const neighbor = this.grid[newRow][newCol];

                // Add weight for diagonal movement
                if (Math.abs(dRow) + Math.abs(dCol) === 2) {
                    neighbor.weight = 1.414; // √2
                } else {
                    neighbor.weight = 1;
                }

                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }

    heuristic(nodeA, nodeB) {
        // Manhattan distance
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;
        
        while (currentNode) {
            path.unshift(currentNode);
            currentNode = currentNode.parent;
        }
        
        return path;
    }

    async animateNode(node, type) {
        if (node.type === 'start' || node.type === 'end') return;
        
        node.type = type;
        this.render();
        
        // Wait based on speed setting
        const delay = Math.max(10, 200 - (this.speed * 20));
        await this.sleep(delay);
    }

    async animatePath(path) {
        for (const node of path) {
            if (node.type !== 'start' && node.type !== 'end') {
                node.type = 'path';
                node.inPath = true;
                this.render();
                await this.sleep(50);
            }
        }
        
        this.isRunning = false;
    }

    async waitForResume() {
        while (this.isPaused) {
            await this.sleep(100);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    calculateEfficiency(result) {
        if (!result.pathFound) return 0;
        
        // Calculate theoretical minimum path length (Manhattan distance)
        const minDistance = Math.abs(this.startNode.row - this.endNode.row) + 
                           Math.abs(this.startNode.col - this.endNode.col);
        
        return Math.max(0, (minDistance / result.pathLength) * 100);
    }

    generateMaze() {
        // Clear the grid first
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col].type !== 'start' && this.grid[row][col].type !== 'end') {
                    this.grid[row][col].type = 'empty';
                }
            }
        }
        
        // Generate maze with guaranteed path
        this.generateConnectedMaze();
        this.render();
    }

    generateConnectedMaze() {
        // First, create a guaranteed path from start to end using A*
        this.createGuaranteedPath();
        
        // Then add random walls while preserving connectivity
        this.addRandomWalls();
    }

    createGuaranteedPath() {
        if (!this.startNode || !this.endNode) return;
        
        // Simple pathfinding to create initial path
        const visited = new Set();
        const queue = [this.startNode];
        const parentMap = new Map();
        
        visited.add(`${this.startNode.row},${this.startNode.col}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current === this.endNode) {
                // Reconstruct and mark the guaranteed path
                this.markGuaranteedPath(parentMap);
                return;
            }
            
            const neighbors = this.getDirectNeighbors(current);
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(key) && neighbor.type !== 'wall') {
                    visited.add(key);
                    parentMap.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }
    }

    markGuaranteedPath(parentMap) {
        const guaranteedPath = [];
        let current = this.endNode;
        
        while (current && parentMap.has(current)) {
            guaranteedPath.unshift(current);
            current = parentMap.get(current);
        }
        guaranteedPath.unshift(this.startNode);
        
        // Mark these cells as protected (cannot be walls)
        for (const node of guaranteedPath) {
            node.isProtected = true;
        }
    }

    addRandomWalls() {
        const wallDensity = 0.3; // 30% of cells will be walls
        const totalCells = this.rows * this.cols;
        const targetWalls = Math.floor(totalCells * wallDensity);
        let wallsAdded = 0;
        
        // Create list of all possible wall positions
        const possibleWalls = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node.type === 'empty' && !node.isProtected) {
                    possibleWalls.push(node);
                }
            }
        }
        
        // Shuffle the array for randomness
        for (let i = possibleWalls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possibleWalls[i], possibleWalls[j]] = [possibleWalls[j], possibleWalls[i]];
        }
        
        // Add walls while checking connectivity
        for (const node of possibleWalls) {
            if (wallsAdded >= targetWalls) break;
            
            // Temporarily add wall
            node.type = 'wall';
            
            // Check if path still exists
            if (this.pathExists()) {
                wallsAdded++;
            } else {
                // Remove wall if it blocks the path
                node.type = 'empty';
            }
        }
        
        // Clean up protection flags
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                delete this.grid[row][col].isProtected;
            }
        }
    }

    pathExists() {
        if (!this.startNode || !this.endNode) return false;
        
        const visited = new Set();
        const queue = [this.startNode];
        
        visited.add(`${this.startNode.row},${this.startNode.col}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current === this.endNode) {
                return true;
            }
            
            const neighbors = this.getDirectNeighbors(current);
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(key) && neighbor.type !== 'wall') {
                    visited.add(key);
                    queue.push(neighbor);
                }
            }
        }
        
        return false;
    }

    getDirectNeighbors(node) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Only cardinal directions
        
        for (const [dRow, dCol] of directions) {
            const newRow = node.row + dRow;
            const newCol = node.col + dCol;
            
            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                neighbors.push(this.grid[newRow][newCol]);
            }
        }
        
        return neighbors;
    }

    getMazeNeighbors(row, col) {
        const neighbors = [];
        const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (newRow > 0 && newRow < this.rows - 1 && 
                newCol > 0 && newCol < this.cols - 1 && 
                this.grid[newRow][newCol].type === 'wall') {
                neighbors.push([newRow, newCol]);
            }
        }
        
        return neighbors;
    }

    render() {
        // Clear canvas with dark background
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid with enhanced graphics
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                const x = col * this.cellWidth;
                const y = row * this.cellHeight;
                
                this.drawEnhancedCell(x, y, node);
            }
        }
        
        // Draw grid lines with subtle glow
        this.drawGridLines();
    }

    drawEnhancedCell(x, y, node) {
        const centerX = x + this.cellWidth / 2;
        const centerY = y + this.cellHeight / 2;
        const padding = 1;
        
        // Draw cell background with rounded corners
        this.ctx.fillStyle = this.getCellColor(node);
        this.drawRoundedRect(x + padding, y + padding, 
                           this.cellWidth - padding * 2, 
                           this.cellHeight - padding * 2, 2);
        this.ctx.fill();
        
        // Add special effects based on cell type
        switch(node.type) {
            case 'start':
                this.drawStartNode(centerX, centerY);
                break;
            case 'end':
                this.drawEndNode(centerX, centerY);
                break;
            case 'wall':
                this.drawWallNode(x, y);
                break;
            case 'visited':
                this.drawVisitedNode(centerX, centerY);
                break;
            case 'path':
                this.drawPathNode(centerX, centerY);
                break;
        }
    }

    getCellColor(node) {
        const colors = {
            empty: '#1a1a1a',
            wall: '#2d2d2d',
            start: '#4caf50',
            end: '#f44336',
            visited: '#9c27b0',
            path: '#ffeb3b',
            current: '#00d4ff',
            frontier: '#ff9800'
        };
        return colors[node.type] || colors.empty;
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    drawStartNode(centerX, centerY) {
        const radius = Math.min(this.cellWidth, this.cellHeight) / 3;
        
        // Outer glow
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
        gradient.addColorStop(0, 'rgba(76, 175, 80, 0.8)');
        gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner circle
        this.ctx.fillStyle = '#4caf50';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Play icon
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - radius/3, centerY - radius/2);
        this.ctx.lineTo(centerX + radius/2, centerY);
        this.ctx.lineTo(centerX - radius/3, centerY + radius/2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawEndNode(centerX, centerY) {
        const radius = Math.min(this.cellWidth, this.cellHeight) / 3;
        
        // Outer glow
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
        gradient.addColorStop(0, 'rgba(244, 67, 54, 0.8)');
        gradient.addColorStop(1, 'rgba(244, 67, 54, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner circle
        this.ctx.fillStyle = '#f44336';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Target rings
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawWallNode(x, y) {
        // Create brick-like pattern
        const brickHeight = this.cellHeight / 3;
        const brickWidth = this.cellWidth / 2;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const brickX = x + j * brickWidth + (i % 2 === 0 ? 0 : brickWidth / 2);
                const brickY = y + i * brickHeight;

                // Deterministic brick color based on position
                const seed = (i * 2 + j) ^ (Math.floor(x) * 73856093) ^ (Math.floor(y) * 19349663);
                const brightness = 0.2 + ((seed & 0xFF) / 255) * 0.1;
                this.ctx.fillStyle = `rgb(${brightness * 255}, ${brightness * 255}, ${brightness * 255})`;

                this.drawRoundedRect(brickX, brickY, brickWidth - 1, brickHeight - 1, 1);
                this.ctx.fill();

                // Brick outline
                this.ctx.strokeStyle = '#444';
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
            }
        }
    }

    drawVisitedNode(centerX, centerY) {
        const radius = Math.min(this.cellWidth, this.cellHeight) / 4;
        
        // Pulsing effect
        const pulseRadius = radius + Math.sin(Date.now() * 0.01) * 2;
        
        // Gradient fill
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
        gradient.addColorStop(0, 'rgba(156, 39, 176, 0.8)');
        gradient.addColorStop(1, 'rgba(156, 39, 176, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPathNode(centerX, centerY) {
        const radius = Math.min(this.cellWidth, this.cellHeight) / 3;
        
        // Bright glow effect
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
        gradient.addColorStop(0, 'rgba(255, 235, 59, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 235, 59, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Diamond shape
        this.ctx.fillStyle = '#ffeb3b';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - radius);
        this.ctx.lineTo(centerX + radius, centerY);
        this.ctx.lineTo(centerX, centerY + radius);
        this.ctx.lineTo(centerX - radius, centerY);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawGridLines() {
        // Subtle grid lines with glow
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        this.ctx.shadowColor = 'rgba(0, 212, 255, 0.3)';
        this.ctx.shadowBlur = 1;
        
        // Vertical lines
        for (let col = 0; col <= this.cols; col++) {
            const x = col * this.cellWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let row = 0; row <= this.rows; row++) {
            const y = row * this.cellHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
    }

    drawNodeIcon(x, y, type) {
        const centerX = x + this.cellWidth / 2;
        const centerY = y + this.cellHeight / 2;
        const radius = Math.min(this.cellWidth, this.cellHeight) / 4;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${radius * 1.5}px FontAwesome`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        if (type === 'start') {
            this.ctx.fillText('▶', centerX, centerY);
        } else if (type === 'end') {
            this.ctx.fillText('🎯', centerX, centerY);
        }
    }

    showContextMenu(x, y, row, col) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #00d4ff;
            border-radius: 5px;
            padding: 0.5rem;
            z-index: 1000;
            color: white;
            font-size: 0.9rem;
        `;
        
        const node = this.grid[row][col];
        const options = [
            { text: 'Set as Start', action: () => this.setStartNode(row, col) },
            { text: 'Set as End', action: () => this.setEndNode(row, col) },
            { text: 'Toggle Wall', action: () => this.toggleWall(row, col) }
        ];
        
        options.forEach(option => {
            const item = document.createElement('div');
            item.textContent = option.text;
            item.style.cssText = `
                padding: 0.3rem 0.5rem;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.2s;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(0, 212, 255, 0.3)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            
            item.addEventListener('click', () => {
                option.action();
                this.render();
                menu.remove();
            });
            
            menu.appendChild(item);
        });
        
        document.body.appendChild(menu);
        
        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', () => {
                if (menu.parentNode) {
                    menu.remove();
                }
            }, { once: true });
        }, 100);
    }

    toggleWall(row, col) {
        const node = this.grid[row][col];
        if (node.type === 'empty') {
            node.type = 'wall';
        } else if (node.type === 'wall') {
            node.type = 'empty';
        }
    }
}

// Initialize visualizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new GridVisualizer('grid-canvas');
});

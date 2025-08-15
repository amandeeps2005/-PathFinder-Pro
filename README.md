# PathFinder Pro - Gamified Algorithm Visualizer

PathFinder Pro is an interactive, web-based application designed to visualize various pathfinding algorithms in a fun and engaging way. It provides a gamified experience for learning and experimenting with fundamental graph traversal algorithms.

## Features

*   **Interactive Grid**: Click and drag to create walls, and move the start and end nodes.
*   **Algorithm Visualization**: Watch algorithms like Dijkstra's, A*, BFS, and DFS come to life in real-time.
*   **Speed Control**: Adjust the visualization speed to observe the process at your own pace.
*   **Maze Generation**: Instantly generate complex mazes to challenge the algorithms.
*   **Game Modes**:
    *   **Free Play**: Experiment freely with no constraints.
    *   **Challenge Mode**: Tackle specific objectives.
    *   **Maze Runner**: Navigate through generated mazes.
    *   **Time Race**: Find the path as quickly as possible.
*   **In-depth Theory Section**: Learn the theory behind each algorithm with clear explanations, pseudocode, and code examples in Java, Python, and C++.
*   **Performance Stats**: Get detailed statistics like path length, nodes visited, and time taken after each visualization.
*   **Sleek UI**: A modern, responsive interface with particle effects and sound feedback.

## Algorithms Implemented

*   **Dijkstra's Algorithm**: The classic algorithm for finding the shortest paths in a weighted graph.
*   **A* Search**: An efficient algorithm that uses heuristics to find the shortest path.
*   **Breadth-First Search (BFS)**: An unweighted algorithm that guarantees the shortest path in terms of the number of edges.
*   **Depth-First Search (DFS)**: An algorithm that explores as far as possible along each branch before backtracking.

## How to Use

1.  **Open the Application**: Simply open the `index.html` file in your web browser.
2.  **Set Up the Grid**:
    *   The **green node** is the start point.
    *   The **red node** is the end point.
    *   Click and drag the start/end nodes to move them.
    *   Click and drag on empty cells to draw **walls**.
3.  **Select an Algorithm**: Choose your desired algorithm from the dropdown menu.
4.  **Adjust Speed**: Use the slider to control the visualization speed.
5.  **Visualize!**: Click the **Start** button or press the `Spacebar` to begin.

## Technologies Used

*   **HTML5**: For the structure of the application.
*   **CSS3**: For styling, animations, and layout.
*   **Vanilla JavaScript (ES6+)**: For all the application logic, DOM manipulation, and algorithm implementations.
*   **HTML5 Canvas**: For rendering the interactive grid and visualizations.

## Project Structure

```
-PathFinder-Pro-main/
├── app.js             # Main application logic, event handling, and state management.
├── index.html         # The main HTML file.
├── particles.js       # Renders the animated particle background.
├── sounds.js          # Manages all audio feedback.
├── styles.css         # All styles for the application.
├── utils.js           # Utility functions (not present in current structure, but good practice).
└── visualizer.js      # Core logic for the grid, drawing, and algorithm execution.
```

## Getting Started

No installation is needed! Since this is a vanilla HTML, CSS, and JavaScript project, you can run it by following these simple steps:

1.  Clone this repository:
    ```bash
    git clone https://github.com/your-username/PathFinder-Pro-main.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd -PathFinder-Pro-main
    ```
3.  Open the `index.html` file in your favorite web browser.

That's it! You're ready to start visualizing.

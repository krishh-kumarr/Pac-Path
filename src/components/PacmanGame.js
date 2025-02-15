import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Pacman Game Component (Provided in the search result)
const GRID_SIZE = 15;
const CELL_SIZE = 50;

const PacmanGame = () => {
    const [grid, setGrid] = useState([]);
    const [pacman, setPacman] = useState({ x: 1, y: 1 });
    const [food, setFood] = useState(null);
    const [walls, setWalls] = useState([]);
    const [path, setPath] = useState([]);
    const [score, setScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [placingFood, setPlacingFood] = useState(false);
    const [animatedCells, setAnimatedCells] = useState([]);
    //const [showPopup, setShowPopup] = useState(false); //Removed
    //const [popupMessage, setPopupMessage] = useState(''); //Removed
    const pacmanRef = useRef(pacman);
    const [pathIndex, setPathIndex] = useState(0); // Track current position in path
    const [showRealTimePopup, setShowRealTimePopup] = useState(false);
    const [realTimePopupMessage, setRealTimePopupMessage] = useState('');
    const [realTimeScore, setRealTimeScore] = useState(0);

    useEffect(() => {
        pacmanRef.current = pacman;
    }, [pacman]);

    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = () => {
        const newWalls = [];

        for (let i = 0; i < GRID_SIZE; i++) {
            newWalls.push(`${i},0`);
            newWalls.push(`${i},${GRID_SIZE - 1}`);
            newWalls.push(`0,${i}`);
            newWalls.push(`${GRID_SIZE - 1},${i}`);
        }

        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            if ((x !== 1 || y !== 1)) {
                newWalls.push(`${x},${y}`);
            }
        }

        setWalls(newWalls);
        setPacman({ x: 1, y: 1 });
        setFood(null);
        setScore(0);
        setPath([]);
        setIsMoving(false);
        setGameStarted(false);
        setPlacingFood(true);
        setAnimatedCells([]);
        //setShowPopup(false); //Removed
        //setPopupMessage(''); //Removed
        setPathIndex(0);
        //setShowRealTimePopup(false); //keep as is.
        setRealTimePopupMessage('');
        setRealTimeScore(0);
    };

    const findPath = (start, end) => {
        const h = (pos) => Math.abs(end.x - pos.x) + Math.abs(end.y - pos.y);

        const getNeighbors = (pos) => {
            const directions = [
                { x: 0, y: 1 },
                { x: 1, y: 0 },
                { x: 0, y: -1 },
                { x: -1, y: 0 }
            ];

            return directions
                .map(dir => ({
                    x: pos.x + dir.x,
                    y: pos.y + dir.y
                }))
                .filter(newPos =>
                    newPos.x >= 0 &&
                    newPos.x < GRID_SIZE &&
                    newPos.y >= 0 &&
                    newPos.y < GRID_SIZE &&
                    !walls.includes(`${newPos.x},${newPos.y}`)
                );
        };

        const openSet = [start];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(`${start.x},${start.y}`, 0);
        fScore.set(`${start.x},${start.y}`, h(start));

        while (openSet.length > 0) {
            const current = openSet.reduce((a, b) =>
                (fScore.get(`${a.x},${a.y}`) < fScore.get(`${b.x},${b.y}`)) ? a : b
            );

            if (current.x === end.x && current.y === end.y) {
                const path = [];
                let temp = current;
                while (cameFrom.has(`${temp.x},${temp.y}`)) {
                    path.unshift(temp);
                    temp = cameFrom.get(`${temp.x},${temp.y}`);
                }
                path.unshift(start);
                return path;
            }
            openSet.splice(openSet.indexOf(current), 1);
            closedSet.add(`${current.x},${current.y}`); for (const neighbor of getNeighbors(current)) {
                if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

                const tentativeG = gScore.get(`${current.x},${current.y}`) + 1;

                if (!openSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
                    openSet.push(neighbor);
                } else if (tentativeG >= gScore.get(`${neighbor.x},${neighbor.y}`)) {
                    continue;
                }

                cameFrom.set(`${neighbor.x},${neighbor.y}`, current);
                gScore.set(`${neighbor.x},${neighbor.y}`, tentativeG);
                fScore.set(`${neighbor.x},${neighbor.y}`, tentativeG + h(neighbor));
            }
        }

        return null;
    };

    const handleCellClick = (x, y) => {
        if (placingFood && !walls.includes(`${x},${y}`) && (x !== pacmanRef.current.x || y !== pacmanRef.current.y)) {
            setFood({ x, y });
            setPlacingFood(false);
        }
    };

    const handleFoodCollection = () => {
        setPlacingFood(true);
        setFood(null);
    };

    useEffect(() => {
        if (!gameStarted || isMoving || !food) return;

        const movePacman = async () => {
            const newPath = findPath(pacman, food);

            if (newPath && newPath.length > 1) {
                setPath(newPath);
                setIsMoving(true);
                setAnimatedCells([]);
                setPathIndex(1); // Start from the second element in the path
                setRealTimeScore(0);
                setShowRealTimePopup(true);

                for (let i = 1; i < newPath.length; i++) {
                    const pos = newPath[i];

                    // Update state within the loop using a functional update
                    setPacman(prevPacman => ({ x: pos.x, y: pos.y }));

                    setRealTimeScore(prevScore => {
                        const newScore = prevScore + 1;
                        // Show real-time popup
                        const currentPathCoords = newPath.slice(0, i + 1).map(p => `(${p.x}, ${p.y})`).join(' -> ');
                        setRealTimePopupMessage(
                            <div>
                                <p>Moving to food...</p>
                                <p>Blocks Travelled: {newScore}</p>
                                <p>Current Path: {currentPathCoords}</p>
                            </div>
                        );
                        return newScore;
                    });
                    setAnimatedCells(prevAnimatedCells => [...prevAnimatedCells, { x: pos.x, y: pos.y }]);
                    setPathIndex(i);

                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Check if Pacman has reached the food
                if (pacmanRef.current.x === food.x && pacmanRef.current.y === food.y) {
                    setIsMoving(false);
                    setAnimatedCells([]);
                    handleFoodCollection();

                } else {
                    setIsMoving(false);
                    setAnimatedCells([]);
                }
            }
        };

        movePacman();
    }, [gameStarted, food, isMoving]);

    const cellVariants = {
        initial: { y: 0, scale: 1 },
        animate: {
            y: [-5, 0, -5, 0],
            scale: [1, 1.1, 1, 1],
            transition: {
                duration: 0.4,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop"
            }
        }
    };

    const RealTimePopup = ({ message }) => (
        <div className="fixed top-20 left-0 w-full  flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-md">
                {message}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
            <div className="mb-4 text-white text-2xl">Blocks Travelled: {score}</div>

            {placingFood && (
                <div className="mb-4 text-yellow-400 text-xl">
                    Click on the grid to place food for Pacman!
                </div>
            )}... {!gameStarted && !placingFood && (
                <button
                    onClick={() => setGameStarted(true)}
                    className="mb-4 px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500"
                >
                    Start Game
                </button>
            )}... <div
                className="relative bg-blue-900 rounded-lg p-2"
                style={{
                    width: GRID_SIZE * CELL_SIZE + 20,
                    height: GRID_SIZE * CELL_SIZE + 20
                }}
            >
                {/* Grid */}
                {[...Array(GRID_SIZE)].map((_, y) => (
                    <div key={y} className="flex">
                        {[...Array(GRID_SIZE)].map((_, x) => {
                            const isAnimated = animatedCells.some(cell => cell.x === x && cell.y === y);

                            return (
                                <motion.div
                                    key={`${x},${y}`}
                                    className="border border-blue-700 cursor-pointer"
                                    style={{
                                        width: CELL_SIZE,
                                        height: CELL_SIZE,
                                        backgroundColor: walls.includes(`${x},${y}`) ? '#1a365d' : 'transparent'
                                    }}
                                    onClick={() => handleCellClick(x, y)}
                                    variants={cellVariants}
                                    initial="initial"
                                    animate={isAnimated ? "animate" : "initial"}
                                />
                            );
                        })}
                    </div>
                ))}
                {/* Path visualization */}
                {path.map((pos, index) => (
                    <div
                        key={index}
                        className="absolute w-2 h-2 bg-yellow-200 rounded-full"
                        style={{
                            left: pos.x * CELL_SIZE + CELL_SIZE / 2 + 8,
                            top: pos.y * CELL_SIZE + CELL_SIZE / 2 + 8,
                            opacity: 0.3
                        }}
                    />
                ))}
                {/* Pacman */}
                <motion.div
                    className="absolute"
                    style={{
                        left: 8,
                        top: 8,
                        width: CELL_SIZE,
                        height: CELL_SIZE
                    }}
                    animate={{
                        x: pacman.x * CELL_SIZE,
                        y: pacman.y * CELL_SIZE,
                        rotate: path.length > 1 ?
                            Math.atan2(
                                path[1]?.y - pacman.y,
                                path[1]?.x - pacman.x
                            ) * (180 / Math.PI) : 0
                    }}
                    transition={{
                        type: "tween",
                        duration: 0.3
                    }}
                >
                    <svg viewBox="0 0 40 40">
                        <motion.path
                            d="M20 0 A20 20 0 1 1 20 40 A20 20 0 1 1 20 0 L20 20 Z"
                            fill="yellow"
                            animate={{
                                d: isMoving ?
                                    "M20 0 A20 20 0 1 1 20 40 A20 20 0 1 1 20 0 L20 20 Z" :
                                    "M20 7 A20 20 0 1 1 20 33 A20 20 0 1 1 20 7 L20 20 Z"
                            }}
                            transition={{
                                duration: 0.3,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />
                    </svg>
                </motion.div>

                {/* Food */}
                {food && (
                    <div
                        className="absolute"
                        style={{
                            left: food.x * CELL_SIZE + 8,
                            top: food.y * CELL_SIZE + 8,
                            width: CELL_SIZE,
                            height: CELL_SIZE
                        }}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={initializeGame}
                className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-blue-600"
            >
                Reset Game
            </button>
            {showRealTimePopup && (
                <RealTimePopup message={realTimePopupMessage} />
            )}
        </div>
    );
};

// 8 Puzzle Game Component
const EightPuzzleGame = () => {
    const [puzzle, setPuzzle] = useState([1, 2, 3, 4, 5, 6, 7, 8, 0]); // 0 represents the blank tile
    const [userMoves, setUserMoves] = useState([]);
    const [gameWon, setGameWon] = useState(false);
    const [solution, setSolution] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false); // State to control analytics visibility

    useEffect(() => {
        // Check if the puzzle is solved on every move
        if (isSolved(puzzle)) {
            setGameWon(true);
            setShowAnalytics(true); // Show analytics when the game is won
        }
    }, [puzzle]);

    const shufflePuzzle = () => {
        let shuffledPuzzle;
        do {
            shuffledPuzzle = generateEasyPuzzle();
        } while (!isSolvable(shuffledPuzzle));

        setPuzzle(shuffledPuzzle);
        setUserMoves([]);
        setGameWon(false);
        setSolution(null);
        setShowAnalytics(false); // Hide analytics when the game is shuffled
    };

    const generateEasyPuzzle = () => {
        // Start with a solved puzzle
        let puzzle = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let blankIndex = 8; // Index of the blank tile

        // Make 5-6 random moves
        for (let i = 0; i < 5; i++) {
            const possibleMoves = [];
            const row = Math.floor(blankIndex / 3);
            const col = blankIndex % 3;

            // Check possible moves (up, down, left, right)
            if (row > 0) possibleMoves.push(blankIndex - 3);   // Up
            if (row < 2) possibleMoves.push(blankIndex + 3);   // Down
            if (col > 0) possibleMoves.push(blankIndex - 1);   // Left
            if (col < 2) possibleMoves.push(blankIndex + 1);   // Right

            // Randomly select a move
            const moveIndex = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

            // Swap the blank tile
            [puzzle[blankIndex], puzzle[moveIndex]] = [puzzle[moveIndex], puzzle[blankIndex]];
            blankIndex = moveIndex;
        }

        return puzzle;
    };

    const isSolvable = (grid) => {
        let inversions = 0;
        for (let i = 0; i < grid.length; i++) {
            for (let j = i + 1; j < grid.length; j++) {
                if (grid[i] && grid[j] && grid[i] > grid[j]) {
                    inversions++;
                }
            }
        }
        return inversions % 2 === 0;
    };

    const isSolved = (grid) => {
        const solvedState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        return grid.every((value, index) => value === solvedState[index]);
    };

    const getBlankPosition = (grid) => {
        return grid.indexOf(0);
    };

    const moveTile = (index) => {
        if (gameWon) return;

        const blankIndex = getBlankPosition(puzzle);
        const row = Math.floor(index / 3);
        const col = index % 3;
        const blankRow = Math.floor(blankIndex / 3);
        const blankCol = blankIndex % 3;

        if ((Math.abs(row - blankRow) === 1 && col === blankCol) || (Math.abs(col - blankCol) === 1 && row === blankRow)) {
            const newPuzzle = [...puzzle];
            [newPuzzle[blankIndex], newPuzzle[index]] = [newPuzzle[index], newPuzzle[blankIndex]];
            setPuzzle(newPuzzle);
            setUserMoves([...userMoves, index]);
        }
    };

    // Analytics
    const moveFrequency = () => {
        const freq = {};
        userMoves.forEach(move => {
            freq[move] = (freq[move] || 0) + 1;
        });
        return freq;
    };

    const renderMoveFrequency = () => {
        const freq = moveFrequency();
        return (
            <ul>
                {Object.entries(freq).map(([move, count]) => (
                    <li key={move}>Tile {move + 1}: {count} moves</li>
                ))}
            </ul>
        );
    };

    const Analytics = () => {
        return (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg text-white">
                <h3 className="text-xl font-semibold mb-2">Game Analytics</h3>
                <p>Total Moves: {userMoves.length}</p>
                <h4 className="text-lg font-semibold mt-2">Move Frequency:</h4>
                {renderMoveFrequency()}
            </div>
        );
    };

    const GreedyBestFirstExplanation = () => {
        return (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg text-white">
                <h3 className="text-xl font-semibold mb-2">Greedy Best-First Search</h3>
                <p>
                    Imagine you're trying to solve this puzzle with a super-simple strategy: always pick the move that seems to get you closest to the solution <i>right now</i>. That's basically Greedy Best-First Search!
                </p>
                <p>
                    <strong className="text-yellow-400">How it Works:</strong>
                </p>
                <ol className="list-decimal list-inside pl-5">
                    <li>It looks at all possible moves.</li>
                    <li>It guesses which move gets it closest to the solution (using a "heuristic"). For example, it might count how many tiles are in the correct spot.</li>
                    <li>It picks the move that *seems* best and repeats!</li>
                </ol>
                <p>
                    <strong className="text-red-400">The Catch:</strong>
                    Just like grabbing for the closest cookie, it doesn't always lead to the *best* path! It can get stuck or take a longer route.
                </p>

                {/* Simple Diagram (text-based, can be enhanced with actual image/SVG) */}
                <div className="mt-2">
                    <p>
                        <strong className="text-green-400">Visual Example:</strong>
                    </p>
                    <pre className="bg-gray-700 p-2 rounded">
                        <code>
                            Start: [1 2 3, 4 5 6, 7 8 0] {'\n'}
                            Goal:  [1 2 3, 4 5 6, 7 8 0] {'\n'}
                            Heuristic: Tiles in correct place
                        </code>
                    </pre>
                </div>

                <p>
                    In our puzzle, a simple heuristic could be: "How many tiles are in their final correct position?".  Greedy Best-First Search would always pick the move that increases this number the most.
                </p>
            </div>
        );
    };


    return (
        <div className="flex flex-col items-center p-4">
            <div className="text-white text-2xl mb-4">8 Puzzle Game</div>
            <div className="grid grid-cols-3 gap-2">
                {puzzle.map((tile, index) => (
                    <button
                        key={index}
                        className={`w-20 h-20 border border-gray-700 text-white text-4xl font-bold flex items-center justify-center rounded ${tile === 0 ? 'bg-gray-900' : 'bg-gray-800 hover:bg-gray-700'}`}
                        onClick={() => moveTile(index)}
                        disabled={gameWon}
                    >
                        {tile !== 0 ? tile : ''}
                    </button>
                ))}
            </div>
            {gameWon && (
                <div className="text-green-500 mt-4 text-xl">
                    Congratulations! You solved the puzzle!
                </div>
            )}
            <button
                onClick={shufflePuzzle}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Shuffle Puzzle
            </button>
            {showAnalytics && <Analytics />}
            {showAnalytics && <GreedyBestFirstExplanation />}
        </div>
    );
};

const App = () => {
    return (
        <div className="flex flex-row items-center justify-center min-h-screen bg-gray-900 p-4">
            <PacmanGame />
            <EightPuzzleGame />
        </div>
    );
};

export default App;

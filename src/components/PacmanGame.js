import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Stage, Layer, Rect, Text, Line, Arrow } from 'react-konva';
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
        setPathIndex(0);
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
                setPathIndex(1); 
                setRealTimeScore(0);
                setShowRealTimePopup(true);

                for (let i = 1; i < newPath.length; i++) {
                    const pos = newPath[i];

                    
                    setPacman(prevPacman => ({ x: pos.x, y: pos.y }));

                    setRealTimeScore(prevScore => {
                        const newScore = prevScore + 1;
                       
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
            <div className="mb-4 text-white text-2xl">Pac-an game using A* Search 👾 </div>

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
    const [puzzle, setPuzzle] = useState([1, 2, 3, 4, 5, 6, 7, 8, 0]);
    const [userMoves, setUserMoves] = useState([]);
    const [gameWon, setGameWon] = useState(false);
    const [solution, setSolution] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [puzzleHistory, setPuzzleHistory] = useState([
        [1, 2, 3, 4, 5, 6, 7, 8, 0]
    ]);

    useEffect(() => {
        if (isSolved(puzzle)) {
            setGameWon(true);
            setShowAnalytics(true);
            shootConfetti();
        }
    }, [puzzle]);

    const shootConfetti = () => {
        const duration = 300;
        const end = Date.now() + duration;

        const interval = setInterval(() => {
            if (Date.now() > end) {
                clearInterval(interval);
                return;
            }

            confetti({
                particleCount: 800,
                spread: 100,
                origin: { x: Math.random(), y: 0 }
            });
        }, 60);
    };

    const shufflePuzzle = () => {
        let shuffledPuzzle;
        do {
            shuffledPuzzle = generateEasyPuzzle();
        } while (!isSolvable(shuffledPuzzle));

        setPuzzle(shuffledPuzzle);
        setUserMoves([]);
        setGameWon(false);
        setSolution(null);
        setShowAnalytics(false);
        setPuzzleHistory([shuffledPuzzle]);
    };

    const generateEasyPuzzle = () => {
        let puzzle = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let blankIndex = 8;

        for (let i = 0; i < 5; i++) {
            const possibleMoves = [];
            const row = Math.floor(blankIndex / 3);
            const col = blankIndex % 3;

            if (row > 0) possibleMoves.push(blankIndex - 3);
            if (row < 2) possibleMoves.push(blankIndex + 3);
            if (col > 0) possibleMoves.push(blankIndex - 1);
            if (col < 2) possibleMoves.push(blankIndex + 1);

            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            puzzle[blankIndex] = puzzle[move];
            puzzle[move] = 0;
            blankIndex = move;
        }

        return puzzle;
    };

    const isSolvable = (puzzle) => {
        let inversions = 0;
        for (let i = 0; i < 9; i++) {
            for (let j = i + 1; j < 9; j++) {
                if (puzzle[i] && puzzle[j] && puzzle[i] > puzzle[j]) {
                    inversions++;
                }
            }
        }
        return inversions % 2 === 0;
    };

    const isSolved = (currentPuzzle) => {
        const solvedPuzzle = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        return currentPuzzle.every((value, index) => value === solvedPuzzle[index]);
    };

    const getBlankPosition = (currentPuzzle) => {
        return currentPuzzle.indexOf(0);
    };

    const moveTile = (tileIndex) => {
        if (gameWon) return;

        const blankIndex = getBlankPosition(puzzle);
        const row = Math.floor(blankIndex / 3);
        const col = blankIndex % 3;
        const tileRow = Math.floor(tileIndex / 3);
        const tileCol = tileIndex % 3;

        if ((Math.abs(row - tileRow) === 1 && col === tileCol) || (Math.abs(col - tileCol) === 1 && row === tileRow)) {
            const newPuzzle = [...puzzle];
            newPuzzle[blankIndex] = newPuzzle[tileIndex];
            newPuzzle[tileIndex] = 0;
            setPuzzle(newPuzzle);
            setUserMoves([...userMoves, { from: tileIndex, to: blankIndex }]);
            setPuzzleHistory([...puzzleHistory, newPuzzle]);
        }
    };

    const solvePuzzle = () => {
        const solvedState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        const initialState = [...puzzle];

        const getNeighbors = (puzzleState) => {
            const blankIndex = getBlankPosition(puzzleState);
            const row = Math.floor(blankIndex / 3);
            const col = blankIndex % 3;
            const neighbors = [];

            const possibleMoves = [];
            if (row > 0) possibleMoves.push(blankIndex - 3);
            if (row < 2) possibleMoves.push(blankIndex + 3);
            if (col > 0) possibleMoves.push(blankIndex - 1);
            if (col < 2) possibleMoves.push(blankIndex + 1);

            possibleMoves.forEach(move => {
                const newPuzzle = [...puzzleState];
                newPuzzle[blankIndex] = newPuzzle[move];
                newPuzzle[move] = 0;
                neighbors.push(newPuzzle);
            });

            return neighbors;
        };

        const heuristic = (puzzleState) => {
            let misplacedTiles = 0;
            for (let i = 0; i < 9; i++) {
                if (puzzleState[i] !== 0 && puzzleState[i] !== solvedState[i]) {
                    misplacedTiles++;
                }
            }
            return misplacedTiles;
        };

        const aStarSearch = () => {
            const closedSet = new Set();
            const openSet = [{ state: initialState, gScore: 0, fScore: heuristic(initialState), path: [] }];

            while (openSet.length > 0) {
                openSet.sort((a, b) => a.fScore - b.fScore);
                const current = openSet.shift();

                if (isSolved(current.state)) {
                    return current.path;
                }

                const stateKey = current.state.toString();
                if (closedSet.has(stateKey)) {
                    continue;
                }
                closedSet.add(stateKey);

                const neighbors = getNeighbors(current.state);
                neighbors.forEach(neighbor => {
                    const gScore = current.gScore + 1;
                    const fScore = gScore + heuristic(neighbor);
                    const existing = openSet.find(item => item.state.toString() === neighbor.toString());

                    if (!existing || gScore < existing.gScore) {
                        if (existing) {
                            openSet.splice(openSet.indexOf(existing), 1);
                        }
                        openSet.push({ state: neighbor, gScore, fScore, path: [...current.path, current.state] });
                    }
                });
            }
            return null;
        };

        const solutionPath = aStarSearch();
        if (solutionPath) {
            setSolution(solutionPath);
            setShowAnalytics(true);
        } else {
            setSolution("No solution found.");
        }
    };

    const handleAnalyticsClose = () => {
        setShowAnalytics(false);
    };

    const PuzzleTile = ({ index, value }) => {
        const tileSize = 80;
        const x = (index % 3) * tileSize;
        const y = Math.floor(index / 3) * tileSize;
        const isBlank = value === 0;

        return (
            <Rect
                x={x}
                y={y}
                width={tileSize}
                height={tileSize}
                fill={isBlank ? 'white' : '#4CAF50'}
                stroke="black"
                strokeWidth={2}
                onClick={() => moveTile(index)}
                cornerRadius={10}
                shadowBlur={5}
            />
        );
    };

    const PuzzleText = ({ index, value }) => {
        const tileSize = 80;
        const x = (index % 3) * tileSize;
        const y = Math.floor(index / 3) * tileSize;
        const isBlank = value === 0;

        return (
            <Text
                x={x}
                y={y}
                width={tileSize}
                height={tileSize}
                text={!isBlank ? value.toString() : ''}
                fontSize={40}
                fontFamily="Calibri"
                fill={isBlank ? 'black' : 'white'}
                align="center"
                verticalAlign="middle"
                onClick={() => moveTile(index)}
                fontStyle="bold"
            />
        );
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-6">8-Puzzle Game</h1>
            <div className="mb-4">
                <Stage width={240} height={240}>
                    <Layer>
                        {puzzle.map((value, index) => (
                            <>
                                <PuzzleTile key={`tile-${index}`} index={index} value={value} />
                                <PuzzleText key={`text-${index}`} index={index} value={value} />
                            </>
                        ))}
                        <Line
                            points={[80, 0, 80, 240]}
                            stroke="black"
                            strokeWidth={2}
                        />
                        <Line
                            points={[160, 0, 160, 240]}
                            stroke="black"
                            strokeWidth={2}
                        />
                        <Line
                            points={[0, 80, 240, 80]}
                            stroke="black"
                            strokeWidth={2}
                        />
                        <Line
                            points={[0, 160, 240, 160]}
                            stroke="black"
                            strokeWidth={2}
                        />
                    </Layer>
                </Stage>
            </div>
            <div className="flex space-x-4 mb-4">
                <button
                    onClick={shufflePuzzle}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                    Shuffle
                </button>
                <button
                    onClick={solvePuzzle}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                >
                    Solve
                </button>
            </div>
            {gameWon && (
                <div className="text-green-600 font-bold text-xl mb-4">
                    Congratulations! You solved the puzzle!
                </div>
            )}
            {solution && typeof solution === 'string' && (
                <div className="text-red-600 font-bold text-xl mb-4">{solution}</div>
            )}

            {showAnalytics && (
                <AnalyticsPopup
                    onClose={handleAnalyticsClose}
                    moves={userMoves}
                    solution={solution}
                    puzzleHistory={puzzleHistory}
                />
            )}
        </div>
    );
};

const AnalyticsPopup = ({ onClose, moves, solution, puzzleHistory }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const tileSize = 60;

    const renderPuzzle = (puzzle) => {
        return (
            <Stage width={tileSize * 3} height={tileSize * 3}>
                <Layer>
                    {puzzle.map((value, index) => {
                        const x = (index % 3) * tileSize;
                        const y = Math.floor(index / 3) * tileSize;

                        return (
                            <>
                                <Rect
                                    key={`rect-${index}`}
                                    x={x}
                                    y={y}
                                    width={tileSize}
                                    height={tileSize}
                                    fill={value === 0 ? 'white' : '#4CAF50'}
                                    stroke="black"
                                    strokeWidth={2}
                                    cornerRadius={10}
                                    shadowBlur={5}
                                />
                                <Text
                                    key={`text-${index}`}
                                    x={x}
                                    y={y}
                                    width={tileSize}
                                    height={tileSize}
                                    text={value === 0 ? '' : value.toString()}
                                    fontSize={28}
                                    fontFamily="Calibri"
                                    fill={value === 0 ? 'black' : 'white'}
                                    align="center"
                                    verticalAlign="middle"
                                    fontStyle="bold"
                                />
                            </>
                        );
                    })}
                </Layer>
            </Stage>
        );
    };

    const misplacedTilesHeuristic = (puzzle) => {
        const solvedState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let misplacedTiles = 0;
        for (let i = 0; i < 9; i++) {
            if (puzzle[i] !== 0 && puzzle[i] !== solvedState[i]) {
                misplacedTiles++;
            }
        }
        return misplacedTiles;
    };

    const handleNext = () => {
        setCurrentStep((prevStep) => Math.min(prevStep + 1, puzzleHistory.length - 1));
    };

    const handlePrevious = () => {
        setCurrentStep((prevStep) => Math.max(prevStep - 1, 0));
    };

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-2/3">
                <h2 className="text-2xl font-bold mb-4">Analytics</h2>
                <p className="mb-4">Total Moves: {moves ? moves.length : 'N/A'}</p>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Your Game Play</h3>
                    <div className="flex flex-col items-center">
                        <h4 className="text-md font-semibold mb-1">Step {currentStep + 1}</h4>
                        {renderPuzzle(puzzleHistory[currentStep])}
                        <div className="flex space-x-4 mt-4">
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentStep === puzzleHistory.length - 1}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Greedy Best-First Search Explanation</h3>
                    <p className="mb-2">
                        Greedy Best-First Search (GBFS) expands nodes based on a heuristic, aiming to get to the goal quickly.
                        It might not find the optimal solution, but it's often faster.
                    </p>
                    <p className="mb-2">
                        A simple heuristic is "number of misplaced tiles". GBFS would choose the move that reduces this number the most.
                    </p>
                    <p>
                        For example, at step {currentStep + 1}, the misplaced tiles heuristic is: {misplacedTilesHeuristic(puzzleHistory[currentStep])}.
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                >
                    Close
                </button>
            </div>
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

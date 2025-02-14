import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
            closedSet.add(`${current.x},${current.y}`);

            for (const neighbor of getNeighbors(current)) {
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
            )}

            {!gameStarted && !placingFood && (
                <button
                    onClick={() => setGameStarted(true)}
                    className="mb-4 px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500"
                >
                    Start Game
                </button>
            )}

            <div
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

export default PacmanGame;

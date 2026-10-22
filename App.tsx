// Fix: Add missing import for React.
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import type { BingoGrid, Cell } from './types.ts';
import { HALLOWEEN_TERMS } from './constants.ts';
import { GHOST_HOOD_PATH, GHOST_FACE_PATH } from './ghostMask.ts';
import { Celebration } from './Celebration.tsx';

const { useState, useEffect, useLayoutEffect, useCallback, useRef } = React;

interface JargonTerm {
    text: string;
    icon: string;
}

interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    cardsCreated: number;
}

interface GridState {
    grid: BingoGrid;
    timestamp: number;
    bingoWon: boolean;
    interacted: boolean;
}

type CardDisplayMode = 'both' | 'icon' | 'text';

// Let JSX accept the shared <hans-footer> web component.
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'hans-footer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                'text-color'?: string;
                'github-url'?: string;
                logo?: string;
                padding?: string;
            };
        }
    }
}

// --- LocalStorage Keys ---
const JARGON_LIST_KEY = 'spookyBingoJargonList';
const GRID_STATE_KEY = 'spookyBingoState';
const GAME_STATS_KEY = 'spookyBingoGameStats';

// --- LocalStorage Helpers ---
const getStoredJargonList = (): JargonTerm[] => {
    try {
        const stored = localStorage.getItem(JARGON_LIST_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to parse jargon list from localStorage", error);
    }
    return [...HALLOWEEN_TERMS].map(term => ({ text: term, icon: term }));
};

const setStoredJargonList = (jargonList: JargonTerm[]) => {
    try {
        localStorage.setItem(JARGON_LIST_KEY, JSON.stringify(jargonList));
    } catch (error) {
        console.error("Failed to save jargon list to localStorage", error);
    }
};

const getStoredStats = (): GameStats => {
    try {
        const stored = localStorage.getItem(GAME_STATS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (typeof parsed.gamesPlayed === 'number' && typeof parsed.gamesWon === 'number') {
                return {
                    gamesPlayed: parsed.gamesPlayed,
                    gamesWon: parsed.gamesWon,
                    cardsCreated: parsed.cardsCreated || parsed.gamesPlayed || 0,
                };
            }
        }
    } catch (error) {
        console.error("Failed to parse game stats from localStorage", error);
    }
    return { gamesPlayed: 0, gamesWon: 0, cardsCreated: 0 };
};

const getInitialGridState = (): GridState | null => {
    try {
        const saved = localStorage.getItem(GRID_STATE_KEY);
        if (saved) {
            const state: GridState = JSON.parse(saved);
            const fiveMinutes = 5 * 60 * 1000;
            if (Date.now() - state.timestamp < fiveMinutes) {
                return state;
            }
        }
    } catch (e) { console.error("Failed to load saved state", e); }
    localStorage.removeItem(GRID_STATE_KEY);
    return null;
}

const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};


// --- Admin View Component ---
const AdminView: React.FC<{ isDarkMode: boolean; toggleDarkMode: () => void; }> = ({ isDarkMode, toggleDarkMode }) => {
    const [allTerms] = useState<JargonTerm[]>(getStoredJargonList());
    const [shuffledTerms, setShuffledTerms] = useState<JargonTerm[]>([]);
    const [calledTerms, setCalledTerms] = useState<JargonTerm[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [showAllCalled, setShowAllCalled] = useState(false);
    const [itemOpacity, setItemOpacity] = useState(1);

    const startNewGame = useCallback(() => {
        setItemOpacity(0);
        setTimeout(() => {
            setShuffledTerms(shuffle(allTerms));
            setCalledTerms([]);
            setCurrentIndex(-1);
            setShowAllCalled(false);
            setItemOpacity(1);
        }, 300);
    }, [allTerms]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const handleNext = () => {
        if (currentIndex < shuffledTerms.length - 1) {
            setItemOpacity(0);
            setTimeout(() => {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                setCalledTerms(prev => [...prev, shuffledTerms[nextIndex]]);
                setItemOpacity(1);
            }, 300);
        }
    };
    
    const currentTerm = currentIndex >= 0 ? shuffledTerms[currentIndex] : null;
    const isFinished = currentIndex >= shuffledTerms.length - 1;

    return (
         <div className="max-w-4xl mx-auto flex flex-col min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-pixel text-4xl md:text-5xl">BINGO CALLER</h1>
                    <p className="font-pixel text-lg dark:text-gray-300 grey-text">Admin Mode</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/" className="font-pixel text-lg hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer">Back to Game</Link>
                    <button id="dark-mode-toggle-admin" onClick={toggleDarkMode} className="flex-shrink-0 relative flex items-center gap-2 p-1 rounded-full transition-all group hover:bg-transparent border-0" title={isDarkMode ? "Turn off dark mode" : "Turn on dark mode"}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 831.0055 1184.8492" className="w-10 h-10" fill="none"><g><path id="Hood" className="fill-current text-[#4A3C6A] dark:text-[#FCF7E6]" d={GHOST_HOOD_PATH} /><path id="Face" className="transition-colors fill-[#FCF7E6] dark:fill-[#4A3C6A] group-hover:fill-[#4A3C6A] dark:group-hover:fill-[#FCF7E6]" d={GHOST_FACE_PATH} /></g></svg>
                        {isDarkMode && (<span className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none transition-opacity opacity-0 group-hover:opacity-100`}>X</span>)}
                    </button>
                </div>
            </header>
            
            <main className="flex-grow flex flex-col items-center gap-8">
                <div 
                    className="w-full h-64 md:h-80 border-4 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col justify-center items-center p-4 transition-opacity duration-300"
                    style={{ opacity: itemOpacity }}
                >
                    {currentTerm ? (
                        <div className="text-center">
                            <svg className="w-24 h-24 sm:w-32 sm:h-32 mx-auto" fill="currentColor">
                                <use href={`#${currentTerm.icon.replace(/\s/g, '')}`} />
                            </svg>
                            <p className="font-pixel text-4xl sm:text-5xl uppercase mt-4">{currentTerm.text}</p>
                        </div>
                    ) : (
                         <p className="font-pixel text-2xl text-gray-500">Click "Next Item" to start</p>
                    )}
                    {isFinished && currentTerm && (
                        <p className="font-pixel text-2xl text-red-500 mt-4 animate-pulse">All items have been called!</p>
                    )}
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleNext} 
                        disabled={isFinished}
                        className="bg-black text-white dark:bg-white dark:text-black font-pixel text-xl py-3 px-6 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next Item
                    </button>
                    <button 
                        onClick={startNewGame} 
                        className="bg-gray-200 dark:bg-gray-800 font-pixel text-xl py-3 px-6 hover:opacity-90 transition-opacity"
                    >
                        Restart &amp; Re-shuffle
                    </button>
                </div>

                <div className="w-full mt-4">
                    <button 
                        onClick={() => setShowAllCalled(p => !p)} 
                        className="font-pixel text-lg hover:underline"
                    >
                        {showAllCalled ? 'Hide' : 'Show'} {calledTerms.length} Called Items
                    </button>
                    {showAllCalled && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {calledTerms.slice().reverse().map(term => (
                                <div key={term.text} className="p-2 border-2 border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-1 bg-gray-50 dark:bg-gray-900">
                                    <svg className="w-12 h-12" fill="currentColor">
                                        <use href={`#${term.icon.replace(/\s/g, '')}`} />
                                    </svg>
                                    <span className="text-xs font-pixel uppercase text-center">{term.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};


// --- Bingo Game Component (Original App) ---
const BingoGame: React.FC<{ isDarkMode: boolean; toggleDarkMode: () => void; }> = ({ isDarkMode, toggleDarkMode }) => {
    const [masterJargonList, setMasterJargonList] = useState<JargonTerm[]>(getStoredJargonList);
    
    const [gridState, setGridState] = useState<GridState | null>(getInitialGridState);
    // Ref to hold the latest gridState to avoid stale closures
    const gridStateRef = useRef<GridState | null>(gridState);
    useEffect(() => {
        gridStateRef.current = gridState;
    }, [gridState]);

    const grid = gridState?.grid ?? [];
    const bingoWonOnCard = gridState?.bingoWon ?? false;

    const [stats, setStats] = useState<GameStats>(() => {
        const s = getStoredStats();
        if (!getInitialGridState()) {
            s.cardsCreated = (s.cardsCreated || 0) + 1;
        } else if (s.cardsCreated === 0) {
            s.cardsCreated = Math.max(1, s.gamesPlayed);
        }
        return s;
    });

    const [bingoPulseActive, setBingoPulseActive] = useState(false);
    const [showBlackout, setShowBlackout] = useState(false);
    const [blackoutOpacity, setBlackoutOpacity] = useState(false);
    const [easterEggActive, setEasterEggActive] = useState(false);
    const [cardDisplayMode, setCardDisplayMode] = useState<CardDisplayMode>('both');
    const [showBingoModal, setShowBingoModal] = useState(false);
    const [isDismissingModal, setIsDismissingModal] = useState(false);
    
    // This flag is crucial to prevent a race condition where clicking "New Game"
    // on a winning board could re-trigger the BINGO modal.
    const [isResetting, setIsResetting] = useState(false);


    const tagInputRef = useRef<HTMLInputElement>(null);
    const [tagInput, setTagInput] = useState('');

    // FLIP animation for term chips: remember where each chip was (relative to the list),
    // then after the list changes slide chips from their old spot and pop new ones in.
    const jargonListRef = useRef<HTMLDivElement>(null);
    const chipPositions = useRef(new Map<string, { x: number; y: number }>());
    const measureChips = () => {
        const positions = new Map<string, { x: number; y: number }>();
        const list = jargonListRef.current;
        if (!list) return positions;
        const listRect = list.getBoundingClientRect();
        list.querySelectorAll<HTMLElement>('[data-term]').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width === 0) return; // settings panel is closed
            positions.set(el.dataset.term!, { x: r.left - listRect.left + list.scrollLeft, y: r.top - listRect.top + list.scrollTop });
        });
        return positions;
    };
    // Call before changing the term list so the animation starts from where chips are now.
    const snapshotChips = () => { chipPositions.current = measureChips(); };
    useLayoutEffect(() => {
        const list = jargonListRef.current;
        if (!list) return;
        const prevPositions = chipPositions.current;
        const nextPositions = measureChips();
        const added: HTMLElement[] = [];
        list.querySelectorAll<HTMLElement>('[data-term]').forEach(el => {
            const term = el.dataset.term!;
            const pos = nextPositions.get(term);
            if (!pos) return;
            const prev = prevPositions.get(term);
            if (prev) {
                const dx = prev.x - pos.x, dy = prev.y - pos.y;
                if (dx || dy) {
                    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 350, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
                }
            } else if (prevPositions.size > 0) {
                added.push(el);
                el.animate([{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }], { duration: 350, delay: 120, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', fill: 'backwards' });
            }
        });
        chipPositions.current = nextPositions;
        // Bring a single newly added chip into view when the list scrolls.
        if (added.length === 1) {
            const pos = nextPositions.get(added[0].dataset.term!)!;
            if (pos.y < list.scrollTop || pos.y + added[0].offsetHeight > list.scrollTop + list.clientHeight) {
                list.scrollTo({ top: pos.y - list.clientHeight / 2, behavior: 'smooth' });
            }
        }
    }, [masterJargonList]);
    
    useEffect(() => {
        setStoredJargonList(masterJargonList);
    }, [masterJargonList]);
    
    useEffect(() => {
        if (gridState) {
            try {
                localStorage.setItem(GRID_STATE_KEY, JSON.stringify(gridState));
            } catch (e) { console.error("Failed to save grid state", e); }
        }
    }, [gridState]);

    useEffect(() => {
        try {
            localStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
        } catch (e) { console.error("Failed to save stats", e); }
    }, [stats]);

    const createCard = useCallback(() => {
        if (masterJargonList.length < 24) {
             setGridState(null);
             setIsResetting(false); // Ensure flag is cleared even if card isn't created
             return;
        }

        const shuffledTerms = shuffle([...masterJargonList]);
        let termIndex = 0;
        const newGrid: BingoGrid = [];

        for (let i = 0; i < 5; i++) {
            const row: Cell[] = [];
            for (let j = 0; j < 5; j++) {
                const isFreeSpace = (i === 2 && j === 2);
                const jargon = isFreeSpace ? null : shuffledTerms[termIndex % shuffledTerms.length];
                const text = isFreeSpace ? "ETERNAL VOID" : jargon!.text;
                const icon = isFreeSpace ? "" : jargon!.icon;
                if (!isFreeSpace) termIndex++;

                row.push({
                    row: i,
                    col: j,
                    text: text,
                    icon: icon,
                    checked: isFreeSpace,
                    isFreeSpace: isFreeSpace,
                    isWinningCell: false
                });
            }
            newGrid.push(row);
        }
        
        const newState: GridState = {
            grid: newGrid,
            timestamp: Date.now(),
            bingoWon: false,
            interacted: false,
        };
        setGridState(newState);

        setShowBlackout(false);
        setBlackoutOpacity(false);
        setEasterEggActive(false);
        setBingoPulseActive(false);
        setIsResetting(false); // Unset the flag after the new card is ready

    }, [masterJargonList]);
    
    // This function starts the reset process by setting the `isResetting` flag.
    const resetGame = useCallback(() => {
        setIsResetting(true); // Activate the guard flag
        if (gridStateRef.current?.interacted) {
            setStats(s => ({ ...s, gamesPlayed: s.gamesPlayed + 1, cardsCreated: s.cardsCreated + 1 }));
        } else {
            setStats(s => ({ ...s, cardsCreated: s.cardsCreated + 1 }));
        }
    }, []);


    // This effect listens for the `isResetting` flag and calls createCard when it's true.
    useEffect(() => {
        if (isResetting) {
            createCard();
        }
    }, [isResetting, createCard]);


    useEffect(() => {
        if (!gridState) {
            createCard();
        }
    }, [createCard, gridState]);


    const handleCellClick = (r: number, c: number) => {
        if (!gridState || grid[r][c].isFreeSpace) return;
        
        const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
        newGrid[r][c].checked = !newGrid[r][c].checked;

        setGridState(prevState => prevState ? ({
            ...prevState,
            grid: newGrid,
            timestamp: Date.now(),
            interacted: true,
        }) : null);
    };

    const clearStats = () => {
        setStats({ gamesPlayed: 0, gamesWon: 0, cardsCreated: 0 });
    };

    const handleCloseModal = useCallback(() => {
        setIsDismissingModal(true); // Start animation and block bingo checks

        // After animation, reset state
        setTimeout(() => {
            setShowBingoModal(false);
            setIsDismissingModal(false);
        }, 450); // Matches the celebration's yank-away animation
    }, []);

    const handleNewGameFromModal = useCallback(() => {
        setIsDismissingModal(true); // Start animation and block bingo checks

        // After animation, reset game and state
        setTimeout(() => {
            setShowBingoModal(false);
            resetGame();
            setIsDismissingModal(false); // Reset this last
        }, 450); // Matches the celebration's yank-away animation
    }, [resetGame]);

    useEffect(() => {
        // The `isResetting` guard is essential here. It prevents this effect from running
        // on a stale (winning) grid during the process of creating a new game.
        if (grid.length === 0 || !gridState || isResetting || isDismissingModal) return;

        const allChecked = grid.every(row => row.every(cell => cell.checked));
        if (allChecked && !showBlackout) {
            setShowBlackout(true);
            setTimeout(() => setBlackoutOpacity(true), 10);
        }

        let newBingo = false;
        const winningCells = new Set<string>();

        // Check rows
        for (let i = 0; i < 5; i++) {
            if (grid[i].every(cell => cell.checked)) {
                newBingo = true;
                for (let j = 0; j < 5; j++) winningCells.add(`${i},${j}`);
            }
        }
        // Check columns
        for (let j = 0; j < 5; j++) {
            if (grid.every(row => row[j].checked)) {
                newBingo = true;
                for (let i = 0; i < 5; i++) winningCells.add(`${i},${j}`);
            }
        }
        // Check diagonals
        if (grid.every((row, i) => row[i].checked)) {
             newBingo = true;
             for (let i = 0; i < 5; i++) winningCells.add(`${i},${i}`);
        }
        if (grid.every((row, i) => row[4 - i].checked)) {
             newBingo = true;
             for (let i = 0; i < 5; i++) winningCells.add(`${i},${4 - i}`);
        }

        if (newBingo) {
            const currentGrid = gridState.grid;
            const updatedGrid = currentGrid.map((row, rIdx) =>
                row.map((cell, cIdx) => ({
                    ...cell,
                    isWinningCell: winningCells.has(`${rIdx},${cIdx}`) || cell.isWinningCell
                }))
            );

            if (!bingoWonOnCard) { // Only trigger the "You Won!" sequence once per card
                setStats(s => ({...s, gamesWon: s.gamesWon + 1, gamesPlayed: s.gamesPlayed + 1}));
                setGridState(prevState => prevState ? ({ ...prevState, grid: updatedGrid, bingoWon: true, interacted: false }) : null);
                
                setEasterEggActive(true);
                setBingoPulseActive(true);
                setShowBingoModal(true); 
                
                setTimeout(() => setEasterEggActive(false), 1500);
                setTimeout(() => setBingoPulseActive(false), 3000);
            } else {
                 // If bingo is already won, just update the grid to highlight new winning lines
                 setGridState(prevState => prevState ? ({ ...prevState, grid: updatedGrid }) : null);
            }
        }
    }, [grid, showBlackout, bingoWonOnCard, gridState, isDismissingModal, isResetting]);

    const handleDeleteTerm = (termToDelete: string) => {
        snapshotChips();
        setMasterJargonList(prev => prev.filter(jargon => jargon.text !== termToDelete));
    };
    
    const handleAddTerm = (newTermText: string) => {
        if (newTermText && !masterJargonList.some(j => j.text.toLowerCase() === newTermText.toLowerCase())) {
             snapshotChips();
             const randomIcon = HALLOWEEN_TERMS[Math.floor(Math.random() * HALLOWEEN_TERMS.length)];
             setMasterJargonList(prev => [...prev, { text: newTermText, icon: randomIcon }]);
             setTagInput('');
        } else if (newTermText) {
             setTagInput('');
        }
    };
    
    // Custom terms are anything the user typed in, rather than one of the built-in icon terms.
    const isCustomTerm = (jargon: JargonTerm) => !HALLOWEEN_TERMS.includes(jargon.text);

    // Step a custom term to the next icon, and update any cell on the current card using it.
    const handleCycleIcon = (termText: string) => {
        const term = masterJargonList.find(j => j.text === termText);
        if (!term) return;
        const nextIcon = HALLOWEEN_TERMS[(HALLOWEEN_TERMS.indexOf(term.icon) + 1) % HALLOWEEN_TERMS.length];
        setMasterJargonList(prev => prev.map(j => j.text === termText ? { ...j, icon: nextIcon } : j));
        setGridState(prevState => prevState ? ({
            ...prevState,
            grid: prevState.grid.map(row => row.map(cell => cell.text === termText ? { ...cell, icon: nextIcon } : cell)),
        }) : null);
    };

    const handleResetToDefaults = () => {
        const defaultTerms = [...HALLOWEEN_TERMS].map(term => ({ text: term, icon: term }));
        snapshotChips();
        setMasterJargonList(defaultTerms);
    };

    const handleContainerClick = () => tagInputRef.current?.focus();
    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value);
    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTerm = tagInput.trim().replace(',', '');
            handleAddTerm(newTerm);
        }
    };
    
    const getThumbTransform = () => {
        switch (cardDisplayMode) {
            case 'icon': return 'translateX(100%)';
            case 'text': return 'translateX(200%)';
            case 'both':
            default: return 'translateX(0%)';
        }
    };

    const blackoutIcons = ['reaper', 'pumpkin', 'spider', 'bat', 'witch', 'skeleton', 'candy'];
    const getIconStyle = (index: number) => ({
        position: 'absolute' as 'absolute',
        top: `${10 + Math.random() * 70}%`,
        left: `${10 + Math.random() * 80}%`,
        width: `${60 + Math.random() * 60}px`,
        animationDelay: `${index * 0.5 + Math.random()}s`,
        animationDuration: `${8 + Math.random() * 4}s`,
    });

    const sortedJargon = [...masterJargonList].sort((a, b) => a.text.localeCompare(b.text));
    const selectedCount = grid.flat().filter(cell => cell.checked && !cell.isFreeSpace).length;


    return (
        <>
            <div className="spider-svg-container">
                <svg viewBox="0 0 150 600" preserveAspectRatio="xMinYMin meet">
                    <g className="web"><line x1="0" y1="0" x2="130" y2="0" /><line x1="0" y1="0" x2="120" y2="50" /><line x1="0" y1="0" x2="50" y2="120" /><line x1="0" y1="0" x2="0" y2="130" /><path d="M 130 0 Q 90 25, 120 50" /><path d="M 120 50 Q 60 85, 50 120" /><path d="M 50 120 Q 25 90, 0 130" /><path d="M 65 0 Q 60 12.5, 60 25" /><path d="M 60 25 Q 30 42, 25 60" /><path d="M 25 60 Q 12.5 60, 0 65" /></g>
                    <g id="spider-group"><line x1="0" y1="-425" x2="0" y2="-3.5" className="spider-internal-thread" /><g id="spider" transform="translate(0, 0)"><ellipse cx="0" cy="5" rx="4" ry="6" className="spider-body" /><circle cx="0" cy="-1" r="2.5" className="spider-body" /><g className="spider-legs"><line x1="0" y1="5" x2="-7" y2="0" /><line x1="0" y1="5" x2="7" y2="0" /><line x1="0" y1="5" x2="-8" y2="5" /><line x1="0" y1="5" x2="8" y2="5" /><line x1="0" y1="5" x2="-7" y2="10" /><line x1="0" y1="5" x2="7" y2="10" /><line x1="0" y1="5" x2="-6" y2="13" /><line x1="0" y1="5" x2="6" y2="13" /></g></g></g>
                </svg>
            </div>

            {showBingoModal && (
                <Celebration isDismissing={isDismissingModal} onNewGame={handleNewGameFromModal} onClose={handleCloseModal} />
            )}

            <div className={`fixed inset-0 bg-[#4A3C6A] bg-opacity-95 dark:bg-[#FCF7E6] dark:bg-opacity-95 z-40 flex flex-col justify-center items-center text-[#FCF7E6] dark:text-[#4A3C6A] text-center p-8 transition-opacity duration-500 overflow-hidden ${showBlackout ? 'flex' : 'hidden'} ${blackoutOpacity ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0">
                    {blackoutIcons.map((icon, index) => (
                         <div key={index} className="animate-float" style={getIconStyle(index)}>
                             <svg className="w-full h-full opacity-30" fill="currentColor">
                                <use href={`#${icon.replace(/\s/g, '')}`} />
                            </svg>
                         </div>
                    ))}
                </div>
                <h1 className="font-pixel text-7xl md:text-9xl mt-4 animate-pulse z-10">BINGO BLACKOUT!</h1>
                <p className="font-pixel text-xl mt-4 z-10">You've embraced the spooky void.</p>
                <button
                    onClick={resetGame}
                    className="mt-8 bg-[#FCF7E6] text-[#4A3C6A] dark:bg-[#4A3C6A] dark:text-[#FCF7E6] font-pixel text-xl py-2 px-4 hover:opacity-90 transition-opacity border-2 border-current z-10"
                >
                    PLAY AGAIN (IF YOU DARE)
                </button>
            </div>

            <div className={`relative z-10 max-w-4xl lg:max-w-7xl mx-auto lg:border-2 border-gray-300 md:p-6 transition-all duration-500 dark:border-gray-700 ${easterEggActive ? 'bingo-easter-egg' : ''}`} id="main-container">
                <header className="flex justify-between items-start mb-8 gap-4">
                    <div className="flex flex-col items-start">
                        <h1 className="font-pixel text-4xl md:text-5xl" style={{color: 'var(--hw-text)'}}>SPOOKY BINGO</h1>
                        <p className="font-pixel text-base md:text-lg dark:text-gray-300 grey-text text-left ">nothing scarier than a bingo win</p>
                    </div>
                    <button id="dark-mode-toggle" onClick={toggleDarkMode} className="flex-shrink-0 relative flex items-center gap-2 p-1 rounded-full transition-all group hover:bg-transparent border-0" title={isDarkMode ? "Turn off dark mode" : "Turn on dark mode"}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 831.0055 1184.8492" className="w-10 h-10" fill="none"><g><path id="Hood" className="fill-current text-[#4A3C6A] dark:text-[#FCF7E6]" d={GHOST_HOOD_PATH} /><path id="Face" className="transition-colors fill-[#FCF7E6] dark:fill-[#4A3C6A] group-hover:fill-[#4A3C6A] dark:group-hover:fill-[#FCF7E6]" d={GHOST_FACE_PATH} /></g></svg>
                        {isDarkMode && (<span className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none transition-opacity opacity-0 group-hover:opacity-100`}>X</span>)}
                    </button>
                </header>

                <main className="lg:flex lg:gap-8 items-start">
                    <div className="lg:w-3/5 flex flex-col">
                        <div className="grid grid-cols-5 gap-1 sm:gap-2" id="bingo-card">
                            {grid.length === 0 ? (
                                <div className="col-span-5 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                    <p className="text-center font-pixel text-xl dark:text-white mb-4">NOT ENOUGH TERMS TO GENERATE CARD</p>
                                    <p className="text-center dark:text-gray-300 mb-2">Current term count: {masterJargonList.length} / 24 required</p>
                                    <p className="text-center text-sm dark:text-gray-400">Please add more terms in Settings.</p>
                                </div>
                            ) : (
                                grid.map((row, rowIndex) => (
                                    row.map((cell, colIndex) => {
                                        let cellClasses = `bingo-card-cell flex items-center justify-center p-0 text-center font-bold cursor-pointer aspect-square border-2`;
                                        if (bingoPulseActive && cell.isWinningCell) {
                                            cellClasses += ' bingo-win';
                                        }
                                        if (cell.isFreeSpace) cellClasses += " is-checked font-pixel";
                                        else if (cell.checked) cellClasses += " is-checked";
                                        
                                        if (cardDisplayMode === 'text') cellClasses += ' text-only';
                                        if (cardDisplayMode === 'icon') cellClasses += ' icon-only';

                                        return (
                                            <div key={`${rowIndex}-${colIndex}`} onClick={() => handleCellClick(rowIndex, colIndex)} className={cellClasses} data-winning={cell.isWinningCell} data-icon={cell.icon}>
                                                {cell.isFreeSpace ? (
                                                    <span className="text-sm sm:text-base leading-tight">{cell.text}</span>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center gap-1 text-current">
                                                        {cardDisplayMode !== 'text' && cell.icon && cell.icon !== "" && (<svg fill="currentColor"><use href={`#${cell.icon.replace(/\s/g, '')}`} /></svg>)}
                                                        {cardDisplayMode !== 'icon' && (<span className="text-[11px] sm:text-[14px] font-pixel uppercase tracking-wider">{cell.text}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ))
                            )}
                        </div>
                         {grid.length > 0 && (
                            <p className="text-right mt-3 text-xs dark:text-gray-400 font-pixel">{selectedCount} / 24 SELECTED</p>
                        )}
                    </div>

                    <div className="lg:w-2/5 flex flex-col gap-6 lg:mt-0 ">
                         <div className="flex justify-between items-end">
                             <div className="flex items-end gap-4 group">
                                  <div className="relative">
                                    <div className="flex flex-col items-start text-left">
                                         <p className="font-pixel text-5xl tracking-tighter dark:text-white leading-none">{`${stats.gamesWon} / ${stats.gamesPlayed}`}</p>
                                         <p className="font-pixel text-base dark:text-gray-300">WINS / PLAYED</p>
                                     </div>
                                     <button
                                         onClick={clearStats}
                                         title="Reset bingo history"
                                         className={`absolute -top-2 -right-6 text-gray-400 dark:text-gray-500 transition-opacity ${stats.gamesPlayed > 0 || stats.gamesWon > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
                                     >
                                         <span className="material-symbols-outlined text-lg">close</span>
                                     </button>
                                 </div>
                             </div>
                             <button
                                 onClick={(e) => { e.preventDefault(); resetGame(); }}
                                 className="flex items-center gap-2 rounded-lg p-1 sm:px-3 sm:py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                 title="Generate new card"
                             >
                                 <span className="material-symbols-outlined text-2xl">refresh</span>
                                 <span className="hidden sm:inline font-pixel text-lg uppercase">New Game</span>
                             </button>
                        </div>

                        <details className="border-2 border-gray-300 p-4 dark:border-gray-700">
                            <summary className="flex justify-between items-center text-md font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 -m-2 p-2 rounded-t-sm">
                                <span className="font-pixel uppercase">Settings</span>
                            </summary>
                            <div className="mt-4 flex flex-col">
                                <p className="mb-4 text-sm dark:text-white">...manage the terms that populate the bingo card. Changes will refresh the card.</p>
                                <div className="flex items-center gap-3 mb-4">
                                    <label className="font-pixel text-sm uppercase whitespace-nowrap">Cards:</label>
                                    <div className="multi-toggle-container w-full">
                                        <div className="multi-toggle-thumb" style={{ transform: getThumbTransform() }}></div>
                                        <button className={`multi-toggle-btn ${cardDisplayMode === 'both' ? 'active' : ''}`} onClick={() => setCardDisplayMode('both')}>Both</button>
                                        <button className={`multi-toggle-btn ${cardDisplayMode === 'icon' ? 'active' : ''}`} onClick={() => setCardDisplayMode('icon')}>Icon only</button>
                                        <button className={`multi-toggle-btn ${cardDisplayMode === 'text' ? 'active' : ''}`} onClick={() => setCardDisplayMode('text')}>Text only</button>
                                    </div>
                                </div>
                                <div
                                    className="relative flex flex-wrap gap-2 border-2 border-gray-300 p-2 max-h-48 lg:max-h-none overflow-y-auto dark:border-gray-700 cursor-text bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black dark:focus-within:ring-white"
                                    onClick={handleContainerClick}
                                    ref={jargonListRef}
                                    id="jargon-list"
                                >
                                    {sortedJargon.map((jargon) => (
                                        <div key={jargon.text} data-term={jargon.text} className="flex items-center gap-1 bg-gray-100 border border-gray-300 text-xs font-bold py-1 pl-2 pr-1 dark:bg-black dark:border-gray-700 dark:text-white group whitespace-nowrap">
                                            {isCustomTerm(jargon) ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCycleIcon(jargon.text); }}
                                                    className="mr-1 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                                                    title="Click to change icon"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor"><use href={`#${jargon.icon.replace(/\s/g, '')}`} /></svg>
                                                </button>
                                            ) : (
                                                <svg className="w-4 h-4 mr-1" fill="currentColor"><use href={`#${jargon.icon.replace(/\s/g, '')}`} /></svg>
                                            )}
                                            <span className="capitalize">{jargon.text}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTerm(jargon.text); }}
                                                className="ml-1 p-0.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center justify-center"
                                                title="Remove term"
                                            >
                                                <span className="material-symbols-outlined text-[16px] leading-none">close</span>
                                            </button>
                                        </div>
                                    ))}
                                    <input ref={tagInputRef} type="text" value={tagInput} onChange={handleTagInputChange} onKeyDown={handleTagInputKeyDown} className="flex-grow min-w-[100px] outline-none bg-transparent text-sm p-1 dark:text-white placeholder-gray-400" placeholder={masterJargonList.length === 0 ? "Type term and press comma..." : "Add a term..."} />
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <Link
                                        to="/admin"
                                        id="admin-mode-link"
                                        className="flex items-center gap-1.5 border-2 border-current py-1 px-3 font-pixel text-base uppercase hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg leading-none">campaign</span>
                                        <span>Show game caller</span>
                                    </Link>
                                    <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                                        {masterJargonList.length > 0 && (<button onClick={() => { setMasterJargonList([]); }} className="hover:underline transition-colors">Clear all</button>)}
                                        <button onClick={handleResetToDefaults} className="hover:underline transition-colors">Reset defaults</button>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>
                </main>
            </div>
        </>
    );
}
//test
// --- Main App Router ---
function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            themeColorMeta?.setAttribute('content', '#4A3C6A');
        } else {
            document.documentElement.classList.remove('dark');
            themeColorMeta?.setAttribute('content', '#FCF7E6');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    return (
        <>
            <Routes>
                <Route path="/" element={<BingoGame isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
                <Route path="/admin" element={<AdminView isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
            </Routes>
            {/* Shared footer web component, loaded from haaans.com/shared/footer.js */}
            <hans-footer text-color="var(--hw-text)"></hans-footer>
        </>
    );
}

export default App;
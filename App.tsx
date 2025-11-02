import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { BingoGrid, Cell } from './types';
import { HALLOWEEN_TERMS } from './constants';

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
const AdminView: React.FC<{ onSwitchToGame: () => void; isDarkMode: boolean; toggleDarkMode: () => void; }> = ({ onSwitchToGame, isDarkMode, toggleDarkMode }) => {
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
                    <button onClick={onSwitchToGame} className="font-pixel text-lg hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer">Back to Game</button>
                    <button id="dark-mode-toggle-admin" onClick={toggleDarkMode} className="flex-shrink-0 relative flex items-center gap-2 p-1 rounded-full transition-all group hover:bg-transparent border-0" title={isDarkMode ? "Turn off dark mode" : "Turn on dark mode"}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 831.0055 1184.8492" className="w-10 h-10" fill="none"><g><path id="Hood" className="fill-current text-[#4A3C6A] dark:text-[#FCF7E6]" d="M831.0012,1184.8492H0v-283.7726c15.6078-7.0452,33.8768-11.6022,48.9861-19.4394,31.6518-16.4179,11.8888-32.5721,2.0949-55.1432-26.799-61.7611-2.5334-156.0111,11.3307-220.1945,22.1168-102.3891,47.1297-204.6843,70.9148-306.7542C167.8884,151.228,227.0403,49.8861,381.0222,4.7749c46.4767-13.616,91.5096,4.2277,133.7178,24.1419,113.8958,53.7372,144.8012,134.2534,178.6952,248.8906,34.5876,116.9834,60.8748,245.4045,85.32,365.2847,11.5277,56.5322,29.2336,124.5664,7.0631,180.3094-5.0991,12.8206-18.3496,29.1343-15.515,42.9737,3.2361,15.8,47.7024,25.6877,60.2081,33.6927l.4943,1.5039-.0043,283.2773Z" /><path id="Face" className="transition-colors fill-[#FCF7E6] dark:fill-[#4A3C6A] group-hover:fill-[#4A3C6A] dark:group-hover:fill-[#FCF7E6]" d="M408.8714,127.3719c53.6921-4.6757,113.6913,41.8753,147.5371,79.6223,69.0189,76.9745,104.3967,206.0727,115.3377,307.2775,1.6423,15.1916,5.3483,39.4317-.8071,53.1302-8.6138,19.1692-29.4733,15.1333-39.572,29.3569-5.6243,7.9216-8.0265,22.1695-10.2416,31.7206-8.2435,35.5436-12.5874,73.193-22.7836,108.1024-19.6543,67.2918-71.6133,116.236-90.1051,183.6395-12.5929,45.9017-7.4029,103.6013-28.0715,144.7788-27.1583,54.1066-96.7072,58.2855-129.8323,7.6238-33.8207-51.7256-22.1948-121.1712-37.6466-179.1646-5.2215-19.5973-12.8523-39.2265-21.2973-57.6309-25.762-56.1436-60.0784-84.665-72.7952-149.9971-6.2249-31.9801-5.5425-79.6091-16.7877-108.1055-8.221-20.8327-35.7593-17.596-43.4828-40.4325-4.0994-12.1208.3774-36.5123,2.189-49.8675,14.5121-106.9852,55.0984-226.8911,135.6809-301.9141,28.9998-26.9991,72.3286-54.6259,112.6782-58.1397ZM345.8879,261.2047c-22.666,3.5666-36.9147,41.9936-48.2668,59.6282-10.2589,15.9365-23.4606,29.8323-37.8956,42.0252-28.9605,24.4622-73.723,42.7852-63.1008,89.156,7.9357,34.6429,44.3304,38.6057,73.4001,29.061,39.0977-12.8374,82.6479-63.7014,99.2709-100.5292,13.7041-30.3609,37.3379-128.8996-23.4078-119.3411ZM477.7289,266.201c-33.1222,5.1296-27.344,64.296-23.4197,87.8974,10.7093,64.4065,67.61,160.6037,145.5224,139.17,47.5446-13.0795,36.2882-52.2666,9.5133-80.4391-29.9642-31.5282-55.1221-44.387-74.5978-87.2426-12.5858-27.6944-16.4843-65.6632-57.0181-59.3858ZM405.9326,471.9409c-1.4005-.8748-5.7922-.0063-7.5713.6343-10.3547,3.728-40.1955,46.5664-41.9868,57.9146-4.7789,30.2753,26.0385,24.3638,40.7336,10.773,11.6695-10.7926,11.1245-48.5998,10.0109-64.0144-.0844-1.1687-.4602-4.8538-1.1863-5.3074ZM463.6684,549.3962c3.7532-3.5865,3.8965-10.1799,3.2476-15.0662-1.5658-11.7904-28.6769-47.952-37.8396-57.0672-5.4965-5.4681-13.8657-10.2831-15.0083,1.0309-1.3873,13.7368-.8805,45.1363,5.9639,56.9779,6.675,11.5483,32.6769,24.5973,43.6364,14.1247ZM411.8612,625.9689c-25.9706.5415-51.0975,9.8326-67.1315,30.7601-41.1885,53.7589-6.4194,157.8952.4089,220.2522,5.8915,53.8017-1.2493,125.0571,24.8111,173.0204,19.0667,35.0916,58.6872,39.4135,79.2451,3.0006,16.0861-28.4922,13.2534-70.8439,16.8134-103.0838,8.5986-77.8712,45.0313-155.4992,36.9442-234.8108-5.4719-53.6637-33.8777-90.3316-91.0912-89.1386Z" /></g></svg>
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
const BingoGame: React.FC<{ onSwitchToAdmin: () => void; isDarkMode: boolean; toggleDarkMode: () => void; }> = ({ onSwitchToAdmin, isDarkMode, toggleDarkMode }) => {
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


    const tagInputRef = useRef<HTMLInputElement>(null);
    const [tagInput, setTagInput] = useState('');
    
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

    }, [masterJargonList]);
    
    const resetGame = useCallback(() => {
        if (gridStateRef.current?.interacted) {
            setStats(s => ({ ...s, gamesPlayed: s.gamesPlayed + 1, cardsCreated: s.cardsCreated + 1 }));
        } else {
            setStats(s => ({ ...s, cardsCreated: s.cardsCreated + 1 }));
        }
        createCard();
    }, [createCard]);


    useEffect(() => {
        createCard();
    }, [createCard]);


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
        }, 500); // Corresponds to 'animate-modal-drop-out' duration
    }, []);

    const handleNewGameFromModal = useCallback(() => {
        setIsDismissingModal(true); // Start animation and block bingo checks

        // After animation, reset game and state
        setTimeout(() => {
            setShowBingoModal(false);
            resetGame();
            setIsDismissingModal(false); // Reset this last
        }, 500); // Corresponds to 'animate-modal-drop-out' duration
    }, [resetGame]);

    useEffect(() => {
        if (grid.length === 0 || !gridState) return;

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

            if (!bingoWonOnCard) { 
                if (!isDismissingModal) { 
                    setStats(s => ({...s, gamesWon: s.gamesWon + 1, gamesPlayed: s.gamesPlayed + 1}));
                    setGridState(prevState => prevState ? ({ ...prevState, grid: updatedGrid, bingoWon: true, interacted: false }) : null);
                    
                    setEasterEggActive(true);
                    setBingoPulseActive(true);
                    setShowBingoModal(true); 
                    
                    setTimeout(() => setEasterEggActive(false), 1500);
                    setTimeout(() => setBingoPulseActive(false), 3000);
                }
            } else {
                 setGridState(prevState => prevState ? ({ ...prevState, grid: updatedGrid }) : null);
            }
        }
    }, [grid, showBlackout, bingoWonOnCard, gridState, isDismissingModal]);

    const handleDeleteTerm = (termToDelete: string) => {
        setMasterJargonList(prev => prev.filter(jargon => jargon.text !== termToDelete));
    };
    
    const handleAddTerm = (newTermText: string) => {
        if (newTermText && !masterJargonList.some(j => j.text.toLowerCase() === newTermText.toLowerCase())) {
             const randomIcon = HALLOWEEN_TERMS[Math.floor(Math.random() * HALLOWEEN_TERMS.length)];
             setMasterJargonList(prev => [...prev, { text: newTermText, icon: randomIcon }]);
             setTagInput('');
        } else if (newTermText) {
             setTagInput('');
        }
    };
    
    const handleResetToDefaults = () => {
        const defaultTerms = [...HALLOWEEN_TERMS].map(term => ({ text: term, icon: term }));
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
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex justify-center items-center" onClick={handleCloseModal}>
                    <div className={`relative bg-white dark:bg-black p-8 rounded-lg shadow-2xl border-4 border-current text-center flex flex-col items-center gap-4 ${isDismissingModal ? 'animate-modal-drop-out' : 'animate-modal-drop-in'}`} onClick={(e) => e.stopPropagation()}>
                        <button onClick={handleCloseModal} className="absolute top-2 right-2 text-current hover:opacity-75">
                             <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                        <svg className="w-24 h-24 text-[#4A3C6A] dark:text-[#FCF7E6]" viewBox="0 0 24 24" fill="currentColor">
                             <path d="M12 2C6.486 2 2 6.486 2 12v4.143c0 .529.449.944.976.9 1.675-.143 2.618.635 3.024 1.243.406.608.336 1.758-.047 3.187-.064.238.111.479.357.479h11.379c.246 0 .421-.241.357-.479-.382-1.429-.453-2.579-.047-3.187.406-.608 1.349-1.386 3.024-1.243.527.044.976-.371.976-.9V12c0-5.514-4.486-10-10-10zm-3 9c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm6 0c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z"/>
                             <circle cx="9" cy="10" r="1.5" fill="white" className="dark:fill-black" />
                             <circle cx="15" cy="10" r="1.5" fill="white" className="dark:fill-black" />
                        </svg>
                        <h2 className="font-pixel text-6xl md:text-7xl uppercase text-current animate-pulse">BINGO!</h2>
                        <p className="font-pixel text-lg dark:text-gray-300">You've summoned a win!</p>
                        <div className="flex justify-center gap-4 mt-4">
                             <button
                                onClick={handleNewGameFromModal}
                                className="relative overflow-hidden bg-black text-white dark:bg-white dark:text-black font-pixel text-lg py-2 px-6 hover:opacity-90 transition-opacity"
                            >
                                <span className="relative z-10">New Game</span>
                            </button>
                             <button
                                onClick={handleCloseModal}
                                className="bg-gray-200 dark:bg-gray-800 font-pixel text-lg py-2 px-6 hover:opacity-90 transition-opacity"
                            >
                                Keep Playing
                            </button>
                        </div>
                    </div>
                </div>
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 831.0055 1184.8492" className="w-10 h-10" fill="none"><g><path id="Hood" className="fill-current text-[#4A3C6A] dark:text-[#FCF7E6]" d="M831.0012,1184.8492H0v-283.7726c15.6078-7.0452,33.8768-11.6022,48.9861-19.4394,31.6518-16.4179,11.8888-32.5721,2.0949-55.1432-26.799-61.7611-2.5334-156.0111,11.3307-220.1945,22.1168-102.3891,47.1297-204.6843,70.9148-306.7542C167.8884,151.228,227.0403,49.8861,381.0222,4.7749c46.4767-13.616,91.5096,4.2277,133.7178,24.1419,113.8958,53.7372,144.8012,134.2534,178.6952,248.8906,34.5876,116.9834,60.8748,245.4045,85.32,365.2847,11.5277,56.5322,29.2336,124.5664,7.0631,180.3094-5.0991,12.8206-18.3496,29.1343-15.515,42.9737,3.2361,15.8,47.7024,25.6877,60.2081,33.6927l.4943,1.5039-.0043,283.2773Z" /><path id="Face" className="transition-colors fill-[#FCF7E6] dark:fill-[#4A3C6A] group-hover:fill-[#4A3C6A] dark:group-hover:fill-[#FCF7E6]" d="M408.8714,127.3719c53.6921-4.6757,113.6913,41.8753,147.5371,79.6223,69.0189,76.9745,104.3967,206.0727,115.3377,307.2775,1.6423,15.1916,5.3483,39.4317-.8071,53.1302-8.6138,19.1692-29.4733,15.1333-39.572,29.3569-5.6243,7.9216-8.0265,22.1695-10.2416,31.7206-8.2435,35.5436-12.5874,73.193-22.7836,108.1024-19.6543,67.2918-71.6133,116.236-90.1051,183.6395-12.5929,45.9017-7.4029,103.6013-28.0715,144.7788-27.1583,54.1066-96.7072,58.2855-129.8323,7.6238-33.8207-51.7256-22.1948-121.1712-37.6466-179.1646-5.2215-19.5973-12.8523-39.2265-21.2973-57.6309-25.762-56.1436-60.0784-84.665-72.7952-149.9971-6.2249-31.9801-5.5425-79.6091-16.7877-108.1055-8.221-20.8327-35.7593-17.596-43.4828-40.4325-4.0994-12.1208.3774-36.5123,2.189-49.8675,14.5121-106.9852,55.0984-226.8911,135.6809-301.9141,28.9998-26.9991,72.3286-54.6259,112.6782-58.1397ZM345.8879,261.2047c-22.666,3.5666-36.9147,41.9936-48.2668,59.6282-10.2589,15.9365-23.4606,29.8323-37.8956,42.0252-28.9605,24.4622-73.723,42.7852-63.1008,89.156,7.9357,34.6429,44.3304,38.6057,73.4001,29.061,39.0977-12.8374,82.6479-63.7014,99.2709-100.5292,13.7041-30.3609,37.3379-128.8996-23.4078-119.3411ZM477.7289,266.201c-33.1222,5.1296-27.344,64.296-23.4197,87.8974,10.7093,64.4065,67.61,160.6037,145.5224,139.17,47.5446-13.0795,36.2882-52.2666,9.5133-80.4391-29.9642-31.5282-55.1221-44.387-74.5978-87.2426-12.5858-27.6944-16.4843-65.6632-57.0181-59.3858ZM405.9326,471.9409c-1.4005-.8748-5.7922-.0063-7.5713.6343-10.3547,3.728-40.1955,46.5664-41.9868,57.9146-4.7789,30.2753,26.0385,24.3638,40.7336,10.773,11.6695-10.7926,11.1245-48.5998,10.0109-64.0144-.0844-1.1687-.4602-4.8538-1.1863-5.3074ZM463.6684,549.3962c3.7532-3.5865,3.8965-10.1799,3.2476-15.0662-1.5658-11.7904-28.6769-47.952-37.8396-57.0672-5.4965-5.4681-13.8657-10.2831-15.0083,1.0309-1.3873,13.7368-.8805,45.1363,5.9639,56.9779,6.675,11.5483,32.6769,24.5973,43.6364,14.1247ZM411.8612,625.9689c-25.9706.5415-51.0975,9.8326-67.1315,30.7601-41.1885,53.7589-6.4194,157.8952.4089,220.2522,5.8915,53.8017-1.2493,125.0571,24.8111,173.0204,19.0667,35.0916,58.6872,39.4135,79.2451,3.0006,16.0861-28.4922,13.2534-70.8439,16.8134-103.0838,8.5986-77.8712,45.0313-155.4992,36.9442-234.8108-5.4719-53.6637-33.8777-90.3316-91.0912-89.1386Z" /></g></svg>
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
                                    <p className="text-center text-sm dark:text-gray-400">Please add more terms to the Cards.</p>
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
                                            <div key={`${rowIndex}-${colIndex}`} onClick={() => handleCellClick(rowIndex, colIndex)} className={cellClasses}>
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
                            <p className="text-right mt-3 text-xs dark:text-gray-400 font-pixel">{selectedCount} / 24 SQUARES SELECTED</p>
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

                        <details className="border-2 border-gray-300 p-4 dark:border-gray-700 flex-grow lg:max-h-[400px] lg:flex lg:flex-col">
                            <summary className="flex justify-between items-center text-md font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 -m-2 p-2 rounded-t-sm">
                                <span className="font-pixel uppercase">Cards</span>
                            </summary>
                            <div className="mt-4 flex flex-col flex-grow overflow-hidden">
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
                                    className="flex flex-wrap gap-2 border-2 border-gray-300 p-2 max-h-48 lg:flex-grow overflow-y-auto dark:border-gray-700 cursor-text bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black dark:focus-within:ring-white"
                                    onClick={handleContainerClick}
                                    id="jargon-list"
                                >
                                    {sortedJargon.map((jargon, index) => (
                                        <div key={`${jargon.text}-${index}`} className="flex items-center gap-1 bg-gray-100 border border-gray-300 text-xs font-bold py-1 pl-2 pr-1 dark:bg-black dark:border-gray-700 dark:text-white group whitespace-nowrap">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor"><use href={`#${jargon.icon.replace(/\s/g, '')}`} /></svg>
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
                                <div className="mt-2 self-end flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    {masterJargonList.length > 0 && (<button onClick={() => { setMasterJargonList([]); }} className="hover:underline transition-colors">Clear all</button>)}
                                    <button onClick={handleResetToDefaults} className="hover:underline transition-colors">Reset defaults</button>
                                    <button onClick={onSwitchToAdmin} className="hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer text-xs text-gray-500 dark:text-gray-400">Admin Mode</button>
                                </div>
                            </div>
                        </details>
                    </div>
                </main>
                <footer className="text-center mt-3 text-xs dark:text-gray-400">
                    <p>Made just for fun by <a href="https://haaans.com/">Hans</a></p>
                </footer>
            </div>
        </>
    );
}

// --- Main App Router ---
function App() {
    const [view, setView] = useState<'game' | 'admin'>('game');
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


    if (view === 'admin') {
        return <AdminView onSwitchToGame={() => setView('game')} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
    }
    
    return <BingoGame onSwitchToAdmin={() => setView('admin')} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
}

export default App;
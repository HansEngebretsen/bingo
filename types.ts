export interface Cell {
    row: number;
    col: number;
    text: string;
    icon: string;
    checked: boolean;
    isFreeSpace: boolean;
    isWinningCell: boolean;
}

export type BingoGrid = Cell[][];
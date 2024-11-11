(function(exports) {
    exports.initializeGameState = function() {
        return {
            superBoard: Array(3).fill().map(() => Array(3).fill().map(() => Array(3).fill().map(() => Array(3).fill('')))),
            boardWinners: Array(3).fill().map(() => Array(3).fill('')),
            currentPlayerIndex: 0,
            activeBoard: null
        };
    };

    exports.isValidMove = function(gameState, boardRow, boardCol, cellRow, cellCol) {
        if (gameState.winner !== undefined) {
            return false;
        }
        if (gameState.activeBoard !== null &&
            (gameState.activeBoard[0] !== boardRow || gameState.activeBoard[1] !== boardCol)) {
            return false;
        }
        if (gameState.superBoard[boardRow][boardCol][cellRow][cellCol] !== '') {
            return false;
        }
        if (gameState.boardWinners[boardRow][boardCol] !== '') {
            return false;
        }
        return true;
    };

    exports.updateGameState = function(gameState, boardRow, boardCol, cellRow, cellCol) {
        const currentPlayer = gameState.currentPlayerIndex === 0 ? 'X' : 'O';
        gameState.superBoard[boardRow][boardCol][cellRow][cellCol] = currentPlayer;

        if (exports.checkWin(gameState.superBoard[boardRow][boardCol])) {
            gameState.boardWinners[boardRow][boardCol] = currentPlayer;
            if (exports.checkSuperWin(gameState.boardWinners)) {
                gameState.winner = currentPlayer;
            }
        } else if (exports.checkDraw(gameState.superBoard[boardRow][boardCol])) {
            gameState.boardWinners[boardRow][boardCol] = 'T';
        }

        gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;
        gameState.activeBoard = gameState.boardWinners[cellRow][cellCol] === '' ? [cellRow, cellCol] : null;
    };

    exports.checkWin = function(board) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        return lines.some(line => {
            const [a, b, c] = line;
            return board[Math.floor(a/3)][a%3] !== '' &&
                   board[Math.floor(a/3)][a%3] === board[Math.floor(b/3)][b%3] &&
                   board[Math.floor(b/3)][b%3] === board[Math.floor(c/3)][c%3];
        });
    };

    exports.checkSuperWin = function(boardWinners) {
        return exports.checkWin(boardWinners);
    };

    exports.checkDraw = function(board) {
        return board.every(row => row.every(cell => cell !== ''));
    };

})(typeof exports === 'undefined' ? this['sharedLogic'] = {} : exports);

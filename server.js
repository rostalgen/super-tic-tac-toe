const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createRoom', (roomId) => {
        if (rooms.has(roomId)) {
            socket.emit('roomError', 'Room already exists');
        } else {
            rooms.set(roomId, { players: [socket.id], gameState: initializeGameState() });
            socket.join(roomId);
            socket.emit('roomCreated', roomId);
        }
    });

    socket.on('leaveRoom', (roomId) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            room.players = room.players.filter(player => player !== socket.id);
            if (room.players.length === 0) {
                rooms.delete(roomId);
            }
            socket.leave(roomId);
        }
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            if (room.players.length < 2) {
                room.players.push(socket.id);
                socket.join(roomId);
                socket.emit('roomJoined', roomId);
                console.log("Room joined");
                if (room.players.length === 2) {
                    console.log("Game started");
                    
                    // randomize the currentPlayer
                    room.gameState.currentPlayerIndex = Math.floor(Math.random() * 2);

                    io.to(roomId).emit('gameStart', { gameState: room.gameState, players: room.players });
                }
            } else {
                socket.emit('roomError', 'Room is full');
            }
        } else {
            socket.emit('roomError', 'Room does not exist');
        }
    });

    socket.on('makeMove', ({ roomId, boardRow, boardCol, cellRow, cellCol }) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            if (room.gameState.winner) {
                return; // Game is already over, ignore further moves
            }
            const playerIndex = room.players.indexOf(socket.id);
            if (playerIndex !== -1 && playerIndex === room.gameState.currentPlayerIndex) {
                if (isValidMove(room.gameState, boardRow, boardCol, cellRow, cellCol)) {
                    updateGameState(room.gameState, boardRow, boardCol, cellRow, cellCol);
                    io.to(roomId).emit('gameStateUpdate', room.gameState);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Handle player disconnection (remove from rooms, notify other player, etc.)
    });
});

function initializeGameState() {
    return {
        superBoard: Array(3).fill().map(() => Array(3).fill().map(() => Array(3).fill().map(() => Array(3).fill('')))),
        boardWinners: Array(3).fill().map(() => Array(3).fill('')),
        currentPlayerIndex: 0,
        activeBoard: null
    };
}

function isValidMove(gameState, boardRow, boardCol, cellRow, cellCol) {
    // Check if the move is within the active board, if there is one
    if (gameState.activeBoard !== null &&
        (gameState.activeBoard[0] !== boardRow || gameState.activeBoard[1] !== boardCol)) {
        return false;
    }

    // Check if the chosen cell is empty
    if (gameState.superBoard[boardRow][boardCol][cellRow][cellCol] !== '') {
        return false;
    }

    // Check if the chosen board is not already won
    if (gameState.boardWinners[boardRow][boardCol] !== '') {
        return false;
    }

    return true;
}


function updateGameState(gameState, boardRow, boardCol, cellRow, cellCol) {
    const currentPlayer = gameState.currentPlayerIndex === 0 ? 'X' : 'O'
    gameState.superBoard[boardRow][boardCol][cellRow][cellCol] = currentPlayer

    if (checkWin(gameState.superBoard[boardRow][boardCol])) {
        gameState.boardWinners[boardRow][boardCol] = currentPlayer
        if (checkSuperWin(gameState.boardWinners)) {
            gameState.winner = currentPlayer
        }
    } else if (checkDraw(gameState.superBoard[boardRow][boardCol])) {
        gameState.boardWinners[boardRow][boardCol] = 'T'
    }

    gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex
    gameState.activeBoard = gameState.boardWinners[cellRow][cellCol] === '' ? [cellRow, cellCol] : null
}

function checkWin(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ]
    return lines.some(line => {
        const [a, b, c] = line
        return board[Math.floor(a/3)][a%3] !== '' &&
               board[Math.floor(a/3)][a%3] === board[Math.floor(b/3)][b%3] &&
               board[Math.floor(b/3)][b%3] === board[Math.floor(c/3)][c%3]
    })
}

function checkSuperWin(boardWinners) {
    return checkWin(boardWinners)
}

function checkDraw(board) {
    return board.every(row => row.every(cell => cell !== ''))
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

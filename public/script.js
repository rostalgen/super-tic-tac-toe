const BOARD_SIZE = 3;
let currentPlayer = 'X';
let superBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(''))));
let boardWinners = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(''));
let activeBoard = null;
let gameActive = true;
const socket = io();
let currentRoom = null;

function createBoard() {
    const game = document.getElementById('superGame');
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const board = document.createElement('div');
            board.classList.add('board');
            board.id = `board-${i}-${j}`;
            for (let x = 0; x < BOARD_SIZE; x++) {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.addEventListener('click', () => makeMove(i, j, x, y));
                    board.appendChild(cell);
                }
            }
            game.appendChild(board);
        }
    }
}

function makeMove(boardRow, boardCol, cellRow, cellCol) {
    console.log("Making move:", boardRow, boardCol, cellRow, cellCol);
    if (currentRoom && gameActive) {
        socket.emit('makeMove', { roomId: currentRoom, boardRow, boardCol, cellRow, cellCol });
    }
}

socket.on('gameStateUpdate', (gameState) => {
    updateBoard(gameState);
    updateStatus(gameState);
});

socket.on('gameStart', ({ gameState, players }) => {
    playerIndex = players.indexOf(socket.id);
        
    console.log("Player index:", playerIndex);
    console.log("Starting player: ", gameState.currentPlayerIndex);
    updateBoard(gameState);
    updateStatus(gameState);
});

function updateSuperBoard() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const board = document.getElementById(`board-${i}-${j}`);
            if (boardWinners[i][j] !== '') {
                board.textContent = boardWinners[i][j];
                board.style.fontSize = '48px';
                board.style.display = 'flex';
                board.style.justifyContent = 'center';
                board.style.alignItems = 'center';
            }
        }
    }
}

function checkWin(board) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (board[i][0] !== '' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return true;
        if (board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return true;
    }
    if (board[0][0] !== '' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) return true;
    if (board[0][2] !== '' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) return true;
    return false;
}

function checkSuperWin() {
    return checkWin(boardWinners);
}

function checkDraw(board) {
    return board.every(row => row.every(cell => cell !== ''));
}

function updateBoard(gameState) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const board = document.getElementById(`board-${i}-${j}`);
            const cells = board.getElementsByClassName('cell');
            if (gameState.boardWinners[i][j] !== '') {
                board.textContent = gameState.boardWinners[i][j];
                board.style.fontSize = '48px';
                board.style.display = 'flex';
                board.style.justifyContent = 'center';
                board.style.alignItems = 'center';
            }
            else {                
                for (let x = 0; x < 3; x++) {
                    for (let y = 0; y < 3; y++) {
                        cells[x * 3 + y].textContent = gameState.superBoard[i][j][x][y];
                    }
                }
            }
        }
    }
    highlightActiveBoard(gameState);
}

function updateStatus(gameState) {
    const status = document.getElementById('playerStatus');
    if(gameState && gameState.currentPlayerIndex !== null)
    {
        const currentPlayer = gameState.currentPlayerIndex === playerIndex ? 'Your' : "Opponent's";
        status.textContent = `${currentPlayer} turn`;
        if (gameState.activeBoard) {
            status.textContent += ` (Must play in board ${gameState.activeBoard[0] * 3 + gameState.activeBoard[1] + 1})`;
        } else {
            status.textContent += ' (Can play in any board)';
        }
        if (gameState.winner) {
            status.textContent = gameState.winner === (playerIndex === 0 ? 'X' : 'O') ? 'You win!' : 'You lose!';
            endGame();
        }
    }
}

function endGame() {
    gameActive = false;
    highlightActiveBoard();
}

function highlightActiveBoard(gameState) {
    document.querySelectorAll('.board').forEach(board => board.classList.remove('active-board', 'opponent-turn'));
    if (gameState) {
        if(gameState.activeBoard) {
            const activeBoard = document.getElementById(`board-${gameState.activeBoard[0]}-${gameState.activeBoard[1]}`);
            if (gameState.currentPlayerIndex === playerIndex) {
                activeBoard.classList.add('active-board');
            } else {
                activeBoard.classList.add('opponent-turn');
            }
        }
        else {
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const board = document.getElementById(`board-${i}-${j}`);
                    const cells = board.getElementsByClassName('cell');
                    if (gameState.boardWinners[i][j] === '') {
                        if (gameState.currentPlayerIndex === playerIndex) {
                            board.classList.add('active-board')
                        } else {
                            board.classList.add('opponent-turn')
                        }
                    }
                }
            }
        }
    }
}

function resetGame() {
    superBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(''))));
    boardWinners = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(''));
    currentPlayer = 'X';
    activeBoard = null;
    gameActive = true;

    document.getElementById('superGame').innerHTML = '';
    createBoard();
    updateStatus();
}

function createRoom() {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.emit('createRoom', roomId);
}

function joinRoom() {
    const roomId = document.getElementById('roomIdInput').value.toUpperCase();
    if (roomId) {
        socket.emit('joinRoom', roomId);
    }
}

function leaveRoom() {
    if (currentRoom) {
        socket.emit('leaveRoom', currentRoom);
        currentRoom = null;
        updateRoomControls();
        resetGame();
    }
}

function updateRoomControls() {
    document.getElementById('createRoomBtn').style.display = currentRoom ? 'none' : 'inline';
    document.getElementById('roomIdInput').style.display = currentRoom ? 'none' : 'inline';
    document.getElementById('joinRoomBtn').style.display = currentRoom ? 'none' : 'inline';
    document.getElementById('leaveRoomBtn').style.display = currentRoom ? 'inline' : 'none';
}

function updateRoomInfo(roomId, isCreator) {
    const roomInfo = document.getElementById('roomInfo');
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    const playerStatus = document.getElementById('playerStatus');

    roomInfo.style.display = 'block';
    roomIdDisplay.textContent = roomId;
    playerStatus.textContent = isCreator ? 'Waiting for opponent...' : 'Waiting for game to start...';
}

socket.on('roomCreated', (roomId) => {
    currentRoom = roomId;
    updateRoomControls();
    updateRoomInfo(roomId, true);
});

socket.on('roomJoined', (roomId) => {
    currentRoom = roomId;
    updateRoomControls();
    updateRoomInfo(roomId, false);
});

socket.on('roomError', (errorMessage) => {
    document.getElementById('playerStatus').textContent = `Error: ${errorMessage}`;
});

// Event listeners for room controls
document.getElementById('createRoomBtn').addEventListener('click', createRoom);
document.getElementById('joinRoomBtn').addEventListener('click', joinRoom);
document.getElementById('leaveRoomBtn').addEventListener('click', leaveRoom);

// Initialize room controls
updateRoomControls();

createBoard();
updateStatus();

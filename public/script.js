const BOARD_SIZE = 3;
let currentPlayer = 'X';
let superBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(''))));
let boardWinners = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(''));
let activeBoard = null;
const socket = io();
let currentRoom = null;
let localGameState = null;

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
    if (currentRoom === 'local') {
        if (sharedLogic.isValidMove(localGameState, boardRow, boardCol, cellRow, cellCol)) {
            sharedLogic.updateGameState(localGameState, boardRow, boardCol, cellRow, cellCol);
            updateBoard(localGameState);
            updateStatus(localGameState);
        }
    } else if (currentRoom) {
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
        if(currentRoom === 'local'){
            const currentPlayer = gameState.currentPlayerIndex === 0 ? 'X' : 'O';
            status.textContent = `${currentPlayer}'s turn`;
        }
        else {
            const currentPlayer = gameState.currentPlayerIndex === playerIndex ? 'Your' : "Opponent's";
            status.textContent = `${currentPlayer} turn`;
        }
        if (gameState.activeBoard) {
            status.textContent += ` (Must play in board ${gameState.activeBoard[0] * 3 + gameState.activeBoard[1] + 1})`;
        } else {
            status.textContent += ' (Can play in any board)';
        }
        if (gameState.winner) {
            if(currentRoom === 'local'){
                status.textContent = `${gameState.winner} wins`;
            }
            else {
                status.textContent = gameState.winner === (playerIndex === 0 ? 'X' : 'O') ? 'You win!' : 'You lose!';
            }
            endGame();
        }
    }
}

function endGame() {
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

function startLocalPlay() {
    currentRoom = 'local';
    playerIndex = 0;
    localGameState = sharedLogic.initializeGameState();
    updateBoard(localGameState);
    updateRoomControls();
    updateRoomInfo(currentRoom, true);
    updateStatus(localGameState);
}


document.getElementById('localPlayBtn').addEventListener('click', startLocalPlay);
document.getElementById('createRoomBtn').addEventListener('click', createRoom);
document.getElementById('joinRoomBtn').addEventListener('click', joinRoom);
document.getElementById('leaveRoomBtn').addEventListener('click', leaveRoom);

// Initialize room controls
updateRoomControls();

createBoard();
updateStatus();

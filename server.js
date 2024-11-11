const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sharedLogic = require('./public/sharedLogic.js');

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
            rooms.set(roomId, { players: [socket.id], gameState: sharedLogic.initializeGameState() });
            socket.join(roomId);
            socket.emit('roomCreated', roomId);
        }
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            if (room.players.length < 2) {
                room.players.push(socket.id);
                socket.join(roomId);
                socket.emit('roomJoined', roomId);
                if (room.players.length === 2) {
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
                if (sharedLogic.isValidMove(room.gameState, boardRow, boardCol, cellRow, cellCol)) {
                    sharedLogic.updateGameState(room.gameState, boardRow, boardCol, cellRow, cellCol);
                    io.to(roomId).emit('gameStateUpdate', room.gameState);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Handle player disconnection (remove from rooms, notify other player, etc.)
    });

    socket.on('chatMessage', ({ roomId, message }) => {
        if (rooms.has(roomId)) {
            io.to(roomId).emit('chatMessage', { sender: socket.id, message });
        }
    });
    
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

# Super Tic-Tac-Toe

Welcome to Super Tic-Tac-Toe, an exciting twist on the classic game! This project implements a multiplayer version of Super Tic-Tac-Toe, playable both locally and online.

## Features

- Local two-player mode
- Online multiplayer with room system
- Real-time game updates using Socket.IO
- Responsive design for various screen sizes
- Visual cues for active boards and turns

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Node.js
- Express.js
- Socket.IO

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository: `git clone https://github.com/yourusername/super-tic-tac-toe.git`
2. Navigate to the project directory: `cd super-tic-tac-toe`
3. Install dependencies: `npm install`
4. Start the server: `node server.js`
5. Open your browser and visit `http://localhost:3000` to play the game.

## How to Play

1. The game consists of 9 small tic-tac-toe boards arranged in a 3x3 grid.
2. The first player can place their mark in any cell on any board.
3. The position of the last move determines which board the next player must play in.
4. Win a small board by getting three in a row.
5. Win the game by winning three small boards in a row.
6. If sent to a full board, the next player can choose any available board.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Inspired by VSauce: https://www.youtube.com/watch?v=_Na3a1ZrX7c
- Built with assistance from Cody, an AI coding assistant

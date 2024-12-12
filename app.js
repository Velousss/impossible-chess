
const PIECE_SYMBOLS = {
    'wp': '♙', 'wn': '♘', 'wb': '♗', 'wr': '♖', 'wq': '♕', 'wk': '♔',
    'bp': '♟', 'bn': '♞', 'bb': '♝', 'br': '♜', 'bq': '♛', 'bk': '♚'
};

let board;
let game;
let playerColor = 'white';
let selectedPiece = null;

function initializeBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
    
            const displayRow = playerColor === 'white' ? row : 7 - row;
            const displayCol = playerColor === 'white' ? col : 7 - col;
    
            square.classList.add((displayRow + displayCol) % 2 === 0 ? 'white' : 'black');
    
            const algebraicNotation = String.fromCharCode(97 + displayCol) + (8 - displayRow);
            square.dataset.square = algebraicNotation;
    
            square.addEventListener('click', handleSquareClick);
            boardElement.appendChild(square);
        }
    }
    
    updateBoardPieces();
}

function updateBoardPieces() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const algebraicSquare = square.dataset.square;
        const piece = game.get(algebraicSquare);
        
        square.textContent = '';
        square.dataset.piece = '';

        if (piece) {
            const pieceKey = piece.color + piece.type;
            const pieceSymbol = PIECE_SYMBOLS[pieceKey];
            
            if (pieceSymbol) {
                square.textContent = pieceSymbol;
                square.dataset.piece = pieceKey;
            }
        }
    });
}

function startNewGame() {
    game = new Chess();
    playerColor = document.getElementById('playerColor').value;
    initializeBoard();
    document.getElementById('gameStatus').textContent = 'Game Started';

    if (playerColor === 'black') {
        makeStockfishMove();
    }
}

function handleSquareClick(event) {
    const clickedSquare = event.target;
    const algebraicNotation = clickedSquare.dataset.square;

    if (!selectedPiece) {
        const piece = game.get(algebraicNotation);
        if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
            selectedPiece = algebraicNotation;
            clickedSquare.classList.add('selected');
        }
    } else {
        try {
            const move = game.move({
                from: selectedPiece,
                to: algebraicNotation,
                promotion: 'q'
            });

            if (move) {
                updateBoardPieces();
                
                if (game.game_over()) {
                    document.getElementById('gameStatus').textContent = 
                        game.in_checkmate() ? 'Checkmate!' : 
                        game.in_draw() ? 'Draw!' : 'Game Over';
                } else {
                    makeStockfishMove();
                }
            }
        } catch (error) {
            console.log('Invalid move', error);
        }

        document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected'));
        selectedPiece = null;
    }
}

function convertFEN(fen) {
    const fenParts = fen.split(' ');
  
    fenParts[3] = game.game_over() ? '-' : game.ep_square || '-';
  
    return fenParts.join(' ');
}

async function makeStockfishMove() {
    const fen = convertFEN(game.fen());
    try {
        const response = await fetch('https://chess-api.com/v1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fen, depth: 18, })
        });
        const data = await response.json();

        if (data && data.move) {
            const { from, to } = data;
            game.move({ from, to, promotion: 'q' });
            updateBoardPieces();

            if (game.game_over()) {
                document.getElementById('gameStatus').textContent = 
                    game.in_checkmate() ? 'Checkmate!' : 
                    game.in_draw() ? 'Draw!' : 'Game Over';
            }
        } else {
            console.error('No move received from API', data);
        }
    } catch (error) {
        console.error('Error making API call:', error);
    }
}

startNewGame();
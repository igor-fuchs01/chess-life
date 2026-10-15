const BOARD_SIZE = 8;

// Accelerated Dragon after 1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6, from Black's back rank down to White's.
const BOARD_POSITION = [
  ["♜", "", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "", "♟", "♟", "♟", "", "♟"],
  ["", "", "♞", "", "", "", "♟", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "♘", "♙", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["♙", "♙", "♙", "", "", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "", "♖"]
];

/**
 * Draws the 64 squares of the home page board, with the pieces of BOARD_POSITION.
 */
function renderBoard() {
  const board = document.getElementById("board");

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      const square = document.createElement("div");
      const isDarkSquare = (row + column) % 2 === 1;

      square.className = isDarkSquare ? "dark" : "light";
      square.textContent = BOARD_POSITION[row][column];
      board.appendChild(square);
    }
  }
}

renderBoard();

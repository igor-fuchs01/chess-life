const ACCELERATED_DRAGON_FEN = "r1bqkbnr/pp1ppp1p/2n3p1/8/3NP3/8/PPP2PPP/RNBQKB1R";
const PIECES = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟", K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" };

function renderBoard(element, fenPlacement) {
  fenPlacement.split("/").forEach((row, rowIndex) => {
    let column = 0;
    for (const symbol of row) {
      const emptySquares = Number(symbol);
      const count = emptySquares || 1;
      for (let i = 0; i < count; i++, column++) {
        const square = document.createElement("div");
        square.className = (rowIndex + column) % 2 ? "dark" : "light";
        if (!emptySquares) {
          square.textContent = PIECES[symbol];
        }
        element.appendChild(square);
      }
    }
  });
}

renderBoard(document.getElementById("board"), ACCELERATED_DRAGON_FEN);

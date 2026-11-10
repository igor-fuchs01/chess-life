// The board is an 8×8 matrix: board[row][column] holds a FEN letter ("K" is the white king, "p" a black pawn)
// or "" for an empty square. Uppercase letters are White. Row 0 is the 8th rank and column 0 is the a-file.
// Only the movement of each piece is checked: there is no castling, en passant or promotion, since no exercise uses them.
const BOARD_SIZE = 8;
const FILES = "abcdefgh";
const SAN_PIECE_LETTERS = "KQRBN";
const KNIGHT_JUMPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const ROOK_DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP_DIRECTIONS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const QUEEN_DIRECTIONS = ROOK_DIRECTIONS.concat(BISHOP_DIRECTIONS);
const WHITE_PAWN_START_ROW = 6;
const BLACK_PAWN_START_ROW = 1;

/**
 * Builds the board from the first field of a FEN, such as "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1".
 * A digit is that many empty squares; a letter is a piece.
 * @param {string} fen
 * @returns {string[][]}
 */
function readBoardFromFen(fen) {
  const placement = fen.split(" ")[0];
  const board = [];

  for (const rankText of placement.split("/")) {
    const row = [];
    for (const symbol of rankText) {
      const emptySquares = Number(symbol);
      for (let i = 0; i < emptySquares; i++) {
        row.push("");
      }
      if (!emptySquares) {
        row.push(symbol);
      }
    }
    board.push(row);
  }
  return board;
}

/**
 * Lists the squares the piece on a square can move to.
 * @param {string[][]} board
 * @param {number} row
 * @param {number} column
 * @returns {{row: number, column: number}[]}
 */
function getTargets(board, row, column) {
  switch (board[row][column].toLowerCase()) {
    case "p":
      return getPawnTargets(board, row, column);
    case "n":
      return getStepTargets(board, row, column, KNIGHT_JUMPS);
    case "k":
      return getStepTargets(board, row, column, KING_STEPS);
    case "r":
      return getSlideTargets(board, row, column, ROOK_DIRECTIONS);
    case "b":
      return getSlideTargets(board, row, column, BISHOP_DIRECTIONS);
    default:
      return getSlideTargets(board, row, column, QUEEN_DIRECTIONS);
  }
}

/**
 * Knight and king: one jump or step to each side, onto an empty square or an enemy piece.
 */
function getStepTargets(board, row, column, steps) {
  const targets = [];

  for (const [rowStep, columnStep] of steps) {
    const targetRow = row + rowStep;
    const targetColumn = column + columnStep;
    if (isInsideBoard(targetRow, targetColumn) && !isSameColor(board, row, column, targetRow, targetColumn)) {
      targets.push({ row: targetRow, column: targetColumn });
    }
  }
  return targets;
}

/**
 * Rook, bishop and queen: along each direction until the edge of the board, stopping before a piece
 * of the same color or on an enemy piece.
 */
function getSlideTargets(board, row, column, directions) {
  const targets = [];

  for (const [rowStep, columnStep] of directions) {
    let targetRow = row + rowStep;
    let targetColumn = column + columnStep;

    while (isInsideBoard(targetRow, targetColumn) && !isSameColor(board, row, column, targetRow, targetColumn)) {
      targets.push({ row: targetRow, column: targetColumn });
      if (board[targetRow][targetColumn] !== "") {
        break;
      }
      targetRow += rowStep;
      targetColumn += columnStep;
    }
  }
  return targets;
}

/**
 * Pawn: one square forward if it is empty, two from its starting row if both are empty,
 * and one square diagonally forward to capture. White moves up the matrix (towards row 0), Black down.
 */
function getPawnTargets(board, row, column) {
  const isWhite = isWhitePiece(board[row][column]);
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? WHITE_PAWN_START_ROW : BLACK_PAWN_START_ROW;
  const nextRow = row + direction;
  const targets = [];

  if (isInsideBoard(nextRow, column) && board[nextRow][column] === "") {
    targets.push({ row: nextRow, column: column });

    const doubleStepRow = row + 2 * direction;
    if (row === startRow && board[doubleStepRow][column] === "") {
      targets.push({ row: doubleStepRow, column: column });
    }
  }

  for (const targetColumn of [column - 1, column + 1]) {
    const hasEnemy = isInsideBoard(nextRow, targetColumn)
      && board[nextRow][targetColumn] !== ""
      && !isSameColor(board, row, column, nextRow, targetColumn);
    if (hasEnemy) {
      targets.push({ row: nextRow, column: targetColumn });
    }
  }
  return targets;
}

/**
 * Moves a piece on the board, capturing whatever stood on the destination.
 * @param {string[][]} board
 * @param {{row: number, column: number}} from
 * @param {{row: number, column: number}} to
 */
function movePiece(board, from, to) {
  board[to.row][to.column] = board[from.row][from.column];
  board[from.row][from.column] = "";
}

/**
 * Reads the piece and the destination of a move in standard algebraic notation (SAN).
 * "Qxf7#" is a queen going to f7; a move without a piece letter, such as "exd5", is a pawn move.
 * @param {string} san
 * @param {boolean} isWhite - Whether White plays the move.
 * @returns {{piece: string, square: string}} The piece as a FEN letter, such as "Q" or "q", and the square name.
 */
function readSanMove(san, isWhite) {
  const move = san.replace("+", "").replace("#", "");
  let letter = "P";
  if (SAN_PIECE_LETTERS.includes(move[0])) {
    letter = move[0];
  }

  return {
    piece: isWhite ? letter : letter.toLowerCase(),
    square: move.slice(-2)
  };
}

/**
 * Writes a move in short SAN, such as "Nf3", "Qxf7" or "exd5", without check or mate signs.
 * Used for wrong moves, which are saved but never compared with anything.
 * @param {string[][]} board - The board before the move.
 * @param {{row: number, column: number}} from
 * @param {{row: number, column: number}} to
 * @returns {string}
 */
function writeSanMove(board, from, to) {
  const letter = board[from.row][from.column].toUpperCase();
  const isCapture = board[to.row][to.column] !== "";
  const square = getSquareName(to.row, to.column);

  if (letter === "P") {
    return isCapture ? `${FILES[from.column]}x${square}` : square;
  }
  return letter + (isCapture ? "x" : "") + square;
}

/**
 * Names a square as in chess notation, such as "e4".
 * @param {number} row
 * @param {number} column
 * @returns {string}
 */
function getSquareName(row, column) {
  return FILES[column] + (BOARD_SIZE - row);
}

/**
 * Tells whether a piece is White's: White's letters are uppercase.
 * @param {string} piece
 * @returns {boolean}
 */
function isWhitePiece(piece) {
  return piece === piece.toUpperCase();
}

/**
 * Tells whether the target square holds a piece of the same color as the piece on the origin square.
 */
function isSameColor(board, row, column, targetRow, targetColumn) {
  const target = board[targetRow][targetColumn];
  return target !== "" && isWhitePiece(target) === isWhitePiece(board[row][column]);
}

/**
 * Tells whether a row and column are on the board.
 */
function isInsideBoard(row, column) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
}

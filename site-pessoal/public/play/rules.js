// Chess rules over an 8×8 matrix. board[row][column] holds a piece { color, type } or null.
// Row 0 is the 8th rank (Black's back rank) and row 7 is the 1st rank; column 0 is the a-file.
const BOARD_SIZE = 8;
const WHITE = "white";
const BLACK = "black";
const FILES = "abcdefgh";
const BACK_RANK = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
const PROMOTION_TYPES = ["queen", "rook", "bishop", "knight"];
// Piece letters of standard algebraic notation (SAN); pawns have none.
const SAN_LETTERS = { king: "K", queen: "Q", rook: "R", bishop: "B", knight: "N", pawn: "" };
const PAWN_START_ROW = { white: 6, black: 1 };
const PROMOTION_ROW = { white: 0, black: 7 };
const KNIGHT_JUMPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const ROOK_DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP_DIRECTIONS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
// Where each rook starts, and the castling it allows while it has not moved or been captured.
const ROOK_CORNERS = [
  { row: 7, column: 0, color: WHITE, side: "queenSide" },
  { row: 7, column: 7, color: WHITE, side: "kingSide" },
  { row: 0, column: 0, color: BLACK, side: "queenSide" },
  { row: 0, column: 7, color: BLACK, side: "kingSide" }
];
// Fifty moves by each player, counted in half-moves.
const FIFTY_MOVE_LIMIT = 100;
const REPETITIONS_FOR_DRAW = 3;

/**
 * Creates a game at the starting position, with White to move.
 * @returns {object} The game: board, turn, castling rights, en passant square, half-move clock and position history.
 */
function createInitialGame() {
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board.push(new Array(BOARD_SIZE).fill(null));
  }

  for (let column = 0; column < BOARD_SIZE; column++) {
    board[0][column] = { color: BLACK, type: BACK_RANK[column] };
    board[1][column] = { color: BLACK, type: "pawn" };
    board[6][column] = { color: WHITE, type: "pawn" };
    board[7][column] = { color: WHITE, type: BACK_RANK[column] };
  }

  const game = {
    board: board,
    turn: WHITE,
    castling: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    },
    // The square a pawn skipped with its double step on the last move, the only square it can be captured on en passant.
    enPassant: null,
    // Half-moves since the last capture or pawn move, for the fifty-move rule.
    halfMoveClock: 0,
    positions: []
  };
  game.positions.push(getPositionKey(game));
  return game;
}

/**
 * Lists the legal moves of the piece on a square. A move is legal only if it leaves its own king out of check,
 * so in check the only moves left are the ones that move the king, block the check or capture the attacker
 * (and only king moves in a double check).
 * @param {object} game
 * @param {number} row
 * @param {number} column
 * @returns {object[]} Moves: { from, to, piece, captured, isEnPassant, castling, promotion }.
 */
function getLegalMoves(game, row, column) {
  const piece = game.board[row][column];
  if (!piece || piece.color !== game.turn) {
    return [];
  }

  const legalMoves = [];
  for (const move of getPieceMoves(game, row, column)) {
    const boardAfterMove = applyMoveToBoard(game.board, move);

    if (!isKingAttacked(boardAfterMove, piece.color)) {
      legalMoves.push(move);
    }
  }
  return legalMoves;
}

/**
 * Lists every legal move of the player to move.
 * @param {object} game
 * @returns {object[]}
 */
function getAllLegalMoves(game) {
  let moves = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      moves = moves.concat(getLegalMoves(game, row, column));
    }
  }
  return moves;
}

/**
 * Plays a legal move and returns the game after it. The given game is not changed.
 * @param {object} game
 * @param {object} move - A move from getLegalMoves; promotion holds the chosen piece type.
 * @returns {object} The new game, with the other player to move.
 */
function makeMove(game, move) {
  const piece = move.piece;
  const castling = {
    white: { ...game.castling.white },
    black: { ...game.castling.black }
  };

  if (piece.type === "king") {
    castling[piece.color].kingSide = false;
    castling[piece.color].queenSide = false;
  }
  // A rook leaving its corner, or captured on it, can no longer castle.
  for (const corner of ROOK_CORNERS) {
    const leavesCorner = move.from.row === corner.row && move.from.column === corner.column;
    const capturedOnCorner = move.to.row === corner.row && move.to.column === corner.column;

    if (leavesCorner || capturedOnCorner) {
      castling[corner.color][corner.side] = false;
    }
  }

  let enPassant = null;
  if (piece.type === "pawn" && Math.abs(move.to.row - move.from.row) === 2) {
    enPassant = { row: (move.from.row + move.to.row) / 2, column: move.from.column };
  }

  let halfMoveClock = game.halfMoveClock + 1;
  if (piece.type === "pawn" || move.captured) {
    halfMoveClock = 0;
  }

  const nextGame = {
    board: applyMoveToBoard(game.board, move),
    turn: getOpponent(piece.color),
    castling: castling,
    enPassant: enPassant,
    halfMoveClock: halfMoveClock,
    positions: game.positions.slice()
  };
  nextGame.positions.push(getPositionKey(nextGame));
  return nextGame;
}

/**
 * Tells how the game ended, if it did: checkmate, stalemate, insufficient material,
 * fifty-move rule or threefold repetition. The draws by rule end the game automatically.
 * @param {object} game
 * @returns {{reason: string, winner: string|null}|null} The ending, with winner null for a draw, or null while the game goes on.
 */
function getGameEnd(game) {
  const hasLegalMoves = getAllLegalMoves(game).length > 0;
  const inCheck = isKingAttacked(game.board, game.turn);

  if (!hasLegalMoves && inCheck) {
    return { reason: "checkmate", winner: getOpponent(game.turn) };
  }
  if (!hasLegalMoves) {
    return { reason: "stalemate", winner: null };
  }
  if (hasInsufficientMaterial(game.board)) {
    return { reason: "insufficientMaterial", winner: null };
  }
  if (game.halfMoveClock >= FIFTY_MOVE_LIMIT) {
    return { reason: "fiftyMoves", winner: null };
  }
  if (countRepetitions(game) >= REPETITIONS_FOR_DRAW) {
    return { reason: "repetition", winner: null };
  }
  return null;
}

/**
 * Writes a move in standard algebraic notation (SAN), such as "Nf3", "exd5", "O-O", "e8=Q" or "Qh5#",
 * the format the games API stores.
 * @param {object} game - The game before the move.
 * @param {object} move - A legal move, with its promotion already chosen.
 * @returns {string}
 */
function getMoveSan(game, move) {
  const target = getSquareName(move.to);
  const isCapture = move.captured !== null;
  let san;

  if (move.castling === "kingSide") {
    san = "O-O";
  } else if (move.castling === "queenSide") {
    san = "O-O-O";
  } else if (move.piece.type === "pawn") {
    san = isCapture ? `${FILES[move.from.column]}x${target}` : target;
    if (move.promotion) {
      san += `=${SAN_LETTERS[move.promotion]}`;
    }
  } else {
    san = SAN_LETTERS[move.piece.type] + getDisambiguation(game, move) + (isCapture ? "x" : "") + target;
  }

  const nextGame = makeMove(game, move);
  if (isKingAttacked(nextGame.board, nextGame.turn)) {
    san += getAllLegalMoves(nextGame).length === 0 ? "#" : "+";
  }
  return san;
}

/**
 * Tells whether a player's king is attacked.
 * @param {object[][]} board
 * @param {string} color - The king's color.
 * @returns {boolean}
 */
function isKingAttacked(board, color) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      if (isPieceAt(board, row, column, color, "king")) {
        return isSquareAttacked(board, row, column, getOpponent(color));
      }
    }
  }
  return false;
}

/**
 * Names a square as in chess notation.
 * @param {{row: number, column: number}} square
 * @returns {string} Such as "e4".
 */
function getSquareName(square) {
  return FILES[square.column] + (BOARD_SIZE - square.row);
}

/**
 * Returns the other player's color.
 * @param {string} color
 * @returns {string}
 */
function getOpponent(color) {
  return color === WHITE ? BLACK : WHITE;
}

/**
 * Lists the moves a piece can make by its own movement, before checking whether they leave its king in check.
 */
function getPieceMoves(game, row, column) {
  const board = game.board;

  switch (board[row][column].type) {
    case "pawn":
      return getPawnMoves(game, row, column);
    case "knight":
      return getStepMoves(board, row, column, KNIGHT_JUMPS);
    case "king":
      return getStepMoves(board, row, column, KING_STEPS).concat(getCastlingMoves(game, row, column));
    case "rook":
      return getSlidingMoves(board, row, column, ROOK_DIRECTIONS);
    case "bishop":
      return getSlidingMoves(board, row, column, BISHOP_DIRECTIONS);
    default:
      return getSlidingMoves(board, row, column, ROOK_DIRECTIONS.concat(BISHOP_DIRECTIONS));
  }
}

/**
 * Pawn moves: one step forward, two from its starting row, diagonal captures, en passant and promotion.
 * A promotion starts as a queen; the player can choose another piece before the move is played.
 */
function getPawnMoves(game, row, column) {
  const board = game.board;
  const piece = board[row][column];
  const direction = getPawnDirection(piece.color);
  const nextRow = row + direction;
  const moves = [];

  if (isInsideBoard(nextRow, column) && !board[nextRow][column]) {
    moves.push(createMove(board, row, column, nextRow, column));

    const doubleStepRow = row + 2 * direction;
    if (row === PAWN_START_ROW[piece.color] && !board[doubleStepRow][column]) {
      moves.push(createMove(board, row, column, doubleStepRow, column));
    }
  }

  for (const columnStep of [-1, 1]) {
    const targetColumn = column + columnStep;
    if (!isInsideBoard(nextRow, targetColumn)) {
      continue;
    }

    const target = board[nextRow][targetColumn];
    const isEnPassantSquare = game.enPassant && game.enPassant.row === nextRow && game.enPassant.column === targetColumn;

    if (target && target.color !== piece.color) {
      moves.push(createMove(board, row, column, nextRow, targetColumn));
    } else if (isEnPassantSquare) {
      const move = createMove(board, row, column, nextRow, targetColumn);
      // The captured pawn is beside this pawn, not on the square it moves to.
      move.captured = board[row][targetColumn];
      move.isEnPassant = true;
      moves.push(move);
    }
  }

  for (const move of moves) {
    if (move.to.row === PROMOTION_ROW[piece.color]) {
      move.promotion = "queen";
    }
  }
  return moves;
}

/**
 * Castling on each side, when the king and that rook have not moved, the squares between them are empty,
 * the king is not in check, and the squares the king passes through and lands on are not attacked.
 */
function getCastlingMoves(game, row, column) {
  const board = game.board;
  const color = board[row][column].color;
  const rights = game.castling[color];
  const moves = [];

  if (isKingAttacked(board, color)) {
    return moves;
  }

  if (rights.kingSide && isCastlingPathSafe(board, row, [5, 6], [5, 6], color)) {
    const move = createMove(board, row, column, row, 6);
    move.castling = "kingSide";
    moves.push(move);
  }
  // On the queen's side the b-file square must be empty, but the king never crosses it.
  if (rights.queenSide && isCastlingPathSafe(board, row, [1, 2, 3], [2, 3], color)) {
    const move = createMove(board, row, column, row, 2);
    move.castling = "queenSide";
    moves.push(move);
  }
  return moves;
}

/**
 * Tells whether castling's path is free: emptyColumns hold no piece and the king's columns are not attacked.
 */
function isCastlingPathSafe(board, row, emptyColumns, kingColumns, color) {
  for (const column of emptyColumns) {
    if (board[row][column]) {
      return false;
    }
  }
  for (const column of kingColumns) {
    if (isSquareAttacked(board, row, column, getOpponent(color))) {
      return false;
    }
  }
  return true;
}

/**
 * Moves of pieces that jump to fixed offsets: the knight and the king.
 */
function getStepMoves(board, row, column, steps) {
  const color = board[row][column].color;
  const moves = [];

  for (const [rowStep, columnStep] of steps) {
    const targetRow = row + rowStep;
    const targetColumn = column + columnStep;
    if (!isInsideBoard(targetRow, targetColumn)) {
      continue;
    }

    const target = board[targetRow][targetColumn];
    if (!target || target.color !== color) {
      moves.push(createMove(board, row, column, targetRow, targetColumn));
    }
  }
  return moves;
}

/**
 * Moves of pieces that slide until blocked: the rook, the bishop and the queen.
 */
function getSlidingMoves(board, row, column, directions) {
  const color = board[row][column].color;
  const moves = [];

  for (const [rowStep, columnStep] of directions) {
    let targetRow = row + rowStep;
    let targetColumn = column + columnStep;

    while (isInsideBoard(targetRow, targetColumn)) {
      const target = board[targetRow][targetColumn];

      if (!target) {
        moves.push(createMove(board, row, column, targetRow, targetColumn));
      } else {
        if (target.color !== color) {
          moves.push(createMove(board, row, column, targetRow, targetColumn));
        }
        break;
      }

      targetRow += rowStep;
      targetColumn += columnStep;
    }
  }
  return moves;
}

/**
 * Builds a plain move from one square to another.
 */
function createMove(board, fromRow, fromColumn, toRow, toColumn) {
  return {
    from: { row: fromRow, column: fromColumn },
    to: { row: toRow, column: toColumn },
    piece: board[fromRow][fromColumn],
    captured: board[toRow][toColumn],
    isEnPassant: false,
    castling: null,
    promotion: null
  };
}

/**
 * Returns a copy of the board with the move played: the en passant capture removes the pawn beside,
 * castling also moves the rook, and promotion replaces the pawn.
 */
function applyMoveToBoard(board, move) {
  const newBoard = [];
  for (const row of board) {
    newBoard.push(row.slice());
  }

  const { from, to } = move;
  newBoard[from.row][from.column] = null;
  newBoard[to.row][to.column] = move.promotion ? { color: move.piece.color, type: move.promotion } : move.piece;

  if (move.isEnPassant) {
    newBoard[from.row][to.column] = null;
  }
  if (move.castling === "kingSide") {
    newBoard[from.row][5] = newBoard[from.row][7];
    newBoard[from.row][7] = null;
  }
  if (move.castling === "queenSide") {
    newBoard[from.row][3] = newBoard[from.row][0];
    newBoard[from.row][0] = null;
  }
  return newBoard;
}

/**
 * Tells whether any piece of attackerColor attacks a square. Checks outward from the square:
 * pawns, knights and the king at their fixed offsets, then the first piece along each line.
 */
function isSquareAttacked(board, row, column, attackerColor) {
  // An attacking pawn stands one row behind the square, from its own point of view.
  const pawnRow = row - getPawnDirection(attackerColor);
  for (const columnStep of [-1, 1]) {
    if (isPieceAt(board, pawnRow, column + columnStep, attackerColor, "pawn")) {
      return true;
    }
  }

  for (const [rowStep, columnStep] of KNIGHT_JUMPS) {
    if (isPieceAt(board, row + rowStep, column + columnStep, attackerColor, "knight")) {
      return true;
    }
  }

  for (const [rowStep, columnStep] of KING_STEPS) {
    if (isPieceAt(board, row + rowStep, column + columnStep, attackerColor, "king")) {
      return true;
    }
  }

  return isAttackedAlongLines(board, row, column, ROOK_DIRECTIONS, attackerColor, "rook")
    || isAttackedAlongLines(board, row, column, BISHOP_DIRECTIONS, attackerColor, "bishop");
}

/**
 * Tells whether the first piece found along any of the directions is an attacker's lineType piece or queen.
 */
function isAttackedAlongLines(board, row, column, directions, attackerColor, lineType) {
  for (const [rowStep, columnStep] of directions) {
    let targetRow = row + rowStep;
    let targetColumn = column + columnStep;

    while (isInsideBoard(targetRow, targetColumn)) {
      const piece = board[targetRow][targetColumn];

      if (piece) {
        const isLinePiece = piece.type === lineType || piece.type === "queen";
        if (piece.color === attackerColor && isLinePiece) {
          return true;
        }
        break;
      }

      targetRow += rowStep;
      targetColumn += columnStep;
    }
  }
  return false;
}

/**
 * Tells whether a square inside the board holds a piece of the given color and type.
 */
function isPieceAt(board, row, column, color, type) {
  if (!isInsideBoard(row, column)) {
    return false;
  }
  const piece = board[row][column];
  return piece !== null && piece.color === color && piece.type === type;
}

/**
 * Tells whether a row and column are on the board.
 */
function isInsideBoard(row, column) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
}

/**
 * Returns the row step of a color's pawns: White moves up the matrix (towards row 0), Black down.
 */
function getPawnDirection(color) {
  return color === WHITE ? -1 : 1;
}

/**
 * Adds the origin to a piece move's SAN when another piece of the same type can reach the same square:
 * the file if it tells them apart, otherwise the rank, otherwise both.
 */
function getDisambiguation(game, move) {
  let hasRival = false;
  let rivalOnSameFile = false;
  let rivalOnSameRank = false;

  for (const other of getAllLegalMoves(game)) {
    const sameTarget = other.to.row === move.to.row && other.to.column === move.to.column;
    const sameOrigin = other.from.row === move.from.row && other.from.column === move.from.column;

    if (other.piece.type !== move.piece.type || !sameTarget || sameOrigin) {
      continue;
    }
    hasRival = true;
    if (other.from.column === move.from.column) {
      rivalOnSameFile = true;
    }
    if (other.from.row === move.from.row) {
      rivalOnSameRank = true;
    }
  }

  const file = FILES[move.from.column];
  const rank = String(BOARD_SIZE - move.from.row);
  if (!hasRival) {
    return "";
  }
  if (!rivalOnSameFile) {
    return file;
  }
  if (!rivalOnSameRank) {
    return rank;
  }
  return file + rank;
}

/**
 * Tells whether neither player can ever checkmate: only kings, a king and one bishop or knight,
 * or kings and bishops that all stand on squares of the same color.
 */
function hasInsufficientMaterial(board) {
  const minorPieces = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      const piece = board[row][column];

      if (!piece || piece.type === "king") {
        continue;
      }
      if (piece.type !== "bishop" && piece.type !== "knight") {
        return false;
      }
      minorPieces.push({ type: piece.type, squareColor: (row + column) % 2 });
    }
  }

  if (minorPieces.length <= 1) {
    return true;
  }
  for (const piece of minorPieces) {
    if (piece.type !== "bishop" || piece.squareColor !== minorPieces[0].squareColor) {
      return false;
    }
  }
  return true;
}

/**
 * Counts how many times the current position has occurred in the game, including now.
 */
function countRepetitions(game) {
  const currentPosition = game.positions[game.positions.length - 1];
  let count = 0;

  for (const position of game.positions) {
    if (position === currentPosition) {
      count++;
    }
  }
  return count;
}

/**
 * Describes a position for the repetition rule: the pieces, the player to move, the castling rights and,
 * when an en passant capture is actually possible, its square.
 */
function getPositionKey(game) {
  let key = "";

  for (const row of game.board) {
    for (const piece of row) {
      key += piece ? `${piece.color}-${piece.type},` : "-,";
    }
  }

  const { white, black } = game.castling;
  key += `${game.turn}|${white.kingSide}${white.queenSide}${black.kingSide}${black.queenSide}`;

  let canCaptureEnPassant = false;
  if (game.enPassant) {
    for (const move of getAllLegalMoves(game)) {
      if (move.isEnPassant) {
        canCaptureEnPassant = true;
      }
    }
  }
  if (canCaptureEnPassant) {
    key += `|${getSquareName(game.enPassant)}`;
  }
  return key;
}

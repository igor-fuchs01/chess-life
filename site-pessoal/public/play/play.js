const PIECE_SYMBOLS = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" }
};
const PIECE_NAMES = { king: "rei", queen: "dama", rook: "torre", bishop: "bispo", knight: "cavalo", pawn: "peão" };
const COLOR_NAMES = { white: "brancas", black: "pretas" };
// Values of partida.cor in the games API.
const API_COLORS = { white: "brancas", black: "pretas" };
// The local game is between two people on the same computer; the AI opponent comes later.
const API_OPPONENT = "humano";
const SAN_PIECE_TYPES = { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight" };
const END_REASONS = {
  checkmate: "Xeque-mate",
  stalemate: "Afogamento",
  insufficientMaterial: "Material insuficiente",
  fiftyMoves: "Regra dos 50 lances",
  repetition: "Tripla repetição",
  resignation: "Abandono",
  agreement: "Empate por acordo"
};

const currentUser = getSessionUser();
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("game-status");
const moveListElement = document.getElementById("move-list");
const gameMessage = document.getElementById("game-message");
const newGameForm = document.getElementById("new-game-form");
const promotionDialog = document.getElementById("promotion-dialog");
const saveRetryButton = document.getElementById("save-retry-button");

let game;
let playerColor;
let sanMoves;
let lastMove;
let gameEnd;
let selectedSquare;
let selectedMoves;
let pendingPromotion;

/**
 * Connects the buttons and starts the first game.
 */
function startPage() {
  newGameForm.addEventListener("submit", handleNewGame);
  document.getElementById("resign-button").addEventListener("click", resign);
  document.getElementById("draw-button").addEventListener("click", agreeDraw);
  saveRetryButton.addEventListener("click", saveGame);
  promotionDialog.addEventListener("close", cancelPromotion);
  createPromotionButtons();

  startGame();
}

/**
 * Starts a new game, asking first when a game in progress would be lost.
 * @param {SubmitEvent} event
 */
function handleNewGame(event) {
  event.preventDefault();

  const isGameInProgress = !gameEnd && sanMoves.length > 0;
  if (isGameInProgress && !confirm("Abandonar a partida atual? Ela não será salva.")) {
    return;
  }
  startGame();
}

/**
 * Sets up the starting position, with the board turned to the color the user chose.
 */
function startGame() {
  game = createInitialGame();
  playerColor = newGameForm.color.value;
  sanMoves = [];
  lastMove = null;
  gameEnd = null;
  clearSelection();

  gameMessage.className = "message";
  saveRetryButton.hidden = true;
  render();
}

/**
 * Selects a piece of the player to move, or plays the selected piece to the clicked square.
 * @param {number} row
 * @param {number} column
 */
function handleSquareClick(row, column) {
  if (gameEnd) {
    return;
  }

  const move = selectedMoves.find((item) => item.to.row === row && item.to.column === column);
  if (move) {
    playMove(move);
    return;
  }

  const piece = game.board[row][column];
  if (piece && piece.color === game.turn) {
    selectedSquare = { row, column };
    selectedMoves = getLegalMoves(game, row, column);
  } else {
    clearSelection();
  }
  renderBoard();
}

/**
 * Plays a move, first asking which piece a promoting pawn becomes.
 * @param {object} move - A legal move from the rules.
 */
function playMove(move) {
  if (move.promotion) {
    pendingPromotion = move;
    for (const button of promotionDialog.querySelectorAll("button")) {
      button.textContent = PIECE_SYMBOLS[game.turn][button.dataset.piece];
    }
    promotionDialog.showModal();
    return;
  }

  finishMove(move);
}

/**
 * Records the move in SAN, updates the game and ends it when a rule says so.
 * @param {object} move
 */
function finishMove(move) {
  sanMoves.push(getMoveSan(game, move));
  game = makeMove(game, move);
  lastMove = move;
  clearSelection();

  const end = getGameEnd(game);
  if (end) {
    endGame(end);
    return;
  }
  render();
}

/**
 * Builds one button per promotion piece in the promotion dialog.
 */
function createPromotionButtons() {
  const options = document.getElementById("promotion-options");

  for (const type of PROMOTION_TYPES) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.piece = type;
    button.setAttribute("aria-label", PIECE_NAMES[type]);
    button.addEventListener("click", () => choosePromotion(type));
    options.appendChild(button);
  }
}

/**
 * Plays the waiting promotion with the chosen piece.
 * @param {string} type - "queen", "rook", "bishop" or "knight".
 */
function choosePromotion(type) {
  const move = { ...pendingPromotion, promotion: type };
  pendingPromotion = null;
  promotionDialog.close();
  finishMove(move);
}

/**
 * Drops the waiting promotion when the dialog is closed without a choice (Esc), so the pawn stays where it was.
 */
function cancelPromotion() {
  pendingPromotion = null;
}

/**
 * The player to move resigns, after confirming.
 */
function resign() {
  if (gameEnd || !confirm(`As ${COLOR_NAMES[game.turn]} abandonam a partida?`)) {
    return;
  }
  endGame({ reason: "resignation", winner: getOpponent(game.turn) });
}

/**
 * Ends the game in a draw both players agreed to, after confirming.
 */
function agreeDraw() {
  if (gameEnd || !confirm("Os dois jogadores concordam com o empate?")) {
    return;
  }
  endGame({ reason: "agreement", winner: null });
}

/**
 * Stops the game, shows how it ended and saves it.
 * @param {{reason: string, winner: string|null}} end
 */
function endGame(end) {
  gameEnd = end;
  render();
  saveGame();
}

/**
 * Sends the finished game to the games API, which identifies its opening.
 * A game with no moves is not saved, since the API needs at least one.
 */
async function saveGame() {
  saveRetryButton.hidden = true;

  if (sanMoves.length === 0) {
    showMessage(gameMessage, "A partida terminou sem lances e não foi salva.", "error");
    return;
  }

  const savedGame = {
    resultado: getResultForPlayer(),
    adversario: API_OPPONENT,
    cor: API_COLORS[playerColor],
    lances: sanMoves
  };

  try {
    const response = await fetch(`/partidas/cadastrar/${currentUser.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(savedGame)
    });

    if (!response.ok) {
      showSaveError("Não foi possível salvar a partida.");
      return;
    }

    const saved = await response.json();
    showMessage(gameMessage, `Partida salva no seu dashboard. Abertura: ${saved.abertura}.`, "success");
  } catch {
    showSaveError("Não foi possível conectar ao servidor para salvar a partida.");
  }
}

/**
 * Shows a save error and offers to try again.
 * @param {string} text
 */
function showSaveError(text) {
  showMessage(gameMessage, text, "error");
  saveRetryButton.hidden = false;
}

/**
 * Turns the ending into the result from the user's side, as the API expects.
 * @returns {"vitoria"|"derrota"|"empate"}
 */
function getResultForPlayer() {
  if (!gameEnd.winner) {
    return "empate";
  }
  return gameEnd.winner === playerColor ? "vitoria" : "derrota";
}

/**
 * Redraws the board, the status and the move list.
 */
function render() {
  renderBoard();
  renderStatus();
  renderMoveList();
}

/**
 * Draws the 64 squares from the game's matrix. The user's color is always at the bottom.
 */
function renderBoard() {
  const isFlipped = playerColor === BLACK;
  const checkedKing = findCheckedKing();
  boardElement.innerHTML = "";

  for (let displayRow = 0; displayRow < BOARD_SIZE; displayRow++) {
    for (let displayColumn = 0; displayColumn < BOARD_SIZE; displayColumn++) {
      const row = isFlipped ? BOARD_SIZE - 1 - displayRow : displayRow;
      const column = isFlipped ? BOARD_SIZE - 1 - displayColumn : displayColumn;
      const square = createSquare(row, column, checkedKing);

      if (displayColumn === 0) {
        square.appendChild(createCoordinate("rank", BOARD_SIZE - row));
      }
      if (displayRow === BOARD_SIZE - 1) {
        square.appendChild(createCoordinate("file", FILES[column]));
      }
      boardElement.appendChild(square);
    }
  }
}

/**
 * Builds one square button, marked when it is selected, a move target, part of the last move or a king in check.
 * @param {number} row
 * @param {number} column
 * @param {{row: number, column: number}|null} checkedKing
 * @returns {HTMLButtonElement}
 */
function createSquare(row, column, checkedKing) {
  const piece = game.board[row][column];
  const square = document.createElement("button");
  square.type = "button";
  square.className = (row + column) % 2 === 1 ? "dark" : "light";
  square.textContent = piece ? PIECE_SYMBOLS[piece.color][piece.type] : "";
  square.setAttribute("aria-label", describeSquare(row, column));
  square.addEventListener("click", () => handleSquareClick(row, column));

  const target = selectedMoves.find((move) => move.to.row === row && move.to.column === column);
  if (target) {
    square.classList.add(target.captured ? "capture" : "target");
  }
  if (isSameSquare(selectedSquare, row, column)) {
    square.classList.add("selected");
  }
  if (lastMove && (isSameSquare(lastMove.from, row, column) || isSameSquare(lastMove.to, row, column))) {
    square.classList.add("last-move");
  }
  if (isSameSquare(checkedKing, row, column)) {
    square.classList.add("check");
  }
  return square;
}

/**
 * Builds the small file letter or rank number shown on the edge squares.
 * @param {"file"|"rank"} kind
 * @param {string|number} text
 * @returns {HTMLSpanElement}
 */
function createCoordinate(kind, text) {
  const coordinate = document.createElement("span");
  coordinate.className = `coordinate ${kind}`;
  coordinate.textContent = text;
  return coordinate;
}

/**
 * Describes a square for screen readers, such as "e4, cavalo das brancas".
 * @param {number} row
 * @param {number} column
 * @returns {string}
 */
function describeSquare(row, column) {
  const piece = game.board[row][column];
  const name = getSquareName({ row, column });

  if (!piece) {
    return `${name}, vazia`;
  }
  return `${name}, ${PIECE_NAMES[piece.type]} das ${COLOR_NAMES[piece.color]}`;
}

/**
 * Finds the king of the player to move when it is in check.
 * @returns {{row: number, column: number}|null}
 */
function findCheckedKing() {
  if (!isKingAttacked(game.board, game.turn)) {
    return null;
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      const piece = game.board[row][column];
      if (piece && piece.type === "king" && piece.color === game.turn) {
        return { row, column };
      }
    }
  }
  return null;
}

/**
 * Shows whose turn it is and whether they are in check, or how the game ended.
 */
function renderStatus() {
  if (!gameEnd) {
    const check = isKingAttacked(game.board, game.turn) ? " Xeque!" : "";
    statusElement.textContent = `Vez das ${COLOR_NAMES[game.turn]}.${check}`;
    return;
  }

  let result = "empate";
  if (gameEnd.winner) {
    result = `${COLOR_NAMES[gameEnd.winner]} vencem`;
  }
  statusElement.textContent = `${END_REASONS[gameEnd.reason]}: ${result}.`;
}

/**
 * Lists the moves in pairs, one numbered line per White move and Black reply.
 */
function renderMoveList() {
  moveListElement.innerHTML = "";
  document.getElementById("moves-empty").hidden = sanMoves.length > 0;

  for (let index = 0; index < sanMoves.length; index += 2) {
    const line = document.createElement("li");
    line.appendChild(createMoveCell(`${index / 2 + 1}.`));
    line.appendChild(createMoveCell(formatSan(sanMoves[index], WHITE)));

    if (index + 1 < sanMoves.length) {
      line.appendChild(createMoveCell(formatSan(sanMoves[index + 1], BLACK)));
    }
    moveListElement.appendChild(line);
  }

  moveListElement.scrollTop = moveListElement.scrollHeight;
}

/**
 * Creates one cell of the move list.
 * @param {string} text
 * @returns {HTMLSpanElement}
 */
function createMoveCell(text) {
  const cell = document.createElement("span");
  cell.textContent = text;
  return cell;
}

/**
 * Shows a SAN move with piece symbols instead of English letters, such as "♘f3" for "Nf3".
 * @param {string} san
 * @param {string} color - The color that played the move.
 * @returns {string}
 */
function formatSan(san, color) {
  return san.replace(/[KQRBN]/g, (letter) => PIECE_SYMBOLS[color][SAN_PIECE_TYPES[letter]]);
}

/**
 * Tells whether a square is at the given row and column.
 * @param {{row: number, column: number}|null} square
 * @param {number} row
 * @param {number} column
 * @returns {boolean}
 */
function isSameSquare(square, row, column) {
  return square !== null && square.row === row && square.column === column;
}

/**
 * Forgets the selected piece and its moves.
 */
function clearSelection() {
  selectedSquare = null;
  selectedMoves = [];
}

startPage();

// The exercise page: the user plays the solution's moves, and the page plays the opponent's replies.
const PIECE_SYMBOLS = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
};
// The start screen with the lists; ?lista= opens the list the exercise came from.
const START_PAGE = "play.html";
// The opponent's reply waits a moment, so the user sees their own move first.
const OPPONENT_DELAY_MS = 500;

const currentUser = getSessionUser();
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("game-status");
const moveListElement = document.getElementById("move-list");
const gameMessage = document.getElementById("game-message");
const retryButton = document.getElementById("retry-button");
const nextLink = document.getElementById("next-link");

let listId;
let exercise;
let board;
// The moves played so far in SAN, the opponent's replies included. The user's moves are at even indexes.
let moves;
let lastMove;
// null while the attempt goes on, then "solved" or "wrong".
let result;
let selectedSquare;
let targets;

/**
 * Reads the list and the exercise from the address (?lista=2&exercicio=6) and loads the exercise.
 * Without valid ids, it goes back to the start screen.
 */
function startPage() {
  const address = new URLSearchParams(window.location.search);
  listId = address.get("lista");
  // A number, as the ids the API sends, so loadNextExercise can find it in the list.
  const exerciseId = Number(address.get("exercicio"));
  if (!listId || !exerciseId) {
    window.location = START_PAGE;
    return;
  }

  document.getElementById("back-link").href = `${START_PAGE}?lista=${listId}`;
  retryButton.addEventListener("click", startAttempt);

  loadExercise(exerciseId);
  loadNextExercise(exerciseId);
}

/**
 * Reads the exercise's position and solution from the API and starts the first attempt.
 * @param {number} exerciseId
 */
async function loadExercise(exerciseId) {
  try {
    const response = await fetch(`/exercicios/buscar/${exerciseId}`);
    if (!response.ok) {
      showMessage(gameMessage, await response.text(), "error");
      return;
    }

    exercise = await response.json();
    document.getElementById("exercise-title").textContent = exercise.titulo;
    startAttempt();
  } catch {
    showMessage(gameMessage, "Não foi possível conectar ao servidor para carregar o exercício.", "error");
  }
}

/**
 * Points the "Próximo exercício" link to the exercise after this one in its list.
 * The link stays empty, and so hidden, for the last exercise of the list.
 * @param {number} exerciseId
 */
async function loadNextExercise(exerciseId) {
  try {
    const response = await fetch(`/exercicios/listar/${listId}/${currentUser.id}`);
    if (response.status !== 200) {
      return;
    }

    const exercises = await response.json();
    for (let index = 0; index < exercises.length - 1; index++) {
      if (exercises[index].id === exerciseId) {
        nextLink.href = `game.html?lista=${listId}&exercicio=${exercises[index + 1].id}`;
      }
    }
  } catch {
    // Without the list, the page simply offers no next exercise.
  }
}

/**
 * Sets up the exercise's position. The user always plays White, drawn at the bottom of the board.
 */
function startAttempt() {
  board = readBoardFromPosition(exercise.posicao);
  moves = [];
  lastMove = null;
  result = null;
  selectedSquare = null;
  targets = [];

  retryButton.hidden = true;
  nextLink.hidden = true;
  gameMessage.className = "message";
  render();
}

/**
 * Selects one of the user's pieces, or moves the selected piece to the clicked square.
 * Clicks are ignored after the attempt ends and while the opponent is replying.
 * @param {number} row
 * @param {number} column
 */
function handleSquareClick(row, column) {
  const isOpponentTurn = moves.length % 2 === 1;
  if (result || isOpponentTurn) {
    return;
  }

  if (isTarget(row, column)) {
    playUserMove(selectedSquare, { row, column });
    return;
  }

  const piece = board[row][column];
  if (piece !== "" && isWhitePiece(piece)) {
    selectedSquare = { row, column };
    targets = getTargets(board, row, column);
  } else {
    selectedSquare = null;
    targets = [];
  }
  render();
}

/**
 * Plays the user's move and compares it with the next solution move: the same piece must go to the same square.
 * A different move ends the attempt as wrong, the last solution move ends it as solved,
 * and any other right move gets the opponent's reply.
 * @param {{row: number, column: number}} from
 * @param {{row: number, column: number}} to
 */
function playUserMove(from, to) {
  const solutionSan = exercise.solucao[moves.length];
  const expected = readSanMove(solutionSan);
  const isRight = board[from.row][from.column] === expected.piece && getSquareName(to.row, to.column) === expected.square;

  if (isRight) {
    moves.push(solutionSan);
  } else {
    moves.push(writeSanMove(board, from, to));
  }
  applyMove(from, to);

  if (!isRight) {
    endAttempt("wrong");
    return;
  }
  if (moves.length === exercise.solucao.length) {
    endAttempt("solved");
    return;
  }
  render();
  setTimeout(playOpponentReply, OPPONENT_DELAY_MS);
}

/**
 * Plays Black's reply written in the solution: finds the piece that can reach the reply's square.
 */
function playOpponentReply() {
  const san = exercise.solucao[moves.length];
  const reply = readSanMove(san);
  const blackPiece = reply.piece.toLowerCase();

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      if (board[row][column] !== blackPiece) {
        continue;
      }
      for (const target of getTargets(board, row, column)) {
        if (getSquareName(target.row, target.column) === reply.square) {
          moves.push(san);
          applyMove({ row, column }, target);
          render();
          return;
        }
      }
    }
  }
}

/**
 * Moves the piece, remembers the move for the highlight and clears the selection.
 * @param {{row: number, column: number}} from
 * @param {{row: number, column: number}} to
 */
function applyMove(from, to) {
  movePiece(board, from, to);
  lastMove = { from, to };
  selectedSquare = null;
  targets = [];
}

/**
 * Stops the attempt, offers to try again, offers the next exercise when this one was solved, and saves the attempt.
 * @param {"solved"|"wrong"} attemptResult
 */
function endAttempt(attemptResult) {
  result = attemptResult;
  retryButton.hidden = false;
  nextLink.hidden = attemptResult !== "solved" || !nextLink.getAttribute("href");
  render();
  saveAttempt();
}

/**
 * Sends the attempt's moves to the API, which compares them with the solution and saves the result.
 */
async function saveAttempt() {
  const attempt = {
    fk_lista: listId,
    fk_exercicio: exercise.id,
    lances: moves
  };

  try {
    const response = await fetch(`/tentativas/cadastrar/${currentUser.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attempt)
    });

    if (!response.ok) {
      showMessage(gameMessage, "Não foi possível salvar a tentativa.", "error");
      return;
    }
    showMessage(gameMessage, "Tentativa salva no seu dashboard.", "success");
  } catch {
    showMessage(gameMessage, "Não foi possível conectar ao servidor para salvar a tentativa.", "error");
  }
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
 * Draws the 64 squares, from the 8th rank at the top to the 1st at the bottom, so White is at the bottom.
 */
function renderBoard() {
  const checkedKing = findCheckedKing();
  boardElement.innerHTML = "";

  for (let row = BOARD_SIZE - 1; row >= 0; row--) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      boardElement.appendChild(createSquare(row, column, checkedKing));
    }
  }
}

/**
 * Builds one square button, marked when it is selected, a move target, part of the last move or a king in check.
 * After a wrong move, its squares are marked in red instead of the usual highlight.
 * @param {number} row
 * @param {number} column
 * @param {{row: number, column: number}|null} checkedKing
 * @returns {HTMLButtonElement}
 */
function createSquare(row, column, checkedKing) {
  const piece = board[row][column];
  const square = document.createElement("button");
  square.type = "button";
  // a1 (row 0, column 0) is a dark square.
  square.className = (row + column) % 2 === 0 ? "dark" : "light";
  square.textContent = PIECE_SYMBOLS[piece] || "";
  square.addEventListener("click", () => handleSquareClick(row, column));

  if (isTarget(row, column)) {
    square.classList.add(piece !== "" ? "capture" : "target");
  }
  if (isSameSquare(selectedSquare, row, column)) {
    square.classList.add("selected");
  }
  if (lastMove && (isSameSquare(lastMove.from, row, column) || isSameSquare(lastMove.to, row, column))) {
    square.classList.add(result === "wrong" ? "wrong-move" : "last-move");
  }
  if (isSameSquare(checkedKing, row, column)) {
    square.classList.add("check");
  }
  return square;
}

/**
 * Finds the black king when the last move put it in check. Only the user's solution moves carry the "+" or "#"
 * sign (Black's replies never give check), so the sign tells it without checking the rules.
 * @returns {{row: number, column: number}|null}
 */
function findCheckedKing() {
  const lastSan = moves[moves.length - 1];
  if (!lastSan || !(lastSan.endsWith("+") || lastSan.endsWith("#"))) {
    return null;
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      if (board[row][column] === "k") {
        return { row, column };
      }
    }
  }
  return null;
}

/**
 * Shows how many moves are left to mate, that the opponent is replying, or how the attempt ended.
 */
function renderStatus() {
  statusElement.classList.toggle("wrong", result === "wrong");
  if (result === "solved") {
    statusElement.textContent = "Xeque-mate! Exercício resolvido.";
    return;
  }
  if (result === "wrong") {
    statusElement.textContent = "Lance errado. Tente de novo.";
    return;
  }
  if (moves.length % 2 === 1) {
    statusElement.textContent = "O adversário está respondendo…";
    return;
  }

  // The solution alternates the user's moves and the replies, so the user's moves left are half of the rest, rounded up.
  const movesLeft = Math.ceil((exercise.solucao.length - moves.length) / 2);
  statusElement.textContent = `Brancas jogam e dão mate em ${movesLeft}.`;
}

/**
 * Lists the moves in numbered lines of two: the user's move and the opponent's reply, such as "1. Bxf7+ Ke7".
 */
function renderMoveList() {
  moveListElement.innerHTML = "";
  document.getElementById("moves-empty").hidden = moves.length > 0;

  for (let index = 0; index < moves.length; index += 2) {
    const line = document.createElement("li");
    // slice stops at the end of the array, so the last line holds only the user's move while the reply is missing.
    const movePair = moves.slice(index, index + 2).join(" ");
    line.textContent = `${index / 2 + 1}. ${movePair}`;
    moveListElement.appendChild(line);
  }
}

/**
 * Tells whether the selected piece can move to a square.
 * @param {number} row
 * @param {number} column
 * @returns {boolean}
 */
function isTarget(row, column) {
  for (const target of targets) {
    if (target.row === row && target.column === column) {
      return true;
    }
  }
  return false;
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
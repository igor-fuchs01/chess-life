// The start screen's exercise lists: one card per list, and the table of the chosen list's exercises.

// The exercise links on the start screen open this page.
const EXERCISE_PAGE = "game.html";
const SOLVED_STATUS = "✓ Resolvido";
const PENDING_STATUS = "Pendente";

const currentUser = getSessionUser();
const listOptions = document.getElementById("list-options");
const listsMessage = document.getElementById("lists-message");
const exercisesSection = document.getElementById("exercises-section");
const exercisesTitle = document.getElementById("exercises-title");
const exerciseList = document.getElementById("exercise-list");

/**
 * Shows the lists and opens the list named in the address (?lista=), which the exercise page links back to.
 */
async function startLists() {
  const lists = await loadLists();
  const listIdInAddress = parsePositiveId(new URLSearchParams(window.location.search).get("lista"));
  const listInAddress = lists.find((list) => list.id === listIdInAddress);

  if (listInAddress) {
    openList(listInAddress);
  }
}

/**
 * Reads the lists and the user's progress from the API and shows one card per list.
 * @returns {Promise<object[]>} The lists, or an empty array when none could be loaded.
 */
async function loadLists() {
  try {
    const response = await fetch(`/listasExercicios/listar/${currentUser.id}`);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    // 204 means there are no lists in the database.
    if (response.status === 204) {
      showMessage(listsMessage, "Nenhuma lista de exercícios cadastrada.", "error");
      return [];
    }

    const lists = await response.json();
    for (let index = 0; index < lists.length; index++) {
      listOptions.appendChild(createListCard(lists[index], index + 1));
    }
    return lists;
  } catch {
    showMessage(listsMessage, "Não foi possível carregar as listas de exercícios.", "error");
    return [];
  }
}

/**
 * Builds a list's card: its level, name, description and the user's progress.
 * @param {{id: number, nome: string, descricao: string, total_exercicios: number, resolvidos: number}} list
 * @param {number} level - The list's place on the screen, from 1.
 * @returns {HTMLButtonElement}
 */
function createListCard(list, level) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "list-option";
  card.dataset.listId = list.id;

  const levelSquare = createTextElement("span", "list-level", level);

  const texts = document.createElement("span");
  texts.appendChild(createTextElement("strong", "list-name", list.nome));
  texts.appendChild(createTextElement("span", "list-description", list.descricao));

  const progressText = `${list.resolvidos}/${list.total_exercicios}`;

  card.appendChild(levelSquare);
  card.appendChild(texts);
  card.appendChild(createTextElement("span", "list-progress", progressText));
  card.addEventListener("click", () => openList(list));
  return card;
}

/**
 * Marks the list's card and fills the table with its exercises.
 * @param {{id: number, nome: string}} list
 */
async function openList(list) {
  for (const card of listOptions.children) {
    card.classList.toggle("selected", Number(card.dataset.listId) === list.id);
  }
  exercisesTitle.textContent = list.nome;
  exerciseList.innerHTML = "";

  try {
    const response = await fetch(`/exercicios/listar/${list.id}/${currentUser.id}`);
    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    const exercises = await response.json();
    for (const exercise of exercises) {
      exerciseList.appendChild(createExerciseRow(list.id, exercise));
    }
    exercisesSection.hidden = false;
  } catch {
    exercisesSection.hidden = true;
    showMessage(listsMessage, "Não foi possível carregar os exercícios desta lista.", "error");
  }
}

/**
 * Builds an exercise's table row: number, link and "Abrir" button to the exercise page, and the status in the list.
 * @param {number} listId
 * @param {{id: number, titulo: string, ordem: number, resolvido: boolean}} exercise
 * @returns {HTMLTableRowElement}
 */
function createExerciseRow(listId, exercise) {
  const exerciseUrl = `${EXERCISE_PAGE}?lista=${listId}&exercicio=${exercise.id}`;
  const row = document.createElement("tr");

  row.appendChild(createTextElement("td", "exercise-number", exercise.ordem));

  const link = createTextElement("a", "exercise-link", exercise.titulo);
  link.href = exerciseUrl;
  const linkCell = document.createElement("td");
  linkCell.appendChild(link);
  row.appendChild(linkCell);

  const statusClass = exercise.resolvido ? "exercise-solved" : "exercise-pending";
  const statusText = exercise.resolvido ? SOLVED_STATUS : PENDING_STATUS;
  row.appendChild(createTextElement("td", statusClass, statusText));

  const openButton = createTextElement("a", "btn", "Abrir");
  openButton.href = exerciseUrl;
  const actionCell = createTextElement("td", "exercise-action", "");
  actionCell.appendChild(openButton);
  row.appendChild(actionCell);

  return row;
}

/**
 * Creates an element with a class and a text. Uses textContent, so text from the database is never read as HTML.
 * @param {string} tagName
 * @param {string} className
 * @param {string|number} text
 * @returns {HTMLElement}
 */
function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

/**
 * Reads an id from the address.
 * @param {string|null} value
 * @returns {number|null} The id, or null when it is not a positive whole number.
 */
function parsePositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

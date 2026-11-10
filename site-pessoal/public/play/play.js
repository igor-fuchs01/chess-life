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
const listCardTemplate = document.getElementById("list-card-template");
const exerciseRowTemplate = document.getElementById("exercise-row-template");

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
    const response = await fetch(`/listas/listar/${currentUser.id}`);
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
 * Fills the list card template with the list's level, name, description and the user's progress.
 * @param {{id: number, nome: string, descricao: string, total_exercicios: number, resolvidos: number}} list
 * @param {number} level - The list's place on the screen, from 1.
 * @returns {HTMLButtonElement}
 */
function createListCard(list, level) {
  const card = listCardTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.listId = list.id;
  card.querySelector(".list-level").textContent = level;
  card.querySelector(".list-name").textContent = list.nome;
  card.querySelector(".list-description").textContent = list.descricao;
  card.querySelector(".list-progress").textContent = `${list.resolvidos}/${list.total_exercicios}`;
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
 * Fills the exercise row template: number, link and "Abrir" button to the exercise page, and the status in the list.
 * @param {number} listId
 * @param {{id: number, titulo: string, ordem: number, resolvido: boolean}} exercise
 * @returns {HTMLTableRowElement}
 */
function createExerciseRow(listId, exercise) {
  const row = exerciseRowTemplate.content.firstElementChild.cloneNode(true);
  const exerciseUrl = `${EXERCISE_PAGE}?lista=${listId}&exercicio=${exercise.id}`;
  const link = row.querySelector(".exercise-link");
  const status = row.querySelector(".exercise-status");

  row.querySelector(".exercise-number").textContent = exercise.ordem;
  link.href = exerciseUrl;
  link.textContent = exercise.titulo;
  row.querySelector(".exercise-open").href = exerciseUrl;

  status.classList.add(exercise.resolvido ? "exercise-solved" : "exercise-pending");
  status.textContent = exercise.resolvido ? SOLVED_STATUS : PENDING_STATUS;
  return row;
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

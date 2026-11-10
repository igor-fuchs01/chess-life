// Player profile fields, shared by the sign-up form and the profile dialog of the game's start screen.
// Both forms name their fields rating, startYear, opening and bio.
const PROFILE_MAX_RATING = 3500;
// The first year MySQL's YEAR type accepts, the same limit as the API.
const PROFILE_FIRST_START_YEAR = 1901;
// The known openings, mocked here. The API accepts only these ids, from 1 to 49.
const OPENINGS = [
  { id: 1, nome: "Abertura do Peão do Rei" },
  { id: 2, nome: "Abertura do Peão da Dama" },
  { id: 3, nome: "Abertura Inglesa" },
  { id: 4, nome: "Abertura Réti" },
  { id: 5, nome: "Abertura Bird" },
  { id: 6, nome: "Abertura Larsen" },
  { id: 7, nome: "Abertura Húngara" },
  { id: 8, nome: "Abertura Italiana" },
  { id: 9, nome: "Giuoco Piano" },
  { id: 10, nome: "Gambito Evans" },
  { id: 11, nome: "Defesa dos Dois Cavalos" },
  { id: 12, nome: "Abertura Espanhola" },
  { id: 13, nome: "Espanhola: Defesa Morphy" },
  { id: 14, nome: "Espanhola: Defesa Berlinense" },
  { id: 15, nome: "Abertura Escocesa" },
  { id: 16, nome: "Abertura dos Quatro Cavalos" },
  { id: 17, nome: "Defesa Petrov" },
  { id: 18, nome: "Defesa Philidor" },
  { id: 19, nome: "Gambito do Rei" },
  { id: 20, nome: "Abertura Vienense" },
  { id: 21, nome: "Abertura do Bispo" },
  { id: 22, nome: "Abertura Central" },
  { id: 23, nome: "Defesa Siciliana" },
  { id: 24, nome: "Siciliana: Najdorf" },
  { id: 25, nome: "Siciliana: Dragão" },
  { id: 26, nome: "Siciliana: Dragão Acelerado" },
  { id: 27, nome: "Siciliana: Fechada" },
  { id: 28, nome: "Siciliana: Alapin" },
  { id: 29, nome: "Siciliana: Gambito Smith-Morra" },
  { id: 30, nome: "Defesa Francesa" },
  { id: 31, nome: "Defesa Caro-Kann" },
  { id: 32, nome: "Defesa Escandinava" },
  { id: 33, nome: "Defesa Alekhine" },
  { id: 34, nome: "Defesa Pirc" },
  { id: 35, nome: "Defesa Moderna" },
  { id: 36, nome: "Gambito da Dama" },
  { id: 37, nome: "Gambito da Dama Aceito" },
  { id: 38, nome: "Gambito da Dama Recusado" },
  { id: 39, nome: "Defesa Eslava" },
  { id: 40, nome: "Sistema Londres" },
  { id: 41, nome: "Sistema Londres" },
  { id: 42, nome: "Sistema Londres" },
  { id: 43, nome: "Defesa Índia" },
  { id: 44, nome: "Defesa Índia do Rei" },
  { id: 45, nome: "Defesa Grünfeld" },
  { id: 46, nome: "Defesa Nimzo-Índia" },
  { id: 47, nome: "Defesa Índia da Dama" },
  { id: 48, nome: "Defesa Benoni" },
  { id: 49, nome: "Defesa Holandesa" }
];

/**
 * Adds the openings to a select, after the options it already has, in alphabetical order.
 * @param {HTMLSelectElement} select
 */
function fillOpeningOptions(select) {
  const openingsByName = [...OPENINGS].sort((first, second) => first.nome.localeCompare(second.nome, "pt-BR"));
  for (const opening of openingsByName) {
    const option = document.createElement("option");
    option.value = opening.id;
    option.textContent = opening.nome;
    select.append(option);
  }
}

/**
 * @param {number|null} openingId
 * @returns {string|null} The opening's name, or null when no opening has that id.
 */
function getOpeningName(openingId) {
  const opening = OPENINGS.find((item) => item.id === openingId);
  return opening ? opening.nome : null;
}

/**
 * Reads the profile fields of a form into the API's body, with null for every empty field.
 * @param {HTMLFormElement} form
 * @returns {{rating: number|null, ano_inicio: number|null, bio: string|null, fk_abertura_favorita: number|null}}
 */
function readProfileFields(form) {
  const bio = form.bio.value.trim();

  return {
    rating: readNumberField(form.rating.value),
    ano_inicio: readNumberField(form.startYear.value),
    bio: bio === "" ? null : bio,
    fk_abertura_favorita: readNumberField(form.opening.value)
  };
}

/**
 * Checks the profile on the page, for a quick reply; the API repeats the checks.
 * Rating, starting year and bio are required; the favorite opening may be "Nenhuma".
 * The bio needs no length check here: the field's maxlength already limits it.
 * @param {{rating: number|null, ano_inicio: number|null, bio: string|null, fk_abertura_favorita: number|null}} profile
 * @returns {string|null} The error message, or null when the profile is valid.
 */
function validateProfileFields(profile) {
  if (profile.rating === null || profile.ano_inicio === null || profile.bio === null) {
    return "Preencha o rating, o ano em que começou a jogar e a bio.";
  }
  if (!isWholeNumberBetween(profile.rating, 0, PROFILE_MAX_RATING)) {
    return `O rating precisa ser um número inteiro de 0 a ${PROFILE_MAX_RATING}.`;
  }

  const currentYear = new Date().getFullYear();
  if (!isWholeNumberBetween(profile.ano_inicio, PROFILE_FIRST_START_YEAR, currentYear)) {
    return `O ano em que começou a jogar precisa estar entre ${PROFILE_FIRST_START_YEAR} e ${currentYear}.`;
  }
  return null;
}

/**
 * @param {string} value - A form field's text.
 * @returns {number|null} The number, or null when the field is empty.
 */
function readNumberField(value) {
  return value === "" ? null : Number(value);
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean} True when the value is a whole number from min to max.
 */
function isWholeNumberBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

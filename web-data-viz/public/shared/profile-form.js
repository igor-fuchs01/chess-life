// Player profile fields, shared by the sign-up form and the profile dialog of the game's start screen.
// Both forms name their fields rating, startYear, opening and bio.
const PROFILE_MAX_RATING = 3500;
// The first year MySQL's YEAR type accepts, the same limit as the API.
const PROFILE_FIRST_START_YEAR = 1901;
// The known openings, mocked here and kept in alphabetical order. The profile saves the chosen name as text.
const OPENINGS = [
  "Abertura Bird",
  "Abertura Central",
  "Abertura do Bispo",
  "Abertura do Peão da Dama",
  "Abertura do Peão do Rei",
  "Abertura dos Quatro Cavalos",
  "Abertura Escocesa",
  "Abertura Espanhola",
  "Abertura Húngara",
  "Abertura Inglesa",
  "Abertura Italiana",
  "Abertura Larsen",
  "Abertura Réti",
  "Abertura Vienense",
  "Defesa Alekhine",
  "Defesa Benoni",
  "Defesa Caro-Kann",
  "Defesa dos Dois Cavalos",
  "Defesa Escandinava",
  "Defesa Eslava",
  "Defesa Francesa",
  "Defesa Grünfeld",
  "Defesa Holandesa",
  "Defesa Índia",
  "Defesa Índia da Dama",
  "Defesa Índia do Rei",
  "Defesa Moderna",
  "Defesa Nimzo-Índia",
  "Defesa Petrov",
  "Defesa Philidor",
  "Defesa Pirc",
  "Defesa Siciliana",
  "Espanhola: Defesa Berlinense",
  "Espanhola: Defesa Morphy",
  "Gambito da Dama",
  "Gambito da Dama Aceito",
  "Gambito da Dama Recusado",
  "Gambito do Rei",
  "Gambito Evans",
  "Giuoco Piano",
  "Siciliana: Alapin",
  "Siciliana: Dragão",
  "Siciliana: Dragão Acelerado",
  "Siciliana: Fechada",
  "Siciliana: Gambito Smith-Morra",
  "Siciliana: Najdorf",
  "Sistema Londres"
];

/**
 * Adds the openings to a select, after the options it already has.
 * @param {HTMLSelectElement} select
 */
function fillOpeningOptions(select) {
  for (const opening of OPENINGS) {
    select.append(new Option(opening, opening));
  }
}

/**
 * Reads the profile fields of a form into the API's body, with null for every empty field.
 * @param {HTMLFormElement} form
 * @returns {{rating: number|null, ano_inicio: number|null, bio: string|null, abertura_favorita: string|null}}
 */
function readProfileFields(form) {
  const bio = form.bio.value.trim();

  return {
    rating: readNumberField(form.rating.value),
    ano_inicio: readNumberField(form.startYear.value),
    bio: bio === "" ? null : bio,
    abertura_favorita: form.opening.value === "" ? null : form.opening.value
  };
}

/**
 * Checks the profile on the page, for a quick reply; the API repeats the checks.
 * Rating, starting year and bio are required; the favorite opening may be "Nenhuma".
 * The bio needs no length check here: the field's maxlength already limits it.
 * @param {{rating: number|null, ano_inicio: number|null, bio: string|null, abertura_favorita: string|null}} profile
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

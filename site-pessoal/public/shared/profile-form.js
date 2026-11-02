// Player profile fields, shared by the sign-up form and the profile dialog of the game's start screen.
// Both forms name their fields rating, startYear, opening and bio.
const PROFILE_MAX_RATING = 3500;
// The first year MySQL's YEAR type accepts, the same limit as the API.
const PROFILE_FIRST_START_YEAR = 1901;

/**
 * Adds the openings the API knows to a select, after the options it already has.
 * @param {HTMLSelectElement} select
 * @returns {Promise<boolean>} False when the openings could not be loaded.
 */
async function loadOpeningOptions(select) {
  try {
    const response = await fetch("/aberturas/listar");
    if (!response.ok) {
      return false;
    }
    for (const opening of await response.json()) {
      const option = document.createElement("option");
      option.value = opening.id;
      option.textContent = opening.nome;
      select.append(option);
    }
    return true;
  } catch {
    return false;
  }
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
 * Checks the profile on the page, for a quick reply; the API repeats the checks. Every field is required.
 * The bio needs no length check here: the field's maxlength already limits it.
 * @param {{rating: number|null, ano_inicio: number|null, bio: string|null, fk_abertura_favorita: number|null}} profile
 * @returns {string|null} The error message, or null when the profile is valid.
 */
function validateProfileFields(profile) {
  if (profile.rating === null || profile.ano_inicio === null || profile.fk_abertura_favorita === null || profile.bio === null) {
    return "Preencha o rating, o ano em que começou a jogar, a abertura favorita e a bio.";
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

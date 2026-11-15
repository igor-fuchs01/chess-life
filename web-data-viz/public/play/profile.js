const profileUser = getSessionUser();
const profileDialog = document.getElementById("profile-dialog");
const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const bioField = document.getElementById("bio");

let savedProfile = null;

/**
 * Connects the profile buttons, fills the opening options and loads the user's profile.
 */
function startProfile() {
  document.getElementById("player-name").textContent = profileUser.name;
  document.getElementById("profile-button").addEventListener("click", openProfileDialog);
  document.getElementById("profile-cancel-button").addEventListener("click", () => profileDialog.close());
  profileForm.addEventListener("submit", saveProfile);
  bioField.addEventListener("input", updateBioCount);

  fillOpeningOptions(profileForm.opening);
  loadProfile();
}

/**
 * Reads the user's profile from the API and shows it on the player card.
 */
async function loadProfile() {
  try {
    const response = await fetch(`/perfis/buscar/${profileUser.id}`);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    savedProfile = response.status === 204 ? null : await response.json();
    renderPlayerCard();
  } catch {
    document.getElementById("player-bio").textContent = "Não foi possível carregar o perfil.";
  }
}

/**
 * Shows the saved profile on the player card. Without a profile there is nothing to edit, so the button hides.
 */
function renderPlayerCard() {
  const hasProfile = savedProfile !== null;

  document.getElementById("player-stats").hidden = !hasProfile;
  document.getElementById("profile-button").hidden = !hasProfile;

  if (!hasProfile) {
    document.getElementById("player-bio").textContent = "Perfil não encontrado.";
    return;
  }

  document.getElementById("player-bio").textContent = savedProfile.bio ?? "Sem bio.";
  document.getElementById("player-rating").textContent = savedProfile.rating ?? "—";
  document.getElementById("player-start-year").textContent = savedProfile.ano_inicio ?? "—";
  document.getElementById("player-opening").textContent = savedProfile.abertura_favorita ?? "—";
}

/**
 * Opens the dialog with the saved profile in the form.
 */
function openProfileDialog() {
  profileForm.rating.value = savedProfile.rating ?? "";
  profileForm.startYear.value = savedProfile.ano_inicio ?? "";
  profileForm.opening.value = savedProfile.abertura_favorita ?? "";
  bioField.value = savedProfile.bio ?? "";
  updateBioCount();

  profileMessage.className = "message";
  profileDialog.showModal();
}

/**
 * Updates the profile, then shows the new information on the player card.
 * @param {SubmitEvent} event
 */
async function saveProfile(event) {
  event.preventDefault();

  const profile = readProfileFields(profileForm);
  const error = validateProfileFields(profile);
  if (error) {
    showMessage(profileMessage, error, "error");
    return;
  }

  try {
    const response = await fetch(`/perfis/atualizar/${profileUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      const errorText = await response.text();
      showMessage(profileMessage, errorText || "Não foi possível salvar o perfil.", "error");
      return;
    }

    profileDialog.close();
    await loadProfile();
  } catch {
    showMessage(profileMessage, "Não foi possível conectar ao servidor.", "error");
  }
}

/**
 * Shows how many of the bio's 50 characters are used.
 */
function updateBioCount() {
  document.getElementById("bio-count").textContent = bioField.value.length;
}

startProfile();

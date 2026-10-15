// Address of the public/ folder, taken from this script's own address so links work both
// through the server and when a page is opened straight from disk.
const SITE_ROOT = document.currentScript.src.replace(/shared\/session\.js.*$/, "");
const LOGIN_PAGE = `${SITE_ROOT}auth/login.html`;

/**
 * Returns the logged-in user saved in this browser tab.
 * @returns {{id: string, name: string, email: string}|null} The user, or null for a visitor.
 */
function getSessionUser() {
  if (!sessionStorage.USER_ID) {
    return null;
  }

  return {
    id: sessionStorage.USER_ID,
    name: sessionStorage.USER_NAME,
    email: sessionStorage.USER_EMAIL
  };
}

/**
 * Saves the user who has just logged in.
 * @param {{id: number, name: string, email: string}} user
 */
function startSession(user) {
  sessionStorage.USER_ID = user.id;
  sessionStorage.USER_NAME = user.name;
  sessionStorage.USER_EMAIL = user.email;
}

/**
 * Logs the user out and goes to the login page.
 */
function endSession() {
  sessionStorage.clear();
  window.location = LOGIN_PAGE;
}

/**
 * Sends visitors to the login page. Called at the top of restricted pages.
 */
function requireSession() {
  if (!getSessionUser()) {
    window.location = LOGIN_PAGE;
  }
}

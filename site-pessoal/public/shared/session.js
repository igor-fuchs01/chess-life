const LOGIN_PAGE = "/auth/login.html";

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

function startSession(user) {
  sessionStorage.USER_ID = user.id;
  sessionStorage.USER_NAME = user.name;
  sessionStorage.USER_EMAIL = user.email;
}

function endSession() {
  sessionStorage.clear();
  window.location = LOGIN_PAGE;
}

function requireSession() {
  const user = getSessionUser();
  if (!user) {
    window.location = LOGIN_PAGE;
  }
  return user;
}

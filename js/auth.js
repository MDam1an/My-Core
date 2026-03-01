/* ================================================================
   auth.js — Authentication & Session Management
   ================================================================ */

const Auth = (() => {

  const USERS_KEY = 'mycore_users';
  const SESSION_KEY = 'mycore_session';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
    catch(e) { return {}; }
  }

  function saveUsers(u) {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  }

  function getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
    catch(e) { return null; }
  }

  function setSession(user) {
    // Use sessionStorage so session ends when browser closes,
    // but also persist email in localStorage for "remember me" feel
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem('mycore_last_user', user.email);
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('mycore_last_user');
  }

  function getDataKey(email) {
    return 'mycore_data_' + email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  function hashPass(pass) {
    // Simple obfuscation (not cryptographic, but better than plaintext)
    return btoa(unescape(encodeURIComponent(pass + '::mycore2024')));
  }

  function register(name, email, password) {
    email = email.trim().toLowerCase();
    const users = getUsers();
    if (users[email]) return { ok: false, msg: 'Este e-mail já está cadastrado.' };
    if (password.length < 6) return { ok: false, msg: 'Senha deve ter pelo menos 6 caracteres.' };

    users[email] = {
      name: name.trim(),
      email,
      hash: hashPass(password),
      createdAt: new Date().toISOString()
    };
    saveUsers(users);

    const user = { name: users[email].name, email };
    setSession(user);
    // Initialize fresh data for new user
    DB.initForUser(email, name.trim());
    return { ok: true, user };
  }

  function login(email, password) {
    email = email.trim().toLowerCase();
    const users = getUsers();
    if (!users[email]) return { ok: false, msg: 'E-mail não encontrado.' };
    if (users[email].hash !== hashPass(password)) return { ok: false, msg: 'Senha incorreta.' };

    const user = { name: users[email].name, email };
    setSession(user);
    return { ok: true, user };
  }

  function logout() {
    clearSession();
    window.location.href = '../index.html';
  }

  // Try auto-login from last session
  function tryAutoLogin() {
    // Check sessionStorage first
    const sess = getCurrentUser();
    if (sess) return sess;

    // Try localStorage "remember"
    const last = localStorage.getItem('mycore_last_user');
    if (last) {
      const users = getUsers();
      if (users[last]) {
        const user = { name: users[last].name, email: last };
        setSession(user);
        return user;
      }
    }
    return null;
  }

  function requireAuth(redirectTo = '../index.html') {
    const user = tryAutoLogin();
    if (!user) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  }

  return { register, login, logout, getCurrentUser, tryAutoLogin, requireAuth, getDataKey };
})();

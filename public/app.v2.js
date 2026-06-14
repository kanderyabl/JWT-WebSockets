const authPanel = document.getElementById("auth-panel");
const chatPanel = document.getElementById("chat-panel");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const btnRegister = document.getElementById("btn-register");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const authError = document.getElementById("auth-error");
const currentUser = document.getElementById("current-user");
const messagesEl = document.getElementById("messages");
const usersEl = document.getElementById("users");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

let token = null;
let username = null;
let ws = null;

const params = new URLSearchParams(window.location.search);
const backendHost =
  params.get("backend") || params.get("api") || window.CONFIG?.api || "";
const wsHost = params.get("ws") || window.CONFIG?.ws || "";
const apiOrigin = backendHost || window.location.origin;

async function api(path, data) {
  const url = `${apiOrigin}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

function getWebSocketUrl() {
  let host = wsHost || window.location.host;
  let protocol = window.location.protocol === "https:" ? "wss" : "ws";

  if (/^wss?:\/\//.test(host)) {
    return `${host}?token=${encodeURIComponent(token)}`;
  }

  if (/^https?:\/\//.test(host)) {
    protocol = host.startsWith("https:") ? "wss" : "ws";
    host = host.replace(/^https?:\/\//, "");
  }

  return `${protocol}://${host}?token=${encodeURIComponent(token)}`;
}

function showError(text) {
  authError.textContent = text;
}

function showChat() {
  authPanel.classList.add("hidden");
  chatPanel.classList.remove("hidden");
  currentUser.textContent = username;
}

function showAuth() {
  authPanel.classList.remove("hidden");
  chatPanel.classList.add("hidden");
  currentUser.textContent = "";
}

function addMessage(item) {
  const div = document.createElement("div");
  div.className = "message";

  if (item.type === "system") {
    div.innerHTML = `<div class="system">${item.text}</div>`;
  } else {
    const date = new Date(item.timestamp).toLocaleTimeString();
    div.innerHTML = `<div class="meta"><strong>${item.username}</strong> • ${date}</div><div>${item.text}</div>`;
  }

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function updateUsers(list) {
  usersEl.innerHTML = list.map((name) => `<li>${name}</li>`).join("");
}

function connectWebSocket() {
  ws = new WebSocket(getWebSocketUrl());

  ws.addEventListener("open", () => {
    addMessage({ type: "system", text: "WebSocket подключен." });
  });

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "users") {
      updateUsers(data.users);
      return;
    }
    addMessage(data);
  });

  ws.addEventListener("close", () => {
    addMessage({ type: "system", text: "Соединение закрыто." });
  });
}

btnRegister.addEventListener("click", async () => {
  showError("");
  const name = usernameInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!name || !pass) {
    showError("Заполни имя и пароль.");
    return;
  }

  const result = await api("/api/register", { username: name, password: pass });
  if (result.error) {
    showError(result.error);
    return;
  }

  showError("Пользователь зарегистрирован. Теперь войди.");
});

btnLogin.addEventListener("click", async () => {
  showError("");
  const name = usernameInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!name || !pass) {
    showError("Заполни имя и пароль.");
    return;
  }

  const result = await api("/api/login", { username: name, password: pass });
  if (result.error) {
    showError(result.error);
    return;
  }

  token = result.token;
  username = result.username;
  showChat();
  connectWebSocket();
});

btnLogout.addEventListener("click", () => {
  if (ws) ws.close();
  token = null;
  username = null;
  messagesEl.innerHTML = "";
  usersEl.innerHTML = "";
  showAuth();
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(JSON.stringify({ type: "message", text }));
  messageInput.value = "";
});

showAuth();

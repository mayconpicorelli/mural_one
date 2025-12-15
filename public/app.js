// public/app.js

document.addEventListener("DOMContentLoaded", () => {
  setupLogin();
  setupCalendar();
  setupChat();
});

function setupLogin() {
  const loginContainer = document.getElementById("login-container");
  const portalContainer = document.getElementById("portal-container");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const logoutBtn = document.getElementById("logout-btn");

  if (!loginForm || !loginContainer || !portalContainer) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    loginMessage.textContent = "Validando acesso...";
    loginMessage.className = "login-message";

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        loginMessage.textContent =
          data.message || "Usuário ou senha inválidos.";
        loginMessage.classList.add("error");
        return;
      }

      loginMessage.textContent =
        data.message || "Login realizado com sucesso.";
      loginMessage.classList.add("success");

      setTimeout(() => {
        loginContainer.classList.add("hidden");
        portalContainer.classList.remove("hidden");
        loginMessage.textContent = "";
      }, 500);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      loginMessage.textContent = "Erro ao conectar ao servidor.";
      loginMessage.classList.add("error");
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      portalContainer.classList.add("hidden");
      loginContainer.classList.remove("hidden");
      loginMessage.textContent = "";
      loginForm.reset();
    });
  }
}

/* --------- Calendário operacional --------- */

let currentMonthDate = new Date();

function setupCalendar() {
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");

  if (!prevBtn || !nextBtn) return;

  prevBtn.addEventListener("click", () => {
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    renderCalendar();
  });

  nextBtn.addEventListener("click", () => {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();
}

// Eventos de exemplo (você pode depois ler isso de um JSON ou do banco)
function getCalendarEvents() {
  return {
    // formato YYYY-MM-DD
    "2025-01-01": { label: "Confraternização universal", type: "holiday" },
    "2025-04-21": { label: "Tiradentes", type: "holiday" },
    "2025-05-01": { label: "Dia do Trabalho", type: "holiday" },
    "2025-12-25": { label: "Natal", type: "holiday" },

    // Exemplo de unidade fechada
    "2025-12-26": { label: "Unidade BAR fechada", type: "closed" },
  };
}

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const title = document.getElementById("calendar-title");

  if (!grid || !title) return;

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-11
  const events = getCalendarEvents();

  const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  title.textContent =
    monthNames[month].charAt(0).toUpperCase() +
    monthNames[month].slice(1) +
    " " +
    year;

  grid.innerHTML = "";

  const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
  weekdays.forEach((d) => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-weekday";
    cell.textContent = d;
    grid.appendChild(cell);
  });

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0 = domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startWeekday; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-cell calendar-empty";
    grid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-day";

    const number = document.createElement("div");
    number.className = "calendar-day-number";
    number.textContent = day;
    cell.appendChild(number);

    const key =
      year +
      "-" +
      String(month + 1).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0");

    const info = events[key];

    if (info) {
      const badge = document.createElement("div");
      const typeClass =
        info.type === "closed" ? "calendar-badge-closed" : "calendar-badge-holiday";
      badge.className = "calendar-badge " + typeClass;
      badge.textContent = info.label;
      cell.appendChild(badge);
    }

    grid.appendChild(cell);
  }
}

/* --------- Agente GPT interno --------- */

const chatHistory = [];

function setupChat() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const messagesEl = document.getElementById("chat-messages");
  const statusEl = document.getElementById("chat-status");

  if (!form || !input || !messagesEl) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    appendChatMessage("user", text, messagesEl);
    chatHistory.push({ role: "user", content: text });
    input.value = "";
    statusEl.textContent = "Consultando agente...";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.reply) {
        statusEl.textContent =
          data.error || "Erro ao consultar o agente. Tente novamente.";
        return;
      }

      statusEl.textContent = "";
      appendChatMessage("bot", data.reply, messagesEl);
      chatHistory.push({ role: "assistant", content: data.reply });

      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (error) {
      console.error("Erro no agente GPT:", error);
      statusEl.textContent = "Erro de conexão com o servidor.";
    }
  });
}

function appendChatMessage(sender, text, container) {
  const wrapper = document.createElement("div");
  wrapper.className =
    "chat-message " +
    (sender === "user" ? "chat-message-user" : "chat-message-bot");

  const p = document.createElement("p");
  p.textContent = text;
  wrapper.appendChild(p);

  container.appendChild(wrapper);
}

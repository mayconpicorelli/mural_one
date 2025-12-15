document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("login-error");
  const loginCard = document.querySelector(".login-card");
  const content = document.getElementById("content");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.classList.add("hidden");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          errorMessage.textContent = "Usuário ou senha inválidos.";
          errorMessage.classList.remove("hidden");
          return;
        }
        throw new Error("Erro ao comunicar com o servidor");
      }

      // Se o servidor devolver JSON, usamos; se não, consideramos sucesso
      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (data && data.success === false) {
        errorMessage.textContent =
          data.message || "Usuário ou senha inválidos.";
        errorMessage.classList.remove("hidden");
        return;
      }

      // Sucesso: esconde o card de login e mostra o conteúdo
      loginCard.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      errorMessage.textContent =
        "Falha ao tentar fazer login. Tente novamente em instantes.";
      errorMessage.classList.remove("hidden");
    }
  });
});





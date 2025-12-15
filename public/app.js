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

      if (response.status === 401) {
        errorMessage.textContent = "Usuário ou senha inválidos.";
        errorMessage.classList.remove("hidden");
        return;
      }

      if (!response.ok) {
        errorMessage.textContent = "Falha ao tentar fazer login.";
        errorMessage.classList.remove("hidden");
        return;
      }

      // Se a resposta for JSON, ok; se não, apenas ignoramos o corpo
      try {
        const data = await response.json();
        if (data && data.success === false) {
          errorMessage.textContent =
            data.message || "Usuário ou senha inválidos.";
          errorMessage.classList.remove("hidden");
          return;
        }
      } catch (_) {
        // resposta não é JSON (por exemplo, "Login OK") -> tratamos como sucesso
      }

      // Sucesso: esconde login e mostra conteúdo
      loginCard.classList.add("hidden");
      content.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      errorMessage.textContent =
        "Falha ao tentar fazer login. Tente novamente.";
      errorMessage.classList.remove("hidden");
    }
  });
});





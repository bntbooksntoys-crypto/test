const form = document.getElementById("login-form");
const errorMsg = document.getElementById("error-msg");
const loginBtn = document.getElementById("login-btn");

// If already logged in, skip straight to the dashboard
if (localStorage.getItem("admin_token")) {
  window.location.href = "dashboard.html";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.style.display = "none";
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed.");
    }

    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("admin_user", JSON.stringify(data.user));
    window.location.href = "dashboard.html";
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = "block";
    loginBtn.disabled = false;
    loginBtn.textContent = "Log In";
  }
});

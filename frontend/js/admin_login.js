// Pre-warm backend and database connection in background on page load
try {
    fetch(`${API_BASE_URL}/`).catch(() => {});
} catch (_) {}

async function loginAdmin() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("login-btn") || document.querySelector(".login-page button");
    const errorMsg = document.getElementById("error-message");

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (!username || !password) {
        if (errorMsg) {
            errorMsg.innerText = "Please enter both username and password.";
            errorMsg.style.display = "block";
        } else {
            alert("Please enter both username and password.");
        }
        return;
    }

    if (errorMsg) {
        errorMsg.style.display = "none";
        errorMsg.innerText = "";
    }

    const originalBtnText = loginBtn ? loginBtn.innerHTML : "Login";
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin-login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        let data;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(text || "Unexpected server response");
        }

        if (data.success) {
            window.location.href = "admin.html";
        } else {
            const message = data.message || "Invalid Username or Password";
            if (errorMsg) {
                errorMsg.innerText = message;
                errorMsg.style.display = "block";
            } else {
                alert(message);
            }
        }
    } catch (err) {
        const errorText = "Unable to connect to server. Please ensure the backend is running.";
        if (errorMsg) {
            errorMsg.innerText = errorText;
            errorMsg.style.display = "block";
        } else {
            alert(errorText);
        }
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnText;
        }
    }
}

// Allow pressing Enter key to login
document.addEventListener("DOMContentLoaded", () => {
    const inputs = [document.getElementById("username"), document.getElementById("password")];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    loginAdmin();
                }
            });
        }
    });
});

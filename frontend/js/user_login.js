// Pre-warm backend and database connection in background on page load
try {
    fetch(`${API_BASE_URL}/`).catch(() => {});
} catch (_) {}

async function loginUser() {
    const memIdInput = document.getElementById("mem_id");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("login-btn") || document.querySelector(".login-page button");
    const errorMsg = document.getElementById("error-message");

    const mem_id = memIdInput ? memIdInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (!mem_id || !password) {
        if (errorMsg) {
            errorMsg.innerText = "Please enter both Member ID and password.";
            errorMsg.style.display = "block";
        } else {
            alert("Please enter both Member ID and password.");
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
        const response = await fetch(`${API_BASE_URL}/user-login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mem_id: parseInt(mem_id),
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
            localStorage.setItem("member_id", data.member_id);
            localStorage.setItem("member_name", data.name);
            window.location.href = "user.html";
        } else {
            const message = data.message || "Invalid Member ID or Password";
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
    const inputs = [document.getElementById("mem_id"), document.getElementById("password")];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    loginUser();
                }
            });
        }
    });
});

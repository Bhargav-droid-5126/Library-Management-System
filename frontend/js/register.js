// Pre-warm backend and database connection in background on page load
try {
    fetch(`${API_BASE_URL}/`).catch(() => {});
} catch (_) {}

async function register() {
    const nameInput = document.getElementById("name");
    const passwordInput = document.getElementById("password");
    const registerBtn = document.getElementById("register-btn") || document.querySelector(".login-page button");
    const errorMsg = document.getElementById("error-message");

    const name = nameInput ? nameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (!name || !password) {
        if (errorMsg) {
            errorMsg.innerText = "Please fill all fields.";
            errorMsg.style.display = "block";
        } else {
            alert("Please fill all fields.");
        }
        return;
    }

    if (errorMsg) {
        errorMsg.style.display = "none";
        errorMsg.innerText = "";
    }

    const originalBtnText = registerBtn ? registerBtn.innerHTML : "Register";
    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mem_name: name,
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
            alert(
                (data.message || "Registration Successful") +
                "\n\nYour Member ID is : " +
                data.member_id
            );
            window.location.href = "user_login.html";
        } else {
            const message = data.message || "Registration failed";
            if (errorMsg) {
                errorMsg.innerText = message;
                errorMsg.style.display = "block";
            } else {
                alert(message);
            }
        }
    } catch (err) {
        const errorText = "Unable to connect to server. Please try again in a moment.";
        if (errorMsg) {
            errorMsg.innerText = errorText;
            errorMsg.style.display = "block";
        } else {
            alert(errorText);
        }
    } finally {
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.innerHTML = originalBtnText;
        }
    }
}

// Allow pressing Enter key to register
document.addEventListener("DOMContentLoaded", () => {
    const inputs = [document.getElementById("name"), document.getElementById("password")];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    register();
                }
            });
        }
    });
});

async function loginAdmin() {

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let response = await fetch("http://127.0.0.1:8000/admin-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

    let data = await response.json();

    if (data.success) {
        alert(data.message);
        window.location.href = "admin.html";
    } else {
        alert(data.message);
    }
}
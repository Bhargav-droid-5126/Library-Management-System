async function loginUser() {

    let mem_id = document.getElementById("mem_id").value;
    let password = document.getElementById("password").value;

    let response = await fetch("http://127.0.0.1:8000/user-login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            mem_id: parseInt(mem_id),
            password: password
        })

    });

    let data = await response.json();

    if (data.success) {

        localStorage.setItem("member_id", data.member_id);
        localStorage.setItem("member_name", data.name);

        alert(data.message);

        window.location.href = "user.html";

    } else {

        alert(data.message);

    }

}
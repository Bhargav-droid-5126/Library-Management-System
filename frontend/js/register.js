async function register() {

    let name = document.getElementById("name").value;
    let password = document.getElementById("password").value;

    if (name === "" || password === "") {
        alert("Please fill all fields");
        return;
    }

    let response = await fetch("http://127.0.0.1:8000/register", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            mem_name: name,
            password: password
        })

    });

    let data = await response.json();

    alert(
        data.message +
        "\n\nYour Member ID is : " +
        data.member_id
    );

    window.location.href = "user_login.html";

}
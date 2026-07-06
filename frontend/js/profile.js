async function loadProfile() {
    let memberId = localStorage.getItem("member_id");
    let loadingDiv = document.getElementById("loading");
    let contentDiv = document.getElementById("profileContent");

    loadingDiv.style.display = "block";
    contentDiv.style.display = "none";

    // Remove any existing error messages
    let existingMsg = document.querySelector(".error-message");
    if (existingMsg) {
        existingMsg.remove();
    }

    try {
        let response = await fetch(`${API_BASE_URL}/profile/` + memberId);
        if (!response.ok) {
            throw new Error("Failed to load profile");
        }
        let data = await response.json();
        
        loadingDiv.style.display = "none";
        contentDiv.style.display = "block";

        document.getElementById("memberId").value = data.member_id;
        document.getElementById("memberName").value = data.name;
        document.getElementById("bookCount").value = data.books;
    } catch (error) {
        console.error("Error loading profile:", error);
        loadingDiv.style.display = "none";
        
        let card = document.querySelector(".profile-card");
        let errorMsg = document.createElement("div");
        errorMsg.className = "error-message";
        errorMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Failed to load profile. Please check if the backend is running.`;
        card.appendChild(errorMsg);
    }
}

async function updateProfile() {
    let memberId = document.getElementById("memberId").value;
    let memberName = document.getElementById("memberName").value;
    let loadingDiv = document.getElementById("loading");
    let contentDiv = document.getElementById("profileContent");

    loadingDiv.style.display = "block";
    contentDiv.style.display = "none";

    try {
        let response = await fetch(`${API_BASE_URL}/update-profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mem_id: Number(memberId),
                mem_name: memberName
            })
        });
        if (!response.ok) {
            throw new Error("Failed to update profile");
        }
        let data = await response.json();
        alert(data.message);
        localStorage.setItem("member_name", memberName);
        loadProfile();
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
        loadingDiv.style.display = "none";
        contentDiv.style.display = "block";
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

loadProfile();
async function loadMembers() {
    let loadingDiv = document.getElementById("loading");
    let contentDiv = document.getElementById("membersContent");
    let table = document.getElementById("memberTable");
    let tableElement = document.getElementById("membersTable");

    loadingDiv.style.display = "block";
    if (tableElement) tableElement.style.display = "none";
    table.innerHTML = "";

    // Clear any existing message
    let existingMsg = contentDiv.querySelector(".empty-card, .error-message");
    if (existingMsg) existingMsg.remove();

    try {
        let response = await fetch(`${API_BASE_URL}/members`);
        if (!response.ok) {
            throw new Error("Failed to fetch members");
        }
        let members = await response.json();
        loadingDiv.style.display = "none";

        if (!members || members.length === 0) {
            if (tableElement) tableElement.style.display = "none";
            contentDiv.innerHTML += `
                <div class="empty-card">
                    <i class="fa-solid fa-users-slash"></i>
                    <h2>No members found</h2>
                    <p>There are currently no registered library members.</p>
                </div>
            `;
            return;
        }

        if (tableElement) tableElement.style.display = "table";
        members.forEach(function (member) {
            table.innerHTML += `
                <tr>
                    <td>${member[0]}</td>
                    <td>${member[1]}</td>
                    <td>${member[2]}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error loading members:", error);
        loadingDiv.style.display = "none";
        if (tableElement) tableElement.style.display = "none";
        contentDiv.innerHTML += `
            <div class="error-message">
                <i class="fa-solid fa-triangle-exclamation"></i> Failed to load members. Please verify if backend is running.
            </div>
        `;
    }
}

loadMembers();
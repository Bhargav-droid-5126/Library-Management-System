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

        // Ensure numerical ascending order by Member ID
        members.sort((a, b) => Number(a[0]) - Number(b[0]));

        if (tableElement) tableElement.style.display = "table";
        members.forEach(function (member) {
            const isAdmin = member[2] === "admin";
            const actionHtml = isAdmin
                ? `<span style="color:var(--text-muted);font-size:13px;"><i class="fa-solid fa-shield"></i> Protected</span>`
                : `<button class="delete-btn" style="width:auto;padding:6px 14px;font-size:13px;margin:0;" onclick="deleteMember(${member[0]}, '${(member[1] || "").replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash"></i> Delete</button>`;

            table.innerHTML += `
                <tr>
                    <td><strong>${member[0]}</strong></td>
                    <td>${member[1]}</td>
                    <td>${member[2]}</td>
                    <td>${actionHtml}</td>
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

async function deleteMember(memId, name) {
    if (!confirm(`Are you sure you want to delete member ID ${memId} (${name})?`)) {
        return;
    }

    try {
        let response = await fetch(`${API_BASE_URL}/delete-member`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ mem_id: memId })
        });
        let data = await response.json();
        if (data.success) {
            alert(data.message);
            loadMembers();
        } else {
            alert(data.message || "Failed to delete member");
        }
    } catch (err) {
        alert("Unable to delete member. Please verify server connection.");
    }
}

loadMembers();

// ================================
// LOAD ALL PLAYERS
// ================================

async function loadPlayers() {

    try {

        const response = await fetch("/api/players");

        const players = await response.json();

        console.log(players);

        const table = document.getElementById("playersTable");

        table.innerHTML = "";

        if (!players || players.length === 0) {

            table.innerHTML = `

                <tr>

                    <td colspan="8" class="no-data">

                        No players registered.

                    </td>

                </tr>

            `;

            return;

        }

        players.forEach((player, index) => {

            table.innerHTML += `

                <tr>

                    <td>${index + 1}</td>

                    <td>${player.first_name}</td>

                    <td>${player.last_name}</td>

                    <td>${player.nickname || "-"}</td>

                    <td>${player.position}</td>

                    <td>${player.date_of_birth}</td>

                    <td>

                        <span class="status ${player.status === "Active"
                            ? "active-status"
                            : "inactive-status"}">

                            ${player.status}

                        </span>

                    </td>

                    <td>

                        <button
                            class="action-btn edit"
                            onclick="editPlayer(${player.id})">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="action-btn delete"
                            onclick="deletePlayer(${player.id})">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </td>

                </tr>

            `;

        });

    }

    catch (error) {

        console.error("Error loading players:", error);

    }

}


// Load players immediately
loadPlayers();


// ================================
// SEARCH PLAYERS
// ================================

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("keyup", () => {

    const filter = searchInput.value.toLowerCase();

    const rows = document.querySelectorAll("#playersTable tr");

    rows.forEach(row => {

        row.style.display = row.innerText
            .toLowerCase()
            .includes(filter)

            ? ""

            : "none";

    });

});


// ================================
// EDIT PLAYER
// ================================

function editPlayer(id) {

    window.location.href = `edit-player.html?id=${id}`;

}


// ================================
// DELETE PLAYER
// ================================

async function deletePlayer(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this player?"
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(`/api/players/${id}`, {

            method: "DELETE"

        });

        const result = await response.json();

        alert(result.message);

        loadPlayers();

    }

    catch (error) {

        console.error(error);

        alert("Unable to delete player.");

    }

}
// ==========================================
// MAFORI FC - REMOVE PLAYER
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const playerTable =
        document.getElementById("playerTable");

    const searchPlayer =
        document.getElementById("searchPlayer");

    let players = [];


    // ==========================================
    // LOAD PLAYERS
    // ==========================================

    async function loadPlayers() {

        try {

            const response =
                await fetch("/api/players");

            if (!response.ok) {

                throw new Error(
                    "Failed to load players."
                );

            }

            players =
                await response.json();

            displayPlayers(players);

        }

        catch (error) {

            console.error(error);

            playerTable.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-message">
                        Unable to load players.
                    </td>
                </tr>
            `;

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Unable to load players."
            });

        }

    }


    // ==========================================
    // DISPLAY PLAYERS
    // ==========================================

    function displayPlayers(playerList) {

        playerTable.innerHTML = "";


        if (playerList.length === 0) {

            playerTable.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-message">
                        No players found.
                    </td>
                </tr>
            `;

            return;

        }


        playerList.forEach((player, index) => {

            const row =
                document.createElement("tr");


            const statusClass =
                player.status === "Active"
                    ? "status-active"
                    : "status-inactive";


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${player.id}
                </td>

                <td>
                    ${player.first_name || ""}
                    ${player.last_name || ""}
                </td>

                <td>
                    ${player.nickname || "-"}
                </td>

                <td>
                    ${player.position || "-"}
                </td>

                <td>
                    ${player.date_of_birth || "-"}
                </td>

                <td class="${statusClass}">
                    ${player.status || "-"}
                </td>

                <td>

                    <button
                        class="remove-button"
                        onclick="removePlayer(${player.id})"
                    >

                        <i class="fa-solid fa-trash"></i>

                        Remove

                    </button>

                </td>

            `;

            playerTable.appendChild(row);

        });

    }


    // ==========================================
    // SEARCH
    // ==========================================

    searchPlayer.addEventListener(
        "input",
        () => {

            const search =
                searchPlayer.value
                    .toLowerCase()
                    .trim();


            const filteredPlayers =
                players.filter(player => {

                    const fullName =
                        `${player.first_name || ""} ${player.last_name || ""}`
                            .toLowerCase();

                    const position =
                        (player.position || "")
                            .toLowerCase();

                    const nickname =
                        (player.nickname || "")
                            .toLowerCase();

                    const id =
                        String(player.id)
                            .toLowerCase();

                    return (
                        fullName.includes(search) ||
                        position.includes(search) ||
                        nickname.includes(search) ||
                        id.includes(search)
                    );

                });


            displayPlayers(filteredPlayers);

        }
    );


    // ==========================================
    // REMOVE PLAYER
    // ==========================================

    window.removePlayer = async function(playerId) {

        const player =
            players.find(
                p => Number(p.id) === Number(playerId)
            );


        if (!player) {

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Player could not be found."
            });

            return;

        }


        const playerName =
            `${player.first_name || ""} ${player.last_name || ""}`.trim();


        // ======================================
        // CONFIRMATION
        // ======================================

        const confirmation =
            await Swal.fire({

                icon: "warning",

                title: "Remove Player?",

                html: `
                    Are you sure you want to remove
                    <strong>${playerName}</strong>?
                    <br><br>
                    This action cannot be undone.
                `,

                showCancelButton: true,

                confirmButtonText:
                    "Yes, Remove Player",

                cancelButtonText:
                    "Cancel",

                confirmButtonColor:
                    "#dc3545",

                cancelButtonColor:
                    "#081b33"

            });


        if (!confirmation.isConfirmed) {

            return;

        }


        // ======================================
        // DELETE PLAYER
        // ======================================

        try {

            Swal.fire({

                title: "Removing Player...",

                text: "Please wait.",

                allowOutsideClick: false,

                didOpen: () => {

                    Swal.showLoading();

                }

            });


            const response =
                await fetch(
                    `/api/players/${playerId}`,
                    {
                        method: "DELETE"
                    }
                );


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Failed to remove player."
                );

            }


            // Remove from local array

            players =
                players.filter(
                    p =>
                        Number(p.id) !==
                        Number(playerId)
                );


            displayPlayers(players);


            // ==================================
            // SUCCESS
            // ==================================

            Swal.fire({

                icon: "success",

                title: "Player Removed",

                text:
                    `${playerName} has been removed successfully.`,

                confirmButtonColor:
                    "#081b33"

            });

        }

        catch (error) {

            console.error(
                "Remove player error:",
                error
            );


            Swal.fire({

                icon: "error",

                title: "Unable to Remove Player",

                text:
                    error.message ||
                    "Something went wrong."

            });

        }

    };


    // ==========================================
    // LOGOUT
    // ==========================================

    window.logout = function() {

        Swal.fire({

            title: "Logout?",

            text: "Are you sure you want to logout?",

            icon: "question",

            showCancelButton: true,

            confirmButtonText: "Logout",

            cancelButtonText: "Cancel",

            confirmButtonColor: "#dc3545",

            cancelButtonColor: "#081b33"

        }).then(result => {

            if (result.isConfirmed) {

                window.location.href =
                    "login.html";

            }

        });

    };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    loadPlayers();

});
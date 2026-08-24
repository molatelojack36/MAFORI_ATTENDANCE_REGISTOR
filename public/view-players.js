// ==========================================
// MAFORI FC
// VIEW PLAYERS
// ==========================================


// Store players here so that we can use
// player information inside the delete popup.

let allPlayers = [];



// ==========================================
// LOAD ALL PLAYERS
// ==========================================

async function loadPlayers() {

    const table =
        document.getElementById(
            "playersTable"
        );


    /* ======================================
       SHOW LOADING
    ====================================== */

    table.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="no-data"
            >

                <i class="fa-solid fa-spinner fa-spin"></i>

                Loading players...

            </td>

        </tr>

    `;


    try {

        const response =
            await fetch(
                "/api/players"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load players."
            );

        }


        const players =
            await response.json();


        console.log(
            "Players:",
            players
        );


        allPlayers =
            Array.isArray(players)
                ? players
                : [];


        displayPlayers(
            allPlayers
        );

    }

    catch (error) {

        console.error(
            "Error loading players:",
            error
        );


        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="no-data"
                >

                    Unable to load players.

                </td>

            </tr>

        `;


        await Swal.fire({

            icon:
                "error",

            title:
                "Unable to Load Players",

            html: `

                <div style="
                    font-family: Poppins, sans-serif;
                    color: #64748b;
                    line-height: 1.7;
                ">

                    We could not load the Mafori FC
                    player list.

                    <br><br>

                    Please check your connection
                    and try again.

                </div>

            `,

            confirmButtonText:
                '<i class="fa-solid fa-rotate-right"></i> Try Again',

            confirmButtonColor:
                "#ff9800",

            background:
                "#ffffff",

            customClass: {

                popup:
                    "mafori-popup",

                confirmButton:
                    "mafori-confirm-button"

            }

        }).then(result => {

            if (result.isConfirmed) {

                loadPlayers();

            }

        });

    }

}



// ==========================================
// DISPLAY PLAYERS
// ==========================================

function displayPlayers(
    players
) {

    const table =
        document.getElementById(
            "playersTable"
        );


    table.innerHTML =
        "";


    /* ======================================
       NO PLAYERS
    ====================================== */

    if (
        !players ||
        players.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="no-data"
                >

                    <i class="fa-solid fa-users-slash"></i>

                    No players registered.

                </td>

            </tr>

        `;


        return;

    }



    /* ======================================
       DISPLAY EACH PLAYER
    ====================================== */

    players.forEach(
        (
            player,
            index
        ) => {


            const firstName =
                escapeHtml(
                    player.first_name ||
                    ""
                );


            const lastName =
                escapeHtml(
                    player.last_name ||
                    ""
                );


            const nickname =
                escapeHtml(
                    player.nickname ||
                    "-"
                );


            const position =
                escapeHtml(
                    player.position ||
                    "-"
                );


            const dateOfBirth =
                escapeHtml(
                    player.date_of_birth ||
                    "-"
                );


            const status =
                escapeHtml(
                    player.status ||
                    "Inactive"
                );


            const statusClass =
                player.status ===
                "Active"

                    ? "active-status"

                    : "inactive-status";


            table.innerHTML += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


                    <td>
                        ${firstName}
                    </td>


                    <td>
                        ${lastName}
                    </td>


                    <td>
                        ${nickname}
                    </td>


                    <td>
                        ${position}
                    </td>


                    <td>
                        ${dateOfBirth}
                    </td>


                    <td>

                        <span
                            class="
                                status
                                ${statusClass}
                            "
                        >

                            ${status}

                        </span>

                    </td>


                    <td>


                        <!-- EDIT -->

                        <button
                            type="button"
                            class="action-btn edit"
                            onclick="editPlayer(${Number(player.id)})"
                            title="Edit Player"
                        >

                            <i class="fa-solid fa-pen"></i>

                        </button>


                        <!-- DELETE -->

                        <button
                            type="button"
                            class="action-btn delete"
                            onclick="deletePlayer(${Number(player.id)})"
                            title="Delete Player"
                        >

                            <i class="fa-solid fa-trash"></i>

                        </button>


                    </td>

                </tr>

            `;

        }
    );

}



// ==========================================
// LOAD PLAYERS IMMEDIATELY
// ==========================================

loadPlayers();



// ==========================================
// SEARCH PLAYERS
// ==========================================

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "keyup",
        () => {


            const filter =
                searchInput
                    .value
                    .toLowerCase()
                    .trim();


            const rows =
                document.querySelectorAll(
                    "#playersTable tr"
                );


            rows.forEach(
                row => {


                    row.style.display =
                        row
                            .innerText
                            .toLowerCase()
                            .includes(
                                filter
                            )

                            ? ""

                            : "none";

                }
            );

        }
    );

}



// ==========================================
// EDIT PLAYER
// ==========================================

function editPlayer(
    id
) {

    window.location.href =
        `edit-player.html?id=${id}`;

}



// ==========================================
// DELETE PLAYER
// ==========================================

async function deletePlayer(
    id
) {


    /* ======================================
       FIND PLAYER
    ====================================== */

    const player =
        allPlayers.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    const playerName =
        player

            ? `${player.first_name || ""} ${player.last_name || ""}`.trim()

            : "this player";


    const safePlayerName =
        escapeHtml(
            playerName
        );



    /* ======================================
       DELETE CONFIRMATION POPUP
    ====================================== */

    const confirmation =
        await Swal.fire({

            icon:
                "warning",

            title:
                "Remove Player?",

            html: `

                <div class="delete-player-popup">


                    <div class="delete-player-icon">

                        <i class="fa-solid fa-user-minus"></i>

                    </div>


                    <p>

                        Are you sure you want to remove

                    </p>


                    <strong>

                        ${safePlayerName}

                    </strong>


                    <span>

                        This player will be permanently
                        removed from the Mafori FC database.

                    </span>


                    <div class="delete-warning">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        This action cannot be undone.

                    </div>


                </div>

            `,

            showCancelButton:
                true,

            confirmButtonText:
                '<i class="fa-solid fa-trash"></i> Yes, Remove Player',

            cancelButtonText:
                '<i class="fa-solid fa-xmark"></i> Cancel',

            confirmButtonColor:
                "#dc3545",

            cancelButtonColor:
                "#071a35",

            reverseButtons:
                true,

            focusCancel:
                true,

            allowOutsideClick:
                false,

            customClass: {

                popup:
                    "mafori-popup",

                confirmButton:
                    "delete-confirm-button",

                cancelButton:
                    "delete-cancel-button"

            }

        });



    /* ======================================
       CANCELLED
    ====================================== */

    if (
        !confirmation.isConfirmed
    ) {

        return;

    }



    /* ======================================
       SHOW DELETING POPUP
    ====================================== */

    Swal.fire({

        title:
            "Removing Player...",

        html: `

            <div class="deleting-player-popup">

                <div class="deleting-icon">

                    <i class="fa-solid fa-futbol"></i>

                </div>

                <p>

                    Please wait while

                    <strong>
                        ${safePlayerName}
                    </strong>

                    is removed.

                </p>

            </div>

        `,

        showConfirmButton:
            false,

        allowOutsideClick:
            false,

        allowEscapeKey:
            false,

        customClass: {

            popup:
                "mafori-popup"

        }

    });



    /* ======================================
       DELETE FROM SERVER
    ====================================== */

    try {

        const response =
            await fetch(

                `/api/players/${id}`,

                {

                    method:
                        "DELETE"

                }

            );


        let result;


        try {

            result =
                await response.json();

        }

        catch (_) {

            result = {

                success:
                    false,

                message:
                    "The server returned an invalid response."

            };

        }



        /* ======================================
           DELETE FAILED
        ====================================== */

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(

                result.message ||
                "Unable to remove player."

            );

        }



        /* ======================================
           UPDATE LOCAL PLAYER ARRAY
        ====================================== */

        allPlayers =
            allPlayers.filter(
                item =>
                    Number(item.id) !==
                    Number(id)
            );



        /* ======================================
           SUCCESS POPUP
        ====================================== */

        await Swal.fire({

            icon:
                "success",

            title:
                "Player Removed!",

            html: `

                <div class="delete-success-popup">


                    <div class="delete-success-name">

                        <i class="fa-solid fa-user-check"></i>

                        ${safePlayerName}

                    </div>


                    <p>

                        The player has been removed
                        successfully from Mafori FC.

                    </p>


                    <span>

                        <i class="fa-solid fa-circle-check"></i>

                        Player Deleted

                    </span>


                </div>

            `,

            confirmButtonText:
                "Done",

            confirmButtonColor:
                "#ff9800",

            timer:
                2500,

            timerProgressBar:
                true,

            customClass: {

                popup:
                    "mafori-popup"

            }

        });



        /* ======================================
           RELOAD PLAYER LIST
        ====================================== */

        loadPlayers();

    }

    catch (error) {

        console.error(
            "Delete Player Error:",
            error
        );


        await Swal.fire({

            icon:
                "error",

            title:
                "Unable to Remove Player",

            html: `

                <div class="error-player-popup">

                    <p>

                        ${escapeHtml(
                            error.message ||
                            "Something went wrong while removing the player."
                        )}

                    </p>

                    <span>

                        Please try again.

                    </span>

                </div>

            `,

            confirmButtonText:
                '<i class="fa-solid fa-rotate-right"></i> Try Again',

            confirmButtonColor:
                "#ff9800",

            customClass: {

                popup:
                    "mafori-popup"

            }

        });

    }

}



// ==========================================
// LOGOUT
// ==========================================

async function logout() {


    /* ======================================
       CONFIRM LOGOUT
    ====================================== */

    const result =
        await Swal.fire({

            icon:
                "question",

            title:
                "Logout from Mafori FC?",

            html: `

                <div class="logout-popup">


                    <div class="logout-popup-icon">

                        <i class="fa-solid fa-futbol"></i>

                    </div>


                    <p>

                        Are you sure you want to logout?

                    </p>


                    <span>

                        You will need to login again
                        to access the Mafori FC
                        Attendance Register.

                    </span>


                </div>

            `,

            showCancelButton:
                true,

            confirmButtonText:
                '<i class="fa-solid fa-right-from-bracket"></i> Yes, Logout',

            cancelButtonText:
                '<i class="fa-solid fa-xmark"></i> Stay Logged In',

            confirmButtonColor:
                "#ff9800",

            cancelButtonColor:
                "#071a35",

            reverseButtons:
                true,

            focusCancel:
                true,

            allowOutsideClick:
                false,

            customClass: {

                popup:
                    "mafori-popup",

                confirmButton:
                    "logout-confirm-button",

                cancelButton:
                    "logout-cancel-button"

            }

        });



    /* ======================================
       CANCEL LOGOUT
    ====================================== */

    if (
        !result.isConfirmed
    ) {

        return;

    }



    /* ======================================
       LOGGING OUT POPUP
    ====================================== */

    Swal.fire({

        title:
            "Logging Out...",

        html: `

            <div class="logout-loading-popup">

                <div class="logout-loading-ball">

                    <i class="fa-solid fa-futbol"></i>

                </div>

                <p>

                    Signing you out of
                    Mafori FC...

                </p>

            </div>

        `,

        showConfirmButton:
            false,

        allowOutsideClick:
            false,

        allowEscapeKey:
            false,

        customClass: {

            popup:
                "mafori-popup"

        }

    });



    /* ======================================
       REMOVE LOGIN SESSION
    ====================================== */

    localStorage.removeItem(
        "user"
    );


    sessionStorage.clear();



    /* ======================================
       REDIRECT TO LOGIN
    ====================================== */

    setTimeout(
        () => {

            window.location.href =
                "login.html";

        },
        1000
    );

}



// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
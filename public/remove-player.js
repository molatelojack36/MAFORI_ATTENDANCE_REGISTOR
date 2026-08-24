/* =====================================================
   MAFORI FC ATTENDANCE REGISTER
   REMOVE PLAYER PAGE
===================================================== */


document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* ==========================================
           ELEMENTS
        ========================================== */

        const playerTable =
            document.getElementById(
                "playerTable"
            );


        const searchPlayer =
            document.getElementById(
                "searchPlayer"
            );


        /*
           Local copy of players loaded
           from Supabase through server.js
        */

        let players = [];


        /* ==========================================
           LOAD PLAYERS FROM DATABASE
        ========================================== */

        async function loadPlayers() {

            if (!playerTable) {

                console.error(
                    "playerTable element not found."
                );

                return;

            }


            /*
               Loading message
            */

            playerTable.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="empty-message"
                    >

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Loading players...

                    </td>

                </tr>

            `;


            try {

                const response =
                    await fetch(
                        "/api/players",
                        {
                            method:
                                "GET",

                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                /*
                   Try reading server response.
                */

                const result =
                    await response.json();


                console.log(
                    "Players API response:",
                    result
                );


                /*
                   HTTP error
                */

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Failed to load players."
                    );

                }


                /*
                   Your current server normally
                   returns the players array directly:

                   [
                       {...},
                       {...}
                   ]

                   But this also supports:

                   {
                       success: true,
                       players: [...]
                   }
                */

                if (
                    Array.isArray(
                        result
                    )
                ) {

                    players =
                        result;

                }

                else if (
                    result &&
                    Array.isArray(
                        result.players
                    )
                ) {

                    players =
                        result.players;

                }

                else if (
                    result &&
                    Array.isArray(
                        result.data
                    )
                ) {

                    players =
                        result.data;

                }

                else {

                    players = [];

                }


                console.log(
                    "Loaded players:",
                    players
                );


                displayPlayers(
                    players
                );

            }

            catch (error) {

                console.error(
                    "Load players error:",
                    error
                );


                playerTable.innerHTML = `

                    <tr>

                        <td
                            colspan="8"
                            class="empty-message"
                        >

                            <i class="fa-solid fa-triangle-exclamation"></i>

                            Unable to load players.

                        </td>

                    </tr>

                `;


                await Swal.fire({

                    icon:
                        "error",

                    title:
                        "Unable to Load Players",

                    text:
                        error.message ||
                        "Could not load players from the database.",

                    confirmButtonText:
                        "Okay",

                    confirmButtonColor:
                        "#ff7a00"

                });

            }

        }


        /* ==========================================
           DISPLAY PLAYERS
        ========================================== */

        function displayPlayers(
            playerList
        ) {

            if (!playerTable) {

                return;

            }


            playerTable.innerHTML =
                "";


            /*
               No players
            */

            if (
                !Array.isArray(
                    playerList
                ) ||
                playerList.length === 0
            ) {

                playerTable.innerHTML = `

                    <tr>

                        <td
                            colspan="8"
                            class="empty-message"
                        >

                            <i class="fa-solid fa-users-slash"></i>

                            No players found.

                        </td>

                    </tr>

                `;


                return;

            }


            /*
               Create player rows
            */

            playerList.forEach(
                (
                    player,
                    index
                ) => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const status =
                        player.status ||
                        "Active";


                    const statusClass =
                        String(
                            status
                        ).toLowerCase() ===
                        "active"

                            ? "status-active"

                            : "status-inactive";


                    const firstName =
                        player.first_name ||
                        "";


                    const lastName =
                        player.last_name ||
                        "";


                    const fullName =
                        `${firstName} ${lastName}`
                            .trim() ||
                        "-";


                    const nickname =
                        player.nickname ||
                        "-";


                    const position =
                        player.position ||
                        "-";


                    const dateOfBirth =
                        player.date_of_birth ||
                        "-";


                    row.innerHTML = `

                        <td>
                            ${index + 1}
                        </td>


                        <td>
                            ${escapeRemoveHtml(
                                player.id
                            )}
                        </td>


                        <td>

                            <strong>

                                ${escapeRemoveHtml(
                                    fullName
                                )}

                            </strong>

                        </td>


                        <td>

                            ${escapeRemoveHtml(
                                nickname
                            )}

                        </td>


                        <td>

                            ${escapeRemoveHtml(
                                position
                            )}

                        </td>


                        <td>

                            ${escapeRemoveHtml(
                                dateOfBirth
                            )}

                        </td>


                        <td>

                            <span
                                class="${statusClass}"
                            >

                                ${escapeRemoveHtml(
                                    status
                                )}

                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="remove-button"
                                data-player-id="${escapeRemoveHtml(
                                    player.id
                                )}"
                            >

                                <i class="fa-solid fa-trash"></i>

                                Remove

                            </button>

                        </td>

                    `;


                    playerTable.appendChild(
                        row
                    );

                }
            );

        }


        /* ==========================================
           REMOVE BUTTON EVENT
        ========================================== */

        if (playerTable) {

            playerTable.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            ".remove-button"
                        );


                    if (!button) {

                        return;

                    }


                    const playerId =
                        button.dataset.playerId;


                    removePlayer(
                        playerId
                    );

                }
            );

        }


        /* ==========================================
           SEARCH PLAYERS
        ========================================== */

        if (searchPlayer) {

            searchPlayer.addEventListener(
                "input",
                () => {

                    const search =
                        searchPlayer
                            .value
                            .toLowerCase()
                            .trim();


                    /*
                       Empty search shows all
                       players again.
                    */

                    if (!search) {

                        displayPlayers(
                            players
                        );

                        return;

                    }


                    const filteredPlayers =
                        players.filter(
                            player => {

                                const fullName =
                                    `${player.first_name || ""} ${player.last_name || ""}`
                                        .toLowerCase();


                                const firstName =
                                    String(
                                        player.first_name ||
                                        ""
                                    )
                                        .toLowerCase();


                                const lastName =
                                    String(
                                        player.last_name ||
                                        ""
                                    )
                                        .toLowerCase();


                                const nickname =
                                    String(
                                        player.nickname ||
                                        ""
                                    )
                                        .toLowerCase();


                                const position =
                                    String(
                                        player.position ||
                                        ""
                                    )
                                        .toLowerCase();


                                const id =
                                    String(
                                        player.id ||
                                        ""
                                    )
                                        .toLowerCase();


                                const status =
                                    String(
                                        player.status ||
                                        ""
                                    )
                                        .toLowerCase();


                                return (

                                    fullName.includes(
                                        search
                                    ) ||

                                    firstName.includes(
                                        search
                                    ) ||

                                    lastName.includes(
                                        search
                                    ) ||

                                    nickname.includes(
                                        search
                                    ) ||

                                    position.includes(
                                        search
                                    ) ||

                                    id.includes(
                                        search
                                    ) ||

                                    status.includes(
                                        search
                                    )

                                );

                            }
                        );


                    displayPlayers(
                        filteredPlayers
                    );

                }
            );

        }


        /* ==========================================
           REMOVE PLAYER
        ========================================== */

        window.removePlayer =
            async function (
                playerId
            ) {

                const player =
                    players.find(
                        p =>
                            Number(
                                p.id
                            ) ===
                            Number(
                                playerId
                            )
                    );


                if (!player) {

                    await Swal.fire({

                        icon:
                            "error",

                        title:
                            "Player Not Found",

                        text:
                            "The selected player could not be found.",

                        confirmButtonText:
                            "Okay",

                        confirmButtonColor:
                            "#ff7a00"

                    });


                    return;

                }


                const playerName =
                    `${player.first_name || ""} ${player.last_name || ""}`
                        .trim();


                /* ======================================
                   CONFIRM REMOVE
                ====================================== */

                const confirmation =
                    await Swal.fire({

                        title:
                            "Remove Player?",

                        html: `

                            <div class="remove-player-popup">

                                <div class="remove-player-icon">

                                    <i class="fa-solid fa-user-minus"></i>

                                </div>

                                <p>
                                    You are about to remove
                                </p>

                                <strong>

                                    ${escapeRemoveHtml(
                                        playerName
                                    )}

                                </strong>

                                <span>
                                    This action cannot be undone.
                                </span>

                            </div>

                        `,

                        showCancelButton:
                            true,

                        confirmButtonText:
                            '<i class="fa-solid fa-trash"></i> Yes, Remove',

                        cancelButtonText:
                            '<i class="fa-solid fa-xmark"></i> Cancel',

                        confirmButtonColor:
                            "#dc3545",

                        cancelButtonColor:
                            "#64748b",

                        reverseButtons:
                            true,

                        focusCancel:
                            true,

                        showClass: {

                            popup:
                                "remove-popup-in"

                        },

                        hideClass: {

                            popup:
                                "remove-popup-out"

                        }

                    });


                if (
                    !confirmation.isConfirmed
                ) {

                    return;

                }


                /* ======================================
                   LOADING POPUP
                ====================================== */

                Swal.fire({

                    title:
                        "Removing Player...",

                    html: `

                        <div class="remove-loading">

                            <div class="remove-spinner">

                                <i class="fa-solid fa-user-minus"></i>

                            </div>

                            <p>

                                Removing
                                ${escapeRemoveHtml(
                                    playerName
                                )}...

                            </p>

                        </div>

                    `,

                    showConfirmButton:
                        false,

                    allowOutsideClick:
                        false,

                    allowEscapeKey:
                        false

                });


                try {

                    const response =
                        await fetch(
                            `/api/players/${encodeURIComponent(
                                playerId
                            )}`,
                            {
                                method:
                                    "DELETE"
                            }
                        );


                    const result =
                        await response.json();


                    console.log(
                        "Delete response:",
                        result
                    );


                    if (
                        !response.ok ||
                        (
                            result.success ===
                            false
                        )
                    ) {

                        throw new Error(
                            result.message ||
                            "Failed to remove player."
                        );

                    }


                    /*
                       Remove player from local list.
                    */

                    players =
                        players.filter(
                            p =>
                                Number(
                                    p.id
                                ) !==
                                Number(
                                    playerId
                                )
                        );


                    /*
                       Display current search results
                       correctly after deletion.
                    */

                    if (
                        searchPlayer &&
                        searchPlayer.value.trim()
                    ) {

                        searchPlayer.dispatchEvent(
                            new Event(
                                "input"
                            )
                        );

                    }

                    else {

                        displayPlayers(
                            players
                        );

                    }


                    /* ======================================
                       SUCCESS
                    ====================================== */

                    await Swal.fire({

                        icon:
                            "success",

                        title:
                            "Player Removed",

                        html: `

                            <div class="remove-success-popup">

                                <div class="remove-success-name">

                                    <i class="fa-solid fa-user-check"></i>

                                    ${escapeRemoveHtml(
                                        playerName
                                    )}

                                </div>

                                <p>
                                    The player has been removed successfully
                                    from the Mafori FC register.
                                </p>

                                <span>

                                    <i class="fa-solid fa-circle-check"></i>

                                    Player Removed

                                </span>

                            </div>

                        `,

                        confirmButtonText:
                            "Done",

                        confirmButtonColor:
                            "#ff7a00",

                        timer:
                            2200,

                        timerProgressBar:
                            true

                    });

                }

                catch (error) {

                    console.error(
                        "Remove player error:",
                        error
                    );


                    await Swal.fire({

                        icon:
                            "error",

                        title:
                            "Unable to Remove Player",

                        text:
                            error.message ||
                            "Something went wrong.",

                        confirmButtonText:
                            "Okay",

                        confirmButtonColor:
                            "#ff7a00"

                    });

                }

            };


        /* ==========================================
           LOGOUT
        ========================================== */

        window.logout =
            async function () {

                const result =
                    await Swal.fire({

                        title:
                            "Logout from Mafori FC?",

                        html: `

                            <div class="remove-logout-popup">

                                <div class="logout-ball">

                                    <i class="fa-solid fa-futbol"></i>

                                </div>

                                <p>
                                    Are you sure you want to logout
                                    from the Mafori FC Attendance Register?
                                </p>

                                <span>
                                    Your saved players and attendance records
                                    will not be affected.
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
                            "#ff7a00",

                        cancelButtonColor:
                            "#64748b",

                        reverseButtons:
                            true,

                        focusCancel:
                            true,

                        showClass: {

                            popup:
                                "remove-popup-in"

                        },

                        hideClass: {

                            popup:
                                "remove-popup-out"

                        }

                    });


                if (
                    !result.isConfirmed
                ) {

                    return;

                }


                Swal.fire({

                    title:
                        "Logging Out...",

                    html: `

                        <div class="remove-logout-loading">

                            <div class="logout-spinner-ball">

                                <i class="fa-solid fa-futbol"></i>

                            </div>

                            <p>
                                Signing you out of Mafori FC...
                            </p>

                        </div>

                    `,

                    showConfirmButton:
                        false,

                    allowOutsideClick:
                        false,

                    allowEscapeKey:
                        false

                });


                localStorage.removeItem(
                    "user"
                );


                sessionStorage.clear();


                setTimeout(
                    () => {

                        window.location.href =
                            "login.html";

                    },
                    1000
                );

            };


        /* ==========================================
           ESCAPE HTML
        ========================================== */

        function escapeRemoveHtml(
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


        /* ==========================================
           INITIAL LOAD
        ========================================== */

        loadPlayers();

    }
);
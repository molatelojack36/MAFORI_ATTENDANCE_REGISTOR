// ==========================================
// REMOVE PLAYER
// ==========================================

window.removePlayer = async function(playerId) {

    const player =
        players.find(
            p => Number(p.id) === Number(playerId)
        );


    if (!player) {

        await Swal.fire({

            icon: "error",

            title: "Player Not Found",

            text: "The selected player could not be found.",

            confirmButtonText: "Okay",

            confirmButtonColor: "#ff7a00"

        });

        return;

    }


    const playerName =
        `${player.first_name || ""} ${player.last_name || ""}`.trim();


    // ======================================
    // POLISHED CONFIRMATION
    // ======================================

    const confirmation =
        await Swal.fire({

            icon: "warning",

            title: "Remove Player?",

            html: `

                <div class="remove-player-popup">

                    <div class="remove-player-icon">

                        <i class="fa-solid fa-user-minus"></i>

                    </div>

                    <p>
                        You are about to remove
                    </p>

                    <strong>
                        ${escapeRemoveHtml(playerName)}
                    </strong>

                    <span>
                        This action cannot be undone.
                    </span>

                </div>

            `,

            showCancelButton: true,

            confirmButtonText:
                '<i class="fa-solid fa-trash"></i> Yes, Remove',

            cancelButtonText:
                '<i class="fa-solid fa-xmark"></i> Cancel',

            confirmButtonColor:
                "#dc3545",

            cancelButtonColor:
                "#64748b",

            reverseButtons: true,

            focusCancel: true,

            showClass: {
                popup: "remove-popup-in"
            },

            hideClass: {
                popup: "remove-popup-out"
            }

        });


    if (!confirmation.isConfirmed) {

        return;

    }


    // ======================================
    // REMOVING PLAYER
    // ======================================

    Swal.fire({

        title: "Removing Player...",

        html: `

            <div class="remove-loading">

                <div class="remove-spinner">

                    <i class="fa-solid fa-user-minus"></i>

                </div>

                <p>
                    Removing ${escapeRemoveHtml(playerName)}...
                </p>

            </div>

        `,

        showConfirmButton: false,

        allowOutsideClick: false,

        allowEscapeKey: false

    });


    try {

        const response =
            await fetch(
                `/api/players/${playerId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

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


        // ======================================
        // POLISHED SUCCESS
        // ======================================

        await Swal.fire({

            icon: "success",

            title: "Player Removed",

            html: `

                <div class="remove-success-popup">

                    <div class="remove-success-name">

                        <i class="fa-solid fa-user-check"></i>

                        ${escapeRemoveHtml(playerName)}

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

            confirmButtonText: "Done",

            confirmButtonColor: "#ff7a00",

            timer: 2200,

            timerProgressBar: true

        });

    }

    catch (error) {

        console.error(
            "Remove player error:",
            error
        );


        await Swal.fire({

            icon: "error",

            title: "Unable to Remove Player",

            text:
                error.message ||
                "Something went wrong.",

            confirmButtonText: "Okay",

            confirmButtonColor: "#ff7a00"

        });

    }

};


// ==========================================
// POLISHED LOGOUT
// ==========================================

window.logout = async function() {

    const result =
        await Swal.fire({

            icon: "question",

            title: "Logout from Mafori FC?",

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

            showCancelButton: true,

            confirmButtonText:
                '<i class="fa-solid fa-right-from-bracket"></i> Yes, Logout',

            cancelButtonText:
                '<i class="fa-solid fa-xmark"></i> Stay Logged In',

            confirmButtonColor:
                "#ff7a00",

            cancelButtonColor:
                "#64748b",

            reverseButtons: true,

            focusCancel: true,

            showClass: {
                popup: "remove-popup-in"
            },

            hideClass: {
                popup: "remove-popup-out"
            }

        });


    if (!result.isConfirmed) {

        return;

    }


    Swal.fire({

        title: "Logging Out...",

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

        showConfirmButton: false,

        allowOutsideClick: false,

        allowEscapeKey: false,

        timer: 1000

    });


    localStorage.removeItem("user");

    sessionStorage.clear();


    setTimeout(
        () => {

            window.location.href =
                "login.html";

        },
        1000
    );

};


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeRemoveHtml(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}
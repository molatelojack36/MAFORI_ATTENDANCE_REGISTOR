// ==========================================
// MAFORI FC
// EDIT PLAYER
// ==========================================


/* ==========================================
   GET PLAYER ID
========================================== */

const params =
    new URLSearchParams(
        window.location.search
    );


const id =
    params.get(
        "id"
    );


const editPlayerForm =
    document.getElementById(
        "editPlayerForm"
    );


const updateButton =
    editPlayerForm
        ? editPlayerForm.querySelector(
            "button[type='submit']"
        )
        : null;


/* ==========================================
   LOAD PLAYER
========================================== */

async function loadPlayer() {

    if (!id) {

        await Swal.fire({

            icon:
                "error",

            title:
                "Player Not Found",

            text:
                "No player ID was provided.",

            confirmButtonText:
                "Back to Players",

            confirmButtonColor:
                "#ff7a00"

        });


        window.location.href =
            "players.html";


        return;

    }


    try {

        const response =
            await fetch(
                `/api/players/${encodeURIComponent(
                    id
                )}`
            );


        const player =
            await response.json();


        if (!response.ok) {

            throw new Error(
                player.message ||
                "Unable to load player."
            );

        }


        document
            .getElementById(
                "first_name"
            )
            .value =
                player.first_name || "";


        document
            .getElementById(
                "last_name"
            )
            .value =
                player.last_name || "";


        document
            .getElementById(
                "nickname"
            )
            .value =
                player.nickname || "";


        document
            .getElementById(
                "position"
            )
            .value =
                player.position || "";


        document
            .getElementById(
                "date_of_birth"
            )
            .value =
                player.date_of_birth || "";


        document
            .getElementById(
                "status"
            )
            .value =
                player.status || "Active";

    }

    catch (error) {

        console.error(
            "Load Player Error:",
            error
        );


        await Swal.fire({

            icon:
                "error",

            title:
                "Unable to Load Player",

            text:
                error.message,

            confirmButtonText:
                "Back to Players",

            confirmButtonColor:
                "#ff7a00"

        });


        window.location.href =
            "players.html";

    }

}


/* ==========================================
   UPDATE PLAYER
========================================== */

if (editPlayerForm) {

    editPlayerForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const updatedPlayer = {

                first_name:
                    document
                        .getElementById(
                            "first_name"
                        )
                        .value
                        .trim(),

                last_name:
                    document
                        .getElementById(
                            "last_name"
                        )
                        .value
                        .trim(),

                nickname:
                    document
                        .getElementById(
                            "nickname"
                        )
                        .value
                        .trim(),

                position:
                    document
                        .getElementById(
                            "position"
                        )
                        .value,

                date_of_birth:
                    document
                        .getElementById(
                            "date_of_birth"
                        )
                        .value,

                status:
                    document
                        .getElementById(
                            "status"
                        )
                        .value

            };


            /* ======================================
               VALIDATION
            ====================================== */

            if (
                !updatedPlayer.first_name ||
                !updatedPlayer.last_name ||
                !updatedPlayer.position
            ) {

                await Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Missing Information",

                    text:
                        "Please enter the player's first name, last name and position.",

                    confirmButtonText:
                        "Okay",

                    confirmButtonColor:
                        "#ff7a00"

                });


                return;

            }


            const playerName =
                `${updatedPlayer.first_name} ${updatedPlayer.last_name}`;


            /* ======================================
               CONFIRM UPDATE
            ====================================== */

            const confirmation =
                await Swal.fire({

                    icon:
                        "question",

                    title:
                        "Update Player?",

                    html: `

                        <div class="edit-confirm-popup">

                            <div class="edit-player-icon">

                                <i class="fa-solid fa-user-pen"></i>

                            </div>

                            <p>
                                You are about to update
                            </p>

                            <strong>
                                ${escapeEditHtml(
                                    playerName
                                )}
                            </strong>

                            <span>
                                ${escapeEditHtml(
                                    updatedPlayer.position
                                )}
                            </span>

                        </div>

                    `,

                    showCancelButton:
                        true,

                    confirmButtonText:
                        '<i class="fa-solid fa-check"></i> Update Player',

                    cancelButtonText:
                        "Cancel",

                    confirmButtonColor:
                        "#ff7a00",

                    cancelButtonColor:
                        "#64748b",

                    reverseButtons:
                        true

                });


            if (
                !confirmation.isConfirmed
            ) {

                return;

            }


            const originalButtonHTML =
                updateButton
                    ? updateButton.innerHTML
                    : "";


            if (updateButton) {

                updateButton.disabled =
                    true;


                updateButton.innerHTML = `

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Updating Player...

                `;

            }


            try {

                const response =
                    await fetch(

                        `/api/players/${encodeURIComponent(
                            id
                        )}`,

                        {

                            method:
                                "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    updatedPlayer
                                )

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
                        "Unable to update player."
                    );

                }


                /* ======================================
                   SUCCESS POPUP
                ====================================== */

                await Swal.fire({

                    icon:
                        "success",

                    title:
                        "Player Updated!",

                    html: `

                        <div class="edit-success-popup">

                            <div class="edit-success-name">

                                <i class="fa-solid fa-user-check"></i>

                                ${escapeEditHtml(
                                    playerName
                                )}

                            </div>

                            <p>

                                The player's information
                                has been updated successfully.

                            </p>

                            <span>

                                <i class="fa-solid fa-circle-check"></i>

                                Changes Saved

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


                window.location.href =
                    "view-players.html";

            }

            catch (error) {

                console.error(
                    "Update Player Error:",
                    error
                );


                await Swal.fire({

                    icon:
                        "error",

                    title:
                        "Update Failed",

                    text:
                        error.message,

                    confirmButtonText:
                        "Try Again",

                    confirmButtonColor:
                        "#ff7a00"

                });

            }

            finally {

                if (updateButton) {

                    updateButton.disabled =
                        false;


                    updateButton.innerHTML =
                        originalButtonHTML;

                }

            }

        }
    );

}


/* ==========================================
   LOGOUT
========================================== */

async function logout() {

    const result =
        await Swal.fire({

            icon:
                "question",

            title:
                "Logout from Mafori FC?",

            html: `

                <div class="edit-logout-popup">

                    <div class="logout-ball">

                        <i class="fa-solid fa-futbol"></i>

                    </div>

                    <p>

                        Are you sure you want to logout
                        from the Mafori FC Attendance Register?

                    </p>

                    <span>

                        Your saved player information
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
                true

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

            <div class="edit-logout-loading">

                <div class="logout-spinner-ball">

                    <i class="fa-solid fa-futbol"></i>

                </div>

                <p>
                    See you soon!
                </p>

            </div>

        `,

        showConfirmButton:
            false,

        allowOutsideClick:
            false,

        allowEscapeKey:
            false,

        timer:
            900

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
        900
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeEditHtml(
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
   INITIALIZE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadPlayer();

    }
);
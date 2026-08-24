// ==========================================
// MAFORI FC
// ADD PLAYER
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const playerForm =
            document.getElementById(
                "playerForm"
            );


        if (!playerForm) {
            return;
        }


        const submitButton =
            playerForm.querySelector(
                "button[type='submit']"
            );


        playerForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();


                const player = {

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


                /* =====================================
                   VALIDATION
                ===================================== */

                if (
                    !player.first_name ||
                    !player.last_name ||
                    !player.position
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


                /* =====================================
                   CONFIRM ADD PLAYER
                ===================================== */

                const confirmation =
                    await Swal.fire({

                        icon:
                            "question",

                        title:
                            "Add Player?",

                        html: `

                            <p>
                                You are about to add
                            </p>

                            <strong
                                style="
                                    color:#0b1f3a;
                                    font-size:18px;
                                "
                            >
                                ${escapePlayerHtml(
                                    player.first_name
                                )}
                                ${escapePlayerHtml(
                                    player.last_name
                                )}
                            </strong>

                            <p
                                style="
                                    margin-top:8px;
                                    color:#64748b;
                                "
                            >
                                ${escapePlayerHtml(
                                    player.position
                                )}
                            </p>

                        `,

                        showCancelButton:
                            true,

                        confirmButtonText:
                            "Yes, Add Player",

                        cancelButtonText:
                            "Cancel",

                        confirmButtonColor:
                            "#ff7a00",

                        cancelButtonColor:
                            "#64748b"

                    });


                if (
                    !confirmation.isConfirmed
                ) {

                    return;

                }


                /* =====================================
                   LOADING BUTTON
                ===================================== */

                const originalButtonHTML =
                    submitButton
                        ? submitButton.innerHTML
                        : "";


                if (submitButton) {

                    submitButton.disabled =
                        true;


                    submitButton.innerHTML = `

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Adding Player...

                    `;

                }


                try {

                    const response =
                        await fetch(

                            "/api/players",

                            {

                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify(
                                        player
                                    )

                            }

                        );


                    const result =
                        await response.json();


                    /* =====================================
                       FAILED
                    ===================================== */

                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        await Swal.fire({

                            icon:
                                "error",

                            title:
                                "Unable to Add Player",

                            text:
                                result.message ||
                                "Something went wrong while adding the player.",

                            confirmButtonText:
                                "Try Again",

                            confirmButtonColor:
                                "#ff7a00"

                        });


                        return;

                    }


                    /* =====================================
                       SUCCESS
                    ===================================== */

                    await Swal.fire({

                        icon:
                            "success",

                        title:
                            "Player Added!",

                        html: `

                            <p
                                style="
                                    margin-bottom:8px;
                                "
                            >
                                <strong>
                                    ${escapePlayerHtml(
                                        player.first_name
                                    )}
                                    ${escapePlayerHtml(
                                        player.last_name
                                    )}
                                </strong>
                            </p>

                            <p>
                                has been added successfully to the Mafori FC squad.
                            </p>

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


                    playerForm.reset();

                }

                catch (error) {

                    console.error(
                        "Add player error:",
                        error
                    );


                    await Swal.fire({

                        icon:
                            "error",

                        title:
                            "Connection Error",

                        text:
                            "Unable to connect to the server.",

                        confirmButtonText:
                            "Okay",

                        confirmButtonColor:
                            "#ff7a00"

                    });

                }

                finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;


                        submitButton.innerHTML =
                            originalButtonHTML;

                    }

                }

            }
        );

    }
);


/* ==========================================
   LOGOUT
========================================== */

async function logout() {

    const result =
        await Swal.fire({

            icon:
                "question",

            title:
                "Logout?",

            text:
                "Are you sure you want to logout from the Mafori FC Attendance Register?",

            showCancelButton:
                true,

            confirmButtonText:
                "Yes, Logout",

            cancelButtonText:
                "Stay Logged In",

            confirmButtonColor:
                "#ff7a00",

            cancelButtonColor:
                "#64748b",

            reverseButtons:
                true

        });


    if (
        !result.isConfirmed
    ) {

        return;

    }


    /* =====================================
       LOGGING OUT POPUP
    ===================================== */

    Swal.fire({

        title:
            "Logging Out...",

        text:
            "Please wait.",

        allowOutsideClick:
            false,

        allowEscapeKey:
            false,

        showConfirmButton:
            false,

        didOpen:
            () => {

                Swal.showLoading();

            }

    });


    /* =====================================
       CLEAR SESSION
    ===================================== */

    localStorage.removeItem(
        "user"
    );


    sessionStorage.clear();


    setTimeout(
        () => {

            window.location.href =
                "login.html";

        },
        700
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapePlayerHtml(
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
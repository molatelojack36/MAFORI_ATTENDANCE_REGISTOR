// ==========================================
// MAFORI FC ATTENDANCE REGISTER
// PLAYERS.JS
// ==========================================


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

                <div class="players-logout-popup">

                    <div class="logout-ball">

                        <i class="fa-solid fa-futbol"></i>

                    </div>


                    <p>

                        Are you sure you want to logout
                        from the Mafori FC Attendance Register?

                    </p>


                    <span>

                        Your players, attendance records
                        and reports are safely stored.

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

            allowOutsideClick:
                true,

            showClass: {

                popup:
                    "players-popup-in"

            },

            hideClass: {

                popup:
                    "players-popup-out"

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

            <div class="players-logout-loading">

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
            false,

        timer:
            1000

    });


    /* ======================================
       CLEAR LOGIN INFORMATION
    ====================================== */

    localStorage.removeItem(
        "user"
    );


    sessionStorage.clear();


    /* ======================================
       REDIRECT
    ====================================== */

    setTimeout(
        () => {

            window.location.href =
                "login.html";

        },
        1000
    );

}
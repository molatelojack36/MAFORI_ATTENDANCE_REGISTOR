/* =====================================================
   MAFORI FC ATTENDANCE REGISTER
   PLAYERS PAGE
   players.js
===================================================== */


/* =====================================================
   LOGOUT
===================================================== */

window.logout = async function () {

    const result =
        await Swal.fire({

            title:
                "Logout?",

            html: `

                <div class="players-logout-popup">

                    <div class="logout-ball">

                        <i class="fa-solid fa-futbol"></i>

                    </div>

                    <p>
                        Are you sure you want to logout?
                    </p>

                    <span>
                        Your current Mafori FC session will be closed.
                    </span>

                </div>

            `,

            icon:
                undefined,

            showCancelButton:
                true,

            confirmButtonText:
                '<i class="fa-solid fa-right-from-bracket"></i> Logout',

            cancelButtonText:
                "Cancel",

            confirmButtonColor:
                "#ef4444",

            cancelButtonColor:
                "#0b1f3a",

            reverseButtons:
                true,

            focusCancel:
                true,

            customClass: {

                popup:
                    "mafori-popup players-popup-in"

            }

        });


    if (
        !result.isConfirmed
    ) {

        return;

    }


    /*
       Show loading popup
    */

    Swal.fire({

        title:
            "Logging Out",

        html: `

            <div class="players-logout-loading">

                <div class="logout-spinner-ball">

                    <i class="fa-solid fa-futbol"></i>

                </div>

                <p>
                    Closing your session...
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
                "mafori-popup players-popup-in"

        }

    });


    /*
       Remove logged-in user
    */

    localStorage.removeItem(
        "user"
    );


    /*
       Clear other session data
       if there is any.
    */

    sessionStorage.clear();


    /*
       Short delay so popup can be seen.
    */

    await new Promise(

        resolve =>
            setTimeout(
                resolve,
                900
            )

    );


    /*
       Redirect to login page
    */

    window.location.href =
        "login.html";

};
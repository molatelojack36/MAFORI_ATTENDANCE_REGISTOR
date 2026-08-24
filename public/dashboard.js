// ==========================================
// MAFORI FC ATTENDANCE REGISTER
// DASHBOARD.JS
// ==========================================


/* ==========================================
   LOAD DASHBOARD STATISTICS
========================================== */

async function loadDashboardStatistics() {

    try {

        const response =
            await fetch(
                "/api/dashboard/statistics"
            );


        console.log(
            "HTTP Status:",
            response.status
        );


        const result =
            await response.json();


        console.log(
            "Dashboard API Response:",
            result
        );


        if (
            !response.ok ||
            !result.success
        ) {

            console.error(
                result.message ||
                "Unable to load dashboard statistics."
            );

            return;

        }


        const stats =
            result.statistics;


        document
            .getElementById(
                "totalPlayers"
            )
            .textContent =
                stats.totalPlayers ?? 0;


        document
            .getElementById(
                "presentToday"
            )
            .textContent =
                stats.present ?? 0;


        document
            .getElementById(
                "absentToday"
            )
            .textContent =
                stats.absent ?? 0;


        document
            .getElementById(
                "excusedToday"
            )
            .textContent =
                stats.excused ?? 0;


        document
            .getElementById(
                "attendanceRate"
            )
            .textContent =
                `${stats.attendanceRate ?? 0}%`;

    }

    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


/* ==========================================
   DISPLAY TODAY'S DATE
========================================== */

function displayToday() {

    const todayElement =
        document.getElementById(
            "today"
        );


    if (!todayElement) {

        return;

    }


    const today =
        new Date();


    todayElement.textContent =
        today.toLocaleDateString(
            "en-ZA",
            {

                weekday:
                    "long",

                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"

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

                <div class="dashboard-logout-content">

                    <div class="logout-ball">

                        <i class="fa-solid fa-futbol"></i>

                    </div>

                    <p>

                        Are you sure you want to logout
                        from the Mafori FC Attendance
                        Register?

                    </p>

                    <span>

                        Your saved players, attendance
                        and reports will not be affected.

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
                    "dashboard-popup-in"

            },

            hideClass: {

                popup:
                    "dashboard-popup-out"

            }

        });


    /* ======================================
       CANCELLED
    ====================================== */

    if (
        !result.isConfirmed
    ) {

        return;

    }


    /* ======================================
       SHOW LOGOUT ANIMATION
    ====================================== */

    Swal.fire({

        title:
            "Logging Out...",

        html: `

            <div class="dashboard-logout-loading">

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
            1100

    });


    /* ======================================
       REMOVE LOGIN INFORMATION
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
        1100
    );

}


/* ==========================================
   INITIALIZE DASHBOARD
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        displayToday();

        loadDashboardStatistics();

    }
);
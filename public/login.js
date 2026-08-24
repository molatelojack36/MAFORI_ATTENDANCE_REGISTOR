document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        const loginButton =
            loginForm
                ? loginForm.querySelector(
                    "button[type='submit']"
                )
                : null;


        const togglePassword =
            document.getElementById(
                "togglePassword"
            );


        const passwordInput =
            document.getElementById(
                "password"
            );


        if (!loginForm) {

            return;

        }


        /* =====================================
           PASSWORD TOGGLE
        ===================================== */

        if (
            togglePassword &&
            passwordInput
        ) {

            togglePassword.addEventListener(
                "click",
                () => {

                    const isPassword =
                        passwordInput.type ===
                        "password";


                    passwordInput.type =
                        isPassword
                            ? "text"
                            : "password";


                    togglePassword.innerHTML =
                        isPassword

                            ? '<i class="fa-solid fa-eye-slash"></i>'

                            : '<i class="fa-solid fa-eye"></i>';

                }
            );

        }


        /* =====================================
           LOGIN
        ===================================== */

        loginForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();


                const username =
                    document
                        .getElementById(
                            "username"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "password"
                        )
                        .value
                        .trim();


                /* =====================================
                   VALIDATION
                ===================================== */

                if (
                    !username ||
                    !password
                ) {

                    await Swal.fire({

                        icon:
                            "warning",

                        title:
                            "Missing Login Details",

                        html: `

                            <div class="login-alert-message">

                                <div class="login-alert-icon">

                                    <i class="fa-solid fa-user-lock"></i>

                                </div>

                                <p>

                                    Please enter both your
                                    username and password.

                                </p>

                            </div>

                        `,

                        confirmButtonText:
                            "Okay",

                        confirmButtonColor:
                            "#ff7a00",

                        customClass: {

                            popup:
                                "login-popup"

                        }

                    });


                    return;

                }


                /* =====================================
                   BUTTON LOADING STATE
                ===================================== */

                const originalButtonHTML =
                    loginButton
                        ? loginButton.innerHTML
                        : "";


                if (loginButton) {

                    loginButton.disabled =
                        true;


                    loginButton.innerHTML = `

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Signing In...

                    `;

                }


                try {

                    const response =
                        await fetch(

                            "/api/login",

                            {

                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({

                                        username,
                                        password

                                    })

                            }

                        );


                    let result;


                    try {

                        result =
                            await response.json();

                    }

                    catch (_) {

                        throw new Error(
                            "The server returned an invalid response."
                        );

                    }


                    /* =====================================
                       LOGIN FAILED
                    ===================================== */

                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        await Swal.fire({

                            icon:
                                "error",

                            title:
                                "Login Failed",

                            html: `

                                <div class="login-alert-message">

                                    <div class="login-alert-icon error-alert-icon">

                                        <i class="fa-solid fa-lock"></i>

                                    </div>

                                    <p>

                                        ${
                                            escapeLoginHtml(
                                                result.message ||
                                                "Invalid username or password."
                                            )
                                        }

                                    </p>

                                    <span>

                                        Please check your login details
                                        and try again.

                                    </span>

                                </div>

                            `,

                            confirmButtonText:
                                '<i class="fa-solid fa-rotate-right"></i> Try Again',

                            confirmButtonColor:
                                "#ff7a00",

                            customClass: {

                                popup:
                                    "login-popup"

                            }

                        });


                        return;

                    }


                    /* =====================================
                       SAVE USER
                    ===================================== */

                    localStorage.setItem(

                        "user",

                        JSON.stringify(
                            result.user
                        )

                    );


                    /* =====================================
                       SUCCESS POPUP
                    ===================================== */

                    const displayName =
                        result.user.fullname ||
                        result.user.username ||
                        "Administrator";


                    await Swal.fire({

                        icon:
                            "success",

                        title:
                            "Welcome Back!",

                        html: `

                            <div class="login-success-popup">

                                <div class="welcome-user-badge">

                                    <i class="fa-solid fa-user-check"></i>

                                    ${escapeLoginHtml(
                                        displayName
                                    )}

                                </div>

                                <p>

                                    You have successfully signed in to
                                    the Mafori FC Attendance Register.

                                </p>

                                <span>

                                    <i class="fa-solid fa-circle-check"></i>

                                    Login Successful

                                </span>

                            </div>

                        `,

                        showConfirmButton:
                            false,

                        timer:
                            1700,

                        timerProgressBar:
                            true,

                        allowOutsideClick:
                            false,

                        allowEscapeKey:
                            false,

                        customClass: {

                            popup:
                                "login-popup"

                        }

                    });


                    /* =====================================
                       REDIRECT
                    ===================================== */

                    window.location.href =
                        "dashboard.html";

                }

                catch (err) {

                    console.error(
                        "Login error:",
                        err
                    );


                    await Swal.fire({

                        icon:
                            "error",

                        title:
                            "Connection Error",

                        html: `

                            <div class="login-alert-message">

                                <div class="login-alert-icon error-alert-icon">

                                    <i class="fa-solid fa-server"></i>

                                </div>

                                <p>

                                    Unable to connect to the server.

                                </p>

                                <span>

                                    Please check your connection
                                    and try again.

                                </span>

                            </div>

                        `,

                        confirmButtonText:
                            "Okay",

                        confirmButtonColor:
                            "#ff7a00",

                        customClass: {

                            popup:
                                "login-popup"

                        }

                    });

                }

                finally {

                    if (loginButton) {

                        loginButton.disabled =
                            false;


                        loginButton.innerHTML =
                            originalButtonHTML;

                    }

                }

            }
        );

    }
);


/* =====================================
   BACK BUTTON
===================================== */

async function goBack() {

    const result =
        await Swal.fire({

            icon:
                "question",

            title:
                "Leave Login Page?",

            html: `

                <div class="login-back-popup">

                    <div class="back-popup-icon">

                        <i class="fa-solid fa-arrow-left"></i>

                    </div>

                    <p>

                        Do you want to return to the
                        previous page?

                    </p>

                </div>

            `,

            showCancelButton:
                true,

            confirmButtonText:
                '<i class="fa-solid fa-arrow-left"></i> Yes, Go Back',

            cancelButtonText:
                "Stay Here",

            confirmButtonColor:
                "#ff7a00",

            cancelButtonColor:
                "#64748b",

            reverseButtons:
                true,

            customClass: {

                popup:
                    "login-popup"

            }

        });


    if (
        !result.isConfirmed
    ) {

        return;

    }


    if (
        window.history.length >
        1
    ) {

        window.history.back();

    }

    else {

        window.location.href =
            "index.html";

    }

}


/* =====================================
   ESCAPE HTML
===================================== */

function escapeLoginHtml(
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
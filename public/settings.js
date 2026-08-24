// ==========================================
// MAFORI FC ATTENDANCE REGISTER
// SETTINGS.JS
// ==========================================


document.addEventListener(
    "DOMContentLoaded",
    async () => {


        /* =====================================
           ELEMENTS
        ===================================== */

        const passwordForm =
            document.getElementById(
                "passwordForm"
            );


        const profileForm =
            document.getElementById(
                "profileForm"
            );


        const clubForm =
            document.getElementById(
                "clubForm"
            );



        /* =====================================
           GET LOGGED-IN USER
        ===================================== */

        let user;


        try {

            user =
                JSON.parse(
                    localStorage.getItem(
                        "user"
                    )
                );

        }

        catch (error) {

            user =
                null;

        }



        /* =====================================
           SESSION CHECK
        ===================================== */

        if (
            !user ||
            !user.id
        ) {

            await Swal.fire({

                icon:
                    "warning",

                title:
                    "Session Expired",

                html: `

                    <div class="settings-message-popup">

                        <p>

                            Your login session has expired.

                        </p>

                        <span>

                            Please login again to continue
                            using Mafori FC Attendance Register.

                        </span>

                    </div>

                `,

                confirmButtonText:
                    '<i class="fa-solid fa-right-to-bracket"></i> Go to Login',

                confirmButtonColor:
                    "#f97316",

                allowOutsideClick:
                    false,

                allowEscapeKey:
                    false

            });


            window.location.href =
                "login.html";


            return;

        }



        /* =====================================
           LOAD USER INFORMATION
        ===================================== */

        const fullnameInput =
            document.getElementById(
                "fullname"
            );


        const usernameInput =
            document.getElementById(
                "username"
            );


        const roleInput =
            document.getElementById(
                "role"
            );


        if (fullnameInput) {

            fullnameInput.value =
                user.fullname ||
                "";

        }


        if (usernameInput) {

            usernameInput.value =
                user.username ||
                "";

        }


        if (roleInput) {

            roleInput.value =
                user.role ||
                "Administrator";

        }



        /* =====================================
           LOAD CLUB SETTINGS
           FROM LOCAL STORAGE
        ===================================== */

        loadLocalClubSettings();



        /* =====================================
           CHANGE PASSWORD
        ===================================== */

        if (passwordForm) {

            passwordForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const currentPassword =
                        document
                            .getElementById(
                                "currentPassword"
                            )
                            .value
                            .trim();


                    const newPassword =
                        document
                            .getElementById(
                                "newPassword"
                            )
                            .value
                            .trim();


                    const confirmPassword =
                        document
                            .getElementById(
                                "confirmPassword"
                            )
                            .value
                            .trim();



                    /* =================================
                       EMPTY PASSWORDS
                    ================================= */

                    if (
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                    ) {

                        await Swal.fire({

                            icon:
                                "warning",

                            title:
                                "Missing Password Information",

                            text:
                                "Please complete all password fields.",

                            confirmButtonText:
                                "Okay",

                            confirmButtonColor:
                                "#f97316"

                        });


                        return;

                    }



                    /* =================================
                       PASSWORD MATCH
                    ================================= */

                    if (
                        newPassword !==
                        confirmPassword
                    ) {

                        await Swal.fire({

                            icon:
                                "warning",

                            title:
                                "Passwords Do Not Match",

                            html: `

                                <div class="settings-message-popup">

                                    <p>

                                        The new passwords do not match.

                                    </p>

                                    <span>

                                        Please enter the same password
                                        in both fields.

                                    </span>

                                </div>

                            `,

                            confirmButtonText:
                                "Try Again",

                            confirmButtonColor:
                                "#f97316"

                        });


                        return;

                    }



                    /* =================================
                       PASSWORD LENGTH
                    ================================= */

                    if (
                        newPassword.length <
                        6
                    ) {

                        await Swal.fire({

                            icon:
                                "warning",

                            title:
                                "Password Too Short",

                            html: `

                                <div class="settings-message-popup">

                                    <p>

                                        Your new password is too short.

                                    </p>

                                    <span>

                                        Password must contain at least
                                        6 characters.

                                    </span>

                                </div>

                            `,

                            confirmButtonText:
                                "Okay",

                            confirmButtonColor:
                                "#f97316"

                        });


                        return;

                    }



                    /* =================================
                       SAME PASSWORD CHECK
                    ================================= */

                    if (
                        currentPassword ===
                        newPassword
                    ) {

                        await Swal.fire({

                            icon:
                                "info",

                            title:
                                "Choose a New Password",

                            text:
                                "Your new password should be different from your current password.",

                            confirmButtonText:
                                "Okay",

                            confirmButtonColor:
                                "#f97316"

                        });


                        return;

                    }



                    /* =================================
                       CONFIRM PASSWORD CHANGE
                    ================================= */

                    const confirmation =
                        await Swal.fire({

                            icon:
                                "question",

                            title:
                                "Change Password?",

                            html: `

                                <div class="settings-confirm-popup">

                                    <div
                                        class="
                                            settings-popup-icon
                                            password-icon
                                        "
                                    >

                                        <i class="fa-solid fa-lock"></i>

                                    </div>


                                    <p>

                                        Are you sure you want to change
                                        your administrator password?

                                    </p>


                                    <span>

                                        You will use the new password
                                        the next time you login.

                                    </span>

                                </div>

                            `,

                            showCancelButton:
                                true,

                            confirmButtonText:
                                '<i class="fa-solid fa-key"></i> Change Password',

                            cancelButtonText:
                                '<i class="fa-solid fa-xmark"></i> Cancel',

                            confirmButtonColor:
                                "#f97316",

                            cancelButtonColor:
                                "#64748b",

                            reverseButtons:
                                true,

                            focusCancel:
                                true

                        });


                    if (
                        !confirmation.isConfirmed
                    ) {

                        return;

                    }



                    /* =================================
                       BUTTON LOADING
                    ================================= */

                    const submitButton =
                        passwordForm.querySelector(
                            "button[type='submit']"
                        );


                    const originalHTML =
                        submitButton
                            ? submitButton.innerHTML
                            : "";


                    if (submitButton) {

                        submitButton.disabled =
                            true;


                        submitButton.innerHTML = `

                            <i class="fa-solid fa-spinner fa-spin"></i>

                            Updating Password...

                        `;

                    }



                    try {

                        const response =
                            await fetch(

                                "/api/change-password",

                                {

                                    method:
                                        "PUT",

                                    headers: {

                                        "Content-Type":
                                            "application/json"

                                    },

                                    body:
                                        JSON.stringify({

                                            user_id:
                                                user.id,

                                            current_password:
                                                currentPassword,

                                            new_password:
                                                newPassword

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


                        if (
                            !response.ok ||
                            !result.success
                        ) {

                            throw new Error(

                                result.message ||
                                "Unable to change password."

                            );

                        }



                        /* =================================
                           SUCCESS
                        ================================= */

                        await Swal.fire({

                            icon:
                                "success",

                            title:
                                "Password Changed!",

                            html: `

                                <div class="settings-success-popup">

                                    <div
                                        class="
                                            settings-success-badge
                                            password-success
                                        "
                                    >

                                        <i class="fa-solid fa-shield-halved"></i>

                                        Password Updated

                                    </div>


                                    <p>

                                        Your administrator password
                                        has been changed successfully.

                                    </p>


                                    <span>

                                        <i class="fa-solid fa-circle-check"></i>

                                        Account Secured

                                    </span>

                                </div>

                            `,

                            confirmButtonText:
                                "Done",

                            confirmButtonColor:
                                "#f97316",

                            timer:
                                2400,

                            timerProgressBar:
                                true

                        });


                        passwordForm.reset();

                    }

                    catch (error) {

                        console.error(
                            "Password update error:",
                            error
                        );


                        await Swal.fire({

                            icon:
                                "error",

                            title:
                                "Password Update Failed",

                            text:
                                error.message ||
                                "Server error. Please try again.",

                            confirmButtonText:
                                "Try Again",

                            confirmButtonColor:
                                "#f97316"

                        });

                    }

                    finally {

                        if (submitButton) {

                            submitButton.disabled =
                                false;


                            submitButton.innerHTML =
                                originalHTML;

                        }

                    }

                }
            );

        }



        /* =====================================
           PROFILE SETTINGS
        ===================================== */

        if (profileForm) {

            profileForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const fullname =
                        document
                            .getElementById(
                                "fullname"
                            )
                            .value
                            .trim();


                    const username =
                        document
                            .getElementById(
                                "username"
                            )
                            .value
                            .trim();



                    /* =================================
                       VALIDATE
                    ================================= */

                    if (
                        !fullname ||
                        !username
                    ) {

                        await Swal.fire({

                            icon:
                                "warning",

                            title:
                                "Missing Information",

                            text:
                                "Please enter your full name and username.",

                            confirmButtonText:
                                "Okay",

                            confirmButtonColor:
                                "#f97316"

                        });


                        return;

                    }



                    /* =================================
                       CONFIRM PROFILE
                    ================================= */

                    const confirmation =
                        await Swal.fire({

                            icon:
                                "question",

                            title:
                                "Save Profile Changes?",

                            html: `

                                <div class="settings-confirm-popup">

                                    <div
                                        class="
                                            settings-popup-icon
                                            profile-icon
                                        "
                                    >

                                        <i class="fa-solid fa-user-pen"></i>

                                    </div>


                                    <p>

                                        Update administrator profile to

                                    </p>


                                    <strong>

                                        ${escapeSettingsHtml(
                                            fullname
                                        )}

                                    </strong>


                                    <span>

                                        @${escapeSettingsHtml(
                                            username
                                        )}

                                    </span>

                                </div>

                            `,

                            showCancelButton:
                                true,

                            confirmButtonText:
                                '<i class="fa-solid fa-floppy-disk"></i> Save Profile',

                            cancelButtonText:
                                "Cancel",

                            confirmButtonColor:
                                "#f97316",

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



                    /* =================================
                       LOADING BUTTON
                    ================================= */

                    const submitButton =
                        profileForm.querySelector(
                            "button[type='submit']"
                        );


                    const originalHTML =
                        submitButton
                            ? submitButton.innerHTML
                            : "";


                    if (submitButton) {

                        submitButton.disabled =
                            true;


                        submitButton.innerHTML = `

                            <i class="fa-solid fa-spinner fa-spin"></i>

                            Saving Profile...

                        `;

                    }



                    try {

                        const response =
                            await fetch(

                                `/api/users/${encodeURIComponent(
                                    user.id
                                )}`,

                                {

                                    method:
                                        "PUT",

                                    headers: {

                                        "Content-Type":
                                            "application/json"

                                    },

                                    body:
                                        JSON.stringify({

                                            fullname,
                                            username

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


                        if (
                            !response.ok ||
                            !result.success
                        ) {

                            throw new Error(

                                result.message ||
                                "Unable to update profile."

                            );

                        }



                        /* =================================
                           UPDATE LOCAL USER
                        ================================= */

                        user.fullname =
                            fullname;


                        user.username =
                            username;


                        localStorage.setItem(

                            "user",

                            JSON.stringify(
                                user
                            )

                        );



                        /* =================================
                           SUCCESS
                        ================================= */

                        await Swal.fire({

                            icon:
                                "success",

                            title:
                                "Profile Updated!",

                            html: `

                                <div class="settings-success-popup">

                                    <div class="settings-success-badge">

                                        <i class="fa-solid fa-user-check"></i>

                                        ${escapeSettingsHtml(
                                            fullname
                                        )}

                                    </div>


                                    <p>

                                        Your administrator profile
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
                                "#f97316",

                            timer:
                                2400,

                            timerProgressBar:
                                true

                        });

                    }

                    catch (error) {

                        console.error(
                            "Profile update error:",
                            error
                        );


                        await Swal.fire({

                            icon:
                                "error",

                            title:
                                "Profile Update Failed",

                            text:
                                error.message ||
                                "Server error. Please try again.",

                            confirmButtonText:
                                "Try Again",

                            confirmButtonColor:
                                "#f97316"

                        });

                    }

                    finally {

                        if (submitButton) {

                            submitButton.disabled =
                                false;


                            submitButton.innerHTML =
                                originalHTML;

                        }

                    }

                }
            );

        }



        /* =====================================
           CLUB SETTINGS
        ===================================== */

        if (clubForm) {

            clubForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const clubName =
                        document
                            .getElementById(
                                "clubName"
                            )
                            .value
                            .trim();


                    const systemTitle =
                        document
                            .getElementById(
                                "systemTitle"
                            )
                            .value
                            .trim();



                    /* =================================
                       VALIDATE
                    ================================= */

                    if (
                        !clubName ||
                        !systemTitle
                    ) {

                        await Swal.fire({

                            icon:
                                "warning",

                            title:
                                "Missing Club Information",

                            text:
                                "Please enter the club name and system title.",

                            confirmButtonText:
                                "Okay",

                            confirmButtonColor:
                                "#f97316"

                        });


                        return;

                    }



                    /* =================================
                       CONFIRM
                    ================================= */

                    const confirmation =
                        await Swal.fire({

                            icon:
                                "question",

                            title:
                                "Save Club Settings?",

                            html: `

                                <div class="settings-confirm-popup">

                                    <div
                                        class="
                                            settings-popup-icon
                                            club-icon
                                        "
                                    >

                                        <i class="fa-solid fa-futbol"></i>

                                    </div>


                                    <strong>

                                        ${escapeSettingsHtml(
                                            clubName
                                        )}

                                    </strong>


                                    <span>

                                        ${escapeSettingsHtml(
                                            systemTitle
                                        )}

                                    </span>

                                </div>

                            `,

                            showCancelButton:
                                true,

                            confirmButtonText:
                                '<i class="fa-solid fa-floppy-disk"></i> Save Settings',

                            cancelButtonText:
                                "Cancel",

                            confirmButtonColor:
                                "#f97316",

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



                    /* =================================
                       SAVE LOCALLY
                    ================================= */

                    const clubSettings = {

                        clubName,
                        systemTitle

                    };


                    localStorage.setItem(

                        "maforiClubSettings",

                        JSON.stringify(
                            clubSettings
                        )

                    );



                    /* =================================
                       SUCCESS
                    ================================= */

                    await Swal.fire({

                        icon:
                            "success",

                        title:
                            "Club Settings Saved!",

                        html: `

                            <div class="settings-success-popup">

                                <div class="settings-success-badge">

                                    <i class="fa-solid fa-futbol"></i>

                                    ${escapeSettingsHtml(
                                        clubName
                                    )}

                                </div>


                                <p>

                                    Club settings have been
                                    saved successfully on this browser.

                                </p>


                                <span>

                                    <i class="fa-solid fa-circle-check"></i>

                                    Settings Saved

                                </span>

                            </div>

                        `,

                        confirmButtonText:
                            "Done",

                        confirmButtonColor:
                            "#f97316",

                        timer:
                            2400,

                        timerProgressBar:
                            true

                    });

                }
            );

        }

    }
);



/* =====================================
   LOAD LOCAL CLUB SETTINGS
===================================== */

function loadLocalClubSettings() {

    try {

        const storedSettings =
            JSON.parse(
                localStorage.getItem(
                    "maforiClubSettings"
                )
            );


        if (!storedSettings) {

            return;

        }


        const clubName =
            document.getElementById(
                "clubName"
            );


        const systemTitle =
            document.getElementById(
                "systemTitle"
            );


        if (
            clubName &&
            storedSettings.clubName
        ) {

            clubName.value =
                storedSettings.clubName;

        }


        if (
            systemTitle &&
            storedSettings.systemTitle
        ) {

            systemTitle.value =
                storedSettings.systemTitle;

        }

    }

    catch (error) {

        console.error(
            "Unable to load local club settings:",
            error
        );

    }

}



/* =====================================
   POLISHED LOGOUT
===================================== */

async function logout() {

    const result =
        await Swal.fire({

            icon:
                "question",

            title:
                "Logout from Mafori FC?",

            html: `

                <div class="settings-logout-popup">

                    <div class="logout-ball">

                        <i class="fa-solid fa-futbol"></i>

                    </div>


                    <p>

                        Are you sure you want to logout
                        from the Mafori FC Attendance Register?

                    </p>


                    <span>

                        Your saved settings, players and
                        attendance records will not be affected.

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
                "#f97316",

            cancelButtonColor:
                "#64748b",

            reverseButtons:
                true,

            focusCancel:
                true,

            showClass: {

                popup:
                    "settings-popup-in"

            },

            hideClass: {

                popup:
                    "settings-popup-out"

            }

        });


    if (
        !result.isConfirmed
    ) {

        return;

    }



    /* =====================================
       LOGGING OUT
    ===================================== */

    Swal.fire({

        title:
            "Logging Out...",

        html: `

            <div class="settings-logout-loading">

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



    /* =====================================
       CLEAR LOGIN SESSION
    ===================================== */

    localStorage.removeItem(
        "user"
    );


    sessionStorage.clear();



    /* =====================================
       REDIRECT
    ===================================== */

    setTimeout(
        () => {

            window.location.href =
                "login.html";

        },
        1000
    );

}



/* =====================================
   ESCAPE HTML
===================================== */

function escapeSettingsHtml(
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
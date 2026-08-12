document.addEventListener("DOMContentLoaded", () => {

    const passwordForm = document.getElementById("passwordForm");
    const profileForm = document.getElementById("profileForm");
    const clubForm = document.getElementById("clubForm");


    /* =====================================
       GET LOGGED-IN USER
    ===================================== */

    const user = JSON.parse(
        localStorage.getItem("user")
    );


    if (!user || !user.id) {

        alert("Your session has expired. Please login again.");

        window.location.href = "login.html";

        return;

    }


    /* =====================================
       LOAD USER INFORMATION
    ===================================== */

    if (document.getElementById("fullname")) {
        document.getElementById("fullname").value =
            user.fullname || "";
    }

    if (document.getElementById("username")) {
        document.getElementById("username").value =
            user.username || "";
    }

    if (document.getElementById("role")) {
        document.getElementById("role").value =
            user.role || "Administrator";
    }


    /* =====================================
       CHANGE PASSWORD
    ===================================== */

    if (passwordForm) {

        passwordForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const currentPassword =
                    document.getElementById("currentPassword").value.trim();

                const newPassword =
                    document.getElementById("newPassword").value.trim();

                const confirmPassword =
                    document.getElementById("confirmPassword").value.trim();


                /* CHECK PASSWORD MATCH */

                if (newPassword !== confirmPassword) {

                    alert("New passwords do not match.");

                    return;

                }


                /* CHECK PASSWORD LENGTH */

                if (newPassword.length < 6) {

                    alert(
                        "New password must be at least 6 characters long."
                    );

                    return;

                }


                try {

                    const response = await fetch(
                        "/api/change-password",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                user_id: user.id,

                                current_password:
                                    currentPassword,

                                new_password:
                                    newPassword

                            })
                        }
                    );


                    const result =
                        await response.json();


                    if (!response.ok || !result.success) {

                        alert(
                            result.message ||
                            "Unable to change password."
                        );

                        return;

                    }


                    alert(
                        "Password changed successfully!"
                    );


                    /* CLEAR FORM */

                    passwordForm.reset();

                }

                catch (error) {

                    console.error(
                        "Password update error:",
                        error
                    );

                    alert(
                        "Server error. Please try again."
                    );

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
                    document.getElementById("fullname").value.trim();

                const username =
                    document.getElementById("username").value.trim();


                try {

                    const response = await fetch(
                        `/api/users/${user.id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                fullname,
                                username

                            })
                        }
                    );


                    const result =
                        await response.json();


                    if (!response.ok || !result.success) {

                        alert(
                            result.message ||
                            "Unable to update profile."
                        );

                        return;

                    }


                    /* UPDATE LOCAL USER */

                    user.fullname = fullname;
                    user.username = username;

                    localStorage.setItem(
                        "user",
                        JSON.stringify(user)
                    );


                    alert(
                        "Profile updated successfully!"
                    );

                }

                catch (error) {

                    console.error(
                        "Profile update error:",
                        error
                    );

                    alert(
                        "Server error. Please try again."
                    );

                }

            }
        );

    }


    /* =====================================
       LOGOUT
    ===================================== */

    window.logout = function () {

        localStorage.removeItem("user");

        window.location.href = "login.html";

    };

});
document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value.trim();


        if (!username || !password) {

            alert("Please enter your username and password.");

            return;
        }


        try {

            const response = await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                alert(
                    result.message ||
                    "Invalid username or password."
                );

                return;
            }


            /*
            =====================================
            SAVE LOGGED-IN USER
            =====================================
            */

            localStorage.setItem(
                "user",
                JSON.stringify(result.user)
            );


            /*
            =====================================
            LOGIN SUCCESS
            =====================================
            */

            alert(
                "Welcome " +
                (result.user.fullname || result.user.username)
            );


            window.location.href =
                "dashboard.html";


        }

        catch (err) {

            console.error(
                "Login error:",
                err
            );

            alert(
                "Unable to connect to the server."
            );

        }

    });

});
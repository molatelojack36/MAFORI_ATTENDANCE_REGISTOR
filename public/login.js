

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                password
            })
        });

        const result = await response.json();

        if (result.success) {
            alert("Welcome " + result.user.fullname);
            window.location.href = "dashboard.html";
        } 
        
        else{
            alert(result.message);
        }

    } catch (err){
        alert("Unable to connect to the server.");
        console.error(err);
    }

});
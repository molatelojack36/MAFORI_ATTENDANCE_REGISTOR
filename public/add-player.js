const playerForm = document.getElementById("playerForm");

playerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const player = {

        first_name: document.getElementById("first_name").value.trim(),

        last_name: document.getElementById("last_name").value.trim(),

        nickname: document.getElementById("nickname").value.trim(),

        position: document.getElementById("position").value,

        date_of_birth: document.getElementById("date_of_birth").value,

        status: document.getElementById("status").value

    };

    try{

        const response = await fetch("/api/players",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(player)

        });

        const result = await response.json();

        if(result.success){

            alert("✅ Player added successfully!");

            playerForm.reset();

        }

        else{

            alert(result.message);

        }

    }

    catch(error){

        console.error(error);

        alert("❌ Unable to connect to the server.");

    }

});
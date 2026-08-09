// =======================================
// TODAY'S DATE
// =======================================

const today = new Date();

const todayDate = document.getElementById("todayDate");

if (todayDate) {
    todayDate.textContent = today.toDateString();
}

// =======================================
// LOAD PLAYERS
// =======================================

async function loadPlayers() {

    try {

        const response = await fetch("/api/players");
        const players = await response.json();

        const table = document.getElementById("attendanceTable");

        table.innerHTML = "";

        const activePlayers = players.filter(player => player.status === "Active");

        if (activePlayers.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">
                        No active players found.
                    </td>
                </tr>
            `;

            return;
        }

        activePlayers.forEach((player, index) => {

            table.innerHTML += `

                <tr>

                    <td>${index + 1}</td>

                    <td>${player.first_name} ${player.last_name}</td>

                    <td>${player.position}</td>

                    <td>
                        <input
                            type="radio"
                            name="player${player.id}"
                            value="Present"
                            checked>
                    </td>

                    <td>
                        <input
                            type="radio"
                            name="player${player.id}"
                            value="Absent">
                    </td>

                    <td>
                        <input
                            type="radio"
                            name="player${player.id}"
                            value="Excused">
                    </td>

                </tr>

            `;

        });

    }

    catch (error) {

        console.error("Load Players Error:", error);

    }

}

loadPlayers();


// =======================================
// SEARCH PLAYER
// =======================================

const searchInput = document.getElementById("searchPlayer");

if (searchInput) {

    searchInput.addEventListener("keyup", function () {

        const filter = this.value.toLowerCase();

        const rows = document.querySelectorAll("#attendanceTable tr");

        rows.forEach(row => {

            row.style.display = row.innerText
                .toLowerCase()
                .includes(filter)
                ? ""
                : "none";

        });

    });

}


// =======================================
// SAVE ATTENDANCE
// =======================================

const saveButton = document.getElementById("saveAttendance");

if (saveButton) {

    saveButton.addEventListener("click", async () => {

        const attendance = [];

        document.querySelectorAll("#attendanceTable tr").forEach(row => {

            const radios = row.querySelectorAll("input[type='radio']");

            if (radios.length === 0) return;

            let status = "Present";

            radios.forEach(radio => {

                if (radio.checked) {

                    status = radio.value;

                }

            });

            attendance.push({

                player_id: Number(radios[0].name.replace("player", "")),
                attendance_status: status

            });

        });

        console.log("Attendance Data:", attendance);

        try {

            const response = await fetch("/api/attendance", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    attendance

                })

            });

            const result = await response.json();

            console.log(result);

            if (result.success) {

                alert("Attendance saved successfully!");

                location.reload();

            } else {

                alert(result.message);

            }

        }

        catch (error) {

            console.error("Save Attendance Error:", error);

            alert("Failed to save attendance.");

        }

    });

}
async function loadDashboardStatistics() {

    try {

        const response = await fetch("/api/dashboard/statistics");

        console.log("HTTP Status:", response.status);

        const result = await response.json();

        console.log("Dashboard API Response:", result);

        if (!result.success) {

            console.error(result.message);
            return;

        }

        const stats = result.statistics;

        document.getElementById("totalPlayers").textContent = stats.totalPlayers;
        document.getElementById("presentToday").textContent = stats.present;
        document.getElementById("absentToday").textContent = stats.absent;
        document.getElementById("excusedToday").textContent = stats.excused;
        document.getElementById("attendanceRate").textContent = stats.attendanceRate + "%";

    }

    catch (error) {

        console.error("Dashboard Error:", error);

    }

}

loadDashboardStatistics();
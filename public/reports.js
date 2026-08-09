// ==========================================
// MAFORI FC REPORTS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const monthSelect = document.getElementById("month");
    const yearInput = document.getElementById("year");

    const generateButton =
        document.getElementById("generateReport");

    const downloadPDF =
        document.getElementById("downloadPDF");

    const downloadCSV =
        document.getElementById("downloadExcel");

    const reportTable =
        document.getElementById("reportTable");

    const totalPlayers =
        document.getElementById("totalPlayers");

    const presentPlayers =
        document.getElementById("presentPlayers");

    const absentPlayers =
        document.getElementById("absentPlayers");

    const excusedPlayers =
        document.getElementById("excusedPlayers");

    const attendanceRate =
        document.getElementById("attendanceRate");


    // ==========================================
    // CURRENT MONTH / YEAR
    // ==========================================

    const today = new Date();

    monthSelect.value =
        today.getMonth() + 1;

    yearInput.value =
        today.getFullYear();


    // ==========================================
    // GENERATE REPORT
    // ==========================================

    generateButton.addEventListener(
        "click",
        generateReport
    );


    async function generateReport() {

        const month =
            monthSelect.value;

        const year =
            yearInput.value;


        if (!year) {

            alert("Please enter a year.");

            return;

        }


        generateButton.disabled = true;

        generateButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Generating...
        `;


        try {

            console.log(
                "Generating report:",
                month,
                year
            );


            // IMPORTANT:
            // This endpoint returns JSON,
            // NOT the PDF.

            const response = await fetch(
                `/api/reports/monthly/data?month=${month}&year=${year}`
            );


            const result =
                await response.json();


            console.log(
                "Report response:",
                result
            );


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Unable to generate report."
                );

            }


            if (!result.success) {

                throw new Error(
                    result.message ||
                    "Unable to generate report."
                );

            }


            const report =
                result.report;


            const players =
                report.players || [];

            const sessions =
                report.sessions || [];

            const attendance =
                report.attendance || [];


            // ==========================================
            // TOTAL PLAYERS
            // ==========================================

            totalPlayers.textContent =
                players.length;


            // ==========================================
            // STATISTICS
            // ==========================================

            let present = 0;
            let absent = 0;
            let excused = 0;


            attendance.forEach(record => {

                if (
                    record.attendance_status ===
                    "Present"
                ) {

                    present++;

                }

                else if (
                    record.attendance_status ===
                    "Absent"
                ) {

                    absent++;

                }

                else if (
                    record.attendance_status ===
                    "Excused"
                ) {

                    excused++;

                }

            });


            presentPlayers.textContent =
                present;

            absentPlayers.textContent =
                absent;

            excusedPlayers.textContent =
                excused;


            const totalRecords =
                present +
                absent +
                excused;


            const rate =
                totalRecords > 0
                    ? (
                        (present /
                            totalRecords) *
                        100
                    ).toFixed(1)
                    : "0.0";


            attendanceRate.textContent =
                rate + "%";


            // ==========================================
            // CLEAR TABLE
            // ==========================================

            reportTable.innerHTML = "";


            if (players.length === 0) {

                reportTable.innerHTML = `
                    <tr>
                        <td colspan="5">
                            No active players found
                            for this report.
                        </td>
                    </tr>
                `;

                return;

            }


            // ==========================================
            // CREATE TABLE
            // ==========================================

            let rowNumber = 1;


            players.forEach(player => {

                const playerRecords =
                    attendance.filter(
                        record =>
                            Number(record.player_id) ===
                            Number(player.id)
                    );


                // ======================================
                // NO ATTENDANCE
                // ======================================

                if (
                    playerRecords.length === 0
                ) {

                    const row =
                        document.createElement("tr");


                    row.innerHTML = `

                        <td>
                            ${rowNumber++}
                        </td>

                        <td>
                            ${player.first_name || ""}
                            ${player.last_name || ""}
                        </td>

                        <td>
                            ${player.position || "-"}
                        </td>

                        <td>
                            -
                        </td>

                        <td>
                            -
                        </td>

                    `;


                    reportTable.appendChild(row);

                    return;

                }


                // ======================================
                // ATTENDANCE RECORDS
                // ======================================

                playerRecords.forEach(record => {

                    const session =
                        sessions.find(
                            session =>
                                Number(session.id) ===
                                Number(record.session_id)
                        );


                    const row =
                        document.createElement("tr");


                    let statusClass = "";


                    if (
                        record.attendance_status ===
                        "Present"
                    ) {

                        statusClass = "present";

                    }

                    else if (
                        record.attendance_status ===
                        "Absent"
                    ) {

                        statusClass = "absent";

                    }

                    else if (
                        record.attendance_status ===
                        "Excused"
                    ) {

                        statusClass = "excused";

                    }


                    row.innerHTML = `

                        <td>
                            ${rowNumber++}
                        </td>

                        <td>
                            ${player.first_name || ""}
                            ${player.last_name || ""}
                        </td>

                        <td>
                            ${player.position || "-"}
                        </td>

                        <td class="${statusClass}">
                            ${record.attendance_status || "-"}
                        </td>

                        <td>
                            ${
                                session
                                    ? session.session_date
                                    : "-"
                            }
                        </td>

                    `;


                    reportTable.appendChild(row);

                });

            });


            console.log(
                "Report generated successfully."
            );

        }

        catch (error) {

            console.error(
                "REPORT ERROR:",
                error
            );


            alert(
                "Unable to generate the report.\n\n" +
                error.message
            );

        }

        finally {

            generateButton.disabled =
                false;

            generateButton.innerHTML = `
                <i class="fa-solid fa-chart-line"></i>
                Generate Report
            `;

        }

    }


    // ==========================================
    // DOWNLOAD PDF
    // ==========================================

    downloadPDF.addEventListener(
        "click",
        () => {

            const month =
                monthSelect.value;

            const year =
                yearInput.value;


            if (!month || !year) {

                alert(
                    "Please select a month and year."
                );

                return;

            }


            window.open(
                `/api/reports/monthly?month=${month}&year=${year}`,
                "_blank"
            );

        }
    );


    // ==========================================
    // DOWNLOAD CSV
    // ==========================================

    downloadCSV.addEventListener(
        "click",
        () => {

            const month =
                monthSelect.value;

            const year =
                yearInput.value;


            if (!month || !year) {

                alert(
                    "Please select a month and year."
                );

                return;

            }


            window.open(
                `/api/reports/monthly/csv?month=${month}&year=${year}`,
                "_blank"
            );

        }
    );


    // ==========================================
    // LOAD CURRENT MONTH AUTOMATICALLY
    // ==========================================

    generateReport();

});
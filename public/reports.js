// ==========================================
// MAFORI FC REPORTS
// REPORTS.JS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* ==========================================
           ELEMENTS
        ========================================== */

        const monthSelect =
            document.getElementById("month");

        const yearInput =
            document.getElementById("year");

        const generateButton =
            document.getElementById(
                "generateReport"
            );

        const downloadPDF =
            document.getElementById(
                "downloadPDF"
            );

        const downloadCSV =
            document.getElementById(
                "downloadExcel"
            );

        const reportTable =
            document.getElementById(
                "reportTable"
            );

        const totalPlayers =
            document.getElementById(
                "totalPlayers"
            );

        const presentPlayers =
            document.getElementById(
                "presentPlayers"
            );

        const absentPlayers =
            document.getElementById(
                "absentPlayers"
            );

        const excusedPlayers =
            document.getElementById(
                "excusedPlayers"
            );

        const attendanceRate =
            document.getElementById(
                "attendanceRate"
            );


        /* ==========================================
           MONTH NAMES
        ========================================== */

        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];


        /* ==========================================
           CURRENT MONTH / YEAR
        ========================================== */

        const today =
            new Date();


        if (monthSelect) {

            monthSelect.value =
                today.getMonth() + 1;

        }


        if (yearInput) {

            yearInput.value =
                today.getFullYear();

        }


        /* ==========================================
           HELPER
           FORMAT DATE
        ========================================== */

        function formatDate(
            dateValue
        ) {

            if (!dateValue) {

                return "-";

            }


            const date =
                new Date(
                    dateValue +
                    "T00:00:00"
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return dateValue;

            }


            return date.toLocaleDateString(
                "en-ZA",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            );

        }


        /* ==========================================
           HELPER
           GET STATUS CLASS
        ========================================== */

        function getStatusClass(
            status
        ) {

            if (
                status ===
                "Present"
            ) {

                return "present";

            }


            if (
                status ===
                "Absent"
            ) {

                return "absent";

            }


            if (
                status ===
                "Excused"
            ) {

                return "excused";

            }


            return "";

        }


        /* ==========================================
           HELPER
           SAFE FILE DOWNLOAD
        ========================================== */

        async function downloadFile(
            url,
            filename,
            errorMessage
        ) {

            try {

                const response =
                    await fetch(
                        url
                    );


                if (!response.ok) {

                    let message =
                        errorMessage;


                    try {

                        const result =
                            await response.json();


                        message =
                            result.message ||
                            message;

                    }

                    catch (_) {

                        // Response was not JSON.

                    }


                    throw new Error(
                        message
                    );

                }


                const blob =
                    await response.blob();


                const objectUrl =
                    window.URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    objectUrl;


                link.download =
                    filename;


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                window.URL.revokeObjectURL(
                    objectUrl
                );


                return true;

            }

            catch (error) {

                console.error(
                    "Download error:",
                    error
                );


                alert(
                    error.message ||
                    errorMessage
                );


                return false;

            }

        }


        /* ==========================================
           GENERATE REPORT BUTTON
        ========================================== */

        if (generateButton) {

            generateButton.addEventListener(
                "click",
                generateReport
            );

        }


        /* ==========================================
           GENERATE REPORT
        ========================================== */

        async function generateReport() {

            const month =
                monthSelect
                    ? monthSelect.value
                    : "";


            const year =
                yearInput
                    ? yearInput.value
                    : "";


            /* ======================================
               VALIDATION
            ====================================== */

            if (!month) {

                alert(
                    "Please select a month."
                );

                return;

            }


            if (!year) {

                alert(
                    "Please enter a year."
                );

                return;

            }


            if (generateButton) {

                generateButton.disabled =
                    true;


                generateButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Generating...
                `;

            }


            try {

                console.log(
                    "Generating report:",
                    month,
                    year
                );


                /* ======================================
                   LOAD MONTHLY DATA
                ====================================== */

                const response =
                    await fetch(
                        `/api/reports/monthly/data?month=${encodeURIComponent(
                            month
                        )}&year=${encodeURIComponent(
                            year
                        )}`
                    );


                let result;


                try {

                    result =
                        await response.json();

                }

                catch (parseError) {

                    throw new Error(
                        "The server returned an invalid report response."
                    );

                }


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
                    result.report || {};


                const players =
                    Array.isArray(
                        report.players
                    )
                        ? report.players
                        : [];


                const sessions =
                    Array.isArray(
                        report.sessions
                    )
                        ? report.sessions
                        : [];


                const attendance =
                    Array.isArray(
                        report.attendance
                    )
                        ? report.attendance
                        : [];


                /* ======================================
                   TOTAL PLAYERS
                ====================================== */

                if (totalPlayers) {

                    totalPlayers.textContent =
                        players.length;

                }


                /* ======================================
                   ATTENDANCE STATISTICS
                ====================================== */

                let present = 0;

                let absent = 0;

                let excused = 0;


                attendance.forEach(
                    record => {

                        const status =
                            record.attendance_status;


                        if (
                            status ===
                            "Present"
                        ) {

                            present++;

                        }

                        else if (
                            status ===
                            "Absent"
                        ) {

                            absent++;

                        }

                        else if (
                            status ===
                            "Excused"
                        ) {

                            excused++;

                        }

                    }
                );


                if (presentPlayers) {

                    presentPlayers.textContent =
                        present;

                }


                if (absentPlayers) {

                    absentPlayers.textContent =
                        absent;

                }


                if (excusedPlayers) {

                    excusedPlayers.textContent =
                        excused;

                }


                const totalRecords =
                    present +
                    absent +
                    excused;


                const rate =
                    totalRecords > 0

                        ? (
                            (
                                present /
                                totalRecords
                            ) *
                            100
                        ).toFixed(1)

                        : "0.0";


                if (attendanceRate) {

                    attendanceRate.textContent =
                        rate + "%";

                }


                /* ======================================
                   CLEAR TABLE
                ====================================== */

                if (!reportTable) {

                    return;

                }


                reportTable.innerHTML =
                    "";


                /* ======================================
                   NO PLAYERS
                ====================================== */

                if (
                    players.length ===
                    0
                ) {

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


                /* ======================================
                   CREATE REPORT TABLE
                ====================================== */

                let rowNumber =
                    1;


                players.forEach(
                    player => {

                        const playerRecords =
                            attendance.filter(
                                record =>
                                    Number(
                                        record.player_id
                                    ) ===
                                    Number(
                                        player.id
                                    )
                            );


                        /* ==================================
                           PLAYER HAS NO ATTENDANCE
                        ================================== */

                        if (
                            playerRecords.length ===
                            0
                        ) {

                            const row =
                                document.createElement(
                                    "tr"
                                );


                            row.innerHTML = `

                                <td>
                                    ${rowNumber++}
                                </td>

                                <td>
                                    ${
                                        player.first_name ||
                                        ""
                                    }
                                    ${
                                        player.last_name ||
                                        ""
                                    }
                                </td>

                                <td>
                                    ${
                                        player.position ||
                                        "-"
                                    }
                                </td>

                                <td>
                                    -
                                </td>

                                <td>
                                    -
                                </td>

                            `;


                            reportTable.appendChild(
                                row
                            );


                            return;

                        }


                        /* ==================================
                           SORT PLAYER RECORDS BY DATE
                        ================================== */

                        const sortedRecords =
                            [...playerRecords]
                                .sort(
                                    (
                                        recordA,
                                        recordB
                                    ) => {

                                        const sessionA =
                                            sessions.find(
                                                session =>
                                                    Number(
                                                        session.id
                                                    ) ===
                                                    Number(
                                                        recordA.session_id
                                                    )
                                            );


                                        const sessionB =
                                            sessions.find(
                                                session =>
                                                    Number(
                                                        session.id
                                                    ) ===
                                                    Number(
                                                        recordB.session_id
                                                    )
                                            );


                                        const dateA =
                                            sessionA
                                                ? sessionA.session_date
                                                : "";


                                        const dateB =
                                            sessionB
                                                ? sessionB.session_date
                                                : "";


                                        return String(
                                            dateA
                                        ).localeCompare(
                                            String(
                                                dateB
                                            )
                                        );

                                    }
                                );


                        /* ==================================
                           CREATE ATTENDANCE ROWS
                        ================================== */

                        sortedRecords.forEach(
                            record => {

                                const session =
                                    sessions.find(
                                        session =>
                                            Number(
                                                session.id
                                            ) ===
                                            Number(
                                                record.session_id
                                            )
                                    );


                                const row =
                                    document.createElement(
                                        "tr"
                                    );


                                const status =
                                    record.attendance_status ||
                                    "-";


                                const statusClass =
                                    getStatusClass(
                                        status
                                    );


                                row.innerHTML = `

                                    <td>
                                        ${rowNumber++}
                                    </td>

                                    <td>
                                        ${
                                            player.first_name ||
                                            ""
                                        }
                                        ${
                                            player.last_name ||
                                            ""
                                        }
                                    </td>

                                    <td>
                                        ${
                                            player.position ||
                                            "-"
                                        }
                                    </td>

                                    <td class="${statusClass}">
                                        ${status}
                                    </td>

                                    <td>
                                        ${
                                            session
                                                ? formatDate(
                                                    session.session_date
                                                )
                                                : "-"
                                        }
                                    </td>

                                `;


                                reportTable.appendChild(
                                    row
                                );

                            }
                        );

                    }
                );


                console.log(
                    "Report generated successfully.",
                    {
                        players:
                            players.length,

                        sessions:
                            sessions.length,

                        records:
                            attendance.length
                    }
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

                if (generateButton) {

                    generateButton.disabled =
                        false;


                    generateButton.innerHTML = `
                        <i class="fa-solid fa-chart-line"></i>
                        Generate Report
                    `;

                }

            }

        }


        /* ==========================================
           DOWNLOAD PDF
        ========================================== */

        if (downloadPDF) {

            downloadPDF.addEventListener(
                "click",
                async () => {

                    const month =
                        monthSelect
                            ? monthSelect.value
                            : "";


                    const year =
                        yearInput
                            ? yearInput.value
                            : "";


                    if (
                        !month ||
                        !year
                    ) {

                        alert(
                            "Please select a month and year."
                        );

                        return;

                    }


                    const originalHTML =
                        downloadPDF.innerHTML;


                    downloadPDF.disabled =
                        true;


                    downloadPDF.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Downloading PDF...
                    `;


                    const success =
                        await downloadFile(

                            `/api/reports/monthly?month=${encodeURIComponent(
                                month
                            )}&year=${encodeURIComponent(
                                year
                            )}`,

                            `Mafori_FC_Attendance_${month}_${year}.pdf`,

                            "Unable to download the PDF report."

                        );


                    downloadPDF.disabled =
                        false;


                    downloadPDF.innerHTML =
                        originalHTML;


                    if (success) {

                        console.log(
                            "PDF downloaded successfully."
                        );

                    }

                }
            );

        }


        /* ==========================================
           DOWNLOAD CSV
           CURRENT SERVER STILL RETURNS CSV
        ========================================== */

        if (downloadCSV) {

            downloadCSV.addEventListener(
                "click",
                async () => {

                    const month =
                        monthSelect
                            ? monthSelect.value
                            : "";


                    const year =
                        yearInput
                            ? yearInput.value
                            : "";


                    if (
                        !month ||
                        !year
                    ) {

                        alert(
                            "Please select a month and year."
                        );

                        return;

                    }


                    const originalHTML =
                        downloadCSV.innerHTML;


                    downloadCSV.disabled =
                        true;


                    downloadCSV.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Downloading...
                    `;


                    await downloadFile(

                        `/api/reports/monthly/csv?month=${encodeURIComponent(
                            month
                        )}&year=${encodeURIComponent(
                            year
                        )}`,

                        `Mafori_FC_Attendance_${month}_${year}.csv`,

                        "Unable to download the attendance spreadsheet."

                    );


                    downloadCSV.disabled =
                        false;


                    downloadCSV.innerHTML =
                        originalHTML;

                }
            );

        }


        /* ==========================================
           AUTO LOAD CURRENT REPORT
        ========================================== */

        generateReport();

    }
);
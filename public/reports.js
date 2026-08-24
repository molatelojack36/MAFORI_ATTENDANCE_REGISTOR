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
            document.getElementById(
                "month"
            );


        const yearInput =
            document.getElementById(
                "year"
            );


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
           STATUS CLASS
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
           ESCAPE HTML
        ========================================== */

        function escapeHtml(
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



        /* ==========================================
           FILE DOWNLOAD
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


                await Swal.fire({

                    icon:
                        "error",

                    title:
                        "Download Failed",

                    text:
                        error.message ||
                        errorMessage,

                    confirmButtonText:
                        "Okay",

                    confirmButtonColor:
                        "#ff7a00"

                });


                return false;

            }

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

                await Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Select a Month",

                    text:
                        "Please select a month.",

                    confirmButtonColor:
                        "#ff7a00"

                });


                return;

            }


            if (!year) {

                await Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Enter a Year",

                    text:
                        "Please enter a year.",

                    confirmButtonColor:
                        "#ff7a00"

                });


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

                catch (_) {

                    throw new Error(
                        "The server returned an invalid report response."
                    );

                }


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(

                        result.message ||
                        "Unable to generate report."

                    );

                }


                const report =
                    result.report ||
                    {};


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
                   STATISTICS
                ====================================== */

                let present =
                    0;


                let absent =
                    0;


                let excused =
                    0;


                attendance.forEach(
                    record => {

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
                        rate +
                        "%";

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
                   CREATE TABLE
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
                           PLAYER WITHOUT ATTENDANCE
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

                                    ${escapeHtml(
                                        `${player.first_name || ""} ${player.last_name || ""}`
                                            .trim()
                                    )}

                                </td>

                                <td>

                                    ${escapeHtml(
                                        player.position ||
                                        "-"
                                    )}

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
                           SORT RECORDS BY SESSION DATE
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
                           CREATE ROWS
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


                                const status =
                                    record.attendance_status ||
                                    "-";


                                const statusClass =
                                    getStatusClass(
                                        status
                                    );


                                const row =
                                    document.createElement(
                                        "tr"
                                    );


                                row.innerHTML = `

                                    <td>
                                        ${rowNumber++}
                                    </td>

                                    <td>

                                        ${escapeHtml(
                                            `${player.first_name || ""} ${player.last_name || ""}`
                                                .trim()
                                        )}

                                    </td>

                                    <td>

                                        ${escapeHtml(
                                            player.position ||
                                            "-"
                                        )}

                                    </td>

                                    <td class="${statusClass}">

                                        ${escapeHtml(
                                            status
                                        )}

                                    </td>

                                    <td>

                                        ${
                                            session
                                                ? escapeHtml(
                                                    formatDate(
                                                        session.session_date
                                                    )
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


                await Swal.fire({

                    icon:
                        "error",

                    title:
                        "Unable to Generate Report",

                    text:
                        error.message ||
                        "Something went wrong while generating the report.",

                    confirmButtonText:
                        "Okay",

                    confirmButtonColor:
                        "#ff7a00"

                });

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
           GENERATE REPORT BUTTON
        ========================================== */

        if (generateButton) {

            generateButton.addEventListener(
                "click",
                generateReport
            );

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

                        await Swal.fire({

                            icon:
                                "warning",

                            title:
                                "Select Month and Year",

                            text:
                                "Please select a month and year.",

                            confirmButtonColor:
                                "#ff7a00"

                        });


                        return;

                    }


                    const monthName =
                        monthNames[
                            Number(month) -
                            1
                        ];


                    const confirmation =
                        await Swal.fire({

                            icon:
                                "question",

                            title:
                                "Download PDF?",

                            html: `

                                <div class="report-download-popup">

                                    <div class="report-download-icon pdf-icon">

                                        <i class="fa-solid fa-file-pdf"></i>

                                    </div>

                                    <p>

                                        Download the Mafori FC attendance
                                        report for

                                    </p>

                                    <strong>

                                        ${escapeHtml(
                                            monthName
                                        )}
                                        ${escapeHtml(
                                            year
                                        )}

                                    </strong>

                                </div>

                            `,

                            showCancelButton:
                                true,

                            confirmButtonText:
                                '<i class="fa-solid fa-download"></i> Download PDF',

                            cancelButtonText:
                                "Cancel",

                            confirmButtonColor:
                                "#dc2626",

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

                        await Swal.fire({

                            icon:
                                "success",

                            title:
                                "PDF Downloaded!",

                            html: `

                                <div class="report-success-popup">

                                    <strong>

                                        ${escapeHtml(
                                            monthName
                                        )}
                                        ${escapeHtml(
                                            year
                                        )}

                                    </strong>

                                    <p>

                                        Your Mafori FC PDF attendance
                                        report has been downloaded successfully.

                                    </p>

                                </div>

                            `,

                            confirmButtonText:
                                "Done",

                            confirmButtonColor:
                                "#ff7a00",

                            timer:
                                2200,

                            timerProgressBar:
                                true

                        });

                    }

                }
            );

        }



        /* ==========================================
           DOWNLOAD CSV
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

                        await Swal.fire({

                            icon:
                                "warning",

                            title:
                                "Select Month and Year",

                            text:
                                "Please select a month and year.",

                            confirmButtonColor:
                                "#ff7a00"

                        });


                        return;

                    }


                    const monthName =
                        monthNames[
                            Number(month) -
                            1
                        ];


                    const confirmation =
                        await Swal.fire({

                            icon:
                                "question",

                            title:
                                "Download CSV?",

                            html: `

                                <div class="report-download-popup">

                                    <div class="report-download-icon csv-icon">

                                        <i class="fa-solid fa-file-csv"></i>

                                    </div>

                                    <p>

                                        Download Mafori FC attendance
                                        data for

                                    </p>

                                    <strong>

                                        ${escapeHtml(
                                            monthName
                                        )}
                                        ${escapeHtml(
                                            year
                                        )}

                                    </strong>

                                </div>

                            `,

                            showCancelButton:
                                true,

                            confirmButtonText:
                                '<i class="fa-solid fa-download"></i> Download CSV',

                            cancelButtonText:
                                "Cancel",

                            confirmButtonColor:
                                "#16a34a",

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


                    const originalHTML =
                        downloadCSV.innerHTML;


                    downloadCSV.disabled =
                        true;


                    downloadCSV.innerHTML = `

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Downloading...

                    `;


                    const success =
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


                    if (success) {

                        await Swal.fire({

                            icon:
                                "success",

                            title:
                                "CSV Downloaded!",

                            html: `

                                <div class="report-success-popup">

                                    <strong>

                                        ${escapeHtml(
                                            monthName
                                        )}
                                        ${escapeHtml(
                                            year
                                        )}

                                    </strong>

                                    <p>

                                        Your Mafori FC attendance CSV
                                        has been downloaded successfully.

                                    </p>

                                </div>

                            `,

                            confirmButtonText:
                                "Done",

                            confirmButtonColor:
                                "#ff7a00",

                            timer:
                                2200,

                            timerProgressBar:
                                true

                        });

                    }

                }
            );

        }



        /* ==========================================
           AUTO LOAD CURRENT REPORT
        ========================================== */

        generateReport();

    }
);



/* ==========================================
   LOGOUT
========================================== */

async function logout() {

    const result =
        await Swal.fire({

            icon:
                "question",

            title:
                "Logout from Mafori FC?",

            html: `

                <div class="reports-logout-popup">

                    <div class="logout-ball">

                        <i class="fa-solid fa-futbol"></i>

                    </div>

                    <p>

                        Are you sure you want to logout
                        from the Mafori FC Attendance Register?

                    </p>

                    <span>

                        Your reports and attendance records
                        are safely stored.

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
                "#ff7a00",

            cancelButtonColor:
                "#64748b",

            reverseButtons:
                true,

            focusCancel:
                true,

            showClass: {

                popup:
                    "reports-popup-in"

            },

            hideClass: {

                popup:
                    "reports-popup-out"

            }

        });


    if (
        !result.isConfirmed
    ) {

        return;

    }


    Swal.fire({

        title:
            "Logging Out...",

        html: `

            <div class="reports-logout-loading">

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


    localStorage.removeItem(
        "user"
    );


    sessionStorage.clear();


    setTimeout(
        () => {

            window.location.href =
                "login.html";

        },
        1000
    );

}
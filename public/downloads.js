// ==========================================
// MAFORI FC ATTENDANCE REGISTER
// DOWNLOADS.JS
// ==========================================


/* ==========================================
   LOGOUT
========================================== */

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (
        confirmLogout
    ) {

        window.location.href =
            "login.html";

    }

}


/* ==========================================
   POPULATE YEAR DROPDOWN
========================================== */

function loadYears() {

    const yearSelect =
        document.getElementById(
            "year"
        );


    if (!yearSelect) {

        return;

    }


    const currentYear =
        new Date().getFullYear();


    /*
        Clear existing dynamically-added
        options where necessary.
    */

    const existingValues =
        Array.from(
            yearSelect.options
        ).map(
            option =>
                String(
                    option.value
                )
        );


    /*
        Current year + next year +
        previous five years.
    */

    for (
        let year =
            currentYear + 1;

        year >=
        currentYear - 5;

        year--
    ) {

        if (
            existingValues.includes(
                String(year)
            )
        ) {

            continue;

        }


        const option =
            document.createElement(
                "option"
            );


        option.value =
            year;


        option.textContent =
            year;


        yearSelect.appendChild(
            option
        );

    }


    yearSelect.value =
        currentYear;

}


/* ==========================================
   SELECT CURRENT MONTH
========================================== */

function loadCurrentMonth() {

    const monthSelect =
        document.getElementById(
            "month"
        );


    if (!monthSelect) {

        return;

    }


    const currentMonth =
        new Date().getMonth() + 1;


    monthSelect.value =
        currentMonth;

}


/* ==========================================
   FILE DOWNLOAD HELPER
========================================== */

async function downloadReportFile(
    url,
    filename,
    defaultErrorMessage
) {

    try {

        const response =
            await fetch(
                url
            );


        if (!response.ok) {

            let message =
                defaultErrorMessage;


            try {

                const error =
                    await response.json();


                message =
                    error.message ||
                    message;

            }

            catch (_) {

                // Response may not be JSON.

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
            "Download Error:",
            error
        );


        alert(
            error.message ||
            defaultErrorMessage
        );


        return false;

    }

}


/* ==========================================
   DOWNLOAD PDF
========================================== */

const downloadPdfButton =
    document.getElementById(
        "downloadPdf"
    );


if (downloadPdfButton) {

    downloadPdfButton.addEventListener(
        "click",
        async function () {

            const monthElement =
                document.getElementById(
                    "month"
                );


            const yearElement =
                document.getElementById(
                    "year"
                );


            const month =
                monthElement
                    ? monthElement.value
                    : "";


            const year =
                yearElement
                    ? yearElement.value
                    : "";


            /* ======================================
               VALIDATE MONTH
            ====================================== */

            if (!month) {

                alert(
                    "Please select a month."
                );

                return;

            }


            /* ======================================
               VALIDATE YEAR
            ====================================== */

            if (!year) {

                alert(
                    "Please select a year."
                );

                return;

            }


            const originalHTML =
                downloadPdfButton.innerHTML;


            downloadPdfButton.disabled =
                true;


            downloadPdfButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Preparing PDF...
            `;


            await downloadReportFile(

                `/api/reports/monthly?month=${encodeURIComponent(
                    month
                )}&year=${encodeURIComponent(
                    year
                )}`,

                `Mafori_FC_Attendance_${month}_${year}.pdf`,

                "Failed to download the PDF report."

            );


            downloadPdfButton.disabled =
                false;


            downloadPdfButton.innerHTML =
                originalHTML;

        }
    );

}


/* ==========================================
   DOWNLOAD CSV
========================================== */

const downloadCsvButton =
    document.getElementById(
        "downloadCsv"
    );


if (downloadCsvButton) {

    downloadCsvButton.addEventListener(
        "click",
        async function () {

            const monthElement =
                document.getElementById(
                    "month"
                );


            const yearElement =
                document.getElementById(
                    "year"
                );


            const month =
                monthElement
                    ? monthElement.value
                    : "";


            const year =
                yearElement
                    ? yearElement.value
                    : "";


            /* ======================================
               VALIDATE MONTH
            ====================================== */

            if (!month) {

                alert(
                    "Please select a month."
                );

                return;

            }


            /* ======================================
               VALIDATE YEAR
            ====================================== */

            if (!year) {

                alert(
                    "Please select a year."
                );

                return;

            }


            const originalHTML =
                downloadCsvButton.innerHTML;


            downloadCsvButton.disabled =
                true;


            downloadCsvButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Preparing File...
            `;


            await downloadReportFile(

                `/api/reports/monthly/csv?month=${encodeURIComponent(
                    month
                )}&year=${encodeURIComponent(
                    year
                )}`,

                `Mafori_FC_Attendance_${month}_${year}.csv`,

                "Failed to download the attendance spreadsheet."

            );


            downloadCsvButton.disabled =
                false;


            downloadCsvButton.innerHTML =
                originalHTML;

        }
    );

}


/* ==========================================
   INITIALIZE PAGE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadYears();

        loadCurrentMonth();

    }
);
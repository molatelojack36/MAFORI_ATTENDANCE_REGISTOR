// =====================================
// DOWNLOADS.JS
// MAFORI FC
// =====================================


// =====================================
// LOGOUT
// =====================================

function logout() {

    const confirmLogout = confirm(
        "Are you sure you want to logout?"
    );

    if (confirmLogout) {

        window.location.href = "login.html";

    }

}


// =====================================
// POPULATE YEAR DROPDOWN
// =====================================

function loadYears() {

    const yearSelect = document.getElementById("year");

    const currentYear = new Date().getFullYear();

    // Add the previous 5 years
    // and the next year

    for (
        let year = currentYear + 1;
        year >= currentYear - 5;
        year--
    ) {

        const option = document.createElement("option");

        option.value = year;

        option.textContent = year;

        yearSelect.appendChild(option);

    }

    // Automatically select current year

    yearSelect.value = currentYear;

}


// =====================================
// SELECT CURRENT MONTH
// =====================================

function loadCurrentMonth() {

    const monthSelect =
        document.getElementById("month");

    const currentMonth =
        new Date().getMonth() + 1;

    monthSelect.value = currentMonth;

}


// =====================================
// DOWNLOAD PDF
// =====================================

document
    .getElementById("downloadPdf")
    .addEventListener("click", async function () {

        const month =
            document.getElementById("month").value;

        const year =
            document.getElementById("year").value;


        // Check month

        if (!month) {

            alert("Please select a month.");

            return;

        }


        // Check year

        if (!year) {

            alert("Please select a year.");

            return;

        }


        try {

            const response = await fetch(
                `/api/reports/monthly?month=${month}&year=${year}`
            );


            if (!response.ok) {

                const error =
                    await response.json();

                alert(
                    error.message ||
                    "Unable to generate report."
                );

                return;

            }


            const blob =
                await response.blob();


            // Create temporary download URL

            const url =
                window.URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                `Mafori_FC_Attendance_${month}_${year}.pdf`;


            document.body.appendChild(link);

            link.click();

            link.remove();


            window.URL.revokeObjectURL(url);

        }

        catch (error) {

            console.error(
                "PDF Download Error:",
                error
            );

            alert(
                "Failed to download the PDF report."
            );

        }

    });


// =====================================
// DOWNLOAD CSV
// =====================================

document
    .getElementById("downloadCsv")
    .addEventListener("click", async function () {

        const month =
            document.getElementById("month").value;

        const year =
            document.getElementById("year").value;


        // Check month

        if (!month) {

            alert("Please select a month.");

            return;

        }


        // Check year

        if (!year) {

            alert("Please select a year.");

            return;

        }


        try {

            const response = await fetch(
                `/api/reports/monthly/csv?month=${month}&year=${year}`
            );


            if (!response.ok) {

                const error =
                    await response.json();

                alert(
                    error.message ||
                    "Unable to generate CSV."
                );

                return;

            }


            const blob =
                await response.blob();


            // Create temporary download URL

            const url =
                window.URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                `Mafori_FC_Attendance_${month}_${year}.csv`;


            document.body.appendChild(link);

            link.click();

            link.remove();


            window.URL.revokeObjectURL(url);

        }

        catch (error) {

            console.error(
                "CSV Download Error:",
                error
            );

            alert(
                "Failed to download the CSV file."
            );

        }

    });


// =====================================
// INITIALIZE PAGE
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadYears();

        loadCurrentMonth();

    }
);
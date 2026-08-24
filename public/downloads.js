// ==========================================
// MAFORI FC ATTENDANCE REGISTER
// DOWNLOADS.JS
// ==========================================


/* ==========================================
   POLISHED LOGOUT
========================================== */

async function logout() {

    const result =
        await Swal.fire({

            icon:
                "question",

            title:
                "Logout from Mafori FC?",

            html: `

                <div class="downloads-logout-content">

                    <div class="logout-ball">

                        <i class="fa-solid fa-futbol"></i>

                    </div>

                    <p>

                        Are you sure you want to logout
                        from the Attendance Register?

                    </p>

                    <span>

                        Your saved attendance records and
                        downloaded reports will not be affected.

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
                    "downloads-popup-in"

            },

            hideClass: {

                popup:
                    "downloads-popup-out"

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

            <div class="downloads-logout-loading">

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


    const existingValues =
        Array.from(
            yearSelect.options
        ).map(
            option =>
                String(
                    option.value
                )
        );


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
   GET MONTH NAME
========================================== */

function getMonthName(
    month
) {

    const months = [

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


    return months[
        Number(month) - 1
    ] || "";

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


        await Swal.fire({

            icon:
                "error",

            title:
                "Download Failed",

            text:
                error.message ||
                defaultErrorMessage,

            confirmButtonText:
                "Okay",

            confirmButtonColor:
                "#ff7a00"

        });


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

                await Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Select a Month",

                    text:
                        "Please select a month before downloading the report.",

                    confirmButtonText:
                        "Okay",

                    confirmButtonColor:
                        "#ff7a00"

                });


                return;

            }


            /* ======================================
               VALIDATE YEAR
            ====================================== */

            if (!year) {

                await Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Select a Year",

                    text:
                        "Please select a year before downloading the report.",

                    confirmButtonText:
                        "Okay",

                    confirmButtonColor:
                        "#ff7a00"

                });


                return;

            }


            const monthName =
                getMonthName(
                    month
                );


            const confirmation =
                await Swal.fire({

                    icon:
                        "question",

                    title:
                        "Download PDF?",

                    html: `

                        <div class="download-confirmation">

                            <div class="download-confirm-icon">

                                <i class="fa-solid fa-file-pdf"></i>

                            </div>

                            <p>

                                Download the Mafori FC attendance
                                register for

                            </p>

                            <strong>

                                ${monthName} ${year}

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
                        "#ff7a00",

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
                downloadPdfButton.innerHTML;


            downloadPdfButton.disabled =
                true;


            downloadPdfButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Preparing PDF...

            `;


            const success =
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


            if (success) {

                await Swal.fire({

                    icon:
                        "success",

                    title:
                        "PDF Ready!",

                    html: `

                        <div class="download-success">

                            <p>

                                The Mafori FC attendance register for

                            </p>

                            <strong>

                                ${monthName} ${year}

                            </strong>

                            <p>

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

                await Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Select a Month",

                    text:
                        "Please select a month before downloading the attendance data.",

                    confirmButtonText:
                        "Okay",

                    confirmButtonColor:
                        "#ff7a00"

                });


                return;

            }


            /* ======================================
               VALIDATE YEAR
            ====================================== */

            if (!year) {

                await Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Select a Year",

                    text:
                        "Please select a year before downloading the attendance data.",

                    confirmButtonText:
                        "Okay",

                    confirmButtonColor:
                        "#ff7a00"

                });


                return;

            }


            const monthName =
                getMonthName(
                    month
                );


            const confirmation =
                await Swal.fire({

                    icon:
                        "question",

                    title:
                        "Download CSV?",

                    html: `

                        <div class="download-confirmation">

                            <div class="download-confirm-icon csv-confirm-icon">

                                <i class="fa-solid fa-file-csv"></i>

                            </div>

                            <p>

                                Download Mafori FC attendance data for

                            </p>

                            <strong>

                                ${monthName} ${year}

                            </strong>

                        </div>

                    `,

                    showCancelButton:
                        true,

                    confirmButtonText:
                        '<i class="fa-solid fa-file-arrow-down"></i> Download CSV',

                    cancelButtonText:
                        "Cancel",

                    confirmButtonColor:
                        "#ff7a00",

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
                downloadCsvButton.innerHTML;


            downloadCsvButton.disabled =
                true;


            downloadCsvButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Preparing File...

            `;


            const success =
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


            if (success) {

                await Swal.fire({

                    icon:
                        "success",

                    title:
                        "CSV Ready!",

                    html: `

                        <div class="download-success">

                            <p>

                                Mafori FC attendance data for

                            </p>

                            <strong>

                                ${monthName} ${year}

                            </strong>

                            <p>

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
   INITIALIZE PAGE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadYears();

        loadCurrentMonth();

    }
);
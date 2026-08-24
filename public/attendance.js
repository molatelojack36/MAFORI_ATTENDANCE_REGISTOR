// ==========================================
// MAFORI FC ATTENDANCE
// ATTENDANCE.JS
// ==========================================


/* ==========================================
   ELEMENTS
========================================== */

const attendanceTable =
    document.getElementById("attendanceTable");

const attendanceDate =
    document.getElementById("attendanceDate");

const selectedDateText =
    document.getElementById("selectedDateText");

const registerStatus =
    document.getElementById("registerStatus");

const searchPlayer =
    document.getElementById("searchPlayer");

const loadAttendanceButton =
    document.getElementById("loadAttendance");

const todayButton =
    document.getElementById("todayButton");

const saveAttendanceButton =
    document.getElementById("saveAttendance");


/* ==========================================
   STATE
========================================== */

let players = [];

let currentRegisterDate = null;

let currentSessionExists = false;


/* ==========================================
   SOUTH AFRICA DATE
========================================== */

function getSouthAfricaDate() {

    const now =
        new Date();

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Africa/Johannesburg",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        )
            .formatToParts(now);

    const getPart =
        type =>
            parts.find(
                part =>
                    part.type === type
            )?.value;

    const year =
        getPart("year");

    const month =
        getPart("month");

    const day =
        getPart("day");

    return `${year}-${month}-${day}`;

}


/* ==========================================
   FORMAT DATE
========================================== */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(
            `${dateValue}T00:00:00`
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
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(value) {

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
   STATUS CLASS
========================================== */

function getStatusClass(status) {

    if (
        status === "Present"
    ) {
        return "status-present";
    }

    if (
        status === "Absent"
    ) {
        return "status-absent";
    }

    if (
        status === "Excused"
    ) {
        return "status-excused";
    }

    return "status-unmarked";

}


/* ==========================================
   SET REGISTER STATUS
========================================== */

function updateRegisterStatus() {

    if (!registerStatus) {
        return;
    }

    if (currentSessionExists) {

        registerStatus.textContent =
            "Saved Register";

        registerStatus.className =
            "register-status saved";

    }
    else {

        registerStatus.textContent =
            "New / Not Saved";

        registerStatus.className =
            "register-status unsaved";

    }

}


/* ==========================================
   LOAD REGISTER
========================================== */

async function loadAttendanceRegister(date) {

    if (!date) {

        await Swal.fire({

            icon: "warning",

            title: "Select a Date",

            text:
                "Please select an attendance date.",

            confirmButtonText:
                "Okay",

            confirmButtonColor:
                "#ff9800"

        });

        return;

    }


    currentRegisterDate =
        date;


    if (selectedDateText) {

        selectedDateText.textContent =
            formatDate(date);

    }


    if (attendanceTable) {

        attendanceTable.innerHTML = `

            <tr class="loading-row">

                <td colspan="8">

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Loading attendance register...

                </td>

            </tr>

        `;

    }


    if (loadAttendanceButton) {

        loadAttendanceButton.disabled =
            true;

        loadAttendanceButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Loading...

        `;

    }


    try {

        const response =
            await fetch(

                `/api/attendance/date/${encodeURIComponent(
                    date
                )}`

            );


        let result;


        try {

            result =
                await response.json();

        }
        catch (error) {

            throw new Error(
                "The server returned an invalid attendance response."
            );

        }


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load attendance."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to load attendance."
            );

        }


        players =
            Array.isArray(
                result.players
            )
                ? result.players
                : [];


        currentSessionExists =
            Boolean(
                result.sessionExists
            );


        updateRegisterStatus();

        renderPlayers(
            players
        );

    }
    catch (error) {

        console.error(
            "Load attendance error:",
            error
        );


        players =
            [];


        if (attendanceTable) {

            attendanceTable.innerHTML = `

                <tr>

                    <td colspan="8">

                        Unable to load attendance register.

                    </td>

                </tr>

            `;

        }


        await Swal.fire({

            icon: "error",

            title:
                "Unable to Load Register",

            text:
                error.message,

            confirmButtonText:
                "Okay",

            confirmButtonColor:
                "#ff9800"

        });

    }
    finally {

        if (loadAttendanceButton) {

            loadAttendanceButton.disabled =
                false;

            loadAttendanceButton.innerHTML = `

                <i class="fa-solid fa-rotate"></i>

                Load Register

            `;

        }

    }

}


/* ==========================================
   RENDER PLAYERS
========================================== */

function renderPlayers(playerList) {

    if (!attendanceTable) {
        return;
    }


    attendanceTable.innerHTML =
        "";


    if (
        !Array.isArray(playerList) ||
        playerList.length === 0
    ) {

        attendanceTable.innerHTML = `

            <tr>

                <td colspan="8">

                    No active players found.

                </td>

            </tr>

        `;

        return;

    }


    playerList.forEach(
        (
            player,
            index
        ) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.dataset.playerId =
                player.id;


            const playerName =
                `${player.first_name || ""} ${player.last_name || ""}`
                    .trim();


            const nickname =
                player.nickname
                    ? ` (${player.nickname})`
                    : "";


            const status =
                player.attendance_status ||
                "";


            const statusLabel =
                status ||
                "Not Marked";


            const statusClass =
                getStatusClass(status);


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>

                    <div class="player-name">

                        <strong>
                            ${escapeHtml(
                                playerName
                            )}
                        </strong>

                        ${
                            nickname
                                ? `
                                    <small>
                                        ${escapeHtml(
                                            nickname
                                        )}
                                    </small>
                                `
                                : ""
                        }

                    </div>

                </td>

                <td>

                    ${escapeHtml(
                        player.position ||
                        "-"
                    )}

                </td>

                <td>

                    <input
                        type="radio"
                        name="attendance_${player.id}"
                        value="Present"
                        ${
                            status === "Present"
                                ? "checked"
                                : ""
                        }
                    >

                </td>

                <td>

                    <input
                        type="radio"
                        name="attendance_${player.id}"
                        value="Absent"
                        ${
                            status === "Absent"
                                ? "checked"
                                : ""
                        }
                    >

                </td>

                <td>

                    <input
                        type="radio"
                        name="attendance_${player.id}"
                        value="Excused"
                        ${
                            status === "Excused"
                                ? "checked"
                                : ""
                        }
                    >

                </td>

                <td>

                    <span
                        class="current-status ${statusClass}"
                        id="status_${player.id}"
                    >

                        ${escapeHtml(
                            statusLabel
                        )}

                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="edit-attendance-btn"
                        data-player-id="${player.id}"
                    >

                        <i class="fa-solid fa-pen"></i>

                        Edit

                    </button>

                </td>

            `;


            attendanceTable.appendChild(
                row
            );

        }
    );


    attachEditButtons();

}


/* ==========================================
   ATTACH EDIT BUTTONS
========================================== */

function attachEditButtons() {

    const buttons =
        document.querySelectorAll(
            ".edit-attendance-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const playerId =
                        Number(
                            button.dataset.playerId
                        );

                    editPlayerAttendance(
                        playerId
                    );

                }
            );

        }
    );

}


/* ==========================================
   FIND SELECTED STATUS
========================================== */

function getSelectedStatus(playerId) {

    const selected =
        document.querySelector(

            `input[name="attendance_${playerId}"]:checked`

        );


    return selected
        ? selected.value
        : null;

}


/* ==========================================
   EDIT ONE PLAYER
========================================== */

async function editPlayerAttendance(playerId) {

    const player =
        players.find(
            item =>
                Number(item.id) ===
                Number(playerId)
        );


    if (!player) {
        return;
    }


    if (!currentRegisterDate) {

        await Swal.fire({

            icon: "warning",

            title:
                "Register Date Required",

            text:
                "Please select and load an attendance date first.",

            confirmButtonColor:
                "#ff9800"

        });

        return;

    }


    const currentStatus =
        getSelectedStatus(
            playerId
        ) ||
        player.attendance_status ||
        "";


    const playerName =
        `${player.first_name || ""} ${player.last_name || ""}`
            .trim();


    const result =
        await Swal.fire({

            icon:
                "question",

            title:
                "Edit Attendance",

            html: `

                <div class="attendance-edit-popup">

                    <p
                        style="
                            margin-bottom:6px;
                            color:#64748b;
                        "
                    >
                        Update attendance for
                    </p>

                    <p>

                        <strong
                            style="
                                color:#0b1f3a;
                                font-size:18px;
                            "
                        >

                            ${escapeHtml(
                                playerName
                            )}

                        </strong>

                    </p>

                    <div
                        style="
                            margin-top:10px;
                            margin-bottom:14px;
                            color:#ff7a00;
                            font-weight:600;
                        "
                    >

                        <i class="fa-solid fa-calendar-day"></i>

                        ${escapeHtml(
                            formatDate(
                                currentRegisterDate
                            )
                        )}

                    </div>

                    <select
                        id="editAttendanceStatus"
                        class="swal2-select"
                    >

                        <option
                            value=""
                            ${
                                !currentStatus
                                    ? "selected"
                                    : ""
                            }
                        >
                            Select status
                        </option>

                        <option
                            value="Present"
                            ${
                                currentStatus ===
                                "Present"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Present
                        </option>

                        <option
                            value="Absent"
                            ${
                                currentStatus ===
                                "Absent"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Absent
                        </option>

                        <option
                            value="Excused"
                            ${
                                currentStatus ===
                                "Excused"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Excused
                        </option>

                    </select>

                </div>

            `,

            showCancelButton:
                true,

            confirmButtonText:
                '<i class="fa-solid fa-check"></i> Update Attendance',

            cancelButtonText:
                "Cancel",

            confirmButtonColor:
                "#ff9800",

            cancelButtonColor:
                "#64748b",

            reverseButtons:
                true,

            preConfirm:
                () => {

                    const status =
                        document
                            .getElementById(
                                "editAttendanceStatus"
                            )
                            .value;


                    if (!status) {

                        Swal.showValidationMessage(
                            "Please select an attendance status."
                        );

                        return false;

                    }


                    return status;

                }

        });


    if (!result.isConfirmed) {
        return;
    }


    await updatePlayerAttendance(
        player,
        result.value
    );

}


/* ==========================================
   UPDATE ONE PLAYER
========================================== */

async function updatePlayerAttendance(
    player,
    newStatus
) {

    const playerName =
        `${player.first_name || ""} ${player.last_name || ""}`
            .trim();


    Swal.fire({

        title:
            "Updating Attendance",

        html: `

            <div class="logout-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                <p>
                    Updating ${escapeHtml(
                        playerName
                    )}...
                </p>

            </div>

        `,

        showConfirmButton:
            false,

        allowOutsideClick:
            false,

        allowEscapeKey:
            false

    });


    try {

        const response =
            await fetch(

                `/api/attendance/player/${encodeURIComponent(
                    player.id
                )}`,

                {

                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            date:
                                currentRegisterDate,

                            attendance_status:
                                newStatus

                        })

                }

            );


        let result;


        try {

            result =
                await response.json();

        }
        catch (error) {

            throw new Error(
                "The server returned an invalid response."
            );

        }


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to update attendance."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to update attendance."
            );

        }


        player.attendance_status =
            newStatus;


        currentSessionExists =
            true;


        updateRegisterStatus();


        const radio =
            document.querySelector(

                `input[name="attendance_${player.id}"][value="${newStatus}"]`

            );


        if (radio) {
            radio.checked = true;
        }


        const statusLabel =
            document.getElementById(
                `status_${player.id}`
            );


        if (statusLabel) {

            statusLabel.textContent =
                newStatus;

            statusLabel.className =
                `current-status ${getStatusClass(
                    newStatus
                )}`;

        }


        await Swal.fire({

            icon:
                "success",

            title:
                "Attendance Updated!",

            html: `

                <div class="attendance-success-popup">

                    <div class="success-date">

                        <i class="fa-solid fa-user-check"></i>

                        ${escapeHtml(
                            playerName
                        )}

                    </div>

                    <p>

                        Attendance has been updated to

                        <strong>
                            ${escapeHtml(
                                newStatus
                            )}
                        </strong>

                        for

                        ${escapeHtml(
                            formatDate(
                                currentRegisterDate
                            )
                        )}.

                    </p>

                </div>

            `,

            confirmButtonText:
                "Done",

            confirmButtonColor:
                "#ff9800",

            timer:
                2200,

            timerProgressBar:
                true

        });

    }
    catch (error) {

        console.error(
            "Update attendance error:",
            error
        );


        await Swal.fire({

            icon:
                "error",

            title:
                "Update Failed",

            text:
                error.message,

            confirmButtonColor:
                "#ff9800"

        });

    }

}


/* ==========================================
   SAVE FULL REGISTER
========================================== */

async function saveFullRegister() {

    if (!currentRegisterDate) {

        await Swal.fire({

            icon:
                "warning",

            title:
                "Select Attendance Date",

            text:
                "Please select an attendance date.",

            confirmButtonColor:
                "#ff9800"

        });

        return;

    }


    const today =
        getSouthAfricaDate();


    /*
        The main save API saves today's
        Johannesburg register.

        Previous attendance registers
        must be corrected using Edit.
    */

    if (
        currentRegisterDate !==
        today
    ) {

        await Swal.fire({

            icon:
                "info",

            title:
                "Previous Register",

            text:
                "Use the Edit button beside a player to correct a previous attendance register.",

            confirmButtonColor:
                "#ff9800"

        });

        return;

    }


    const attendance =
        [];


    const unmarkedPlayers =
        [];


    players.forEach(
        player => {

            const status =
                getSelectedStatus(
                    player.id
                );


            if (!status) {

                unmarkedPlayers.push(
                    `${player.first_name || ""} ${player.last_name || ""}`
                        .trim()
                );

                return;

            }


            attendance.push({

                player_id:
                    player.id,

                attendance_status:
                    status

            });

        }
    );


    /* ======================================
       CHECK UNMARKED PLAYERS
    ====================================== */

    if (
        unmarkedPlayers.length > 0
    ) {

        const preview =
            unmarkedPlayers
                .slice(
                    0,
                    5
                )
                .join(", ");


        const extra =
            unmarkedPlayers.length > 5
                ? ` and ${unmarkedPlayers.length - 5} more`
                : "";


        await Swal.fire({

            icon:
                "warning",

            title:
                "Attendance Incomplete",

            html: `

                <p>
                    Please mark attendance for:
                </p>

                <strong>
                    ${escapeHtml(
                        preview
                    )}
                    ${escapeHtml(
                        extra
                    )}
                </strong>

            `,

            confirmButtonText:
                "Okay",

            confirmButtonColor:
                "#ff9800"

        });


        return;

    }


    /* ======================================
       COUNT STATUS VALUES
    ====================================== */

    const presentCount =
        attendance.filter(
            item =>
                item.attendance_status ===
                "Present"
        ).length;


    const absentCount =
        attendance.filter(
            item =>
                item.attendance_status ===
                "Absent"
        ).length;


    const excusedCount =
        attendance.filter(
            item =>
                item.attendance_status ===
                "Excused"
        ).length;


    /* ======================================
       CONFIRM SAVE
    ====================================== */

    const confirmation =
        await Swal.fire({

            icon:
                "question",

            title:
                "Save Attendance Register?",

            html: `

                <div class="attendance-confirm-popup">

                    <div class="success-date">

                        <i class="fa-solid fa-calendar-check"></i>

                        ${escapeHtml(
                            formatDate(
                                currentRegisterDate
                            )
                        )}

                    </div>

                    <p
                        style="
                            margin-top:15px;
                            margin-bottom:15px;
                            color:#64748b;
                        "
                    >
                        Please confirm today's attendance.
                    </p>

                    <div
                        style="
                            display:flex;
                            justify-content:center;
                            gap:10px;
                            flex-wrap:wrap;
                        "
                    >

                        <span
                            style="
                                padding:7px 12px;
                                border-radius:20px;
                                background:#eaf8ef;
                                color:#20863d;
                                font-size:12px;
                                font-weight:600;
                            "
                        >
                            Present: ${presentCount}
                        </span>

                        <span
                            style="
                                padding:7px 12px;
                                border-radius:20px;
                                background:#fdeaea;
                                color:#c62828;
                                font-size:12px;
                                font-weight:600;
                            "
                        >
                            Absent: ${absentCount}
                        </span>

                        <span
                            style="
                                padding:7px 12px;
                                border-radius:20px;
                                background:#fff3df;
                                color:#d97706;
                                font-size:12px;
                                font-weight:600;
                            "
                        >
                            Excused: ${excusedCount}
                        </span>

                    </div>

                </div>

            `,

            showCancelButton:
                true,

            confirmButtonText:
                '<i class="fa-solid fa-floppy-disk"></i> Save Register',

            cancelButtonText:
                "Cancel",

            confirmButtonColor:
                "#28a745",

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


    /* ======================================
       SAVING STATE
    ====================================== */

    if (saveAttendanceButton) {

        saveAttendanceButton.disabled =
            true;

        saveAttendanceButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Saving Attendance...

        `;

    }


    try {

        const response =
            await fetch(

                "/api/attendance",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            attendance:
                                attendance

                        })

                }

            );


        let result;


        try {

            result =
                await response.json();

        }
        catch (error) {

            throw new Error(
                "The server returned an invalid response."
            );

        }


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to save attendance."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to save attendance."
            );

        }


        currentSessionExists =
            true;


        updateRegisterStatus();


        players.forEach(
            player => {

                player.attendance_status =
                    getSelectedStatus(
                        player.id
                    );

            }
        );


        renderPlayers(
            players
        );


        /* ======================================
           POLISHED SUCCESS POPUP
        ====================================== */

        await Swal.fire({

            icon:
                "success",

            title:
                "Attendance Saved Successfully!",

            html: `

                <div class="attendance-success-popup">

                    <div class="success-date">

                        <i class="fa-solid fa-calendar-check"></i>

                        ${escapeHtml(
                            formatDate(
                                currentRegisterDate
                            )
                        )}

                    </div>

                    <p>

                        The Mafori FC attendance register
                        has been saved successfully.

                    </p>

                    <div
                        style="
                            display:flex;
                            justify-content:center;
                            gap:8px;
                            flex-wrap:wrap;
                            margin-top:15px;
                        "
                    >

                        <span
                            style="
                                background:#eaf8ef;
                                color:#20863d;
                                padding:7px 11px;
                                border-radius:20px;
                                font-size:12px;
                                font-weight:600;
                            "
                        >
                            ${presentCount} Present
                        </span>

                        <span
                            style="
                                background:#fdeaea;
                                color:#c62828;
                                padding:7px 11px;
                                border-radius:20px;
                                font-size:12px;
                                font-weight:600;
                            "
                        >
                            ${absentCount} Absent
                        </span>

                        <span
                            style="
                                background:#fff3df;
                                color:#d97706;
                                padding:7px 11px;
                                border-radius:20px;
                                font-size:12px;
                                font-weight:600;
                            "
                        >
                            ${excusedCount} Excused
                        </span>

                    </div>

                    <div class="success-summary">

                        <span>

                            <i class="fa-solid fa-circle-check"></i>

                            Register Updated

                        </span>

                    </div>

                </div>

            `,

            confirmButtonText:
                "Done",

            confirmButtonColor:
                "#ff9800",

            timer:
                2600,

            timerProgressBar:
                true,

            showClass: {

                popup:
                    "swal2-show attendance-popup-in"

            },

            hideClass: {

                popup:
                    "swal2-hide attendance-popup-out"

            }

        });

    }
    catch (error) {

        console.error(
            "Save attendance error:",
            error
        );


        await Swal.fire({

            icon:
                "error",

            title:
                "Unable to Save",

            text:
                error.message,

            confirmButtonText:
                "Okay",

            confirmButtonColor:
                "#ff9800"

        });

    }
    finally {

        if (saveAttendanceButton) {

            saveAttendanceButton.disabled =
                false;

            saveAttendanceButton.innerHTML = `

                <i class="fa-solid fa-floppy-disk"></i>

                Save Attendance Register

            `;

        }

    }

}


/* ==========================================
   SEARCH PLAYERS
========================================== */

function filterPlayers() {

    if (!searchPlayer) {
        return;
    }


    const search =
        searchPlayer.value
            .trim()
            .toLowerCase();


    if (!search) {

        renderPlayers(
            players
        );

        return;

    }


    const filtered =
        players.filter(
            player => {

                const searchable =
                    [
                        player.first_name,
                        player.last_name,
                        player.nickname,
                        player.position
                    ]
                        .filter(
                            Boolean
                        )
                        .join(" ")
                        .toLowerCase();


                return searchable.includes(
                    search
                );

            }
        );


    renderPlayers(
        filtered
    );

}


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

                <div class="logout-popup-content">

                    <p>
                        Are you sure you want to logout
                        from the Attendance Register?
                    </p>

                    <span>
                        Your saved attendance records
                        will not be affected.
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
                "#ff6f00",

            cancelButtonColor:
                "#64748b",

            reverseButtons:
                true,

            focusCancel:
                true,

            showClass: {

                popup:
                    "swal2-show logout-popup-in"

            },

            hideClass: {

                popup:
                    "swal2-hide logout-popup-out"

            }

        });


    if (
        !result.isConfirmed
    ) {
        return;
    }


    /* ======================================
       LOGGING OUT POPUP
    ====================================== */

    Swal.fire({

        title:
            "Logging Out...",

        html: `

            <div class="logout-loading">

                <i class="fa-solid fa-futbol fa-spin"></i>

                <p>
                    See you soon!
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
            900

    });


    /* ======================================
       CLEAR LOGIN DATA
    ====================================== */

    localStorage.removeItem(
        "user"
    );


    sessionStorage.clear();


    /* ======================================
       REDIRECT
    ====================================== */

    setTimeout(
        () => {

            window.location.href =
                "login.html";

        },
        900
    );

}


/* ==========================================
   EVENT LISTENERS
========================================== */

if (loadAttendanceButton) {

    loadAttendanceButton.addEventListener(
        "click",
        () => {

            loadAttendanceRegister(
                attendanceDate.value
            );

        }
    );

}


if (todayButton) {

    todayButton.addEventListener(
        "click",
        () => {

            const today =
                getSouthAfricaDate();


            attendanceDate.value =
                today;


            loadAttendanceRegister(
                today
            );

        }
    );

}


if (saveAttendanceButton) {

    saveAttendanceButton.addEventListener(
        "click",
        saveFullRegister
    );

}


if (searchPlayer) {

    searchPlayer.addEventListener(
        "input",
        filterPlayers
    );

}


/* ==========================================
   INITIALIZE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const today =
            getSouthAfricaDate();


        if (attendanceDate) {

            attendanceDate.value =
                today;


            /*
                Do not allow future
                attendance dates.
            */

            attendanceDate.max =
                today;

        }


        loadAttendanceRegister(
            today
        );

    }
);
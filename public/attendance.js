// ==========================================
// MAFORI FC ATTENDANCE
// ATTENDANCE.JS
// ==========================================


/* ==========================================
   ELEMENTS
========================================== */

const attendanceTable =
    document.getElementById(
        "attendanceTable"
    );


const attendanceDate =
    document.getElementById(
        "attendanceDate"
    );


const selectedDateText =
    document.getElementById(
        "selectedDateText"
    );


const registerStatus =
    document.getElementById(
        "registerStatus"
    );


const searchPlayer =
    document.getElementById(
        "searchPlayer"
    );


const loadAttendanceButton =
    document.getElementById(
        "loadAttendance"
    );


const todayButton =
    document.getElementById(
        "todayButton"
    );


const saveAttendanceButton =
    document.getElementById(
        "saveAttendance"
    );


/* ==========================================
   STATE
========================================== */

let players =
    [];


let currentRegisterDate =
    null;


let currentSessionExists =
    false;


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
                timeZone:
                    "Africa/Johannesburg",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
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
                "long",

            year:
                "numeric"
        }
    );

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
   STATUS CLASS
========================================== */

function getStatusClass(
    status
) {

    if (
        status ===
        "Present"
    ) {

        return "status-present";

    }


    if (
        status ===
        "Absent"
    ) {

        return "status-absent";

    }


    if (
        status ===
        "Excused"
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


    if (
        currentSessionExists
    ) {

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

async function loadAttendanceRegister(
    date
) {

    if (!date) {

        await Swal.fire({

            icon:
                "warning",

            title:
                "Select a Date",

            text:
                "Please select an attendance date."

        });


        return;

    }


    currentRegisterDate =
        date;


    if (selectedDateText) {

        selectedDateText.textContent =
            formatDate(
                date
            );

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

            icon:
                "error",

            title:
                "Unable to Load Register",

            text:
                error.message

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

function renderPlayers(
    playerList
) {

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
                getStatusClass(
                    status
                );


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
                            status ===
                            "Present"
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
                            status ===
                            "Absent"
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
                            status ===
                            "Excused"
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

function getSelectedStatus(
    playerId
) {

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

async function editPlayerAttendance(
    playerId
) {

    const player =
        players.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    playerId
                )
        );


    if (!player) {

        return;

    }


    if (!currentRegisterDate) {

        await Swal.fire({

            icon:
                "warning",

            title:
                "Register Date Required",

            text:
                "Please select and load an attendance date first."

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

            title:
                "Edit Attendance",

            html: `

                <div class="attendance-edit-popup">

                    <p>
                        <strong>
                            ${escapeHtml(
                                playerName
                            )}
                        </strong>
                    </p>

                    <p>
                        ${escapeHtml(
                            formatDate(
                                currentRegisterDate
                            )
                        )}
                    </p>

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

            icon:
                "question",

            showCancelButton:
                true,

            confirmButtonText:
                "Update Attendance",

            cancelButtonText:
                "Cancel",

            confirmButtonColor:
                "#ff9800",

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


    const newStatus =
        result.value;


    await updatePlayerAttendance(
        player,
        newStatus
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

        text:
            `Updating ${playerName}...`,

        allowOutsideClick:
            false,

        didOpen:
            () => {

                Swal.showLoading();

            }

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


        /* ======================================
           UPDATE RADIO BUTTON
        ====================================== */

        const radio =
            document.querySelector(

                `input[name="attendance_${player.id}"][value="${newStatus}"]`

            );


        if (radio) {

            radio.checked =
                true;

        }


        /* ======================================
           UPDATE STATUS LABEL
        ====================================== */

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
                "Attendance Updated",

            text:
                result.message ||
                `${playerName}'s attendance has been updated.`,

            confirmButtonColor:
                "#ff9800"

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
                error.message

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
                "Please select an attendance date."

        });


        return;

    }


    const today =
        getSouthAfricaDate();


    /*
        The existing POST /api/attendance
        is specifically designed for today's
        Johannesburg register.

        Previous registers should be corrected
        with the Edit button instead.
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
                "Use the Edit button beside a player to correct a previous attendance register."

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

            html:
                `Please mark attendance for:<br><strong>${escapeHtml(
                    preview
                )}${escapeHtml(
                    extra
                )}</strong>`

        });


        return;

    }


    const confirmation =
        await Swal.fire({

            icon:
                "question",

            title:
                "Save Attendance?",

            text:
                `Save the register for ${formatDate(
                    currentRegisterDate
                )}?`,

            showCancelButton:
                true,

            confirmButtonText:
                "Save Register",

            cancelButtonText:
                "Cancel",

            confirmButtonColor:
                "#ff9800"

        });


    if (
        !confirmation.isConfirmed
    ) {

        return;

    }


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


        await Swal.fire({

            icon:
                "success",

            title:
                "Attendance Saved",

            text:
                result.message ||
                "Attendance register saved successfully.",

            confirmButtonColor:
                "#ff9800"

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
                error.message

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
   LOGOUT
========================================== */

function logout() {

    Swal.fire({

        icon:
            "question",

        title:
            "Logout?",

        text:
            "Are you sure you want to logout?",

        showCancelButton:
            true,

        confirmButtonText:
            "Logout",

        cancelButtonText:
            "Cancel",

        confirmButtonColor:
            "#ff9800"

    })
        .then(
            result => {

                if (
                    result.isConfirmed
                ) {

                    sessionStorage.clear();


                    window.location.href =
                        "login.html";

                }

            }
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
                Prevent choosing a future
                attendance date.
            */

            attendanceDate.max =
                today;

        }


        loadAttendanceRegister(
            today
        );

    }
);
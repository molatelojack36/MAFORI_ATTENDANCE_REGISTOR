// ==========================================
// MAFORI FC
// PLAYER BIRTHDAY ALERTS
// birthdays.js
// ==========================================


/* ==========================================
   CHECK TODAY'S BIRTHDAYS
========================================== */

async function checkPlayerBirthdays() {

    try {

        const response =
            await fetch(
                "/api/birthdays/today"
            );


        let result;


        try {

            result =
                await response.json();

        }

        catch (error) {

            throw new Error(
                "The server returned an invalid birthday response."
            );

        }


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to check player birthdays."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to check player birthdays."
            );

        }


        const birthdays =
            Array.isArray(
                result.birthdays
            )
                ? result.birthdays
                : [];


        /* ======================================
           NO BIRTHDAYS TODAY
        ====================================== */

        if (
            birthdays.length ===
            0
        ) {

            console.log(
                "No player birthdays today."
            );


            return;

        }


        /* ======================================
           PREVENT REPEATED POPUP
        ====================================== */

        const todayKey =
            result.date ||
            new Date()
                .toISOString()
                .split("T")[0];


        const storageKey =
            `maforiBirthdayAlert_${todayKey}`;


        const alreadyShown =
            sessionStorage.getItem(
                storageKey
            );


        if (
            alreadyShown ===
            "shown"
        ) {

            return;

        }


        /* ======================================
           BUILD PLAYER BIRTHDAY MESSAGE
        ====================================== */

        let birthdayHtml =
            "";


        birthdays.forEach(
            player => {

                const fullName =
                    `${player.first_name || ""} ${player.last_name || ""}`
                        .trim();


                const nickname =
                    player.nickname
                        ? ` (${player.nickname})`
                        : "";


                const ageText =
                    player.age !== null &&
                    player.age !== undefined

                        ? ` turns ${player.age}`

                        : "";


                birthdayHtml += `

                    <div
                        style="
                            margin-bottom:12px;
                            padding:12px;
                            border-radius:10px;
                            background:#fff7e6;
                            text-align:left;
                        "
                    >

                        <strong
                            style="
                                color:#0b1f3a;
                                font-size:15px;
                            "
                        >

                            🎂 ${escapeBirthdayHtml(
                                fullName
                            )}
                            ${escapeBirthdayHtml(
                                nickname
                            )}

                        </strong>

                        <br>

                        <span
                            style="
                                color:#555;
                                font-size:13px;
                            "
                        >

                            ${escapeBirthdayHtml(
                                player.position ||
                                "Player"
                            )}

                            ${escapeBirthdayHtml(
                                ageText
                            )}

                        </span>

                    </div>

                `;

            }
        );


        /* ======================================
           ALERT TITLE
        ====================================== */

        const title =
            birthdays.length === 1

                ? "🎉 Player Birthday Today!"

                : "🎉 Player Birthdays Today!";


        /* ======================================
           SHOW SWEETALERT
        ====================================== */

        await Swal.fire({

            icon:
                "success",

            title:
                title,

            html: `

                <div>

                    <p
                        style="
                            margin-bottom:15px;
                            color:#555;
                        "
                    >

                        ${
                            birthdays.length === 1
                                ? "Today is a special day for one of the Mafori FC players."
                                : `Today is a special day for ${birthdays.length} Mafori FC players.`
                        }

                    </p>

                    ${birthdayHtml}

                    <p
                        style="
                            margin-top:15px;
                            font-size:13px;
                            color:#666;
                        "
                    >

                        🧡 Wishing them a happy birthday from Mafori FC!

                    </p>

                </div>

            `,

            confirmButtonText:
                "Happy Birthday! 🎂",

            confirmButtonColor:
                "#ff9800",

            allowOutsideClick:
                true

        });


        /* ======================================
           MARK ALERT AS SHOWN
        ====================================== */

        sessionStorage.setItem(
            storageKey,
            "shown"
        );

    }

    catch (error) {

        console.error(
            "Birthday check error:",
            error
        );

    }

}


/* ==========================================
   HTML ESCAPE
========================================== */

function escapeBirthdayHtml(
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
   INITIALIZE BIRTHDAY CHECK
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        checkPlayerBirthdays();

    }
);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

const app = express();

/* =====================================
   MIDDLEWARE
===================================== */

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// Serve frontend files
app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

/* =====================================
   SUPABASE CONNECTION
===================================== */

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

/* =====================================
   HOME PAGE
===================================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

/* =====================================
   LOGIN API
===================================== */

app.post("/api/login", async (req, res) => {

    const {
        username,
        password
    } = req.body;

    try {

        const {
            data,
            error
        } = await supabase

            .from("users")

            .select("*")

            .eq("username", username)

            .eq("password", password)

            .single();


        if (error || !data) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        res.json({

            success: true,

            message:
                "Login Successful",

            user: {

                id: data.id,

                fullname:
                    data.fullname,

                role:
                    data.role

            }

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message:
                "Server Error"

        });

    }

});

/* =====================================
   ADD PLAYER API
===================================== */

app.post("/api/players", async (req, res) => {

    const {

        first_name,
        last_name,
        nickname,
        position,
        date_of_birth,
        status

    } = req.body;


    try {

        const {
            data,
            error
        } = await supabase

            .from("players")

            .insert([{

                first_name,
                last_name,
                nickname,
                position,
                date_of_birth,
                status

            }])

            .select();


        if (error) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        res.status(201).json({

            success: true,

            message:
                "Player added successfully.",

            player:
                data[0]

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message:
                "Server Error"

        });

    }

});

/* =====================================
   VIEW ALL PLAYERS API
===================================== */

app.get("/api/players", async (req, res) => {

    try {

        const {
            data,
            error
        } = await supabase

            .from("players")

            .select("*")

            .order("id", {
                ascending: true
            });


        if (error) {

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }


        res.json(data);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

});

/* =====================================
   GET SINGLE PLAYER API
===================================== */

app.get("/api/players/:id", async (req, res) => {

    const id =
        req.params.id;


    try {

        const {
            data,
            error
        } = await supabase

            .from("players")

            .select("*")

            .eq("id", id)

            .single();


        if (error) {

            return res.status(404).json({

                success: false,

                message:
                    error.message

            });

        }


        res.json(data);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

});

/* =====================================
   UPDATE PLAYER API
===================================== */

app.put("/api/players/:id", async (req, res) => {

    const id =
        req.params.id;


    try {

        const {
            error
        } = await supabase

            .from("players")

            .update(req.body)

            .eq("id", id);


        if (error) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        res.json({

            success: true,

            message:
                "Player updated successfully."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

});

/* =====================================
   DELETE PLAYER API
===================================== */

app.delete("/api/players/:id", async (req, res) => {

    const id =
        req.params.id;


    try {

        const {
            error
        } = await supabase

            .from("players")

            .delete()

            .eq("id", id);


        if (error) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        res.json({

            success: true,

            message:
                "Player deleted successfully."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message:
                "Server Error"

        });

    }

});

/* =====================================
   SAVE ATTENDANCE
===================================== */

app.post("/api/attendance", async (req, res) => {

    const attendance =
        req.body.attendance;


    if (
        !attendance ||
        attendance.length === 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "No attendance data received."

        });

    }


    try {

        const today =
            new Date();

        const todayDate =
            today
                .toISOString()
                .split("T")[0];


        /* ============================
           CHECK SESSION
        ============================ */

        let {

            data: session,
            error: sessionError

        } = await supabase

            .from("training_sessions")

            .select("*")

            .eq(
                "session_date",
                todayDate
            )

            .maybeSingle();


        if (sessionError) {

            return res.status(500).json({

                success: false,

                message:
                    sessionError.message

            });

        }


        /* ============================
           CREATE SESSION
        ============================ */

        if (!session) {

            const {
                data,
                error
            } = await supabase

                .from("training_sessions")

                .insert([{

                    session_date:
                        todayDate,

                    month:
                        today.getMonth() + 1,

                    year:
                        today.getFullYear()

                }])

                .select()

                .single();


            if (error) {

                return res.status(500).json({

                    success: false,

                    message:
                        error.message

                });

            }


            session =
                data;

        }


        /* ============================
           SAVE ATTENDANCE
        ============================ */

        for (
            const player
            of attendance
        ) {

            const {
                data: existing
            } = await supabase

                .from("attendance")

                .select("id")

                .eq(
                    "player_id",
                    player.player_id
                )

                .eq(
                    "session_id",
                    session.id
                )

                .maybeSingle();


            if (existing) {

                await supabase

                    .from("attendance")

                    .update({

                        attendance_status:
                            player.attendance_status

                    })

                    .eq(
                        "id",
                        existing.id
                    );

            }

            else {

                await supabase

                    .from("attendance")

                    .insert([{

                        player_id:
                            player.player_id,

                        session_id:
                            session.id,

                        attendance_status:
                            player.attendance_status

                    }]);

            }

        }


        /* ============================
           DASHBOARD STATISTICS
        ============================ */

        const {
            count: totalPlayers
        } = await supabase

            .from("players")

            .select("*", {

                count:
                    "exact",

                head:
                    true

            })

            .eq(
                "status",
                "Active"
            );


        const {
            count: present
        } = await supabase

            .from("attendance")

            .select("*", {

                count:
                    "exact",

                head:
                    true

            })

            .eq(
                "session_id",
                session.id
            )

            .eq(
                "attendance_status",
                "Present"
            );


        const {
            count: absent
        } = await supabase

            .from("attendance")

            .select("*", {

                count:
                    "exact",

                head:
                    true

            })

            .eq(
                "session_id",
                session.id
            )

            .eq(
                "attendance_status",
                "Absent"
            );


        const {
            count: excused
        } = await supabase

            .from("attendance")

            .select("*", {

                count:
                    "exact",

                head:
                    true

            })

            .eq(
                "session_id",
                session.id
            )

            .eq(
                "attendance_status",
                "Excused"
            );


        const attendanceRate =
            totalPlayers > 0

                ? (
                    (present /
                        totalPlayers) *
                    100
                ).toFixed(1)

                : "0.0";


        res.json({

            success: true,

            message:
                "Attendance saved successfully.",

            statistics: {

                totalPlayers,

                present,

                absent,

                excused,

                attendanceRate

            }

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

});

/* =====================================
   DASHBOARD STATISTICS API
===================================== */

app.get(
    "/api/dashboard/statistics",
    async (req, res) => {

        try {

            const today =
                new Date()
                    .toISOString()
                    .split("T")[0];


            /* ============================
               TOTAL ACTIVE PLAYERS
            ============================ */

            const {
                count: totalPlayers
            } = await supabase

                .from("players")

                .select("*", {

                    count:
                        "exact",

                    head:
                        true

                })

                .eq(
                    "status",
                    "Active"
                );


            /* ============================
               TODAY'S SESSION
            ============================ */

            const {
                data: session
            } = await supabase

                .from("training_sessions")

                .select("id")

                .eq(
                    "session_date",
                    today
                )

                .maybeSingle();


            let present = 0;

            let absent = 0;

            let excused = 0;


            if (session) {

                const {
                    count: presentCount
                } = await supabase

                    .from("attendance")

                    .select("*", {

                        count:
                            "exact",

                        head:
                            true

                    })

                    .eq(
                        "session_id",
                        session.id
                    )

                    .eq(
                        "attendance_status",
                        "Present"
                    );


                const {
                    count: absentCount
                } = await supabase

                    .from("attendance")

                    .select("*", {

                        count:
                            "exact",

                        head:
                            true

                    })

                    .eq(
                        "session_id",
                        session.id
                    )

                    .eq(
                        "attendance_status",
                        "Absent"
                    );


                const {
                    count: excusedCount
                } = await supabase

                    .from("attendance")

                    .select("*", {

                        count:
                            "exact",

                        head:
                            true

                    })

                    .eq(
                        "session_id",
                        session.id
                    )

                    .eq(
                        "attendance_status",
                        "Excused"
                    );


                present =
                    presentCount || 0;

                absent =
                    absentCount || 0;

                excused =
                    excusedCount || 0;

            }


            const attendanceRate =
                totalPlayers > 0

                    ? (
                        (present /
                            totalPlayers) *
                        100
                    ).toFixed(1)

                    : "0.0";


            res.json({

                success: true,

                statistics: {

                    totalPlayers:
                        totalPlayers || 0,

                    present,

                    absent,

                    excused,

                    attendanceRate

                }

            });

        }

        catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message:
                    err.message

            });

        }

    }
);

/* =====================================
   MONTHLY REPORT DATA
===================================== */

async function getMonthlyReportData(
    month,
    year
) {

    /* ============================
       GET SESSIONS
    ============================ */

    const {
        data: sessions,
        error: sessionError
    } = await supabase

        .from("training_sessions")

        .select("*")

        .eq(
            "month",
            Number(month)
        )

        .eq(
            "year",
            Number(year)
        )

        .order(
            "session_date",
            {
                ascending:
                    true
            }
        );


    if (sessionError) {

        throw sessionError;

    }


    /* ============================
       GET PLAYERS
    ============================ */

    const {
        data: players,
        error: playerError
    } = await supabase

        .from("players")

        .select("*")

        .eq(
            "status",
            "Active"
        )

        .order(
            "id",
            {
                ascending:
                    true
            }
        );


    if (playerError) {

        throw playerError;

    }


    /* ============================
       GET ATTENDANCE
    ============================ */

    const sessionIds =
        sessions.map(
            session =>
                session.id
        );


    let attendance = [];


    if (sessionIds.length > 0) {

        const {
            data,
            error
        } = await supabase

            .from("attendance")

            .select("*")

            .in(
                "session_id",
                sessionIds
            );


        if (error) {

            throw error;

        }


        attendance =
            data || [];

    }


    return {

        sessions,

        players,

        attendance

    };

}

/* =====================================
   MONTHLY REPORT JSON API
===================================== */

app.get(
    "/api/reports/monthly/data",
    async (req, res) => {

        try {

            const {
                month,
                year
            } = req.query;


            if (!month || !year) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Month and year are required."

                });

            }


            const report =
                await getMonthlyReportData(
                    month,
                    year
                );


            res.json({

                success: true,

                report

            });

        }

        catch (err) {

            console.error(
                "Monthly Report Data Error:",
                err
            );

            res.status(500).json({

                success: false,

                message:
                    err.message

            });

        }

    }
);

/* =====================================
   DOWNLOAD MONTHLY CSV
===================================== */

app.get(
    "/api/reports/monthly/csv",
    async (req, res) => {

        try {

            const {
                month,
                year
            } = req.query;


            if (!month || !year) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Month and year are required."

                });

            }


            const report =
                await getMonthlyReportData(
                    month,
                    year
                );


            let csv =
                "Player ID,First Name,Last Name,Position";


            report.sessions.forEach(
                session => {

                    csv +=
                        `,${session.session_date}`;

                }
            );


            csv +=
                ",Present,Absent,Excused,Attendance Rate\n";


            report.players.forEach(
                player => {

                    let present = 0;

                    let absent = 0;

                    let excused = 0;


                    let row =
                        `${player.id},` +
                        `"${player.first_name || ""}",` +
                        `"${player.last_name || ""}",` +
                        `"${player.position || ""}"`;


                    report.sessions.forEach(
                        session => {

                            const record =
                                report.attendance.find(
                                    item =>
                                        Number(
                                            item.player_id
                                        ) === Number(
                                            player.id
                                        ) &&
                                        Number(
                                            item.session_id
                                        ) === Number(
                                            session.id
                                        )
                                );


                            const status =
                                record
                                    ? record.attendance_status
                                    : "-";


                            row +=
                                `,"${status}"`;


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


                    const total =
                        present +
                        absent +
                        excused;


                    const rate =
                        total > 0

                            ? (
                                (present /
                                    total) *
                                100
                            ).toFixed(1)

                            : "0.0";


                    row +=
                        `,${present}` +
                        `,${absent}` +
                        `,${excused}` +
                        `,${rate}%\n`;


                    csv += row;

                }
            );


            res.setHeader(
                "Content-Type",
                "text/csv; charset=utf-8"
            );


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="Mafori_FC_Attendance_${month}_${year}.csv"`
            );


            res.send(csv);

        }

        catch (err) {

            console.error(
                "CSV Report Error:",
                err
            );


            res.status(500).json({

                success: false,

                message:
                    err.message

            });

        }

    }
);

/* =====================================
   DOWNLOAD MONTHLY PDF
===================================== */

app.get(
    "/api/reports/monthly",
    async (req, res) => {

        try {

            const {
                month,
                year
            } = req.query;


            if (!month || !year) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Month and year are required."

                });

            }


            const report =
                await getMonthlyReportData(
                    month,
                    year
                );


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


            const monthName =
                monthNames[
                    Number(month) - 1
                ];


            const doc =
                new PDFDocument({

                    margin: 40,

                    size: "A4",

                    layout:
                        "landscape"

                });


            res.setHeader(
                "Content-Type",
                "application/pdf"
            );


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="Mafori_FC_Attendance_${month}_${year}.pdf"`
            );


            doc.pipe(res);


            /* ============================
               TITLE
            ============================ */

            doc
                .fontSize(22)
                .font("Helvetica-Bold")
                .text(
                    "MAFORI FOOTBALL CLUB",
                    {
                        align:
                            "center"
                    }
                );


            doc
                .moveDown(0.5)
                .fontSize(16)
                .font("Helvetica")
                .text(
                    "Monthly Attendance Register",
                    {
                        align:
                            "center"
                    }
                );


            doc
                .moveDown(0.3)
                .fontSize(13)
                .text(
                    `${monthName} ${year}`,
                    {
                        align:
                            "center"
                    }
                );


            doc.moveDown(1);


            /* ============================
               SUMMARY
            ============================ */

            let totalPresent = 0;

            let totalAbsent = 0;

            let totalExcused = 0;


            report.attendance.forEach(
                record => {

                    if (
                        record.attendance_status ===
                        "Present"
                    ) {

                        totalPresent++;

                    }

                    else if (
                        record.attendance_status ===
                        "Absent"
                    ) {

                        totalAbsent++;

                    }

                    else if (
                        record.attendance_status ===
                        "Excused"
                    ) {

                        totalExcused++;

                    }

                }
            );


            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    `Active Players: ${report.players.length}`
                );

            doc.text(
                `Training Sessions: ${report.sessions.length}`
            );

            doc.text(
                `Present Records: ${totalPresent}`
            );

            doc.text(
                `Absent Records: ${totalAbsent}`
            );

            doc.text(
                `Excused Records: ${totalExcused}`
            );


            doc.moveDown(1);


            /* ============================
               TABLE
            ============================ */

            const startX = 40;

            let y = doc.y;

            const playerWidth = 170;

            const positionWidth = 90;

            const sessionWidth = 70;


            doc
                .font("Helvetica-Bold")
                .fontSize(8);


            doc.text(
                "Player",
                startX,
                y,
                {
                    width:
                        playerWidth
                }
            );


            doc.text(
                "Position",
                startX +
                playerWidth,
                y,
                {
                    width:
                        positionWidth
                }
            );


            let currentX =
                startX +
                playerWidth +
                positionWidth;


            report.sessions.forEach(
                session => {

                    doc.text(
                        session.session_date,
                        currentX,
                        y,
                        {
                            width:
                                sessionWidth
                        }
                    );

                    currentX +=
                        sessionWidth;

                }
            );


            y += 25;


            doc.font("Helvetica");


            report.players.forEach(
                player => {

                    if (y > 520) {

                        doc.addPage();

                        y = 40;

                    }


                    const fullName =
                        `${player.first_name || ""} ${player.last_name || ""}`;


                    doc.text(
                        fullName,
                        startX,
                        y,
                        {
                            width:
                                playerWidth
                        }
                    );


                    doc.text(
                        player.position || "-",
                        startX +
                        playerWidth,
                        y,
                        {
                            width:
                                positionWidth
                        }
                    );


                    let x =
                        startX +
                        playerWidth +
                        positionWidth;


                    report.sessions.forEach(
                        session => {

                            const record =
                                report.attendance.find(
                                    item =>
                                        Number(
                                            item.player_id
                                        ) === Number(
                                            player.id
                                        ) &&
                                        Number(
                                            item.session_id
                                        ) === Number(
                                            session.id
                                        )
                                );


                            const status =
                                record
                                    ? record.attendance_status
                                    : "-";


                            doc.text(
                                status,
                                x,
                                y,
                                {
                                    width:
                                        sessionWidth
                                }
                            );


                            x +=
                                sessionWidth;

                        }
                    );


                    y += 22;

                }
            );


            doc
                .fontSize(8)
                .font("Helvetica")
                .text(
                    "Generated by Mafori FC Player Training Attendance Register",
                    40,
                    560,
                    {
                        align:
                            "center",

                        width:
                            760
                    }
                );


            doc.end();

        }

        catch (err) {

            console.error(
                "PDF Report Error:",
                err
            );


            // Only send JSON if headers have not
            // already been sent by the PDF stream.

            if (!res.headersSent) {

                res.status(500).json({

                    success: false,

                    message:
                        err.message

                });

            }

        }

    }
);

/* =====================================
   SETTINGS API
===================================== */

/*
   These settings are stored in the
   "settings" table in Supabase.

   Expected columns:

   id
   club_name
   club_email
   club_phone
   club_address
   training_time
   training_days
*/

/* =====================================
   GET SETTINGS
===================================== */

app.get(
    "/api/settings",
    async (req, res) => {

        try {

            const {
                data,
                error
            } = await supabase

                .from("settings")

                .select("*")

                .limit(1)
                .maybeSingle();


            if (error) {

                return res.status(500).json({

                    success: false,

                    message:
                        error.message

                });

            }


            res.json({

                success: true,

                settings:
                    data || {}

            });

        }

        catch (err) {

            console.error(
                "Settings GET Error:",
                err
            );


            res.status(500).json({

                success: false,

                message:
                    err.message

            });

        }

    }
);

/* =====================================
   SAVE / UPDATE SETTINGS
===================================== */

app.put(
    "/api/settings",
    async (req, res) => {

        try {

            const {

                club_name,
                club_email,
                club_phone,
                club_address,
                training_time,
                training_days

            } = req.body;


            /* ============================
               CHECK EXISTING SETTINGS
            ============================ */

            const {
                data: existing,
                error: findError
            } = await supabase

                .from("settings")

                .select("id")

                .limit(1)
                .maybeSingle();


            if (findError) {

                return res.status(500).json({

                    success: false,

                    message:
                        findError.message

                });

            }


            let data;

            let error;


            /* ============================
               UPDATE EXISTING SETTINGS
            ============================ */

            if (existing) {

                const result =
                    await supabase

                        .from("settings")

                        .update({

                            club_name,
                            club_email,
                            club_phone,
                            club_address,
                            training_time,
                            training_days

                        })

                        .eq(
                            "id",
                            existing.id
                        )

                        .select()
                        .single();


                data =
                    result.data;

                error =
                    result.error;

            }

            /* ============================
               CREATE SETTINGS
            ============================ */

            else {

                const result =
                    await supabase

                        .from("settings")

                        .insert([{

                            club_name,
                            club_email,
                            club_phone,
                            club_address,
                            training_time,
                            training_days

                        }])

                        .select()
                        .single();


                data =
                    result.data;

                error =
                    result.error;

            }


            if (error) {

                return res.status(400).json({

                    success: false,

                    message:
                        error.message

                });

            }


            res.json({

                success: true,

                message:
                    "Settings saved successfully.",

                settings:
                    data

            });

        }

        catch (err) {

            console.error(
                "Settings SAVE Error:",
                err
            );


            res.status(500).json({

                success: false,

                message:
                    err.message

            });

        }

    }
);

/* =====================================
   CHANGE USER PASSWORD API
===================================== */

app.put("/api/change-password", async (req, res) => {

    const {
        user_id,
        current_password,
        new_password
    } = req.body;


    if (
        !user_id ||
        !current_password ||
        !new_password
    ) {

        return res.status(400).json({

            success: false,

            message:
                "All password fields are required."

        });

    }


    try {

        /* ================================
           CHECK CURRENT PASSWORD
        ================================= */

        const {
            data: user,
            error: findError
        } = await supabase

            .from("users")

            .select("*")

            .eq("id", user_id)

            .eq("password", current_password)

            .single();


        if (findError || !user) {

            return res.status(401).json({

                success: false,

                message:
                    "Current password is incorrect."

            });

        }


        /* ================================
           UPDATE PASSWORD
        ================================= */

        const {
            error: updateError
        } = await supabase

            .from("users")

            .update({

                password: new_password

            })

            .eq("id", user_id);


        if (updateError) {

            return res.status(400).json({

                success: false,

                message:
                    updateError.message

            });

        }


        /* ================================
           SUCCESS
        ================================= */

        res.json({

            success: true,

            message:
                "Password changed successfully."

        });

    }


    catch (err) {

        console.error(
            "Password Change Error:",
            err
        );


        res.status(500).json({

            success: false,

            message:
                "Server Error"

        });

    }

});

/* =====================================
   START SERVER
===================================== */

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        "====================================="
    );

    console.log(
        `🚀 Server running on http://localhost:${PORT}`
    );

    console.log(
        "====================================="
    );

});
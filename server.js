require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const clubLogoPath = path.join(
    __dirname,
    "public",
    "MAFORI_FC_LOGO.jpeg"
);


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

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
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

app.post(
    "/api/login",
    async (req, res) => {

        const {
            username,
            password
        } = req.body;

        try {

            if (!username || !password) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Username and password are required."

                    });

            }


            const {
                data,
                error
            } =
                await supabase

                    .from("users")

                    .select("*")

                    .eq(
                        "username",
                        username
                    )

                    .eq(
                        "password",
                        password
                    )

                    .maybeSingle();


            if (error) {

                console.error(
                    "Login database error:",
                    error
                );

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            "Database error during login."

                    });

            }


            if (!data) {

                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Invalid username or password."

                    });

            }


            return res.json({

                success: true,

                message:
                    "Login Successful",

                user: {

                    id:
                        data.id,

                    username:
                        data.username,

                    fullname:
                        data.fullname || "",

                    role:
                        data.role || "Admin"

                }

            });

        }

        catch (err) {

            console.error(
                "Login error:",
                err
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Server Error"

                });

        }

    }
);


/* =====================================
   GET SINGLE USER
===================================== */

app.get(
    "/api/users/:id",
    async (req, res) => {

        const id =
            req.params.id;

        try {

            const {
                data,
                error
            } =
                await supabase

                    .from("users")

                    .select(
                        "id, username, fullname, role"
                    )

                    .eq(
                        "id",
                        id
                    )

                    .maybeSingle();


            if (error) {

                console.error(
                    "Get user error:",
                    error
                );

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            if (!data) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "User not found."

                    });

            }


            return res.json({

                success: true,

                user: {

                    id:
                        data.id,

                    username:
                        data.username,

                    fullname:
                        data.fullname || "",

                    role:
                        data.role || "Admin"

                }

            });

        }

        catch (err) {

            console.error(
                "Get user error:",
                err
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Server Error"

                });

        }

    }
);


/* =====================================
   UPDATE USER PROFILE
===================================== */

app.put(
    "/api/users/:id",
    async (req, res) => {

        const id =
            req.params.id;

        const {
            fullname,
            username
        } = req.body;


        if (!fullname || !username) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Full name and username are required."

                });

        }


        try {

            const {
                data: existingUser,
                error: existingError
            } =
                await supabase

                    .from("users")

                    .select("id")

                    .eq(
                        "username",
                        username
                    )

                    .neq(
                        "id",
                        id
                    )

                    .maybeSingle();


            if (existingError) {

                console.error(
                    "Username check error:",
                    existingError
                );

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            existingError.message

                    });

            }


            if (existingUser) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "That username is already being used."

                    });

            }


            const {
                data,
                error
            } =
                await supabase

                    .from("users")

                    .update({

                        fullname:
                            fullname,

                        username:
                            username

                    })

                    .eq(
                        "id",
                        id
                    )

                    .select(
                        "id, username, fullname, role"
                    )

                    .single();


            if (error) {

                console.error(
                    "Update profile error:",
                    error
                );

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            return res.json({

                success: true,

                message:
                    "Profile updated successfully.",

                user: {

                    id:
                        data.id,

                    username:
                        data.username,

                    fullname:
                        data.fullname || "",

                    role:
                        data.role || "Admin"

                }

            });

        }

        catch (err) {

            console.error(
                "Profile update error:",
                err
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Server Error"

                });

        }

    }
);


/* =====================================
   CHANGE USER PASSWORD API
===================================== */

app.put(
    "/api/change-password",
    async (req, res) => {

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

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "All password fields are required."

                });

        }


        if (
            new_password.length < 6
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "New password must be at least 6 characters long."

                });

        }


        try {

            /* =================================
               CHECK CURRENT PASSWORD
            ================================= */

            const {
                data: user,
                error: findError
            } =
                await supabase

                    .from("users")

                    .select(
                        "id, username, password, fullname, role"
                    )

                    .eq(
                        "id",
                        user_id
                    )

                    .maybeSingle();


            if (findError) {

                console.error(
                    "Find user error:",
                    findError
                );


                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            findError.message

                    });

            }


            if (!user) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "User account not found."

                    });

            }


            /* =================================
               VERIFY CURRENT PASSWORD
            ================================= */

            if (
                user.password !==
                current_password
            ) {

                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Current password is incorrect."

                    });

            }


            /* =================================
               UPDATE PASSWORD
            ================================= */

            const {
                error: updateError
            } =
                await supabase

                    .from("users")

                    .update({

                        password:
                            new_password

                    })

                    .eq(
                        "id",
                        user_id
                    );


            if (updateError) {

                console.error(
                    "Password update error:",
                    updateError
                );


                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            updateError.message

                    });

            }


            return res.json({

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


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Server Error"

                });

        }

    }
);


/* =====================================
   ADD PLAYER API
===================================== */

app.post(
    "/api/players",
    async (req, res) => {

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
            } =
                await supabase

                    .from("players")

                    .insert([{

                        first_name,

                        last_name,

                        nickname,

                        position,

                        date_of_birth,

                        status:
                            status || "Active"

                    }])

                    .select();


            if (error) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            return res
                .status(201)
                .json({

                    success: true,

                    message:
                        "Player added successfully.",

                    player:
                        data[0]

                });

        }

        catch (err) {

            console.error(
                "Add player error:",
                err
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Server Error"

                });

        }

    }
);


/* =====================================
   VIEW ALL PLAYERS API
===================================== */

app.get(
    "/api/players",
    async (req, res) => {

        try {

            const {
                data,
                error
            } =
                await supabase

                    .from("players")

                    .select("*")

                    .order(
                        "id",
                        {
                            ascending: true
                        }
                    );


            if (error) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            return res.json(
                data || []
            );

        }

        catch (err) {

            console.error(
                "Get players error:",
                err
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        err.message

                });

        }

    }
);


/* =====================================
   GET SINGLE PLAYER
===================================== */

app.get(
    "/api/players/:id",
    async (req, res) => {

        const id =
            req.params.id;


        try {

            const {
                data,
                error
            } =
                await supabase

                    .from("players")

                    .select("*")

                    .eq(
                        "id",
                        id
                    )

                    .single();


            if (error) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            return res.json(
                data
            );

        }

        catch (err) {

            console.error(
                "Get player error:",
                err
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        err.message

                });

        }

    }
);


/* =====================================
   UPDATE PLAYER
===================================== */

app.put(
    "/api/players/:id",
    async (req, res) => {

        const id =
            req.params.id;


        try {

            const {
                error
            } =
                await supabase

                    .from("players")

                    .update(
                        req.body
                    )

                    .eq(
                        "id",
                        id
                    );


            if (error) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            return res.json({

                success: true,

                message:
                    "Player updated successfully."

            });

        }

        catch (err) {

            console.error(
                "Update player error:",
                err
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        err.message

                });

        }

    }
);


/* =====================================
   DELETE PLAYER
===================================== */

app.delete(
    "/api/players/:id",
    async (req, res) => {

        const id =
            req.params.id;


        try {

            const {
                error
            } =
                await supabase

                    .from("players")

                    .delete()

                    .eq(
                        "id",
                        id
                    );


            if (error) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            return res.json({

                success: true,

                message:
                    "Player deleted successfully."

            });

        }

        catch (err) {

            console.error(
                "Delete player error:",
                err
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Server Error"

                });

        }

    }
);


/* =====================================
   SAVE ATTENDANCE
===================================== */

app.post(
    "/api/attendance",
    async (req, res) => {

        const attendance =
            req.body.attendance;


        if (
            !attendance ||
            attendance.length === 0
        ) {

            return res
                .status(400)
                .json({

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


            /* =====================================
               FIND TODAY'S TRAINING SESSION
            ===================================== */

            let {
                data: session,
                error: sessionError
            } =
                await supabase

                    .from("training_sessions")

                    .select("*")

                    .eq(
                        "session_date",
                        todayDate
                    )

                    .maybeSingle();


            if (sessionError) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            sessionError.message

                    });

            }


            /* =====================================
               CREATE SESSION IF IT DOES NOT EXIST
            ===================================== */

            if (!session) {

                const {
                    data,
                    error
                } =
                    await supabase

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

                    return res
                        .status(500)
                        .json({

                            success: false,

                            message:
                                error.message

                        });

                }


                session =
                    data;

            }


            /* =====================================
               SAVE EACH PLAYER ATTENDANCE
            ===================================== */

            for (
                const player
                of attendance
            ) {

                const {
                    data: existing,
                    error: existingError
                } =
                    await supabase

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


                if (existingError) {

                    console.error(
                        "Attendance lookup error:",
                        existingError
                    );

                    return res
                        .status(500)
                        .json({

                            success: false,

                            message:
                                existingError.message

                        });

                }


                /* =================================
                   UPDATE EXISTING ATTENDANCE
                ================================= */

                if (existing) {

                    const {
                        error: updateError
                    } =
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


                    if (updateError) {

                        console.error(
                            "Attendance update error:",
                            updateError
                        );

                        return res
                            .status(500)
                            .json({

                                success: false,

                                message:
                                    updateError.message

                            });

                    }

                }


                /* =================================
                   INSERT NEW ATTENDANCE
                ================================= */

                else {

                    const {
                        error: insertError
                    } =
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


                    if (insertError) {

                        console.error(
                            "Attendance insert error:",
                            insertError
                        );

                        return res
                            .status(500)
                            .json({

                                success: false,

                                message:
                                    insertError.message

                            });

                    }

                }

            }


            /* =====================================
               TOTAL ACTIVE PLAYERS
            ===================================== */

            const {
                count: totalPlayers,
                error: totalPlayersError
            } =
                await supabase

                    .from("players")

                    .select(
                        "*",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )

                    .eq(
                        "status",
                        "Active"
                    );


            if (totalPlayersError) {

                console.error(
                    "Total players error:",
                    totalPlayersError
                );

            }


            /* =====================================
               PRESENT COUNT
            ===================================== */

            const {
                count: present,
                error: presentError
            } =
                await supabase

                    .from("attendance")

                    .select(
                        "*",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )

                    .eq(
                        "session_id",
                        session.id
                    )

                    .eq(
                        "attendance_status",
                        "Present"
                    );


            if (presentError) {

                console.error(
                    "Present count error:",
                    presentError
                );

            }


            /* =====================================
               ABSENT COUNT
            ===================================== */

            const {
                count: absent,
                error: absentError
            } =
                await supabase

                    .from("attendance")

                    .select(
                        "*",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )

                    .eq(
                        "session_id",
                        session.id
                    )

                    .eq(
                        "attendance_status",
                        "Absent"
                    );


            if (absentError) {

                console.error(
                    "Absent count error:",
                    absentError
                );

            }


            /* =====================================
               EXCUSED COUNT
            ===================================== */

            const {
                count: excused,
                error: excusedError
            } =
                await supabase

                    .from("attendance")

                    .select(
                        "*",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )

                    .eq(
                        "session_id",
                        session.id
                    )

                    .eq(
                        "attendance_status",
                        "Excused"
                    );


            if (excusedError) {

                console.error(
                    "Excused count error:",
                    excusedError
                );

            }


            /* =====================================
               ATTENDANCE RATE
            ===================================== */

            const safeTotalPlayers =
                totalPlayers || 0;


            const safePresent =
                present || 0;


            const safeAbsent =
                absent || 0;


            const safeExcused =
                excused || 0;


            const attendanceRate =
                safeTotalPlayers > 0

                    ? (
                        (
                            safePresent /
                            safeTotalPlayers
                        ) *
                        100
                    ).toFixed(1)

                    : "0.0";


            /* =====================================
               RESPONSE
            ===================================== */

            return res.json({

                success: true,

                message:
                    "Attendance saved successfully.",

                statistics: {

                    totalPlayers:
                        safeTotalPlayers,

                    present:
                        safePresent,

                    absent:
                        safeAbsent,

                    excused:
                        safeExcused,

                    attendanceRate:
                        attendanceRate

                }

            });

        }

        catch (err) {

            console.error(
                "Attendance save error:",
                err
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        err.message

                });

        }

    }
);


/* =====================================
   DASHBOARD STATISTICS
===================================== */

app.get(
    "/api/dashboard/statistics",
    async (req, res) => {

        try {

            const today =
                new Date()
                    .toISOString()
                    .split("T")[0];


            /* =====================================
               TOTAL ACTIVE PLAYERS
            ===================================== */

            const {
                count: totalPlayers,
                error: playersError
            } =
                await supabase

                    .from("players")

                    .select(
                        "*",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )

                    .eq(
                        "status",
                        "Active"
                    );


            if (playersError) {

                console.error(
                    "Dashboard players error:",
                    playersError
                );

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            playersError.message

                    });

            }


            /* =====================================
               FIND TODAY'S SESSION
            ===================================== */

            const {
                data: session,
                error: sessionError
            } =
                await supabase

                    .from("training_sessions")

                    .select("id")

                    .eq(
                        "session_date",
                        today
                    )

                    .maybeSingle();


            if (sessionError) {

                console.error(
                    "Dashboard session error:",
                    sessionError
                );

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            sessionError.message

                    });

            }


            let present = 0;

            let absent = 0;

            let excused = 0;


            /* =====================================
               LOAD TODAY'S ATTENDANCE COUNTS
            ===================================== */

            if (session) {

                const {
                    count: presentCount,
                    error: presentError
                } =
                    await supabase

                        .from("attendance")

                        .select(
                            "*",
                            {
                                count:
                                    "exact",

                                head:
                                    true
                            }
                        )

                        .eq(
                            "session_id",
                            session.id
                        )

                        .eq(
                            "attendance_status",
                            "Present"
                        );


                if (presentError) {

                    console.error(
                        "Dashboard present error:",
                        presentError
                    );

                }


                const {
                    count: absentCount,
                    error: absentError
                } =
                    await supabase

                        .from("attendance")

                        .select(
                            "*",
                            {
                                count:
                                    "exact",

                                head:
                                    true
                            }
                        )

                        .eq(
                            "session_id",
                            session.id
                        )

                        .eq(
                            "attendance_status",
                            "Absent"
                        );


                if (absentError) {

                    console.error(
                        "Dashboard absent error:",
                        absentError
                    );

                }


                const {
                    count: excusedCount,
                    error: excusedError
                } =
                    await supabase

                        .from("attendance")

                        .select(
                            "*",
                            {
                                count:
                                    "exact",

                                head:
                                    true
                            }
                        )

                        .eq(
                            "session_id",
                            session.id
                        )

                        .eq(
                            "attendance_status",
                            "Excused"
                        );


                if (excusedError) {

                    console.error(
                        "Dashboard excused error:",
                        excusedError
                    );

                }


                present =
                    presentCount || 0;


                absent =
                    absentCount || 0;


                excused =
                    excusedCount || 0;

            }


            /* =====================================
               ATTENDANCE RATE
            ===================================== */

            const safeTotalPlayers =
                totalPlayers || 0;


            const attendanceRate =
                safeTotalPlayers > 0

                    ? (
                        (
                            present /
                            safeTotalPlayers
                        ) *
                        100
                    ).toFixed(1)

                    : "0.0";


            /* =====================================
               RESPONSE
            ===================================== */

            return res.json({

                success: true,

                statistics: {

                    totalPlayers:
                        safeTotalPlayers,

                    present:
                        present,

                    absent:
                        absent,

                    excused:
                        excused,

                    attendanceRate:
                        attendanceRate

                }

            });

        }

        catch (err) {

            console.error(
                "Dashboard statistics error:",
                err
            );


            return res
                .status(500)
                .json({

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

    const {
        data: sessions,
        error: sessionError
    } =
        await supabase

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
                    ascending: true
                }
            );


    if (sessionError) {

        throw sessionError;

    }


    const {
        data: players,
        error: playerError
    } =
        await supabase

            .from("players")

            .select("*")

            .eq(
                "status",
                "Active"
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (playerError) {

        throw playerError;

    }


    const safeSessions =
        sessions || [];


    const safePlayers =
        players || [];


    const sessionIds =
        safeSessions.map(
            session =>
                session.id
        );


    let attendance = [];


    if (
        sessionIds.length > 0
    ) {

        const {
            data,
            error
        } =
            await supabase

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

        sessions:
            safeSessions,

        players:
            safePlayers,

        attendance:
            attendance

    };

}


/* =====================================
   MONTHLY REPORT JSON
===================================== */

app.get(
    "/api/reports/monthly/data",
    async (req, res) => {

        try {

            const {
                month,
                year
            } = req.query;


            if (
                !month ||
                !year
            ) {

                return res
                    .status(400)
                    .json({

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


            return res.json({

                success: true,

                report:
                    report

            });

        }

        catch (err) {

            console.error(
                "Monthly Report Data Error:",
                err
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        err.message

                });

        }

    }
);


/* =====================================
   DOWNLOAD CSV
===================================== */

app.get(
    "/api/reports/monthly/csv",
    async (req, res) => {

        try {

            const {
                month,
                year
            } = req.query;


            if (
                !month ||
                !year
            ) {

                return res
                    .status(400)
                    .json({

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


            /* =====================================
               CSV HEADER
            ===================================== */

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


            /* =====================================
               PLAYER ROWS
            ===================================== */

            report.players.forEach(
                player => {

                    let present = 0;

                    let absent = 0;

                    let excused = 0;


                    let row =
                        `${player.id},` +
                        `"${String(
                            player.first_name || ""
                        ).replaceAll(
                            '"',
                            '""'
                        )}",` +
                        `"${String(
                            player.last_name || ""
                        ).replaceAll(
                            '"',
                            '""'
                        )}",` +
                        `"${String(
                            player.position || ""
                        ).replaceAll(
                            '"',
                            '""'
                        )}"`;


                    report.sessions.forEach(
                        session => {

                            const record =
                                report.attendance.find(
                                    item =>
                                        Number(
                                            item.player_id
                                        ) ===
                                        Number(
                                            player.id
                                        ) &&
                                        Number(
                                            item.session_id
                                        ) ===
                                        Number(
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


                    /* =================================
                       ATTENDANCE RATE
                    ================================= */

                    const total =
                        present +
                        absent +
                        excused;


                    const rate =
                        total > 0

                            ? (
                                (
                                    present /
                                    total
                                ) *
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


            /* =====================================
               SEND CSV FILE
            ===================================== */

            res.setHeader(
                "Content-Type",
                "text/csv; charset=utf-8"
            );


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="Mafori_FC_Attendance_${month}_${year}.csv"`
            );


            /*
                UTF-8 BOM helps Excel display
                names and special characters
                correctly.
            */

            return res.send(
                "\uFEFF" + csv
            );

        }

        catch (err) {

            console.error(
                "CSV Report Error:",
                err
            );


            return res
                .status(500)
                .json({

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


            if (
                !month ||
                !year
            ) {

                return res
                    .status(400)
                    .json({

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


            /* =====================================
               CREATE PDF
            ===================================== */

            const doc =
                new PDFDocument({

                    size: "A4",

                    layout:
                        "landscape",

                    margin:
                        30

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


            /* =====================================
               PAGE DIMENSIONS
            ===================================== */

            const pageWidth =
                doc.page.width;


            const pageHeight =
                doc.page.height;


            const margin =
                30;


            const usableWidth =
                pageWidth -
                (
                    margin *
                    2
                );


            /* =====================================
               TABLE COLUMN WIDTHS
            ===================================== */

            const numberWidth =
                28;


            const playerWidth =
                150;


            const positionWidth =
                80;


            const fixedWidth =
                numberWidth +
                playerWidth +
                positionWidth;


            const availableSessionWidth =
                usableWidth -
                fixedWidth;


            /*
                Maximum number of training dates
                displayed on one horizontal page.

                If there are more than 8 sessions,
                the remaining dates continue on
                another PDF page.
            */

            const sessionsPerPage =
                8;


            const sessionWidth =
                availableSessionWidth /
                sessionsPerPage;


            const rowHeight =
                22;


            const headerHeight =
                32;


            /* =====================================
               REPORT TOTALS
            ===================================== */

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


            /* =====================================
               ADD LOGO WATERMARK
            ===================================== */

            function addWatermark() {

                try {

                    doc.save();


                    doc.opacity(
                        0.06
                    );


                    const logoSize =
                        330;


                    doc.image(
                        clubLogoPath,

                        (
                            pageWidth -
                            logoSize
                        ) / 2,

                        (
                            pageHeight -
                            logoSize
                        ) / 2,

                        {

                            fit: [
                                logoSize,
                                logoSize
                            ],

                            align:
                                "center",

                            valign:
                                "center"

                        }
                    );


                    doc.opacity(
                        1
                    );


                    doc.restore();

                }

                catch (error) {

                    console.log(
                        "Logo watermark could not be loaded:",
                        error.message
                    );

                }

            }


            /* =====================================
               DRAW PAGE HEADER
            ===================================== */

            function drawPageHeader(
                sessionGroup,
                pageGroupNumber,
                totalGroups
            ) {

                addWatermark();


                /* =================================
                   CLUB NAME
                ================================= */

                doc
                    .fillColor(
                        "#0b1f3a"
                    )

                    .font(
                        "Helvetica-Bold"
                    )

                    .fontSize(
                        21
                    )

                    .text(
                        "MAFORI FOOTBALL CLUB",

                        margin,

                        28,

                        {

                            width:
                                usableWidth,

                            align:
                                "center"

                        }
                    );


                /* =================================
                   ORANGE DIVIDER
                ================================= */

                doc
                    .moveTo(
                        margin,
                        58
                    )

                    .lineTo(
                        pageWidth -
                        margin,
                        58
                    )

                    .lineWidth(
                        2
                    )

                    .strokeColor(
                        "#ff7a00"
                    )

                    .stroke();


                /* =================================
                   REPORT TITLE
                ================================= */

                doc
                    .fillColor(
                        "#333333"
                    )

                    .font(
                        "Helvetica-Bold"
                    )

                    .fontSize(
                        14
                    )

                    .text(
                        "MONTHLY ATTENDANCE REGISTER",

                        margin,

                        68,

                        {

                            width:
                                usableWidth,

                            align:
                                "center"

                        }
                    );


                /* =================================
                   MONTH + YEAR
                ================================= */

                doc
                    .font(
                        "Helvetica"
                    )

                    .fontSize(
                        11
                    )

                    .text(
                        `${monthName} ${year}`,

                        margin,

                        89,

                        {

                            width:
                                usableWidth,

                            align:
                                "center"

                        }
                    );


                /* =================================
                   REPORT SUMMARY
                ================================= */

                doc
                    .fontSize(
                        8
                    )

                    .fillColor(
                        "#475569"
                    )

                    .text(

                        `Players: ${report.players.length}     ` +
                        `Sessions: ${report.sessions.length}     ` +
                        `Present: ${totalPresent}     ` +
                        `Absent: ${totalAbsent}     ` +
                        `Excused: ${totalExcused}`,

                        margin,

                        110,

                        {

                            width:
                                usableWidth,

                            align:
                                "center"

                        }

                    );


                /* =================================
                   DATE PAGE NUMBER
                ================================= */

                if (
                    totalGroups > 1
                ) {

                    doc
                        .fontSize(
                            7
                        )

                        .fillColor(
                            "#64748b"
                        )

                        .text(

                            `Attendance dates ${pageGroupNumber} of ${totalGroups}`,

                            margin,

                            124,

                            {

                                width:
                                    usableWidth,

                                align:
                                    "center"

                            }

                        );

                }


                /* =================================
                   TABLE HEADER
                ================================= */

                const tableY =
                    145;


                doc
                    .rect(
                        margin,
                        tableY,
                        usableWidth,
                        headerHeight
                    )

                    .fill(
                        "#0b1f3a"
                    );


                let x =
                    margin;


                doc
                    .fillColor(
                        "#ffffff"
                    )

                    .font(
                        "Helvetica-Bold"
                    )

                    .fontSize(
                        7
                    );


                /* NUMBER */

                doc.text(

                    "#",

                    x,

                    tableY + 10,

                    {

                        width:
                            numberWidth,

                        align:
                            "center"

                    }

                );


                x +=
                    numberWidth;


                /* PLAYER */

                doc.text(

                    "PLAYER",

                    x + 5,

                    tableY + 10,

                    {

                        width:
                            playerWidth -
                            10

                    }

                );


                x +=
                    playerWidth;


                /* POSITION */

                doc.text(

                    "POSITION",

                    x,

                    tableY + 10,

                    {

                        width:
                            positionWidth,

                        align:
                            "center"

                    }

                );


                x +=
                    positionWidth;


                /* =================================
                   TRAINING DATES
                ================================= */

                sessionGroup.forEach(
                    session => {

                        const date =
                            new Date(
                                session.session_date +
                                "T00:00:00"
                            );


                        const day =
                            String(
                                date.getDate()
                            ).padStart(
                                2,
                                "0"
                            );


                        const shortMonth =
                            date.toLocaleString(
                                "en-US",
                                {
                                    month:
                                        "short"
                                }
                            );


                        doc.text(

                            `${day}\n${shortMonth}`,

                            x,

                            tableY + 5,

                            {

                                width:
                                    sessionWidth,

                                align:
                                    "center"

                            }

                        );


                        x +=
                            sessionWidth;

                    }
                );


                return (
                    tableY +
                    headerHeight
                );

            }


            /* =====================================
               DRAW PLAYER ROW
            ===================================== */

            function drawPlayerRow(
                player,
                playerNumber,
                sessionGroup,
                y
            ) {

                let x =
                    margin;


                /* =================================
                   ALTERNATING ROW BACKGROUND
                ================================= */

                if (
                    playerNumber %
                    2 ===
                    0
                ) {

                    doc
                        .rect(
                            margin,
                            y,
                            usableWidth,
                            rowHeight
                        )

                        .fill(
                            "#f8fafc"
                        );

                }


                /* =================================
                   ROW BORDER
                ================================= */

                doc
                    .rect(
                        margin,
                        y,
                        usableWidth,
                        rowHeight
                    )

                    .lineWidth(
                        0.3
                    )

                    .strokeColor(
                        "#d8dee7"
                    )

                    .stroke();


                doc
                    .fillColor(
                        "#1e293b"
                    )

                    .font(
                        "Helvetica"
                    )

                    .fontSize(
                        7
                    );


                /* =================================
                   ROW NUMBER
                ================================= */

                doc.text(

                    String(
                        playerNumber
                    ),

                    x,

                    y + 7,

                    {

                        width:
                            numberWidth,

                        align:
                            "center"

                    }

                );


                x +=
                    numberWidth;


                /* =================================
                   PLAYER NAME
                ================================= */

                const fullName =
                    `${player.first_name || ""} ${player.last_name || ""}`
                        .trim();


                doc
                    .font(
                        "Helvetica-Bold"
                    )

                    .text(

                        fullName,

                        x + 5,

                        y + 7,

                        {

                            width:
                                playerWidth -
                                10,

                            ellipsis:
                                true

                        }

                    );


                x +=
                    playerWidth;


                /* =================================
                   POSITION
                ================================= */

                doc
                    .font(
                        "Helvetica"
                    )

                    .text(

                        player.position ||
                        "-",

                        x,

                        y + 7,

                        {

                            width:
                                positionWidth,

                            align:
                                "center",

                            ellipsis:
                                true

                        }

                    );


                x +=
                    positionWidth;


                /* =================================
                   ATTENDANCE CELLS
                ================================= */

                sessionGroup.forEach(
                    session => {

                        const record =
                            report.attendance.find(

                                item =>

                                    Number(
                                        item.player_id
                                    ) ===

                                    Number(
                                        player.id
                                    )

                                    &&

                                    Number(
                                        item.session_id
                                    ) ===

                                    Number(
                                        session.id
                                    )

                            );


                        const status =
                            record

                                ? record.attendance_status

                                : "-";


                        let shortStatus =
                            "-";


                        /* PRESENT */

                        if (
                            status ===
                            "Present"
                        ) {

                            shortStatus =
                                "P";


                            doc.fillColor(
                                "#15803d"
                            );

                        }


                        /* ABSENT */

                        else if (
                            status ===
                            "Absent"
                        ) {

                            shortStatus =
                                "A";


                            doc.fillColor(
                                "#dc2626"
                            );

                        }


                        /* EXCUSED */

                        else if (
                            status ===
                            "Excused"
                        ) {

                            shortStatus =
                                "E";


                            doc.fillColor(
                                "#d97706"
                            );

                        }


                        else {

                            doc.fillColor(
                                "#64748b"
                            );

                        }


                        doc
                            .font(
                                "Helvetica-Bold"
                            )

                            .fontSize(
                                8
                            )

                            .text(

                                shortStatus,

                                x,

                                y + 7,

                                {

                                    width:
                                        sessionWidth,

                                    align:
                                        "center"

                                }

                            );


                        x +=
                            sessionWidth;

                    }
                );


                /* =================================
                   COLUMN DIVIDERS
                ================================= */

                let lineX =
                    margin +
                    numberWidth;


                doc
                    .moveTo(
                        lineX,
                        y
                    )

                    .lineTo(
                        lineX,
                        y +
                        rowHeight
                    )

                    .strokeColor(
                        "#e2e8f0"
                    )

                    .stroke();


                lineX +=
                    playerWidth;


                doc
                    .moveTo(
                        lineX,
                        y
                    )

                    .lineTo(
                        lineX,
                        y +
                        rowHeight
                    )

                    .stroke();


                lineX +=
                    positionWidth;


                doc
                    .moveTo(
                        lineX,
                        y
                    )

                    .lineTo(
                        lineX,
                        y +
                        rowHeight
                    )

                    .stroke();


                return (
                    y +
                    rowHeight
                );

            }


            /* =====================================
               FOOTER
            ===================================== */

            function drawFooter() {

                const footerY =
                    pageHeight -
                    27;


                doc
                    .moveTo(
                        margin,
                        footerY -
                        7
                    )

                    .lineTo(
                        pageWidth -
                        margin,
                        footerY -
                        7
                    )

                    .lineWidth(
                        0.5
                    )

                    .strokeColor(
                        "#cbd5e1"
                    )

                    .stroke();


                doc
                    .fillColor(
                        "#64748b"
                    )

                    .font(
                        "Helvetica"
                    )

                    .fontSize(
                        7
                    )

                    .text(

                        "P = Present     A = Absent     E = Excused",

                        margin,

                        footerY,

                        {

                            width:
                                usableWidth /
                                2

                        }

                    );


                doc.text(

                    "Generated by Mafori FC Player Training Attendance Register",

                    margin +
                    (
                        usableWidth /
                        2
                    ),

                    footerY,

                    {

                        width:
                            usableWidth /
                            2,

                        align:
                            "right"

                    }

                );

            }


            /* =====================================
               SPLIT TRAINING SESSIONS
               INTO GROUPS
            ===================================== */

            const sessionGroups =
                [];


            for (
                let i = 0;

                i <
                report.sessions.length;

                i +=
                sessionsPerPage
            ) {

                sessionGroups.push(

                    report.sessions.slice(
                        i,
                        i +
                        sessionsPerPage
                    )

                );

            }


            /* =====================================
               NO SESSIONS
            ===================================== */

            if (
                sessionGroups.length ===
                0
            ) {

                sessionGroups.push(
                    []
                );

            }


            /* =====================================
               GENERATE PDF PAGES
            ===================================== */

            sessionGroups.forEach(

                (
                    sessionGroup,
                    groupIndex
                ) => {

                    /* NEW HORIZONTAL DATE PAGE */

                    if (
                        groupIndex >
                        0
                    ) {

                        doc.addPage();

                    }


                    let y =
                        drawPageHeader(

                            sessionGroup,

                            groupIndex +
                            1,

                            sessionGroups.length

                        );


                    /* =================================
                       PLAYER ROWS
                    ================================= */

                    report.players.forEach(

                        (
                            player,
                            playerIndex
                        ) => {

                            /* =================================
                               NEW VERTICAL PAGE
                               WHEN PAGE IS FULL
                            ================================= */

                            if (
                                y +
                                rowHeight >
                                pageHeight -
                                45
                            ) {

                                drawFooter();


                                doc.addPage();


                                y =
                                    drawPageHeader(

                                        sessionGroup,

                                        groupIndex +
                                        1,

                                        sessionGroups.length

                                    );

                            }


                            y =
                                drawPlayerRow(

                                    player,

                                    playerIndex +
                                    1,

                                    sessionGroup,

                                    y

                                );

                        }

                    );


                    drawFooter();

                }

            );


            /* =====================================
               FINISH PDF
            ===================================== */

            doc.end();

        }

        catch (err) {

            console.error(
                "PDF Report Error:",
                err
            );


            if (
                !res.headersSent
            ) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            err.message

                    });

            }

        }

    }
);

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
            } =
                await supabase

                    .from("settings")

                    .select("*")

                    .limit(1)

                    .maybeSingle();


            if (error) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            return res.json({

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


            return res
                .status(500)
                .json({

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


            const {
                data: existing,
                error: findError
            } =
                await supabase

                    .from("settings")

                    .select("id")

                    .limit(1)

                    .maybeSingle();


            if (findError) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            findError.message

                    });

            }


            let data;

            let error;


            /* =====================================
               UPDATE EXISTING SETTINGS
            ===================================== */

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


            /* =====================================
               CREATE SETTINGS
            ===================================== */

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

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            error.message

                    });

            }


            return res.json({

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


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        err.message

                });

        }

    }
);


/* =====================================
   HEALTH CHECK
===================================== */

app.get(
    "/api/health",
    (req, res) => {

        return res.json({

            success: true,

            message:
                "Mafori FC Attendance Register API is running.",

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =====================================
   API 404
===================================== */

app.use(
    "/api",
    (req, res) => {

        return res
            .status(404)
            .json({

                success: false,

                message:
                    "API endpoint not found."

            });

    }
);


/* =====================================
   FRONTEND FALLBACK
===================================== */

app.use(
    (req, res) => {

        if (
            req.method !== "GET"
        ) {

            return res
                .status(404)
                .json({

                    success: false,

                    message:
                        "Route not found."

                });

        }


        return res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


/* =====================================
   GLOBAL ERROR HANDLER
===================================== */

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "Unhandled server error:",
            err
        );


        if (
            res.headersSent
        ) {

            return next(
                err
            );

        }


        return res
            .status(500)
            .json({

                success: false,

                message:
                    "An unexpected server error occurred."

            });

    }
);


/* =====================================
   START SERVER
===================================== */

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "====================================="
        );

        console.log(
            "⚽ MAFORI FC ATTENDANCE REGISTER"
        );

        console.log(
            "====================================="
        );

        console.log(
            `🚀 Server running on port ${PORT}`
        );

        console.log(
            "✅ Supabase connected"
        );

        console.log(
            "✅ Attendance API loaded"
        );

        console.log(
            "✅ Monthly PDF report enabled"
        );

        console.log(
            "✅ Mafori FC PDF watermark enabled"
        );

        console.log(
            "====================================="
        );

        console.log("");

    }
);

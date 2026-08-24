require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

const app = express();


/* =====================================
   MAFORI FC LOGO
===================================== */

const clubLogoPath = path.join(
    __dirname,
    "public",
    "MAFORI_FC_LOGO.jpeg"
);


/* =====================================
   SOUTH AFRICA DATE HELPER
===================================== */

function getSouthAfricaDateParts() {

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
        Number(
            getPart("year")
        );


    const month =
        Number(
            getPart("month")
        );


    const day =
        getPart("day");


    const date =
        `${year}-${String(
            month
        ).padStart(
            2,
            "0"
        )}-${day}`;


    return {

        date,

        year,

        month,

        day

    };

}


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
                        "New password must contain at least 6 characters."

                });

        }


        try {

            const {
                data: user,
                error: userError
            } =
                await supabase

                    .from("users")

                    .select(
                        "id, password"
                    )

                    .eq(
                        "id",
                        user_id
                    )

                    .maybeSingle();


            if (userError) {

                console.error(
                    "Password user lookup error:",
                    userError
                );

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            userError.message

                    });

            }


            if (!user) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "User not found."

                    });

            }


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
                    .status(500)
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
                "Change password error:",
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
   GET ALL PLAYERS
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

                console.error(
                    "Get players error:",
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
                        "Failed to load players."

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

        const {
            id
        } = req.params;


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

                    .maybeSingle();


            if (error) {

                console.error(
                    "Get player error:",
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
                            "Player not found."

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
                        "Failed to load player."

                });

        }

    }
);


/* =====================================
   ADD PLAYER
===================================== */

app.post(
    "/api/players",
    async (req, res) => {

        try {

            const {

                first_name,

                last_name,

                nickname,

                position,

                date_of_birth,

                status

            } = req.body;


            /* =====================================
               VALIDATION
            ===================================== */

            if (
                !first_name ||
                !last_name ||
                !position
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "First name, last name and position are required."

                    });

            }


            /* =====================================
               CREATE PLAYER
            ===================================== */

            const {
                data,
                error
            } =
                await supabase

                    .from("players")

                    .insert([{

                        first_name:
                            first_name.trim(),

                        last_name:
                            last_name.trim(),

                        nickname:
                            nickname
                                ? nickname.trim()
                                : null,

                        position:
                            position,

                        date_of_birth:
                            date_of_birth ||
                            null,

                        status:
                            status ||
                            "Active"

                    }])

                    .select()

                    .single();


            if (error) {

                console.error(
                    "Add player error:",
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


            return res
                .status(201)
                .json({

                    success: true,

                    message:
                        "Player added successfully.",

                    player:
                        data

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
                        "Failed to add player."

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

        const {
            id
        } = req.params;


        try {

            const {

                first_name,

                last_name,

                nickname,

                position,

                date_of_birth,

                status

            } = req.body;


            /* =====================================
               VALIDATION
            ===================================== */

            if (
                !first_name ||
                !last_name ||
                !position
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "First name, last name and position are required."

                    });

            }


            /* =====================================
               UPDATE PLAYER
            ===================================== */

            const {
                data,
                error
            } =
                await supabase

                    .from("players")

                    .update({

                        first_name:
                            first_name.trim(),

                        last_name:
                            last_name.trim(),

                        nickname:
                            nickname
                                ? nickname.trim()
                                : null,

                        position:
                            position,

                        date_of_birth:
                            date_of_birth ||
                            null,

                        status:
                            status ||
                            "Active"

                    })

                    .eq(
                        "id",
                        id
                    )

                    .select()

                    .maybeSingle();


            if (error) {

                console.error(
                    "Update player error:",
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


            if (!data) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Player not found."

                    });

            }


            return res.json({

                success: true,

                message:
                    "Player updated successfully.",

                player:
                    data

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
                        "Failed to update player."

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

        const {
            id
        } = req.params;


        try {

            /* =====================================
               CHECK PLAYER EXISTS
            ===================================== */

            const {
                data: player,
                error: playerError
            } =
                await supabase

                    .from("players")

                    .select("id")

                    .eq(
                        "id",
                        id
                    )

                    .maybeSingle();


            if (playerError) {

                console.error(
                    "Player lookup error:",
                    playerError
                );


                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            playerError.message

                    });

            }


            if (!player) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Player not found."

                    });

            }


            /* =====================================
               DELETE PLAYER
            ===================================== */

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

                console.error(
                    "Delete player error:",
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
                        "Failed to delete player."

                });

        }

    }
);


/* =====================================
   SEARCH PLAYERS
===================================== */

app.get(
    "/api/players-search",
    async (req, res) => {

        try {

            const search =
                String(
                    req.query.q || ""
                )
                    .trim();


            if (!search) {

                return res.json(
                    []
                );

            }


            /* =====================================
               GET PLAYERS
            ===================================== */

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

                console.error(
                    "Search players error:",
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


            const searchLower =
                search.toLowerCase();


            /* =====================================
               FILTER PLAYERS
            ===================================== */

            const filtered =
                (data || []).filter(
                    player => {

                        const firstName =
                            String(
                                player.first_name ||
                                ""
                            )
                                .toLowerCase();


                        const lastName =
                            String(
                                player.last_name ||
                                ""
                            )
                                .toLowerCase();


                        const nickname =
                            String(
                                player.nickname ||
                                ""
                            )
                                .toLowerCase();


                        const fullName =
                            `${firstName} ${lastName}`;


                        const id =
                            String(
                                player.id ||
                                ""
                            );


                        return (

                            firstName.includes(
                                searchLower
                            )

                            ||

                            lastName.includes(
                                searchLower
                            )

                            ||

                            nickname.includes(
                                searchLower
                            )

                            ||

                            fullName.includes(
                                searchLower
                            )

                            ||

                            id === search

                        );

                    }
                );


            return res.json(
                filtered
            );

        }

        catch (err) {

            console.error(
                "Search players error:",
                err
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Failed to search players."

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
            !Array.isArray(attendance) ||
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

            /* =====================================
               GET SOUTH AFRICA DATE
            ===================================== */

            const {
                date: todayDate,
                month: localMonth,
                year: localYear
            } =
                getSouthAfricaDateParts();


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

                console.error(
                    "Session lookup error:",
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


            /* =====================================
               CREATE TODAY'S SESSION IF NEEDED
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
                                localMonth,

                            year:
                                localYear

                        }])

                        .select()

                        .single();


                if (error) {

                    console.error(
                        "Create session error:",
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


                session =
                    data;

            }


            /* =====================================
               SAVE EACH PLAYER'S ATTENDANCE
            ===================================== */

            for (
                const player
                of attendance
            ) {

                /* =================================
                   VALIDATE PLAYER RECORD
                ================================= */

                if (
                    !player.player_id ||
                    !player.attendance_status
                ) {

                    continue;

                }


                const allowedStatuses = [
                    "Present",
                    "Absent",
                    "Excused"
                ];


                if (
                    !allowedStatuses.includes(
                        player.attendance_status
                    )
                ) {

                    continue;

                }


                /* =================================
                   CHECK EXISTING RECORD
                ================================= */

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
                   UPDATE EXISTING RECORD
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
                   INSERT NEW RECORD
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
               SAFE VALUES
            ===================================== */

            const safeTotalPlayers =
                totalPlayers || 0;


            const safePresent =
                present || 0;


            const safeAbsent =
                absent || 0;


            const safeExcused =
                excused || 0;


            /* =====================================
               ATTENDANCE RATE
            ===================================== */

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
               SUCCESS RESPONSE
            ===================================== */

            return res.json({

                success: true,

                message:
                    `Attendance saved successfully for ${todayDate}.`,

                session: {

                    id:
                        session.id,

                    session_date:
                        todayDate

                },

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

            /* =====================================
               GET SOUTH AFRICA DATE
            ===================================== */

            const {
                date: todayDate
            } =
                getSouthAfricaDateParts();


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

                    .select(
                        "id, session_date"
                    )

                    .eq(
                        "session_date",
                        todayDate
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


            let present =
                0;


            let absent =
                0;


            let excused =
                0;


            /* =====================================
               LOAD TODAY'S ATTENDANCE COUNTS
            ===================================== */

            if (session) {

                /* =================================
                   PRESENT COUNT
                ================================= */

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


                /* =================================
                   ABSENT COUNT
                ================================= */

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


                /* =================================
                   EXCUSED COUNT
                ================================= */

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
               SAFE TOTAL PLAYERS
            ===================================== */

            const safeTotalPlayers =
                totalPlayers || 0;


            /* =====================================
               ATTENDANCE RATE
            ===================================== */

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

                date:
                    todayDate,

                sessionExists:
                    Boolean(session),

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

    /* =====================================
       VALIDATE MONTH / YEAR
    ===================================== */

    const selectedMonth =
        Number(month);


    const selectedYear =
        Number(year);


    if (
        !selectedMonth ||
        selectedMonth < 1 ||
        selectedMonth > 12
    ) {

        throw new Error(
            "Invalid month selected."
        );

    }


    if (
        !selectedYear ||
        selectedYear < 2000
    ) {

        throw new Error(
            "Invalid year selected."
        );

    }


    /* =====================================
       FIRST DAY OF MONTH
    ===================================== */

    const firstDay =
        `${selectedYear}-${String(
            selectedMonth
        ).padStart(
            2,
            "0"
        )}-01`;


    /* =====================================
       LAST DAY OF MONTH
    ===================================== */

    const lastDayNumber =
        new Date(
            selectedYear,
            selectedMonth,
            0
        ).getDate();


    const lastDay =
        `${selectedYear}-${String(
            selectedMonth
        ).padStart(
            2,
            "0"
        )}-${String(
            lastDayNumber
        ).padStart(
            2,
            "0"
        )}`;


    console.log(
        "Monthly report date range:",
        firstDay,
        "to",
        lastDay
    );


    /* =====================================
       GET ALL TRAINING SESSIONS
       BY ACTUAL SESSION DATE
    ===================================== */

    const {
        data: sessions,
        error: sessionError
    } =
        await supabase

            .from("training_sessions")

            .select("*")

            .gte(
                "session_date",
                firstDay
            )

            .lte(
                "session_date",
                lastDay
            )

            .order(
                "session_date",
                {
                    ascending: true
                }
            );


    if (sessionError) {

        console.error(
            "Monthly sessions error:",
            sessionError
        );


        throw sessionError;

    }


    const safeSessions =
        Array.isArray(sessions)
            ? sessions
            : [];


    console.log(
        "Training sessions found:",
        safeSessions.map(
            session =>
                session.session_date
        )
    );


    /* =====================================
       GET ACTIVE PLAYERS
    ===================================== */

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

        console.error(
            "Monthly players error:",
            playerError
        );


        throw playerError;

    }


    const safePlayers =
        Array.isArray(players)
            ? players
            : [];


    /* =====================================
       GET SESSION IDS
    ===================================== */

    const sessionIds =
        safeSessions.map(
            session =>
                session.id
        );


    /* =====================================
       GET ATTENDANCE RECORDS
    ===================================== */

    let attendance =
        [];


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
                )

                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Monthly attendance error:",
                error
            );


            throw error;

        }


        attendance =
            Array.isArray(data)
                ? data
                : [];

    }


    /* =====================================
       DEBUG INFORMATION
    ===================================== */

    console.log(
        "Monthly report loaded:",
        {

            month:
                selectedMonth,

            year:
                selectedYear,

            firstDay:
                firstDay,

            lastDay:
                lastDay,

            sessions:
                safeSessions.length,

            players:
                safePlayers.length,

            attendanceRecords:
                attendance.length

        }
    );


    /* =====================================
       RETURN REPORT DATA
    ===================================== */

    return {

        month:
            selectedMonth,

        year:
            selectedYear,

        firstDay:
            firstDay,

        lastDay:
            lastDay,

        sessions:
            safeSessions,

        players:
            safePlayers,

        attendance:
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


            /* =====================================
               VALIDATION
            ===================================== */

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


            /* =====================================
               LOAD REPORT
            ===================================== */

            const report =
                await getMonthlyReportData(
                    month,
                    year
                );


            /* =====================================
               RESPONSE
            ===================================== */

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


            /* =====================================
               VALIDATION
            ===================================== */

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


            /* =====================================
               LOAD REPORT DATA
            ===================================== */

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


            /* =====================================
               ADD ALL SESSION DATES
            ===================================== */

            report.sessions.forEach(
                session => {

                    csv +=
                        `,${session.session_date}`;

                }
            );


            /* =====================================
               SUMMARY COLUMNS
            ===================================== */

            csv +=
                ",Present,Absent,Excused,Attendance Rate\n";


            /* =====================================
               PLAYER ROWS
            ===================================== */

            report.players.forEach(
                player => {

                    let present =
                        0;

                    let absent =
                        0;

                    let excused =
                        0;


                    /* =================================
                       PLAYER DETAILS
                    ================================= */

                    let row =
                        `${player.id},` +

                        `"${String(
                            player.first_name ||
                            ""
                        ).replaceAll(
                            '"',
                            '""'
                        )}",` +

                        `"${String(
                            player.last_name ||
                            ""
                        ).replaceAll(
                            '"',
                            '""'
                        )}",` +

                        `"${String(
                            player.position ||
                            ""
                        ).replaceAll(
                            '"',
                            '""'
                        )}"`;


                    /* =================================
                       ATTENDANCE FOR EACH SESSION
                    ================================= */

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

                    const totalMarked =
                        present +
                        absent +
                        excused;


                    const rate =
                        totalMarked > 0

                            ? (
                                (
                                    present /
                                    totalMarked
                                ) *
                                100
                            ).toFixed(1)

                            : "0.0";


                    /* =================================
                       SUMMARY VALUES
                    ================================= */

                    row +=
                        `,${present}` +
                        `,${absent}` +
                        `,${excused}` +
                        `,${rate}%\n`;


                    csv +=
                        row;

                }
            );


            /* =====================================
               FILE HEADERS
            ===================================== */

            res.setHeader(
                "Content-Type",
                "text/csv; charset=utf-8"
            );


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="Mafori_FC_Attendance_${month}_${year}.csv"`
            );


            /* =====================================
               UTF-8 BOM FOR EXCEL
            ===================================== */

            return res.send(
                "\uFEFF" +
                csv
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


            /* =====================================
               VALIDATION
            ===================================== */

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


            /* =====================================
               LOAD REPORT DATA
            ===================================== */

            const report =
                await getMonthlyReportData(
                    month,
                    year
                );


            /* =====================================
               MONTH NAME
            ===================================== */

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

                    size:
                        "A4",

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


            doc.pipe(
                res
            );


            /* =====================================
               PAGE SIZE
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
               TABLE WIDTHS
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
                Maximum 8 dates per horizontal page.

                Example:

                Page 1:
                01 03 05 08 10 12 15 17

                Page 2:
                19 20 22 24 26 28 30
            */

            const sessionsPerPage =
                8;


            const sessionWidth =
                availableSessionWidth /
                sessionsPerPage;


            const rowHeight =
                22;


            const headerHeight =
                34;


            /* =====================================
               REPORT TOTALS
            ===================================== */

            let totalPresent =
                0;


            let totalAbsent =
                0;


            let totalExcused =
                0;


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
                        0.055
                    );


                    const logoSize =
                        320;


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
                datePageNumber,
                totalDatePages
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

                        25,

                        {

                            width:
                                usableWidth,

                            align:
                                "center"

                        }

                    );


                /* =================================
                   ORANGE LINE
                ================================= */

                doc
                    .moveTo(
                        margin,
                        56
                    )

                    .lineTo(
                        pageWidth -
                        margin,
                        56
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
                        "#1e293b"
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

                        66,

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

                    .fillColor(
                        "#475569"
                    )

                    .text(

                        `${monthName} ${year}`,

                        margin,

                        88,

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
                        "#64748b"
                    )

                    .text(

                        `Players: ${report.players.length}     ` +
                        `Sessions: ${report.sessions.length}     ` +
                        `Present: ${totalPresent}     ` +
                        `Absent: ${totalAbsent}     ` +
                        `Excused: ${totalExcused}`,

                        margin,

                        108,

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
                    totalDatePages >
                    1
                ) {

                    doc
                        .fontSize(
                            7
                        )

                        .fillColor(
                            "#64748b"
                        )

                        .text(

                            `Attendance dates page ${datePageNumber} of ${totalDatePages}`,

                            margin,

                            122,

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
                    143;


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

                    tableY + 11,

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

                    tableY + 11,

                    {

                        width:
                            playerWidth - 10

                    }

                );


                x +=
                    playerWidth;


                /* POSITION */

                doc.text(

                    "POSITION",

                    x,

                    tableY + 11,

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
                   SESSION DATES
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
                                "en-ZA",
                                {
                                    month:
                                        "short"
                                }
                            );


                        doc.text(

                            `${day}\n${shortMonth}`,

                            x,

                            tableY + 6,

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
                   ALTERNATING BACKGROUND
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


                /* NUMBER */

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
                                playerWidth - 10,

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
                        footerY - 7
                    )

                    .lineTo(
                        pageWidth -
                        margin,
                        footerY - 7
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
                                usableWidth / 2

                        }

                    );


                doc.text(

                    "Generated by Mafori FC Player Training Attendance Register",

                    margin +
                    (
                        usableWidth / 2
                    ),

                    footerY,

                    {

                        width:
                            usableWidth / 2,

                        align:
                            "right"

                    }

                );

            }


            /* =====================================
               SPLIT ALL SESSION DATES
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

                    /* =================================
                       NEXT SET OF ATTENDANCE DATES
                    ================================= */

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

                            /* =============================
                               PAGE FULL VERTICALLY
                            ============================= */

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

                console.error(
                    "Settings GET Error:",
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


            /* =====================================
               FIND EXISTING SETTINGS
            ===================================== */

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

                console.error(
                    "Settings lookup error:",
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

                console.error(
                    "Settings save error:",
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

        const southAfricaDate =
            getSouthAfricaDateParts();


        return res.json({

            success: true,

            message:
                "Mafori FC Attendance Register API is running.",

            date:
                southAfricaDate.date,

            timezone:
                "Africa/Johannesburg",

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =====================================
   API 404
   KEEP THIS AFTER ALL API ROUTES
===================================== */

app.use(
    "/api",
    (req, res) => {

        console.log(
            "Unknown API request:",
            req.method,
            req.originalUrl
        );


        return res
            .status(404)
            .json({

                success: false,

                message:
                    `API endpoint not found: ${req.method} ${req.originalUrl}`

            });

    }
);


/* =====================================
   FRONTEND FALLBACK
===================================== */

app.use(
    (req, res) => {

        /* =================================
           ONLY ALLOW GET FALLBACK
        ================================= */

        if (
            req.method !==
            "GET"
        ) {

            return res
                .status(404)
                .json({

                    success: false,

                    message:
                        "Route not found."

                });

        }


        /* =================================
           SERVE INDEX.HTML
        ================================= */

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
    process.env.PORT ||
    3000;


app.listen(
    PORT,
    () => {

        const southAfricaDate =
            getSouthAfricaDateParts();


        console.log("");

        console.log(
            "========================================"
        );

        console.log(
            "⚽ MAFORI FC ATTENDANCE REGISTER"
        );

        console.log(
            "========================================"
        );

        console.log(
            `🚀 Server running on port ${PORT}`
        );

        console.log(
            "✅ Supabase client loaded"
        );

        console.log(
            "✅ Login API loaded"
        );

        console.log(
            "✅ User APIs loaded"
        );

        console.log(
            "✅ Player APIs loaded"
        );

        console.log(
            "✅ Attendance API loaded"
        );

        console.log(
            "✅ Dashboard API loaded"
        );

        console.log(
            "✅ Monthly report API loaded"
        );

        console.log(
            "✅ CSV download enabled"
        );

        console.log(
            "✅ PDF download enabled"
        );

        console.log(
            "✅ Mafori FC PDF watermark enabled"
        );

        console.log(
            "✅ South Africa timezone enabled"
        );

        console.log(
            `📅 Johannesburg date: ${southAfricaDate.date}`
        );

        console.log(
            "========================================"
        );

        console.log("");

    }
);

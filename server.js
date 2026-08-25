/* =====================================================
   MAFORI FC ATTENDANCE REGISTER
   SERVER.JS
===================================================== */


/* =====================================================
   ENVIRONMENT VARIABLES
===================================================== */

require("dotenv").config();


/* =====================================================
   IMPORTS
===================================================== */

const express = require("express");

const cors = require("cors");

const path = require("path");

const PDFDocument = require("pdfkit");

const bcrypt = require("bcryptjs");

const {
    createClient
} = require("@supabase/supabase-js");


/* =====================================================
   EXPRESS APP
===================================================== */

const app =
    express();


/* =====================================================
   BCRYPT SETTINGS
===================================================== */

/*
   12 rounds gives good password protection
   without making login unnecessarily slow.
*/

const BCRYPT_ROUNDS =
    12;


/* =====================================================
   MAFORI FC LOGO
===================================================== */

const clubLogoPath =
    path.join(
        __dirname,
        "public",
        "MAFORI_FC_LOGO.jpeg"
    );


/* =====================================================
   SOUTH AFRICA DATE HELPER
===================================================== */

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
            .formatToParts(
                now
            );


    const getPart =
        type =>
            parts.find(
                part =>
                    part.type === type
            )?.value;


    const year =
        Number(
            getPart(
                "year"
            )
        );


    const month =
        Number(
            getPart(
                "month"
            )
        );


    const day =
        getPart(
            "day"
        );


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


/* =====================================================
   HELPER: CHECK BCRYPT HASH
===================================================== */

function isBcryptHash(
    value
) {

    const password =
        String(
            value || ""
        );


    return (
        password.startsWith(
            "$2a$"
        ) ||
        password.startsWith(
            "$2b$"
        ) ||
        password.startsWith(
            "$2y$"
        )
    );

}


/* =====================================================
   HELPER: VERIFY PASSWORD

   Supports:
   1. New bcrypt passwords
   2. Old plaintext passwords during migration
===================================================== */

async function verifyPassword(
    enteredPassword,
    storedPassword
) {

    const entered =
        String(
            enteredPassword || ""
        );


    const stored =
        String(
            storedPassword || ""
        );


    if (
        !entered ||
        !stored
    ) {

        return false;

    }


    if (
        isBcryptHash(
            stored
        )
    ) {

        return bcrypt.compare(
            entered,
            stored
        );

    }


    /*
       Temporary support for an old
       plaintext password.
    */

    return (
        entered === stored
    );

}


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
    cors()
);


app.use(
    express.json({
        limit:
            "1mb"
    })
);


app.use(
    express.urlencoded({

        extended:
            true,

        limit:
            "1mb"

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


/* =====================================================
   CHECK REQUIRED ENVIRONMENT VARIABLES
===================================================== */

if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_ANON_KEY
) {

    console.error(
        "❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env"
    );

}


/* =====================================================
   SUPABASE CONNECTION
===================================================== */

const supabase =
    createClient(

        process.env.SUPABASE_URL,

        process.env.SUPABASE_ANON_KEY

    );


/* =====================================================
   HOME PAGE
===================================================== */

app.get(
    "/",

    (req, res) => {

        return res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


/* =====================================================
   LOGIN API
   BCRYPT PASSWORD HASHING
===================================================== */

app.post(
    "/api/login",

    async (req, res) => {

        try {

            const username =
                String(
                    req.body.username ||
                    ""
                )
                    .trim();


            const password =
                String(
                    req.body.password ||
                    ""
                );


            /* =========================================
               VALIDATION
            ========================================= */

            if (
                !username ||
                !password
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Username and password are required."

                    });

            }


            /* =========================================
               FIND USER BY USERNAME ONLY
            ========================================= */

            const {

                data:
                    user,

                error

            } =
                await supabase

                    .from(
                        "users"
                    )

                    .select(
                        "id, username, password, fullname, role"
                    )

                    .eq(
                        "username",
                        username
                    )

                    .maybeSingle();


            /* =========================================
               DATABASE ERROR
            ========================================= */

            if (error) {

                console.error(
                    "Login database error:",
                    error
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to process login."

                    });

            }


            /* =========================================
               USER NOT FOUND
            ========================================= */

            if (!user) {

                return res
                    .status(
                        401
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid username or password."

                    });

            }


            /* =========================================
               VERIFY PASSWORD
            ========================================= */

            const passwordMatches =
                await verifyPassword(

                    password,

                    user.password

                );


            if (
                !passwordMatches
            ) {

                return res
                    .status(
                        401
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid username or password."

                    });

            }


            /* =========================================
               MIGRATE OLD PLAINTEXT PASSWORD
               TO BCRYPT AFTER SUCCESSFUL LOGIN
            ========================================= */

            if (
                !isBcryptHash(
                    user.password
                )
            ) {

                try {

                    const hashedPassword =
                        await bcrypt.hash(

                            password,

                            BCRYPT_ROUNDS

                        );


                    const {
                        error:
                            migrationError
                    } =
                        await supabase

                            .from(
                                "users"
                            )

                            .update({

                                password:
                                    hashedPassword

                            })

                            .eq(
                                "id",
                                user.id
                            );


                    if (
                        migrationError
                    ) {

                        console.error(
                            "Password migration error:",
                            migrationError
                        );

                    }

                    else {

                        console.log(
                            `✅ Password secured for user: ${user.username}`
                        );

                    }

                }

                catch (
                    migrationException
                ) {

                    /*
                       Do not fail the login because
                       migration failed.

                       The administrator authenticated
                       successfully.
                    */

                    console.error(
                        "Password migration exception:",
                        migrationException
                    );

                }

            }


            /* =========================================
               LOGIN SUCCESS

               Never send password to browser.
            ========================================= */

            return res.json({

                success:
                    true,

                message:
                    "Login successful.",

                user: {

                    id:
                        user.id,

                    username:
                        user.username,

                    fullname:
                        user.fullname ||
                        "",

                    role:
                        user.role ||
                        "Administrator"

                }

            });

        }


        catch (err) {

            console.error(
                "Login error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Server error during login."

                });

        }

    }
);


/* =====================================================
   GET SINGLE USER
===================================================== */

app.get(
    "/api/users/:id",

    async (req, res) => {

        try {

            const id =
                String(
                    req.params.id ||
                    ""
                )
                    .trim();


            if (!id) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "User ID is required."

                    });

            }


            const {

                data,

                error

            } =
                await supabase

                    .from(
                        "users"
                    )

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
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load user."

                    });

            }


            if (!data) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "User not found."

                    });

            }


            return res.json({

                success:
                    true,

                user: {

                    id:
                        data.id,

                    username:
                        data.username,

                    fullname:
                        data.fullname ||
                        "",

                    role:
                        data.role ||
                        "Administrator"

                }

            });

        }


        catch (err) {

            console.error(
                "Get user error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Server error while loading user."

                });

        }

    }
);


/* =====================================================
   UPDATE USER PROFILE
===================================================== */

app.put(
    "/api/users/:id",

    async (req, res) => {

        try {

            const id =
                String(
                    req.params.id ||
                    ""
                )
                    .trim();


            const fullname =
                String(
                    req.body.fullname ||
                    ""
                )
                    .trim();


            const username =
                String(
                    req.body.username ||
                    ""
                )
                    .trim();


            /* =========================================
               VALIDATION
            ========================================= */

            if (!id) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "User ID is required."

                    });

            }


            if (
                !fullname ||
                !username
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Full name and username are required."

                    });

            }


            if (
                username.length <
                3
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Username must contain at least 3 characters."

                    });

            }


            /* =========================================
               CHECK WHETHER USER EXISTS
            ========================================= */

            const {

                data:
                    currentUser,

                error:
                    currentUserError

            } =
                await supabase

                    .from(
                        "users"
                    )

                    .select(
                        "id"
                    )

                    .eq(
                        "id",
                        id
                    )

                    .maybeSingle();


            if (
                currentUserError
            ) {

                console.error(
                    "User lookup error:",
                    currentUserError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to verify user."

                    });

            }


            if (!currentUser) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "User not found."

                    });

            }


            /* =========================================
               CHECK DUPLICATE USERNAME
            ========================================= */

            const {

                data:
                    existingUser,

                error:
                    existingError

            } =
                await supabase

                    .from(
                        "users"
                    )

                    .select(
                        "id"
                    )

                    .eq(
                        "username",
                        username
                    )

                    .neq(
                        "id",
                        id
                    )

                    .maybeSingle();


            if (
                existingError
            ) {

                console.error(
                    "Username check error:",
                    existingError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to check username."

                    });

            }


            if (
                existingUser
            ) {

                return res
                    .status(
                        409
                    )
                    .json({

                        success:
                            false,

                        message:
                            "That username is already being used."

                    });

            }


            /* =========================================
               UPDATE PROFILE
            ========================================= */

            const {

                data,

                error

            } =
                await supabase

                    .from(
                        "users"
                    )

                    .update({

                        fullname,

                        username

                    })

                    .eq(
                        "id",
                        id
                    )

                    .select(
                        "id, username, fullname, role"
                    )

                    .maybeSingle();


            if (error) {

                console.error(
                    "Update profile error:",
                    error
                );


                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to update profile."

                    });

            }


            if (!data) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "User not found."

                    });

            }


            return res.json({

                success:
                    true,

                message:
                    "Profile updated successfully.",

                user: {

                    id:
                        data.id,

                    username:
                        data.username,

                    fullname:
                        data.fullname ||
                        "",

                    role:
                        data.role ||
                        "Administrator"

                }

            });

        }


        catch (err) {

            console.error(
                "Profile update error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Server error while updating profile."

                });

        }

    }
);


/* =====================================================
   CHANGE USER PASSWORD
   BCRYPT SECURED
===================================================== */

app.put(
    "/api/change-password",

    async (req, res) => {

        try {

            const userId =
                String(
                    req.body.user_id ||
                    ""
                )
                    .trim();


            /*
               Do NOT trim passwords.

               Spaces may intentionally be
               part of a password.
            */

            const currentPassword =
                String(
                    req.body.current_password ||
                    ""
                );


            const newPassword =
                String(
                    req.body.new_password ||
                    ""
                );


            /* =========================================
               REQUIRED FIELDS
            ========================================= */

            if (
                !userId ||
                !currentPassword ||
                !newPassword
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "All password fields are required."

                    });

            }


            /* =========================================
               PASSWORD LENGTH
            ========================================= */

            if (
                newPassword.length <
                8
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "New password must contain at least 8 characters."

                    });

            }


            if (
                newPassword.length >
                128
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "New password is too long."

                    });

            }


            /* =========================================
               FIND USER
            ========================================= */

            const {

                data:
                    user,

                error:
                    userError

            } =
                await supabase

                    .from(
                        "users"
                    )

                    .select(
                        "id, username, password"
                    )

                    .eq(
                        "id",
                        userId
                    )

                    .maybeSingle();


            if (
                userError
            ) {

                console.error(
                    "Password user lookup error:",
                    userError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to verify your account."

                    });

            }


            if (!user) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "User not found."

                    });

            }


            /* =========================================
               VERIFY CURRENT PASSWORD
            ========================================= */

            const currentPasswordCorrect =
                await verifyPassword(

                    currentPassword,

                    user.password

                );


            if (
                !currentPasswordCorrect
            ) {

                return res
                    .status(
                        401
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Current password is incorrect."

                    });

            }


            /* =========================================
               PREVENT REUSING CURRENT PASSWORD
            ========================================= */

            const samePassword =
                currentPassword ===
                newPassword;


            if (
                samePassword
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Your new password must be different from your current password."

                    });

            }


            /* =========================================
               CREATE BCRYPT HASH
            ========================================= */

            const hashedPassword =
                await bcrypt.hash(

                    newPassword,

                    BCRYPT_ROUNDS

                );


            /* =========================================
               UPDATE PASSWORD
            ========================================= */

            const {

                error:
                    updateError

            } =
                await supabase

                    .from(
                        "users"
                    )

                    .update({

                        password:
                            hashedPassword

                    })

                    .eq(
                        "id",
                        userId
                    );


            if (
                updateError
            ) {

                console.error(
                    "Password update error:",
                    updateError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to change password."

                    });

            }


            console.log(
                `✅ Password changed securely for user: ${user.username}`
            );


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

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
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Server error while changing password."

                });

        }

    }
);


/* =====================================================
   PART 2 CONTINUES WITH:
   GET ALL PLAYERS
===================================================== */

/* =====================================================
   PART 2
   PLAYER MANAGEMENT APIs
===================================================== */


/* =====================================================
   ALLOWED PLAYER VALUES
===================================================== */

const allowedPlayerPositions = [

    "Goalkeeper",

    "Defender",

    "Midfielder",

    "Forward"

];


const allowedPlayerStatuses = [

    "Active",

    "Inactive"

];


/* =====================================================
   HELPER: CLEAN PLAYER ID
===================================================== */

function getValidPlayerId(
    value
) {

    const id =
        Number(
            value
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        return null;

    }


    return id;

}


/* =====================================================
   GET ALL PLAYERS
===================================================== */

app.get(
    "/api/players",

    async (req, res) => {

        try {

            const {

                data,

                error

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "*"
                    )

                    .order(
                        "id",
                        {
                            ascending:
                                true
                        }
                    );


            /* =========================================
               DATABASE ERROR
            ========================================= */

            if (error) {

                console.error(
                    "Get players error:",
                    error
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load players."

                    });

            }


            /* =========================================
               SUCCESS

               Frontend expects an array directly.
            ========================================= */

            return res.json(
                Array.isArray(
                    data
                )
                    ? data
                    : []
            );

        }


        catch (err) {

            console.error(
                "Get players error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Failed to load players."

                });

        }

    }
);


/* =====================================================
   GET SINGLE PLAYER
===================================================== */

app.get(
    "/api/players/:id",

    async (req, res) => {

        try {

            const playerId =
                getValidPlayerId(
                    req.params.id
                );


            /* =========================================
               VALIDATE ID
            ========================================= */

            if (!playerId) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid player ID."

                    });

            }


            /* =========================================
               LOAD PLAYER
            ========================================= */

            const {

                data,

                error

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "*"
                    )

                    .eq(
                        "id",
                        playerId
                    )

                    .maybeSingle();


            /* =========================================
               DATABASE ERROR
            ========================================= */

            if (error) {

                console.error(
                    "Get player error:",
                    error
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load player."

                    });

            }


            /* =========================================
               PLAYER NOT FOUND
            ========================================= */

            if (!data) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Player not found."

                    });

            }


            /* =========================================
               SUCCESS

               Edit-player.js expects player directly.
            ========================================= */

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
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Failed to load player."

                });

        }

    }
);


/* =====================================================
   ADD PLAYER
===================================================== */

app.post(
    "/api/players",

    async (req, res) => {

        try {

            /* =========================================
               CLEAN INPUT
            ========================================= */

            const firstName =
                String(
                    req.body.first_name ||
                    ""
                )
                    .trim();


            const lastName =
                String(
                    req.body.last_name ||
                    ""
                )
                    .trim();


            const nickname =
                String(
                    req.body.nickname ||
                    ""
                )
                    .trim();


            const position =
                String(
                    req.body.position ||
                    ""
                )
                    .trim();


            const dateOfBirth =
                String(
                    req.body.date_of_birth ||
                    ""
                )
                    .trim();


            const status =
                String(
                    req.body.status ||
                    "Active"
                )
                    .trim();


            /* =========================================
               REQUIRED FIELDS
            ========================================= */

            if (
                !firstName ||
                !lastName ||
                !position
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "First name, last name and position are required."

                    });

            }


            /* =========================================
               NAME LENGTH
            ========================================= */

            if (
                firstName.length >
                100
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "First name is too long."

                    });

            }


            if (
                lastName.length >
                100
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Last name is too long."

                    });

            }


            if (
                nickname.length >
                100
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Nickname is too long."

                    });

            }


            /* =========================================
               VALIDATE POSITION
            ========================================= */

            if (
                !allowedPlayerPositions.includes(
                    position
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid player position."

                    });

            }


            /* =========================================
               VALIDATE STATUS
            ========================================= */

            if (
                !allowedPlayerStatuses.includes(
                    status
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid player status."

                    });

            }


            /* =========================================
               VALIDATE DATE FORMAT
            ========================================= */

            if (
                dateOfBirth &&
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    dateOfBirth
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid date of birth."

                    });

            }


            /* =========================================
               PREVENT FUTURE DATE OF BIRTH
            ========================================= */

            if (
                dateOfBirth
            ) {

                const {

                    date:
                        todayDate

                } =
                    getSouthAfricaDateParts();


                if (
                    dateOfBirth >
                    todayDate
                ) {

                    return res
                        .status(
                            400
                        )
                        .json({

                            success:
                                false,

                            message:
                                "Date of birth cannot be in the future."

                        });

                }

            }


            /* =========================================
               CREATE PLAYER
            ========================================= */

            const {

                data,

                error

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .insert([

                        {

                            first_name:
                                firstName,

                            last_name:
                                lastName,

                            nickname:
                                nickname ||
                                null,

                            position:
                                position,

                            date_of_birth:
                                dateOfBirth ||
                                null,

                            status:
                                status

                        }

                    ])

                    .select()

                    .single();


            /* =========================================
               DATABASE ERROR
            ========================================= */

            if (error) {

                console.error(
                    "Add player error:",
                    error
                );


                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            error.message ||
                            "Unable to add player."

                    });

            }


            /* =========================================
               SUCCESS
            ========================================= */

            return res
                .status(
                    201
                )
                .json({

                    success:
                        true,

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
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Failed to add player."

                });

        }

    }
);


/* =====================================================
   UPDATE PLAYER
===================================================== */

app.put(
    "/api/players/:id",

    async (req, res) => {

        try {

            const playerId =
                getValidPlayerId(
                    req.params.id
                );


            /* =========================================
               VALIDATE ID
            ========================================= */

            if (!playerId) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid player ID."

                    });

            }


            /* =========================================
               CLEAN INPUT
            ========================================= */

            const firstName =
                String(
                    req.body.first_name ||
                    ""
                )
                    .trim();


            const lastName =
                String(
                    req.body.last_name ||
                    ""
                )
                    .trim();


            const nickname =
                String(
                    req.body.nickname ||
                    ""
                )
                    .trim();


            const position =
                String(
                    req.body.position ||
                    ""
                )
                    .trim();


            const dateOfBirth =
                String(
                    req.body.date_of_birth ||
                    ""
                )
                    .trim();


            const status =
                String(
                    req.body.status ||
                    "Active"
                )
                    .trim();


            /* =========================================
               REQUIRED FIELDS
            ========================================= */

            if (
                !firstName ||
                !lastName ||
                !position
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "First name, last name and position are required."

                    });

            }


            /* =========================================
               FIELD LENGTH
            ========================================= */

            if (
                firstName.length >
                100 ||
                lastName.length >
                100 ||
                nickname.length >
                100
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Player name or nickname is too long."

                    });

            }


            /* =========================================
               POSITION
            ========================================= */

            if (
                !allowedPlayerPositions.includes(
                    position
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid player position."

                    });

            }


            /* =========================================
               STATUS
            ========================================= */

            if (
                !allowedPlayerStatuses.includes(
                    status
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid player status."

                    });

            }


            /* =========================================
               DATE FORMAT
            ========================================= */

            if (
                dateOfBirth &&
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    dateOfBirth
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid date of birth."

                    });

            }


            /* =========================================
               FUTURE DATE CHECK
            ========================================= */

            if (
                dateOfBirth
            ) {

                const {

                    date:
                        todayDate

                } =
                    getSouthAfricaDateParts();


                if (
                    dateOfBirth >
                    todayDate
                ) {

                    return res
                        .status(
                            400
                        )
                        .json({

                            success:
                                false,

                            message:
                                "Date of birth cannot be in the future."

                        });

                }

            }


            /* =========================================
               CHECK PLAYER EXISTS
            ========================================= */

            const {

                data:
                    existingPlayer,

                error:
                    existingPlayerError

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "id"
                    )

                    .eq(
                        "id",
                        playerId
                    )

                    .maybeSingle();


            if (
                existingPlayerError
            ) {

                console.error(
                    "Player lookup error:",
                    existingPlayerError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to verify player."

                    });

            }


            if (
                !existingPlayer
            ) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Player not found."

                    });

            }


            /* =========================================
               UPDATE PLAYER
            ========================================= */

            const {

                data,

                error

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .update({

                        first_name:
                            firstName,

                        last_name:
                            lastName,

                        nickname:
                            nickname ||
                            null,

                        position:
                            position,

                        date_of_birth:
                            dateOfBirth ||
                            null,

                        status:
                            status

                    })

                    .eq(
                        "id",
                        playerId
                    )

                    .select()

                    .maybeSingle();


            /* =========================================
               UPDATE ERROR
            ========================================= */

            if (error) {

                console.error(
                    "Update player error:",
                    error
                );


                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            error.message ||
                            "Unable to update player."

                    });

            }


            if (!data) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Player not found."

                    });

            }


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

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
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Failed to update player."

                });

        }

    }
);


/* =====================================================
   DELETE PLAYER
===================================================== */

app.delete(
    "/api/players/:id",

    async (req, res) => {

        try {

            const playerId =
                getValidPlayerId(
                    req.params.id
                );


            /* =========================================
               VALIDATE PLAYER ID
            ========================================= */

            if (!playerId) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid player ID."

                    });

            }


            /* =========================================
               CHECK PLAYER EXISTS
            ========================================= */

            const {

                data:
                    player,

                error:
                    playerError

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "id, first_name, last_name"
                    )

                    .eq(
                        "id",
                        playerId
                    )

                    .maybeSingle();


            if (
                playerError
            ) {

                console.error(
                    "Player lookup error:",
                    playerError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to verify player."

                    });

            }


            if (!player) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Player not found."

                    });

            }


            /* =========================================
               DELETE PLAYER

               Attendance records should also be
               removed automatically because the
               attendance.player_id foreign key uses
               ON DELETE CASCADE.
            ========================================= */

            const {

                error

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .delete()

                    .eq(
                        "id",
                        playerId
                    );


            if (error) {

                console.error(
                    "Delete player error:",
                    error
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            error.message ||
                            "Unable to remove player."

                    });

            }


            /* =========================================
               PLAYER NAME
            ========================================= */

            const playerName =
                `${player.first_name || ""} ${player.last_name || ""}`
                    .trim();


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

                message:
                    playerName

                        ? `${playerName} was removed successfully.`

                        : "Player removed successfully."

            });

        }


        catch (err) {

            console.error(
                "Delete player error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Failed to delete player."

                });

        }

    }
);


/* =====================================================
   SEARCH PLAYERS
===================================================== */

app.get(
    "/api/players-search",

    async (req, res) => {

        try {

            const search =
                String(
                    req.query.q ||
                    ""
                )
                    .trim();


            /* =========================================
               EMPTY SEARCH
            ========================================= */

            if (!search) {

                return res.json(
                    []
                );

            }


            /* =========================================
               SEARCH LENGTH
            ========================================= */

            if (
                search.length >
                100
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Search text is too long."

                    });

            }


            /* =========================================
               LOAD PLAYERS

               Filtering locally preserves the same
               behavior as your existing implementation.
            ========================================= */

            const {

                data,

                error

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "*"
                    )

                    .order(
                        "id",
                        {
                            ascending:
                                true
                        }
                    );


            if (error) {

                console.error(
                    "Search players error:",
                    error
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to search players."

                    });

            }


            const players =
                Array.isArray(
                    data
                )
                    ? data
                    : [];


            const searchLower =
                search
                    .toLowerCase();


            /* =========================================
               FILTER PLAYERS
            ========================================= */

            const filteredPlayers =
                players.filter(
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


                        const position =
                            String(
                                player.position ||
                                ""
                            )
                                .toLowerCase();


                        const status =
                            String(
                                player.status ||
                                ""
                            )
                                .toLowerCase();


                        const fullName =
                            `${firstName} ${lastName}`
                                .trim();


                        const reversedName =
                            `${lastName} ${firstName}`
                                .trim();


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

                            fullName.includes(
                                searchLower
                            )

                            ||

                            reversedName.includes(
                                searchLower
                            )

                            ||

                            nickname.includes(
                                searchLower
                            )

                            ||

                            position.includes(
                                searchLower
                            )

                            ||

                            status.includes(
                                searchLower
                            )

                            ||

                            id ===
                            search

                        );

                    }
                );


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json(
                filteredPlayers
            );

        }


        catch (err) {

            console.error(
                "Search players error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        "Failed to search players."

                });

        }

    }
);


/* =====================================================
   END OF PART 2

   PART 3 STARTS WITH:
   SAVE ATTENDANCE
===================================================== */

/* =====================================================
   PART 3
   ATTENDANCE MANAGEMENT APIs
===================================================== */


/* =====================================================
   ALLOWED ATTENDANCE STATUSES
===================================================== */

const allowedAttendanceStatuses = [

    "Present",

    "Absent",

    "Excused"

];


/* =====================================================
   HELPER: VALIDATE YYYY-MM-DD DATE
===================================================== */

function isValidAttendanceDate(
    value
) {

    const date =
        String(
            value || ""
        )
            .trim();


    /* =========================================
       FORMAT CHECK
    ========================================= */

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            date
        )
    ) {

        return false;

    }


    const [
        yearText,
        monthText,
        dayText
    ] =
        date.split("-");


    const year =
        Number(
            yearText
        );


    const month =
        Number(
            monthText
        );


    const day =
        Number(
            dayText
        );


    /* =========================================
       BASIC RANGE CHECK
    ========================================= */

    if (
        year < 2000 ||
        year > 2100 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {

        return false;

    }


    /* =========================================
       REAL CALENDAR DATE CHECK

       Prevents invalid values such as:
       2026-02-31
    ========================================= */

    const parsedDate =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );


    return (

        parsedDate.getUTCFullYear() ===
        year

        &&

        parsedDate.getUTCMonth() ===
        month - 1

        &&

        parsedDate.getUTCDate() ===
        day

    );

}


/* =====================================================
   HELPER: GET OR CREATE TRAINING SESSION
===================================================== */

async function getOrCreateTrainingSession(
    sessionDate
) {

    /* =========================================
       LOOK FOR EXISTING SESSION
    ========================================= */

    const {

        data:
            existingSession,

        error:
            lookupError

    } =
        await supabase

            .from(
                "training_sessions"
            )

            .select(
                "*"
            )

            .eq(
                "session_date",
                sessionDate
            )

            .maybeSingle();


    if (
        lookupError
    ) {

        throw new Error(
            lookupError.message ||
            "Unable to find training session."
        );

    }


    if (
        existingSession
    ) {

        return existingSession;

    }


    /* =========================================
       EXTRACT YEAR + MONTH
    ========================================= */

    const [
        yearText,
        monthText
    ] =
        sessionDate.split("-");


    const sessionYear =
        Number(
            yearText
        );


    const sessionMonth =
        Number(
            monthText
        );


    /* =========================================
       CREATE SESSION
    ========================================= */

    const {

        data:
            newSession,

        error:
            createError

    } =
        await supabase

            .from(
                "training_sessions"
            )

            .insert([

                {

                    session_date:
                        sessionDate,

                    month:
                        sessionMonth,

                    year:
                        sessionYear

                }

            ])

            .select()

            .single();


    if (
        createError
    ) {

        throw new Error(
            createError.message ||
            "Unable to create training session."
        );

    }


    return newSession;

}


/* =====================================================
   SAVE TODAY'S ATTENDANCE
===================================================== */

app.post(
    "/api/attendance",

    async (req, res) => {

        try {

            const attendance =
                req.body.attendance;


            /* =========================================
               VALIDATE ATTENDANCE ARRAY
            ========================================= */

            if (
                !Array.isArray(
                    attendance
                ) ||
                attendance.length === 0
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "No attendance data received."

                    });

            }


            /* =========================================
               GET SOUTH AFRICA DATE
            ========================================= */

            const {

                date:
                    todayDate

            } =
                getSouthAfricaDateParts();


            /* =========================================
               CLEAN + VALIDATE RECORDS
            ========================================= */

            const cleanedAttendance =
                [];


            const seenPlayerIds =
                new Set();


            for (
                const record of attendance
            ) {

                const playerId =
                    getValidPlayerId(
                        record.player_id
                    );


                const attendanceStatus =
                    String(
                        record.attendance_status ||
                        ""
                    )
                        .trim();


                /* =====================================
                   INVALID PLAYER
                ===================================== */

                if (
                    !playerId
                ) {

                    return res
                        .status(
                            400
                        )
                        .json({

                            success:
                                false,

                            message:
                                "Attendance contains an invalid player ID."

                        });

                }


                /* =====================================
                   INVALID STATUS
                ===================================== */

                if (
                    !allowedAttendanceStatuses.includes(
                        attendanceStatus
                    )
                ) {

                    return res
                        .status(
                            400
                        )
                        .json({

                            success:
                                false,

                            message:
                                "Attendance status must be Present, Absent or Excused."

                        });

                }


                /* =====================================
                   PREVENT DUPLICATE PLAYER ENTRIES
                ===================================== */

                if (
                    seenPlayerIds.has(
                        playerId
                    )
                ) {

                    return res
                        .status(
                            400
                        )
                        .json({

                            success:
                                false,

                            message:
                                `Player ID ${playerId} appears more than once in the attendance request.`

                        });

                }


                seenPlayerIds.add(
                    playerId
                );


                cleanedAttendance.push({

                    player_id:
                        playerId,

                    attendance_status:
                        attendanceStatus

                });

            }


            /* =========================================
               GET ACTIVE PLAYERS
            ========================================= */

            const {

                data:
                    activePlayers,

                error:
                    playersError

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "id"
                    )

                    .eq(
                        "status",
                        "Active"
                    );


            if (
                playersError
            ) {

                console.error(
                    "Attendance active players error:",
                    playersError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to verify active players."

                    });

            }


            const safeActivePlayers =
                Array.isArray(
                    activePlayers
                )
                    ? activePlayers
                    : [];


            const activePlayerIds =
                new Set(
                    safeActivePlayers.map(
                        player =>
                            Number(
                                player.id
                            )
                    )
                );


            /* =========================================
               VERIFY EVERY SUBMITTED PLAYER EXISTS
               AND IS ACTIVE
            ========================================= */

            for (
                const record of cleanedAttendance
            ) {

                if (
                    !activePlayerIds.has(
                        record.player_id
                    )
                ) {

                    return res
                        .status(
                            400
                        )
                        .json({

                            success:
                                false,

                            message:
                                `Player ID ${record.player_id} is not an active Mafori FC player.`

                        });

                }

            }


            /* =========================================
               GET / CREATE TODAY'S SESSION
            ========================================= */

            let session;


            try {

                session =
                    await getOrCreateTrainingSession(
                        todayDate
                    );

            }

            catch (
                sessionError
            ) {

                console.error(
                    "Attendance session error:",
                    sessionError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            sessionError.message ||
                            "Unable to prepare today's training session."

                    });

            }


            /* =========================================
               SAVE EACH PLAYER

               Existing attendance is updated.
               Missing attendance is inserted.
            ========================================= */

            for (
                const record of cleanedAttendance
            ) {

                const {

                    data:
                        existingAttendance,

                    error:
                        existingError

                } =
                    await supabase

                        .from(
                            "attendance"
                        )

                        .select(
                            "id"
                        )

                        .eq(
                            "player_id",
                            record.player_id
                        )

                        .eq(
                            "session_id",
                            session.id
                        )

                        .maybeSingle();


                if (
                    existingError
                ) {

                    console.error(
                        "Attendance lookup error:",
                        existingError
                    );


                    return res
                        .status(
                            500
                        )
                        .json({

                            success:
                                false,

                            message:
                                "Unable to check existing attendance."

                        });

                }


                /* =====================================
                   UPDATE
                ===================================== */

                if (
                    existingAttendance
                ) {

                    const {

                        error:
                            updateError

                    } =
                        await supabase

                            .from(
                                "attendance"
                            )

                            .update({

                                attendance_status:
                                    record.attendance_status

                            })

                            .eq(
                                "id",
                                existingAttendance.id
                            );


                    if (
                        updateError
                    ) {

                        console.error(
                            "Attendance update error:",
                            updateError
                        );


                        return res
                            .status(
                                500
                            )
                            .json({

                                success:
                                    false,

                                message:
                                    "Unable to update attendance."

                            });

                    }

                }


                /* =====================================
                   INSERT
                ===================================== */

                else {

                    const {

                        error:
                            insertError

                    } =
                        await supabase

                            .from(
                                "attendance"
                            )

                            .insert([

                                {

                                    player_id:
                                        record.player_id,

                                    session_id:
                                        session.id,

                                    attendance_status:
                                        record.attendance_status

                                }

                            ]);


                    if (
                        insertError
                    ) {

                        console.error(
                            "Attendance insert error:",
                            insertError
                        );


                        return res
                            .status(
                                500
                            )
                            .json({

                                success:
                                    false,

                                message:
                                    "Unable to save attendance."

                            });

                    }

                }

            }


            /* =========================================
               LOAD SAVED ATTENDANCE FOR TODAY
            ========================================= */

            const {

                data:
                    savedRecords,

                error:
                    savedRecordsError

            } =
                await supabase

                    .from(
                        "attendance"
                    )

                    .select(
                        "player_id, attendance_status"
                    )

                    .eq(
                        "session_id",
                        session.id
                    );


            if (
                savedRecordsError
            ) {

                console.error(
                    "Attendance statistics error:",
                    savedRecordsError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Attendance was saved, but statistics could not be calculated."

                    });

            }


            const safeSavedRecords =
                Array.isArray(
                    savedRecords
                )
                    ? savedRecords
                    : [];


            /*
               Only active players are included
               in today's dashboard statistics.
            */

            const activeAttendance =
                safeSavedRecords.filter(
                    record =>
                        activePlayerIds.has(
                            Number(
                                record.player_id
                            )
                        )
                );


            /* =========================================
               CALCULATE STATISTICS
            ========================================= */

            const present =
                activeAttendance.filter(
                    record =>
                        record.attendance_status ===
                        "Present"
                ).length;


            const absent =
                activeAttendance.filter(
                    record =>
                        record.attendance_status ===
                        "Absent"
                ).length;


            const excused =
                activeAttendance.filter(
                    record =>
                        record.attendance_status ===
                        "Excused"
                ).length;


            const totalPlayers =
                safeActivePlayers.length;


            const attendanceRate =
                totalPlayers > 0

                    ? (
                        (
                            present /
                            totalPlayers
                        ) *
                        100
                    ).toFixed(
                        1
                    )

                    : "0.0";


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

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
                        totalPlayers,

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
                "Attendance save error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to save attendance."

                });

        }

    }
);


/* =====================================================
   GET ATTENDANCE REGISTER BY DATE
===================================================== */

app.get(
    "/api/attendance/date/:date",

    async (req, res) => {

        try {

            const date =
                String(
                    req.params.date ||
                    ""
                )
                    .trim();


            /* =========================================
               VALIDATE DATE
            ========================================= */

            if (
                !isValidAttendanceDate(
                    date
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid attendance date."

                    });

            }


            /* =========================================
               FIND TRAINING SESSION
            ========================================= */

            const {

                data:
                    session,

                error:
                    sessionError

            } =
                await supabase

                    .from(
                        "training_sessions"
                    )

                    .select(
                        "*"
                    )

                    .eq(
                        "session_date",
                        date
                    )

                    .maybeSingle();


            if (
                sessionError
            ) {

                console.error(
                    "Attendance session lookup error:",
                    sessionError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load the training session."

                    });

            }


            /* =========================================
               GET ACTIVE PLAYERS
            ========================================= */

            const {

                data:
                    players,

                error:
                    playersError

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "id, first_name, last_name, nickname, position, date_of_birth, status"
                    )

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


            if (
                playersError
            ) {

                console.error(
                    "Attendance players error:",
                    playersError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load players."

                    });

            }


            const safePlayers =
                Array.isArray(
                    players
                )
                    ? players
                    : [];


            /* =========================================
               NO TRAINING SESSION FOR DATE
            ========================================= */

            if (
                !session
            ) {

                return res.json({

                    success:
                        true,

                    date:
                        date,

                    sessionExists:
                        false,

                    session:
                        null,

                    players:
                        safePlayers.map(
                            player => ({

                                ...player,

                                attendance_id:
                                    null,

                                attendance_status:
                                    null

                            })
                        )

                });

            }


            /* =========================================
               LOAD ATTENDANCE RECORDS
            ========================================= */

            const {

                data:
                    attendanceRecords,

                error:
                    attendanceError

            } =
                await supabase

                    .from(
                        "attendance"
                    )

                    .select(
                        "id, player_id, session_id, attendance_status"
                    )

                    .eq(
                        "session_id",
                        session.id
                    );


            if (
                attendanceError
            ) {

                console.error(
                    "Attendance records error:",
                    attendanceError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load attendance records."

                    });

            }


            const safeAttendance =
                Array.isArray(
                    attendanceRecords
                )
                    ? attendanceRecords
                    : [];


            /* =========================================
               CREATE ATTENDANCE LOOKUP MAP

               This is faster and cleaner than
               repeatedly searching the array.
            ========================================= */

            const attendanceByPlayer =
                new Map();


            safeAttendance.forEach(
                record => {

                    attendanceByPlayer.set(

                        Number(
                            record.player_id
                        ),

                        record

                    );

                }
            );


            /* =========================================
               MERGE PLAYER + ATTENDANCE
            ========================================= */

            const result =
                safePlayers.map(
                    player => {

                        const record =
                            attendanceByPlayer.get(
                                Number(
                                    player.id
                                )
                            );


                        return {

                            ...player,

                            attendance_id:
                                record
                                    ? record.id
                                    : null,

                            attendance_status:
                                record
                                    ? record.attendance_status
                                    : null

                        };

                    }
                );


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

                date:
                    date,

                sessionExists:
                    true,

                session:
                    session,

                players:
                    result

            });

        }


        catch (err) {

            console.error(
                "Get attendance by date error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to load attendance register."

                });

        }

    }
);


/* =====================================================
   EDIT / UPDATE ONE PLAYER'S ATTENDANCE
===================================================== */

app.put(
    "/api/attendance/player/:playerId",

    async (req, res) => {

        try {

            const playerId =
                getValidPlayerId(
                    req.params.playerId
                );


            const date =
                String(
                    req.body.date ||
                    ""
                )
                    .trim();


            const attendanceStatus =
                String(
                    req.body.attendance_status ||
                    ""
                )
                    .trim();


            /* =========================================
               VALIDATE PLAYER
            ========================================= */

            if (
                !playerId
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid player."

                    });

            }


            /* =========================================
               VALIDATE DATE
            ========================================= */

            if (
                !isValidAttendanceDate(
                    date
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Invalid attendance date."

                    });

            }


            /* =========================================
               VALIDATE STATUS
            ========================================= */

            if (
                !allowedAttendanceStatuses.includes(
                    attendanceStatus
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Attendance must be Present, Absent or Excused."

                    });

            }


            /* =========================================
               FIND PLAYER
            ========================================= */

            const {

                data:
                    player,

                error:
                    playerError

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "id, first_name, last_name, status"
                    )

                    .eq(
                        "id",
                        playerId
                    )

                    .maybeSingle();


            if (
                playerError
            ) {

                console.error(
                    "Attendance player lookup error:",
                    playerError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to verify player."

                    });

            }


            if (
                !player
            ) {

                return res
                    .status(
                        404
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Player not found."

                    });

            }


            /* =========================================
               GET OR CREATE SESSION
            ========================================= */

            let session;


            try {

                session =
                    await getOrCreateTrainingSession(
                        date
                    );

            }

            catch (
                sessionError
            ) {

                console.error(
                    "Individual attendance session error:",
                    sessionError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            sessionError.message ||
                            "Unable to prepare training session."

                    });

            }


            /* =========================================
               FIND EXISTING ATTENDANCE
            ========================================= */

            const {

                data:
                    existingAttendance,

                error:
                    existingError

            } =
                await supabase

                    .from(
                        "attendance"
                    )

                    .select(
                        "id"
                    )

                    .eq(
                        "player_id",
                        playerId
                    )

                    .eq(
                        "session_id",
                        session.id
                    )

                    .maybeSingle();


            if (
                existingError
            ) {

                console.error(
                    "Existing attendance lookup error:",
                    existingError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to check existing attendance."

                    });

            }


            let savedAttendance;


            /* =========================================
               UPDATE EXISTING RECORD
            ========================================= */

            if (
                existingAttendance
            ) {

                const {

                    data,

                    error

                } =
                    await supabase

                        .from(
                            "attendance"
                        )

                        .update({

                            attendance_status:
                                attendanceStatus

                        })

                        .eq(
                            "id",
                            existingAttendance.id
                        )

                        .select()

                        .single();


                if (
                    error
                ) {

                    console.error(
                        "Update attendance error:",
                        error
                    );


                    return res
                        .status(
                            500
                        )
                        .json({

                            success:
                                false,

                            message:
                                "Unable to update attendance."

                        });

                }


                savedAttendance =
                    data;

            }


            /* =========================================
               CREATE NEW ATTENDANCE RECORD
            ========================================= */

            else {

                const {

                    data,

                    error

                } =
                    await supabase

                        .from(
                            "attendance"
                        )

                        .insert([

                            {

                                player_id:
                                    playerId,

                                session_id:
                                    session.id,

                                attendance_status:
                                    attendanceStatus

                            }

                        ])

                        .select()

                        .single();


                if (
                    error
                ) {

                    console.error(
                        "Create attendance error:",
                        error
                    );


                    return res
                        .status(
                            500
                        )
                        .json({

                            success:
                                false,

                            message:
                                "Unable to create attendance record."

                        });

                }


                savedAttendance =
                    data;

            }


            /* =========================================
               PLAYER DISPLAY NAME
            ========================================= */

            const playerName =
                `${player.first_name || ""} ${player.last_name || ""}`
                    .trim();


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

                message:
                    `${playerName}'s attendance has been updated.`,

                date:
                    date,

                session: {

                    id:
                        session.id,

                    session_date:
                        session.session_date

                },

                attendance:
                    savedAttendance

            });

        }


        catch (err) {

            console.error(
                "Update individual attendance error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to update attendance."

                });

        }

    }
);


/* =====================================================
   END OF PART 3

   PART 4 STARTS WITH:
   TODAY'S PLAYER BIRTHDAYS
===================================================== */

/* =====================================================
   PART 4
   BIRTHDAYS + DASHBOARD STATISTICS
===================================================== */


/* =====================================================
   TODAY'S PLAYER BIRTHDAYS
===================================================== */

app.get(
    "/api/birthdays/today",

    async (req, res) => {

        try {

            /* =========================================
               GET SOUTH AFRICA DATE
            ========================================= */

            const {

                date:
                    todayDate,

                year:
                    currentYear,

                month:
                    currentMonth,

                day:
                    currentDay

            } =
                getSouthAfricaDateParts();


            /* =========================================
               LOAD ACTIVE PLAYERS WITH DOB
            ========================================= */

            const {

                data:
                    players,

                error

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "id, first_name, last_name, nickname, date_of_birth, position"
                    )

                    .eq(
                        "status",
                        "Active"
                    )

                    .not(
                        "date_of_birth",
                        "is",
                        null
                    )

                    .order(
                        "first_name",
                        {
                            ascending:
                                true
                        }
                    );


            /* =========================================
               DATABASE ERROR
            ========================================= */

            if (
                error
            ) {

                console.error(
                    "Birthday lookup error:",
                    error
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to check today's birthdays."

                    });

            }


            const safePlayers =
                Array.isArray(
                    players
                )
                    ? players
                    : [];


            /* =========================================
               FIND TODAY'S BIRTHDAYS
            ========================================= */

            const birthdays =
                safePlayers

                    .filter(
                        player => {

                            if (
                                !player.date_of_birth
                            ) {

                                return false;

                            }


                            const birthDate =
                                String(
                                    player.date_of_birth
                                );


                            /*
                               Supabase DATE fields normally
                               return YYYY-MM-DD.
                            */

                            if (
                                !isValidAttendanceDate(
                                    birthDate
                                )
                            ) {

                                return false;

                            }


                            const [
                                birthYearText,
                                birthMonthText,
                                birthDayText
                            ] =
                                birthDate.split("-");


                            const birthMonth =
                                Number(
                                    birthMonthText
                                );


                            const birthDay =
                                Number(
                                    birthDayText
                                );


                            return (

                                birthMonth ===
                                Number(
                                    currentMonth
                                )

                                &&

                                birthDay ===
                                Number(
                                    currentDay
                                )

                            );

                        }
                    )

                    .map(
                        player => {

                            const birthYear =
                                Number(
                                    String(
                                        player.date_of_birth
                                    )
                                        .split("-")[0]
                                );


                            const age =
                                Number.isInteger(
                                    birthYear
                                )

                                    ? (
                                        currentYear -
                                        birthYear
                                    )

                                    : null;


                            const fullName =
                                `${player.first_name || ""} ${player.last_name || ""}`
                                    .trim();


                            return {

                                id:
                                    player.id,

                                first_name:
                                    player.first_name,

                                last_name:
                                    player.last_name,

                                full_name:
                                    fullName,

                                nickname:
                                    player.nickname ||
                                    null,

                                position:
                                    player.position,

                                date_of_birth:
                                    player.date_of_birth,

                                age:
                                    age

                            };

                        }
                    );


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

                date:
                    todayDate,

                count:
                    birthdays.length,

                birthdays:
                    birthdays

            });

        }


        catch (err) {

            console.error(
                "Birthday API error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to check player birthdays."

                });

        }

    }
);


/* =====================================================
   DASHBOARD STATISTICS
===================================================== */

app.get(
    "/api/dashboard/statistics",

    async (req, res) => {

        try {

            /* =========================================
               GET SOUTH AFRICA DATE
            ========================================= */

            const {

                date:
                    todayDate

            } =
                getSouthAfricaDateParts();


            /* =========================================
               LOAD ACTIVE PLAYERS

               Loading IDs lets us make sure dashboard
               attendance only counts active players.
            ========================================= */

            const {

                data:
                    activePlayers,

                error:
                    playersError

            } =
                await supabase

                    .from(
                        "players"
                    )

                    .select(
                        "id"
                    )

                    .eq(
                        "status",
                        "Active"
                    );


            if (
                playersError
            ) {

                console.error(
                    "Dashboard players error:",
                    playersError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load dashboard players."

                    });

            }


            const safeActivePlayers =
                Array.isArray(
                    activePlayers
                )
                    ? activePlayers
                    : [];


            const totalPlayers =
                safeActivePlayers.length;


            const activePlayerIds =
                new Set(
                    safeActivePlayers.map(
                        player =>
                            Number(
                                player.id
                            )
                    )
                );


            /* =========================================
               FIND TODAY'S TRAINING SESSION
            ========================================= */

            const {

                data:
                    session,

                error:
                    sessionError

            } =
                await supabase

                    .from(
                        "training_sessions"
                    )

                    .select(
                        "id, session_date"
                    )

                    .eq(
                        "session_date",
                        todayDate
                    )

                    .maybeSingle();


            if (
                sessionError
            ) {

                console.error(
                    "Dashboard session error:",
                    sessionError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load today's training session."

                    });

            }


            /* =========================================
               DEFAULT VALUES

               If there is no training session today,
               dashboard stays at zero.
            ========================================= */

            let present =
                0;


            let absent =
                0;


            let excused =
                0;


            let markedPlayers =
                0;


            /* =========================================
               LOAD TODAY'S ATTENDANCE
            ========================================= */

            if (
                session
            ) {

                const {

                    data:
                        attendanceRecords,

                    error:
                        attendanceError

                } =
                    await supabase

                        .from(
                            "attendance"
                        )

                        .select(
                            "player_id, attendance_status"
                        )

                        .eq(
                            "session_id",
                            session.id
                        );


                if (
                    attendanceError
                ) {

                    console.error(
                        "Dashboard attendance error:",
                        attendanceError
                    );


                    return res
                        .status(
                            500
                        )
                        .json({

                            success:
                                false,

                            message:
                                "Unable to load today's attendance."

                        });

                }


                const safeAttendance =
                    Array.isArray(
                        attendanceRecords
                    )
                        ? attendanceRecords
                        : [];


                /*
                   Ignore attendance belonging to a
                   player who is no longer Active.
                */

                const activeAttendance =
                    safeAttendance.filter(
                        record =>
                            activePlayerIds.has(
                                Number(
                                    record.player_id
                                )
                            )
                    );


                markedPlayers =
                    activeAttendance.length;


                present =
                    activeAttendance.filter(
                        record =>
                            record.attendance_status ===
                            "Present"
                    ).length;


                absent =
                    activeAttendance.filter(
                        record =>
                            record.attendance_status ===
                            "Absent"
                    ).length;


                excused =
                    activeAttendance.filter(
                        record =>
                            record.attendance_status ===
                            "Excused"
                    ).length;

            }


            /* =========================================
               ATTENDANCE RATE

               Mafori FC dashboard currently defines
               attendance rate as:

               Present / Total Active Players × 100
            ========================================= */

            const attendanceRate =
                totalPlayers > 0

                    ? (
                        (
                            present /
                            totalPlayers
                        ) *
                        100
                    ).toFixed(
                        1
                    )

                    : "0.0";


            /* =========================================
               UNMARKED PLAYERS
            ========================================= */

            const unmarked =
                Math.max(
                    totalPlayers -
                    markedPlayers,
                    0
                );


            /* =========================================
               RESPONSE

               Keep existing field names because
               dashboard.js uses:
               stats.totalPlayers
               stats.present
               stats.absent
               stats.excused
               stats.attendanceRate
            ========================================= */

            return res.json({

                success:
                    true,

                date:
                    todayDate,

                sessionExists:
                    Boolean(
                        session
                    ),

                session:
                    session
                        ? {

                            id:
                                session.id,

                            session_date:
                                session.session_date

                        }
                        : null,

                statistics: {

                    totalPlayers:
                        totalPlayers,

                    present:
                        present,

                    absent:
                        absent,

                    excused:
                        excused,

                    markedPlayers:
                        markedPlayers,

                    unmarked:
                        unmarked,

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
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to load dashboard statistics."

                });

        }

    }
);


/* =====================================================
   END OF PART 4

   PART 5 STARTS WITH:
   MONTHLY REPORT DATA
===================================================== */

/* =====================================================
   PART 5
   MONTHLY REPORTS + CSV + PDF
===================================================== */


/* =====================================================
   MONTH NAMES
===================================================== */

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


/* =====================================================
   HELPER: VALIDATE REPORT MONTH
===================================================== */

function getValidReportMonth(
    value
) {

    const month =
        Number(
            value
        );


    if (
        !Number.isInteger(
            month
        ) ||
        month < 1 ||
        month > 12
    ) {

        return null;

    }


    return month;

}


/* =====================================================
   HELPER: VALIDATE REPORT YEAR
===================================================== */

function getValidReportYear(
    value
) {

    const year =
        Number(
            value
        );


    if (
        !Number.isInteger(
            year
        ) ||
        year < 2000 ||
        year > 2100
    ) {

        return null;

    }


    return year;

}


/* =====================================================
   HELPER: CSV VALUE
===================================================== */

function escapeCsvValue(
    value
) {

    const text =
        String(
            value ?? ""
        );


    return `"${text.replaceAll(
        '"',
        '""'
    )}"`;

}


/* =====================================================
   HELPER: BUILD ATTENDANCE LOOKUP KEY
===================================================== */

function attendanceLookupKey(
    playerId,
    sessionId
) {

    return (
        `${Number(playerId)}:${Number(sessionId)}`
    );

}


/* =====================================================
   MONTHLY REPORT DATA
===================================================== */

async function getMonthlyReportData(
    month,
    year
) {

    /* =========================================
       VALIDATE MONTH
    ========================================= */

    const selectedMonth =
        getValidReportMonth(
            month
        );


    if (
        !selectedMonth
    ) {

        throw new Error(
            "Invalid month selected."
        );

    }


    /* =========================================
       VALIDATE YEAR
    ========================================= */

    const selectedYear =
        getValidReportYear(
            year
        );


    if (
        !selectedYear
    ) {

        throw new Error(
            "Invalid year selected."
        );

    }


    /* =========================================
       FIRST DAY
    ========================================= */

    const firstDay =
        `${selectedYear}-${String(
            selectedMonth
        ).padStart(
            2,
            "0"
        )}-01`;


    /* =========================================
       LAST DAY
    ========================================= */

    const lastDayNumber =
        new Date(
            selectedYear,
            selectedMonth,
            0
        )
            .getDate();


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


    /* =========================================
       LOAD TRAINING SESSIONS
    ========================================= */

    const {

        data:
            sessions,

        error:
            sessionsError

    } =
        await supabase

            .from(
                "training_sessions"
            )

            .select(
                "id, session_date, month, year"
            )

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
                    ascending:
                        true
                }
            );


    if (
        sessionsError
    ) {

        console.error(
            "Monthly sessions error:",
            sessionsError
        );


        throw new Error(
            sessionsError.message ||
            "Unable to load training sessions."
        );

    }


    const safeSessions =
        Array.isArray(
            sessions
        )
            ? sessions
            : [];


    /* =========================================
       LOAD ACTIVE PLAYERS
    ========================================= */

    const {

        data:
            players,

        error:
            playersError

    } =
        await supabase

            .from(
                "players"
            )

            .select(
                "id, first_name, last_name, nickname, position, date_of_birth, status"
            )

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


    if (
        playersError
    ) {

        console.error(
            "Monthly players error:",
            playersError
        );


        throw new Error(
            playersError.message ||
            "Unable to load players."
        );

    }


    const safePlayers =
        Array.isArray(
            players
        )
            ? players
            : [];


    /* =========================================
       SESSION IDS
    ========================================= */

    const sessionIds =
        safeSessions.map(
            session =>
                session.id
        );


    /* =========================================
       LOAD ATTENDANCE
    ========================================= */

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

                .from(
                    "attendance"
                )

                .select(
                    "id, player_id, session_id, attendance_status"
                )

                .in(
                    "session_id",
                    sessionIds
                )

                .order(
                    "id",
                    {
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

            console.error(
                "Monthly attendance error:",
                error
            );


            throw new Error(
                error.message ||
                "Unable to load monthly attendance."
            );

        }


        attendance =
            Array.isArray(
                data
            )
                ? data
                : [];

    }


    /* =========================================
       FILTER TO ACTIVE PLAYERS ONLY
    ========================================= */

    const activePlayerIds =
        new Set(
            safePlayers.map(
                player =>
                    Number(
                        player.id
                    )
            )
        );


    attendance =
        attendance.filter(
            record =>
                activePlayerIds.has(
                    Number(
                        record.player_id
                    )
                )
        );


    /* =========================================
       CALCULATE REPORT TOTALS
    ========================================= */

    const totalPresent =
        attendance.filter(
            record =>
                record.attendance_status ===
                "Present"
        ).length;


    const totalAbsent =
        attendance.filter(
            record =>
                record.attendance_status ===
                "Absent"
        ).length;


    const totalExcused =
        attendance.filter(
            record =>
                record.attendance_status ===
                "Excused"
        ).length;


    const totalMarked =
        totalPresent +
        totalAbsent +
        totalExcused;


    const overallAttendanceRate =
        totalMarked > 0

            ? (
                (
                    totalPresent /
                    totalMarked
                ) *
                100
            ).toFixed(
                1
            )

            : "0.0";


    /* =========================================
       RESPONSE OBJECT
    ========================================= */

    return {

        month:
            selectedMonth,

        monthName:
            monthNames[
                selectedMonth - 1
            ],

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
            attendance,

        summary: {

            totalPlayers:
                safePlayers.length,

            totalSessions:
                safeSessions.length,

            present:
                totalPresent,

            absent:
                totalAbsent,

            excused:
                totalExcused,

            totalMarked:
                totalMarked,

            attendanceRate:
                overallAttendanceRate

        }

    };

}


/* =====================================================
   MONTHLY REPORT JSON API
===================================================== */

app.get(
    "/api/reports/monthly/data",

    async (req, res) => {

        try {

            const {

                month,

                year

            } =
                req.query;


            /* =========================================
               REQUIRED VALUES
            ========================================= */

            if (
                month === undefined ||
                year === undefined
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Month and year are required."

                    });

            }


            /* =========================================
               LOAD REPORT
            ========================================= */

            const report =
                await getMonthlyReportData(

                    month,

                    year

                );


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

                report:
                    report

            });

        }


        catch (err) {

            console.error(
                "Monthly report data error:",
                err
            );


            return res
                .status(
                    400
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to generate monthly report."

                });

        }

    }
);


/* =====================================================
   DOWNLOAD MONTHLY CSV
===================================================== */

app.get(
    "/api/reports/monthly/csv",

    async (req, res) => {

        try {

            const {

                month,

                year

            } =
                req.query;


            /* =========================================
               VALIDATION
            ========================================= */

            if (
                month === undefined ||
                year === undefined
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Month and year are required."

                    });

            }


            /* =========================================
               LOAD REPORT
            ========================================= */

            const report =
                await getMonthlyReportData(

                    month,

                    year

                );


            /* =========================================
               ATTENDANCE LOOKUP MAP
            ========================================= */

            const attendanceMap =
                new Map();


            report.attendance.forEach(
                record => {

                    attendanceMap.set(

                        attendanceLookupKey(
                            record.player_id,
                            record.session_id
                        ),

                        record.attendance_status

                    );

                }
            );


            /* =========================================
               CSV HEADERS
            ========================================= */

            const headerColumns = [

                "Player ID",

                "First Name",

                "Last Name",

                "Nickname",

                "Position"

            ];


            report.sessions.forEach(
                session => {

                    headerColumns.push(
                        session.session_date
                    );

                }
            );


            headerColumns.push(

                "Present",

                "Absent",

                "Excused",

                "Marked Sessions",

                "Attendance Rate"

            );


            let csv =
                headerColumns
                    .map(
                        escapeCsvValue
                    )
                    .join(
                        ","
                    ) +
                "\n";


            /* =========================================
               PLAYER ROWS
            ========================================= */

            report.players.forEach(
                player => {

                    let present =
                        0;


                    let absent =
                        0;


                    let excused =
                        0;


                    const row = [

                        player.id,

                        player.first_name ||
                        "",

                        player.last_name ||
                        "",

                        player.nickname ||
                        "",

                        player.position ||
                        ""

                    ];


                    /* =================================
                       SESSION ATTENDANCE
                    ================================= */

                    report.sessions.forEach(
                        session => {

                            const status =
                                attendanceMap.get(

                                    attendanceLookupKey(
                                        player.id,
                                        session.id
                                    )

                                ) ||
                                "-";


                            row.push(
                                status
                            );


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
                       PLAYER ATTENDANCE RATE
                    ================================= */

                    const markedSessions =
                        present +
                        absent +
                        excused;


                    const attendanceRate =
                        markedSessions > 0

                            ? (
                                (
                                    present /
                                    markedSessions
                                ) *
                                100
                            ).toFixed(
                                1
                            )

                            : "0.0";


                    row.push(

                        present,

                        absent,

                        excused,

                        markedSessions,

                        `${attendanceRate}%`

                    );


                    csv +=
                        row
                            .map(
                                escapeCsvValue
                            )
                            .join(
                                ","
                            ) +
                        "\n";

                }
            );


            /* =========================================
               SAFE FILE NAME
            ========================================= */

            const fileName =
                `Mafori_FC_Attendance_${report.monthName}_${report.year}.csv`;


            /* =========================================
               RESPONSE HEADERS
            ========================================= */

            res.setHeader(

                "Content-Type",

                "text/csv; charset=utf-8"

            );


            res.setHeader(

                "Content-Disposition",

                `attachment; filename="${fileName}"`

            );


            /* =========================================
               UTF-8 BOM

               Helps Microsoft Excel correctly
               open the file.
            ========================================= */

            return res.send(
                "\uFEFF" +
                csv
            );

        }


        catch (err) {

            console.error(
                "CSV report error:",
                err
            );


            return res
                .status(
                    400
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to create CSV report."

                });

        }

    }
);


/* =====================================================
   DOWNLOAD MONTHLY PDF
===================================================== */

app.get(
    "/api/reports/monthly",

    async (req, res) => {

        try {

            const {

                month,

                year

            } =
                req.query;


            /* =========================================
               VALIDATION
            ========================================= */

            if (
                month === undefined ||
                year === undefined
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Month and year are required."

                    });

            }


            /* =========================================
               LOAD REPORT
            ========================================= */

            const report =
                await getMonthlyReportData(

                    month,

                    year

                );


            /* =========================================
               ATTENDANCE LOOKUP
            ========================================= */

            const attendanceMap =
                new Map();


            report.attendance.forEach(
                record => {

                    attendanceMap.set(

                        attendanceLookupKey(
                            record.player_id,
                            record.session_id
                        ),

                        record.attendance_status

                    );

                }
            );


            /* =========================================
               CREATE PDF
            ========================================= */

            const doc =
                new PDFDocument({

                    size:
                        "A4",

                    layout:
                        "landscape",

                    margin:
                        30

                });


            const fileName =
                `Mafori_FC_Attendance_${report.monthName}_${report.year}.pdf`;


            /* =========================================
               RESPONSE HEADERS
            ========================================= */

            res.setHeader(

                "Content-Type",

                "application/pdf"

            );


            res.setHeader(

                "Content-Disposition",

                `attachment; filename="${fileName}"`

            );


            doc.pipe(
                res
            );


            /* =========================================
               PDF DIMENSIONS
            ========================================= */

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


            /* =========================================
               TABLE DIMENSIONS
            ========================================= */

            const numberWidth =
                28;


            const playerWidth =
                150;


            const positionWidth =
                82;


            const fixedWidth =
                numberWidth +
                playerWidth +
                positionWidth;


            const sessionsPerPage =
                8;


            const availableSessionWidth =
                usableWidth -
                fixedWidth;


            const sessionWidth =
                availableSessionWidth /
                sessionsPerPage;


            const rowHeight =
                22;


            const headerHeight =
                34;


            /* =========================================
               WATERMARK
            ========================================= */

            function addWatermark() {

                try {

                    doc.save();


                    doc.opacity(
                        0.045
                    );


                    const logoSize =
                        300;


                    doc.image(

                        clubLogoPath,

                        (
                            pageWidth -
                            logoSize
                        ) /
                        2,

                        (
                            pageHeight -
                            logoSize
                        ) /
                        2,

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
                        "PDF watermark could not be loaded:",
                        error.message
                    );

                }

            }


            /* =========================================
               PAGE HEADER
            ========================================= */

            function drawPageHeader(
                sessionGroup,
                datePageNumber,
                totalDatePages
            ) {

                addWatermark();


                /* =====================================
                   CLUB NAME
                ===================================== */

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

                        24,

                        {

                            width:
                                usableWidth,

                            align:
                                "center"

                        }

                    );


                /* =====================================
                   ORANGE LINE
                ===================================== */

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


                /* =====================================
                   REPORT TITLE
                ===================================== */

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


                /* =====================================
                   MONTH
                ===================================== */

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

                        `${report.monthName} ${report.year}`,

                        margin,

                        88,

                        {

                            width:
                                usableWidth,

                            align:
                                "center"

                        }

                    );


                /* =====================================
                   REPORT SUMMARY
                ===================================== */

                doc
                    .fontSize(
                        8
                    )

                    .fillColor(
                        "#64748b"
                    )

                    .text(

                        `Players: ${report.summary.totalPlayers}     ` +
                        `Sessions: ${report.summary.totalSessions}     ` +
                        `Present: ${report.summary.present}     ` +
                        `Absent: ${report.summary.absent}     ` +
                        `Excused: ${report.summary.excused}`,

                        margin,

                        108,

                        {

                            width:
                                usableWidth,

                            align:
                                "center"

                        }

                    );


                /* =====================================
                   DATE GROUP NUMBER
                ===================================== */

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


                /* =====================================
                   TABLE HEADER
                ===================================== */

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


                /* =====================================
                   NUMBER
                ===================================== */

                doc.text(

                    "#",

                    x,

                    tableY +
                    11,

                    {

                        width:
                            numberWidth,

                        align:
                            "center"

                    }

                );


                x +=
                    numberWidth;


                /* =====================================
                   PLAYER
                ===================================== */

                doc.text(

                    "PLAYER",

                    x +
                    5,

                    tableY +
                    11,

                    {

                        width:
                            playerWidth -
                            10

                    }

                );


                x +=
                    playerWidth;


                /* =====================================
                   POSITION
                ===================================== */

                doc.text(

                    "POSITION",

                    x,

                    tableY +
                    11,

                    {

                        width:
                            positionWidth,

                        align:
                            "center"

                    }

                );


                x +=
                    positionWidth;


                /* =====================================
                   SESSION DATES
                ===================================== */

                sessionGroup.forEach(
                    session => {

                        const dateText =
                            String(
                                session.session_date
                            );


                        const [
                            dateYear,
                            dateMonth,
                            dateDay
                        ] =
                            dateText.split("-");


                        const shortMonth =
                            monthNames[
                                Number(
                                    dateMonth
                                ) -
                                1
                            ]
                                .slice(
                                    0,
                                    3
                                );


                        doc.text(

                            `${dateDay}\n${shortMonth}`,

                            x,

                            tableY +
                            6,

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


            /* =========================================
               DRAW PLAYER ROW
            ========================================= */

            function drawPlayerRow(
                player,
                playerNumber,
                sessionGroup,
                y
            ) {

                let x =
                    margin;


                /* =====================================
                   ALTERNATING ROW
                ===================================== */

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


                /* =====================================
                   ROW BORDER
                ===================================== */

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


                /* =====================================
                   NUMBER
                ===================================== */

                doc.text(

                    String(
                        playerNumber
                    ),

                    x,

                    y +
                    7,

                    {

                        width:
                            numberWidth,

                        align:
                            "center"

                    }

                );


                x +=
                    numberWidth;


                /* =====================================
                   PLAYER NAME
                ===================================== */

                const fullName =
                    `${player.first_name || ""} ${player.last_name || ""}`
                        .trim();


                doc
                    .font(
                        "Helvetica-Bold"
                    )

                    .fillColor(
                        "#1e293b"
                    )

                    .text(

                        fullName,

                        x +
                        5,

                        y +
                        7,

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


                /* =====================================
                   POSITION
                ===================================== */

                doc
                    .font(
                        "Helvetica"
                    )

                    .text(

                        player.position ||
                        "-",

                        x,

                        y +
                        7,

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


                /* =====================================
                   ATTENDANCE CELLS
                ===================================== */

                sessionGroup.forEach(
                    session => {

                        const status =
                            attendanceMap.get(

                                attendanceLookupKey(
                                    player.id,
                                    session.id
                                )

                            ) ||
                            "-";


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

                                y +
                                7,

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


                /* =====================================
                   VERTICAL DIVIDERS
                ===================================== */

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


            /* =========================================
               FOOTER
            ========================================= */

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


            /* =========================================
               SPLIT DATES INTO GROUPS
            ========================================= */

            const sessionGroups =
                [];


            for (
                let index = 0;

                index <
                report.sessions.length;

                index +=
                sessionsPerPage
            ) {

                sessionGroups.push(

                    report.sessions.slice(

                        index,

                        index +
                        sessionsPerPage

                    )

                );

            }


            /*
               Still generate one PDF page if
               the selected month has no sessions.
            */

            if (
                sessionGroups.length ===
                0
            ) {

                sessionGroups.push(
                    []
                );

            }


            /* =========================================
               GENERATE PDF PAGES
            ========================================= */

            sessionGroups.forEach(

                (
                    sessionGroup,
                    groupIndex
                ) => {

                    /* =================================
                       ADD NEXT PAGE
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
                       NO PLAYERS
                    ================================= */

                    if (
                        report.players.length ===
                        0
                    ) {

                        doc
                            .fillColor(
                                "#64748b"
                            )

                            .font(
                                "Helvetica"
                            )

                            .fontSize(
                                11
                            )

                            .text(

                                "No active players were found.",

                                margin,

                                y +
                                25,

                                {

                                    width:
                                        usableWidth,

                                    align:
                                        "center"

                                }

                            );

                    }


                    /* =================================
                       PLAYER ROWS
                    ================================= */

                    report.players.forEach(

                        (
                            player,
                            playerIndex
                        ) => {

                            /* =============================
                               PAGE FULL
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


            /* =========================================
               FINISH PDF
            ========================================= */

            doc.end();

        }


        catch (err) {

            console.error(
                "PDF report error:",
                err
            );


            /*
               If the PDF stream has already started,
               Express cannot switch back to JSON.
            */

            if (
                !res.headersSent
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            err.message ||
                            "Unable to create PDF report."

                    });

            }

        }

    }
);


/* =====================================================
   END OF PART 5

   PART 6 STARTS WITH:
   GET SETTINGS
===================================================== */

/* =====================================================
   PART 6
   SETTINGS + HEALTH + ERROR HANDLING + SERVER START
===================================================== */


/* =====================================================
   GET SETTINGS
===================================================== */

app.get(
    "/api/settings",

    async (req, res) => {

        try {

            const {

                data,

                error

            } =
                await supabase

                    .from(
                        "settings"
                    )

                    .select(
                        "*"
                    )

                    .limit(
                        1
                    )

                    .maybeSingle();


            /* =========================================
               DATABASE ERROR
            ========================================= */

            if (
                error
            ) {

                console.error(
                    "Settings GET error:",
                    error
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to load settings."

                    });

            }


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

                settings:
                    data ||
                    {}

            });

        }


        catch (err) {

            console.error(
                "Settings GET error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to load settings."

                });

        }

    }
);


/* =====================================================
   SAVE / UPDATE SETTINGS
===================================================== */

app.put(
    "/api/settings",

    async (req, res) => {

        try {

            /* =========================================
               CLEAN INPUT
            ========================================= */

            const clubName =
                String(
                    req.body.club_name ||
                    ""
                )
                    .trim();


            const clubEmail =
                String(
                    req.body.club_email ||
                    ""
                )
                    .trim();


            const clubPhone =
                String(
                    req.body.club_phone ||
                    ""
                )
                    .trim();


            const clubAddress =
                String(
                    req.body.club_address ||
                    ""
                )
                    .trim();


            const trainingTime =
                String(
                    req.body.training_time ||
                    ""
                )
                    .trim();


            const trainingDays =
                String(
                    req.body.training_days ||
                    ""
                )
                    .trim();


            /* =========================================
               BASIC VALIDATION
            ========================================= */

            if (
                clubName.length >
                150
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Club name is too long."

                    });

            }


            if (
                clubEmail.length >
                150
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Club email is too long."

                    });

            }


            if (
                clubPhone.length >
                50
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Club phone number is too long."

                    });

            }


            if (
                clubAddress.length >
                300
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Club address is too long."

                    });

            }


            if (
                trainingTime.length >
                50
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Training time is too long."

                    });

            }


            if (
                trainingDays.length >
                150
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Training days value is too long."

                    });

            }


            /* =========================================
               OPTIONAL EMAIL FORMAT CHECK
            ========================================= */

            if (
                clubEmail &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    clubEmail
                )
            ) {

                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Please enter a valid club email address."

                    });

            }


            /* =========================================
               SETTINGS DATA
            ========================================= */

            const settingsData = {

                club_name:
                    clubName ||
                    null,

                club_email:
                    clubEmail ||
                    null,

                club_phone:
                    clubPhone ||
                    null,

                club_address:
                    clubAddress ||
                    null,

                training_time:
                    trainingTime ||
                    null,

                training_days:
                    trainingDays ||
                    null

            };


            /* =========================================
               FIND EXISTING SETTINGS
            ========================================= */

            const {

                data:
                    existing,

                error:
                    findError

            } =
                await supabase

                    .from(
                        "settings"
                    )

                    .select(
                        "id"
                    )

                    .limit(
                        1
                    )

                    .maybeSingle();


            if (
                findError
            ) {

                console.error(
                    "Settings lookup error:",
                    findError
                );


                return res
                    .status(
                        500
                    )
                    .json({

                        success:
                            false,

                        message:
                            "Unable to check existing settings."

                    });

            }


            let data;

            let error;


            /* =========================================
               UPDATE EXISTING SETTINGS
            ========================================= */

            if (
                existing
            ) {

                const result =
                    await supabase

                        .from(
                            "settings"
                        )

                        .update(
                            settingsData
                        )

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


            /* =========================================
               CREATE SETTINGS
            ========================================= */

            else {

                const result =
                    await supabase

                        .from(
                            "settings"
                        )

                        .insert([
                            settingsData
                        ])

                        .select()

                        .single();


                data =
                    result.data;


                error =
                    result.error;

            }


            /* =========================================
               SAVE ERROR
            ========================================= */

            if (
                error
            ) {

                console.error(
                    "Settings save error:",
                    error
                );


                return res
                    .status(
                        400
                    )
                    .json({

                        success:
                            false,

                        message:
                            error.message ||
                            "Unable to save settings."

                    });

            }


            /* =========================================
               SUCCESS
            ========================================= */

            return res.json({

                success:
                    true,

                message:
                    "Settings saved successfully.",

                settings:
                    data

            });

        }


        catch (err) {

            console.error(
                "Settings SAVE error:",
                err
            );


            return res
                .status(
                    500
                )
                .json({

                    success:
                        false,

                    message:
                        err.message ||
                        "Unable to save settings."

                });

        }

    }
);


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get(
    "/api/health",

    (req, res) => {

        const southAfricaDate =
            getSouthAfricaDateParts();


        return res.json({

            success:
                true,

            message:
                "Mafori FC Attendance Register API is running.",

            date:
                southAfricaDate.date,

            timezone:
                "Africa/Johannesburg",

            timestamp:
                new Date()
                    .toISOString(),

            features: {

                login:
                    true,

                bcryptPasswords:
                    true,

                players:
                    true,

                attendance:
                    true,

                editAttendance:
                    true,

                birthdays:
                    true,

                dashboard:
                    true,

                reports:
                    true,

                csv:
                    true,

                pdf:
                    true,

                settings:
                    true

            }

        });

    }
);


/* =====================================================
   API 404

   IMPORTANT:
   KEEP THIS BELOW EVERY /api ROUTE
===================================================== */

app.use(
    "/api",

    (
        req,
        res
    ) => {

        console.log(
            "Unknown API request:",
            req.method,
            req.originalUrl
        );


        return res
            .status(
                404
            )
            .json({

                success:
                    false,

                message:
                    `API endpoint not found: ${req.method} ${req.originalUrl}`

            });

    }
);


/* =====================================================
   FRONTEND FALLBACK

   IMPORTANT:
   This must remain BELOW all API routes.
===================================================== */

app.use(
    (
        req,
        res
    ) => {

        /* =========================================
           ONLY ALLOW GET FALLBACK
        ========================================= */

        if (
            req.method !==
            "GET"
        ) {

            return res
                .status(
                    404
                )
                .json({

                    success:
                        false,

                    message:
                        "Route not found."

                });

        }


        /* =========================================
           SERVE HOME PAGE
        ========================================= */

        return res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


/* =====================================================
   GLOBAL ERROR HANDLER

   IMPORTANT:
   KEEP THIS AFTER ALL ROUTES.
===================================================== */

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


        /* =========================================
           RESPONSE ALREADY STARTED
        ========================================= */

        if (
            res.headersSent
        ) {

            return next(
                err
            );

        }


        /* =========================================
           JSON BODY TOO LARGE
        ========================================= */

        if (
            err &&
            err.type ===
            "entity.too.large"
        ) {

            return res
                .status(
                    413
                )
                .json({

                    success:
                        false,

                    message:
                        "Request data is too large."

                });

        }


        /* =========================================
           INVALID JSON
        ========================================= */

        if (
            err instanceof
            SyntaxError &&
            err.status ===
            400 &&
            "body" in err
        ) {

            return res
                .status(
                    400
                )
                .json({

                    success:
                        false,

                    message:
                        "Invalid JSON request."

                });

        }


        /* =========================================
           DEFAULT SERVER ERROR
        ========================================= */

        return res
            .status(
                500
            )
            .json({

                success:
                    false,

                message:
                    "An unexpected server error occurred."

            });

    }
);


/* =====================================================
   START SERVER
===================================================== */

const PORT =
    Number(
        process.env.PORT
    ) ||
    3000;


/* =====================================================
   SERVER INSTANCE
===================================================== */

const server =
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
                "🔐 bcrypt password hashing enabled"
            );


            console.log(
                `📅 South Africa date: ${southAfricaDate.date}`
            );


            console.log(
                "🌍 Timezone: Africa/Johannesburg"
            );


            console.log(
                "========================================"
            );

            console.log("");

        }
    );


/* =====================================================
   GRACEFUL SERVER SHUTDOWN
===================================================== */

function shutdownServer(
    signal
) {

    console.log(
        `\n${signal} received. Shutting down Mafori FC server...`
    );


    server.close(
        () => {

            console.log(
                "✅ Mafori FC server stopped safely."
            );


            process.exit(
                0
            );

        }
    );


    /*
       Safety fallback if an open connection
       prevents graceful shutdown.
    */

    setTimeout(
        () => {

            console.error(
                "❌ Server could not close gracefully. Forcing shutdown."
            );


            process.exit(
                1
            );

        },

        10000
    ).unref();

}


/* =====================================================
   WINDOWS / RENDER / LINUX SHUTDOWN SIGNALS
===================================================== */

process.on(
    "SIGTERM",
    () => {

        shutdownServer(
            "SIGTERM"
        );

    }
);


process.on(
    "SIGINT",
    () => {

        shutdownServer(
            "SIGINT"
        );

    }
);
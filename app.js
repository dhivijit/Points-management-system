// use esversion:8

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require("mongodb");
const process = require('process');
const env = require('dotenv').config();
const ejs = require('ejs');

const PORT = process.env.PORT || 3000;
const uri = process.env.MONGO_URL;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);

const db = client.db(process.env.DB_NAME);
const participants = db.collection(process.env.PARTICIPANTS_db);
const users = db.collection(process.env.USERS_db);
const tokens = db.collection(process.env.TOKENS_db);
const logs = db.collection(process.env.LOGS_db);

function generateToken() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 100;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * length));
        counter += 1;
    }
    return result;
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

app.use(express.static("public"));

app.get("/", (req, res) => {
    if (req.cookies && req.cookies.auth_token) {
        async function run() {
            try {
                const authenticationCheck = await tokens.findOne({ token: req.cookies.auth_token });
                if (authenticationCheck) {
                    const userdata = await users.findOne({ username: authenticationCheck.username });
                    res.render("homepage", { "userRole": userdata.role });
                } else {
                    res.render("homepage", { "userRole": "guest" });
                }
            } catch (e) {
                console.error(e);
            }
        }
        run().catch(console.dir);
    } else {
        res.render("homepage", { "userRole": "guest" });
    }
});

app.route("/login")
    .get((req, res) => {
        if (req.cookies && req.cookies.auth_token) {
            async function run() {
                try {
                    const queryResult = await tokens.findOne({ token: req.cookies.auth_token });
                    // Simulated check for username and password, replace this with your actual authentication logic
                    if (queryResult) {
                        res.redirect('/');
                    } else {
                        res.sendFile(__dirname + "/login.html");
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            run();
        } else {
            res.sendFile(__dirname + "/login.html");
        }
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        async function run() {
            try {
                const query = { username: username, password: password };
                const queryResult = await users.findOne(query);
                // Simulated check for username and password, replace this with your actual authentication logic
                if (queryResult) {
                    // Simulated token generation, replace this with your actual token generation logic
                    const token = generateToken();
                    const newDate = new Date();
                    const fulldate = newDate.toString();
                    const newToken = { token: token, username: username, DateCreated: fulldate };

                    await tokens.insertOne(newToken);

                    await logs.insertOne({ username: username, action: "login", Date: fulldate, time: new Date().getTime() });

                    res.cookie('auth_token', token, { httpOnly: true, secure: true });
                    res.redirect('/');
                } else {
                    res.redirect('/login');
                }
            } catch (e) {
                console.error(e);
            }
        }
        run().catch(console.dir);
    });

app.get("/logout", (req, res) => {
    if (req.cookies && req.cookies.auth_token) {
        async function run() {
            try {
                const userdata = await tokens.findOne({ token: req.cookies.auth_token });
                const queryResult = await tokens.deleteOne({ token: req.cookies.auth_token });
                // Simulated check for username and password, replace this with your actual authentication logic
                if (queryResult) {
                    res.cookie('auth_token', '', { expires: new Date(0), httpOnly: true, secure: true });
                    await logs.insertOne({ username: userdata.username, action: "logout", Date: new Date().toString(), time: new Date().getTime() });
                    res.redirect('/');
                } else {
                    res.status(400).redirect('/');
                }
            } catch (e) {
                console.error(e);
            }
        }
        run().catch(console.dir);

    } else {
        // Handle the case where 'auth_token' cookie is not found
        res.status(400).redirect('/login');
    }

});

app.route("/registerparticipant")
    .get((req, res) => {
        if (req.cookies && req.cookies.auth_token) {
            async function run() {
                try {
                    const queryResult = await tokens.findOne({ token: req.cookies.auth_token });
                    if (queryResult) {
                        const userdata = await users.findOne({ username: queryResult.username });
                        if (userdata.role == "Registration" || userdata.role == "admin") {
                            res.sendFile(__dirname + "/regparticipant.html");
                        } else {
                            res.status(401).send("Unauthorized access");
                        }
                    } else {
                        res.status(401).send("Unauthorized access");
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            run();
        } else {
            res.status(401).send("Unauthorized access");
        }
    }).post((req, res) => {
        if (req.cookies && req.cookies.auth_token) {
            async function run() {
                try {
                    const queryResult = await tokens.findOne({ token: req.cookies.auth_token });
                    if (queryResult) {
                        const teamMember1 = req.body.teamMember1;
                        const teamMember2 = req.body.teamMember2;

                        const teamNameRegex = /^[a-zA-Z\s]+$/;

                        if (!teamNameRegex.test(teamMember1.trim()) || !teamNameRegex.test(teamMember2.trim())) {
                            res.redirect("/registerparticipant");
                        }

                        // generate a three digit random number
                        const teamID = Math.floor(Math.random() * 1000);

                        // check if the teamID is already present in the database
                        const IDcheck = await participants.findOne({ TeamID: teamID });
                        while (IDcheck) {
                            const teamID = Math.floor(Math.random() * 1000);
                            const IDcheck = await participants.findOne({ TeamID: teamID });
                        }
                        const newDate = new Date();
                        const time = newDate.getTime();
                        const fulldate = newDate.toString();
                        const registerer = queryResult.username;
                        const newParticipant = { TeamID: teamID, teamMember1: teamMember1, teamMember2: teamMember2, Time: time, FullDate: fulldate, TeamScore: 0, timesGiven: {}, Registerer: registerer };
                        await participants.insertOne(newParticipant);
                        await logs.insertOne({ username: queryResult.username, TeamID: teamID, action: "register participant", Date: new Date().toString(), time: new Date().getTime() });
                        res.render("regAck", { TeamID: teamID, teamMember1: teamMember1, teamMember2: teamMember2 });
                    } else {
                        res.status(401).redirect('/login');
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            run();
        } else {
            res.status(401).redirect('/login');
        }
    });

app.route("/team")
    .get((req, res) => {
        res.sendFile(__dirname + "/AckPage.html");
    }).post((req, res) => {
        const teamID = req.body.teamID;
        if (teamID <= 0 || teamID >= 1000) {
            res.redirect("/team");
        } else {
            res.redirect(`/points/${teamID}`);
        }
    });

app.get("/points/:teamID", async (req, res) => {
    const TeamID = parseInt(req.params.teamID);
    if (isNaN(TeamID)) {
        res.redirect("/team");
    } else if (TeamID <= 0) {
        res.redirect("/team");
    } else if (TeamID >= 1000) {
        res.redirect("/team");
    }

    async function run() {
        try {
            const queryResult = await participants.findOne({ TeamID: TeamID });
            if (queryResult) {
                TeamMember1 = queryResult.teamMember1;
                TeamMember2 = queryResult.teamMember2;
                TeamScore = queryResult.TeamScore;
                var time = queryResult.Time;

            } else {
                TeamMember1 = "Not Available"
                TeamMember2 = "Not Available";
                TeamScore = 0;
                var CurDate = new Date();
                var time = CurDate.getTime();

            }
            let presentDate = new Date();
            let presentTime = presentDate.getTime();
            if (req.cookies && req.cookies.auth_token) {
                const queryResult = await tokens.findOne({ token: req.cookies.auth_token });
                // Simulated check for username and password, replace this with your actual authentication logic
                if (queryResult) {
                    const userdata = await users.findOne({ username: queryResult.username });
                    if (userdata.role == "Stall" || userdata.role == "admin") {
                        const timeDiff = presentTime - time;
                        if (timeDiff < 2700000) {
                            var timeLeft = 2700000 - timeDiff;
                            var timeatLogin = timeLeft / 1000;
                            var minutes = Math.floor(timeatLogin / 60);
                            var seconds = timeatLogin % 60;
                            timeInString = minutes + "m " + parseInt(seconds) + "s";

                            var teamDetails = await participants.findOne({ TeamID: TeamID });
                            if (!teamDetails.timesGiven[userdata.username]) {
                                teamDetails.timesGiven[userdata.username] = 0;
                            }
                            var timesCanParticipate = 3 - teamDetails.timesGiven[userdata.username];
                            if (timesCanParticipate > 0) {
                                res.render("pointsedit", { "TeamID": TeamID, "teamMember1": TeamMember1, "teamMember2": TeamMember2, "TeamScore": TeamScore, "timeLeft": timeLeft, "timeInString": timeInString, "timesCanParticipate": timesCanParticipate });
                            } else {
                                res.render("pointstimeout", { "TeamID": TeamID, "teamMember1": TeamMember1, "teamMember2": TeamMember2, "TeamScore": TeamScore, "timeoutType": "timesExceeded" });
                            }
                        } else {
                            res.render("pointstimeout", { "TeamID": TeamID, "teamMember1": TeamMember1, "teamMember2": TeamMember2, "TeamScore": TeamScore, "timeoutType": "timeExceeded" });
                        }
                    } else {
                        const timeDiff = presentTime - time;
                        var timeLeft = 2700000 - timeDiff;
                        var timeatLogin = timeLeft / 1000;
                        var minutes = Math.floor(timeatLogin / 60);
                        var seconds = timeatLogin % 60;
                        if (timeDiff > 0) {
                            timeInString = minutes + "m " + parseInt(seconds) + "s";
                        } else {
                            timeInString = "0m 0s";
                        }
                        res.render("pointspage", { "TeamID": TeamID, "teamMember1": TeamMember1, "teamMember2": TeamMember2, "TeamScore": TeamScore, "timeLeft": timeLeft, "timeInString": timeInString });
                    }
                } else {
                    const timeDiff = presentTime - time;
                    var timeLeft = 2700000 - timeDiff;
                    var timeatLogin = timeLeft / 1000;
                    var minutes = Math.floor(timeatLogin / 60);
                    var seconds = timeatLogin % 60;
                    if (timeDiff > 0) {
                        timeInString = minutes + "m " + parseInt(seconds) + "s";
                    } else {
                        timeInString = "0m 0s";
                    }
                    res.render("pointspage", { "TeamID": TeamID, "teamMember1": TeamMember1, "teamMember2": TeamMember2, "TeamScore": TeamScore, "timeLeft": timeLeft, "timeInString": timeInString });
                }
            } else {
                const timeDiff = presentTime - time;
                var timeLeft = 2700000 - timeDiff;
                var timeatLogin = timeLeft / 1000;
                var minutes = Math.floor(timeatLogin / 60);
                var seconds = timeatLogin % 60;
                if (timeDiff > 0) {
                    timeInString = minutes + "m " + parseInt(seconds) + "s";
                } else {
                    timeInString = "0m 0s";
                }

                res.render("pointspage", { "TeamID": TeamID, "teamMember1": TeamMember1, "teamMember2": TeamMember2, "TeamScore": TeamScore, "timeLeft": timeLeft, "timeInString": timeInString });
            }
        } catch (e) {
            console.error(e);
        }
    }
    run().catch(console.dir);
});

app.post("/points/:teamID", (req, res) => {
    const TeamID = parseInt(req.params.teamID);
    async function run() {
        try {
            if (req.cookies && req.cookies.auth_token) {
                const queryResult = await tokens.findOne({ token: req.cookies.auth_token });
                if (queryResult) {
                    const userdata = await users.findOne({ username: queryResult.username });
                    if (userdata.role == "Stall" || userdata.role == "admin") {
                        const teaminfo = await participants.findOne({ TeamID: TeamID });

                        if (teaminfo) {
                            var participated = teaminfo.timesGiven[userdata.username];
                            var timesGiven = teaminfo.timesGiven;
                            if (!participated) {
                                participated = 1;
                            } else {
                                participated += 1;
                            }
                            timesGiven[userdata.username] = participated
                            const newScore = teaminfo.TeamScore + parseInt(req.body.ScoreChange);
                            const query = { TeamID: TeamID };
                            const newvalues = { $set: { TeamScore: newScore, timesGiven: timesGiven } };
                            const queryResult = await participants.updateOne(query, newvalues);
                            await logs.insertOne({ username: userdata.username, TeamID: TeamID, action: "score change", newScore: newScore, Date: new Date().toString(), time: new Date().getTime() });
                        } else {
                            // take a gap of 2 seconds
                            await new Promise(r => setTimeout(r, 1000));
                            res.redirect(`/points/${req.params.teamID}`);
                        }
                    } else {
                        await new Promise(r => setTimeout(r, 1000));
                        res.redirect(`/points/${req.params.teamID}`);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    run().catch(console.dir);
    res.redirect(`/points/${req.params.teamID}`);
});

app.get("/scoreboard", (req, res) => {
    async function run() {
        try {
            const queryResult = await participants.find({}).sort({ TeamScore: -1 }).toArray();
            // Simulated check for username and password, replace this with your actual authentication logic
            res.render("scoreboard", { "scores": queryResult });
        } catch (e) {
            console.error(e);
        }
    }
    run().catch(console.dir);
});

app.get("/admin/logs", (req, res) => {
    async function run() {
        try {
            if (req.cookies && req.cookies.auth_token) {
                const queryResult = await tokens.findOne({ token: req.cookies.auth_token });
                if (queryResult) {
                    const userdata = await users.findOne({ username: queryResult.username });
                    if (userdata.role == "admin") {
                        await logs.insertOne({ username: userdata.username, action: "view logs", Date: new Date().toString(), time: new Date().getTime() });
                        const queryResult = await logs.find({}).sort({ time: -1 }).toArray(); 
                        res.render("logstable", { "logs": queryResult })
                    } else {
                        await logs.insertOne({ username: userdata.username, action: "attempt to view logs", Date: new Date().toString(), time: new Date().getTime() });
                        res.status(401).send("Unauthorized access");
                    }
                } else {
                    res.status(401).send("Unauthorized access");
                }
                // Simulated check for username and password, replace this with your actual authentication logic
            } else {
                res.status(401).send("Unauthorized access");
            }
        } catch (e) {
            console.error(e);
        }
    }
    run().catch(console.dir);
});

app.route("/registeruser")
    .get((req, res) => {
        async function run() {
            try {
                if (req.cookies && req.cookies.auth_token) {
                    const queryResult = await tokens.findOne({ token: req.cookies.auth_token });
                    if (queryResult) {
                        const userdata = await users.findOne({ username: queryResult.username });
                        if (userdata.role == "admin") {
                            res.sendFile(__dirname + "/reguser.html");
                        } else {
                            res.status(401).send("Unauthorized access");
                        }
                    } else {
                        res.status(401).send("Unauthorized access");
                    }
                } else {
                    res.status(401).send("Unauthorized access");
                }
            } catch (e) {
                console.error(e);
            }
        }
        run().catch(console.dir);
    }).post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        const role = req.body.role;

        async function run() {
            try {
                const queryResult = await tokens.findOne({ token: req.cookies.auth_token });
                if (queryResult) {
                    const userdata = await users.findOne({ username: queryResult.username });
                    if (userdata.role == "admin") {
                        const newDate = new Date();
                        const time = newDate.getTime();
                        const fulldate = newDate.toString();
                        const user = { username: username, password: password, role: role, Date: fulldate, Registerer: userdata.username };
                        await users.insertOne(user);
                        await logs.insertOne({ username: userdata.username, action: "register user", newuser: username, time:new Date().getTime() , Date: new Date().toString() });
                        res.render("reguserack", { Username: username });
                    } else {
                        res.status(401).send("Unauthorized access");
                    }
                } else {
                    res.status(401).send("Unauthorized access");
                }
            } catch (e) {
                console.error(e);
            }
        }
        run().catch(console.dir);
    });

app.get("*", (req, res) => {
    res.status(404).send("Page not found");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

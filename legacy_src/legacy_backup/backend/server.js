require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const os = require('os');

const Admin = require('./models/Admin');
const Client = require('./models/Client');
const Round = require('./models/Round');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { forceNew: true });

// Safety Nets
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    // Keep alive if possible, or exit gracefully
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static(path.join(__dirname, '../client'))); // Serve client files
app.use('/admin', express.static(path.join(__dirname, '../admin'))); // Serve admin files
app.use('/assets', express.static(path.join(__dirname, '../assets'))); // Serve asset files by Kaviyan request

// Connect to MongoDB
const { MongoMemoryServer } = require('mongodb-memory-server');

const ATLAS_URI = process.env.MONGODB_URI;

async function initDB() {
    try {
        // Initialize Round Config if not exists
        const count = await Round.countDocuments();
        if (count === 0) {
            await Round.create({ globalPassword: 'default_password' });
            console.log('Initialized Round Config with password "default_password"');
        }

        // Create default admin if not exists
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const hashedAdminPwd = await bcrypt.hash('admin123', 10);
            await Admin.create({ username: 'admin', password: hashedAdminPwd });
            console.log('Initialized Admin with username "admin" and password "admin123"');
        }
    } catch (e) {
        console.error("Initialization Error:", e);
    }
}

async function connectDB() {
    try {
        console.log("Attempting to connect to Remote MongoDB...");
        await mongoose.connect(ATLAS_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Connected (Remote Atlas)');
        await initDB();
        startServer();
    } catch (err) {
        console.error('Remote DB Connection Failed (likely IP whitelist or no internet).');
        console.log('Check Error:', err.message);

        // Fallback 1: MongoMemoryServer
        try {
            console.log('Attempting Fallback 1: In-Memory Database...');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose.connect(uri);
            console.log('\n\x1b[33m[WARNING] Using In-Memory Database.\x1b[0m');
            console.log('Data will be lost when the server stops.');
            await initDB();
            startServer();
        } catch (memErr) {
            console.error("Fallback 1 Failed (Memory DB):", memErr.message);

            // Fallback 2: Local MongoDB
            try {
                console.log('Attempting Fallback 2: Local MongoDB (mongodb://127.0.0.1:27017)...');
                await mongoose.connect('mongodb://127.0.0.1:27017/enigma_competition');
                console.log('MongoDB Connected (Localhost)');
                await initDB();
                startServer();
            } catch (localErr) {
                console.error("Critical: Could not connect to ANY database.");
                console.error("1. Remote Atlas: " + err.message);
                console.error("2. Memory Server: " + memErr.message);
                console.error("3. Localhost: " + localErr.message);
                process.exit(1);
            }
        }
    }
}

connectDB();





// Routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');

// ...
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes); // Mount at /api/admin so /api/admin/set-password works

// Socket.IO Logic
io.on('connection', async (socket) => {
    console.log('New connection:', socket.id);

    // Send current round status to new connection
    // Client Join Event - REGISTER FIRST
    socket.on('client_join', async ({ username, password }) => {
        console.log(`[DEBUG] Received client_join for: ${username}`);
        try {
            console.log("[DEBUG] Fetching Round config...");
            const config = await Round.findOne().maxTimeMS(5000);
            console.log("[DEBUG] Config fetched:", config ? "FOUND" : "NOT FOUND");

            if (!config) return socket.emit('join_error', 'System initializing...');

            console.log(`Auth Attempt: User=${username}, Pass=${password}`);
            console.log("[DEBUG] Verifying password...");
            const match = password === config.globalPassword;
            console.log(`Auth Result: ${match}`);

            if (!match) {
                return socket.emit('join_error', 'Incorrect Competition Password');
            }

            // Check if username taken
            const existing = await Client.findOne({ username });
            if (existing && existing.socketId) {
                // ALLOW RECONNECT: Just overwrite the old socketId
                // return socket.emit('join_error', 'Username already active');
                console.log(`User ${username} re-connecting (taking over session).`);
            }

            let client = existing;
            if (!client) {
                client = new Client({ username, socketId: socket.id, ipAddress: socket.handshake.address });
                await client.save();
            } else {
                client.socketId = socket.id; // Update socket ID
                client.ipAddress = socket.handshake.address;
                await client.save();
            }

            socket.data.username = username; // Store in socket session
            socket.data.isAdmin = false;
            socket.join('clients');
            socket.emit('join_success', { username });

            // Send current round state immediately after join
            socket.emit('round_update', config.rounds);

            // SANITIZE: Only send questions, not answers, to clients
            const publicConfig = {
                q1: config.textRoundConfig.q1,
                q2: config.textRoundConfig.q2,
                q3: config.textRoundConfig.q3
            };
            socket.emit('text_round_config', publicConfig);

            const publicImgConfig = {
                q1Img: config.imgRoundConfig ? config.imgRoundConfig.q1Img : "",
                q2Img: config.imgRoundConfig ? config.imgRoundConfig.q2Img : "",
                q3Img: config.imgRoundConfig ? config.imgRoundConfig.q3Img : ""
            };
            socket.emit('img_round_config', publicImgConfig);

            // Send Timer Status
            if (config.round2EndTime && config.rounds.round2) {
                socket.emit('timer_sync', { endTime: config.round2EndTime });
            }

            // Notify Admin
            updateAdminDashboard();
        } catch (e) {
            console.error(e);
            socket.emit('join_error', 'Server Database Error');
        }
    });

    // Send current round status to new connection (Async, might block)
    try {
        const roundConfig = await Round.findOne();
        if (roundConfig) {
            socket.emit('round_update', roundConfig.rounds);
            // Check active round for timer
            let endTime = null;
            if (roundConfig.rounds.round1) endTime = roundConfig.round1EndTime;
            if (roundConfig.rounds.round2) endTime = roundConfig.round2EndTime;
            if (endTime) socket.emit('timer_sync', { endTime });
        }
    } catch (e) {
        console.error("DB Error on connection:", e.message);
    }



    // Admin Join (Socket)
    socket.on('admin_join', async () => {
        console.log(`[ADMIN JOIN] ID: ${socket.id}`);
        socket.data.isAdmin = true;
        socket.join('admins');
        socket.emit('admin_ack');

        // Send current state and config to Admin immediately
        const config = await Round.findOne();
        if (config) {
            socket.emit('round_update', config.rounds);
            socket.emit('text_round_config', config.textRoundConfig); // Admin gets full config
            if (config.imgRoundConfig) socket.emit('img_round_config', config.imgRoundConfig);

            // Send Active Timer
            let endTime = null;
            if (config.rounds.round1) endTime = config.round1EndTime;
            if (config.rounds.round2) endTime = config.round2EndTime;
            if (endTime) socket.emit('timer_sync', { endTime });
        }

        updateAdminDashboard();
    });

    // Admin: Toggle Round
    socket.on('toggle_round', async ({ round, status, password }) => {
        try {
            console.log(`[TOGGLE REQUEST] From ${socket.id} | Admin=${socket.data.isAdmin} | ${round}=${status}`);

            let authorized = socket.data.isAdmin;

            if (!authorized && password) {
                // Fallback: Check password directly
                const admin = await Admin.findOne({ username: 'admin' }); // Assuming single admin
                if (admin && await bcrypt.compare(password, admin.password)) {
                    authorized = true;
                    socket.data.isAdmin = true; // Repair session
                    console.log("-> Authorized via Password fallback");
                }
            }

            if (!authorized) {
                console.log("-> Denied: Not Admin");
                return;
            }

            if (status) {
                // Exclusive: If turning ON, turn everything else OFF
                const update = {
                    'rounds.lobby': round === 'lobby',
                    'rounds.round1': round === 'round1',
                    'rounds.round2': round === 'round2'
                };

                // TIMER LOGIC
                if (round === 'round1') {
                    const currentConfig = await Round.findOne();
                    const duration = currentConfig.textRoundConfig?.timerDuration || 0;
                    if (duration > 0) {
                        const endTime = Date.now() + (duration * 60 * 1000);
                        update['round1EndTime'] = endTime;
                        update['round2EndTime'] = null; // Ensure R2 is off
                        console.log(`[TIMER] Round 1 Started. Ends at ${endTime}`);
                    } else {
                        update['round1EndTime'] = null;
                    }
                } else if (round === 'round2') {
                    const currentConfig = await Round.findOne();
                    const duration = currentConfig.imgRoundConfig?.timerDuration || 0;
                    if (duration > 0) {
                        const endTime = Date.now() + (duration * 60 * 1000);
                        update['round2EndTime'] = endTime;
                        update['round1EndTime'] = null; // Ensure R1 is off
                        console.log(`[TIMER] Round 2 Started. Ends at ${endTime}`);
                    } else {
                        update['round2EndTime'] = null;
                    }
                } else {
                    update['round1EndTime'] = null;
                    update['round2EndTime'] = null;
                }

                await Round.updateOne({}, update);
            } else {
                // Just turn it off
                const update = {};
                update[`rounds.${round}`] = status;
                if (round === 'round1') update['round1EndTime'] = null;
                if (round === 'round2') update['round2EndTime'] = null;
                await Round.updateOne({}, { $set: update });
            }

            const newConfig = await Round.findOne();
            console.log("-> New State:", newConfig.rounds);
            io.emit('round_update', newConfig.rounds); // Broadcast to all

            let broadcastEndTime = null;
            if (newConfig.rounds.round1) broadcastEndTime = newConfig.round1EndTime;
            if (newConfig.rounds.round2) broadcastEndTime = newConfig.round2EndTime;

            io.emit('timer_sync', { endTime: broadcastEndTime });
        } catch (e) {
            console.error("Toggle Round Error:", e.message);
            socket.emit('admin_error', 'Database Error during toggle');
        }
    });

    // Admin: Update Text Round Config
    socket.on('update_text_round', async (args) => {
        const { q1, q1Ans, q2, q2Ans, q3, q3Ans, password } = args;
        try {
            let authorized = socket.data.isAdmin;

            // Fallback auth if socket session lost (Basic check)
            if (!authorized && password) {
                const admin = await Admin.findOne({ username: 'admin' });
                // Compare plain text as per recent changes
                if (admin && admin.password === password) authorized = true;
            }

            if (!authorized) {
                console.log("Unauthorized text update attempt");
                return;
            }

            await Round.updateOne({}, {
                'textRoundConfig.q1': q1,
                'textRoundConfig.q1Ans': q1Ans,
                'textRoundConfig.q2': q2,
                'textRoundConfig.q2Ans': q2Ans,
                'textRoundConfig.q3': q3,
                'textRoundConfig.q3': q3,
                'textRoundConfig.q3Ans': q3Ans,
                'textRoundConfig.timerDuration': parseInt(args.timerDuration || 0)
            });

            console.log(`[DB UPDATE] Text Round Config Saved:`, {
                q1: q1.slice(0, 20) + "...",
                q1Ans: q1Ans ? q1Ans.slice(0, 20) + "..." : "",
                q2: q2.slice(0, 20) + "...",
                q2Ans: q2Ans ? q2Ans.slice(0, 20) + "..." : "",
                q3: q3.slice(0, 20) + "...",
                q3Ans: q3Ans ? q3Ans.slice(0, 20) + "..." : ""
            });

            const newConfig = await Round.findOne();

            // Update Admins (Full Config)
            io.to('admins').emit('text_round_config', newConfig.textRoundConfig);

            // Update Clients (Sanitized Config)
            const publicConfig = {
                q1: newConfig.textRoundConfig.q1,
                q2: newConfig.textRoundConfig.q2,
                q3: newConfig.textRoundConfig.q3
            };
            io.to('clients').emit('text_round_config', publicConfig);
        } catch (e) {
            console.error("Update Text Round Error:", e.message);
        }
    });

    // Admin: Kick User
    socket.on('kick_user', async ({ username, password }) => {
        try {
            let authorized = socket.data.isAdmin;
            if (!authorized && password) {
                const admin = await Admin.findOne({ username: 'admin' });
                if (admin && await bcrypt.compare(password, admin.password)) authorized = true;
            }
            if (!authorized) return;

            const client = await Client.findOne({ username });
            if (client) {
                if (client.socketId) {
                    io.to(client.socketId).emit('kicked', 'You have been kicked by the admin.');
                    const clientSocket = io.sockets.sockets.get(client.socketId);
                    if (clientSocket) clientSocket.disconnect();
                }
                await Client.deleteOne({ username });
                updateAdminDashboard();
            }
        } catch (e) {
            console.error("Kick User Error:", e.message);
        }
    });

    // Admin: Reset Score
    socket.on('reset_user_score', async ({ username, password }) => {
        try {
            let authorized = socket.data.isAdmin;
            if (!authorized && password) {
                const admin = await Admin.findOne({ username: 'admin' });
                if (admin && await bcrypt.compare(password, admin.password)) authorized = true;
            }
            if (!authorized) return;

            console.log(`[ADMIN ACTION] Reset Score ${username}`);

            await Client.updateOne({ username }, {
                scores: { round1: 0, round2: 0 },
                questionScores: { q1: 0, q2: 0, q3: 0 },
                imgScores: {},
                imgAnswers: {},
                totalScore: 0
            });
            updateAdminDashboard();
        } catch (e) {
            console.error("Reset Score Error:", e.message);
        }
    });

    // Admin: Warn User
    socket.on('warn_user', async ({ username, message, password }) => {
        try {
            let authorized = socket.data.isAdmin;
            if (!authorized && password) {
                const admin = await Admin.findOne({ username: 'admin' });
                if (admin && await bcrypt.compare(password, admin.password)) authorized = true;
            }
            if (!authorized) return;

            const client = await Client.findOne({ username });
            if (client && client.socketId) {
                io.to(client.socketId).emit('admin_warning', message);
            }
        } catch (e) {
            console.error("Warn User Error:", e.message);
        }
    });

    // Admin: Warn All
    socket.on('warn_all', async ({ message, password }) => {
        try {
            let authorized = socket.data.isAdmin;
            if (!authorized && password) {
                const admin = await Admin.findOne({ username: 'admin' });
                if (admin && await bcrypt.compare(password, admin.password)) authorized = true;
            }
            if (!authorized) return;

            // Broadcast to all connected clients
            io.to('clients').emit('admin_warning', message);
            console.log(`[ADMIN BROADCAST] Warning sent: "${message}"`);
        } catch (e) {
            console.error("Warn All Error:", e.message);
        }
    });

    // Client: Submit Score (Legacy/Generic)
    socket.on('submit_score', async ({ round, score }) => {
        if (!socket.data.username) return;
        const username = socket.data.username;

        const update = {};
        update[`scores.${round}`] = score;

        const client = await Client.findOneAndUpdate({ username }, { $set: update }, { new: true });

        // Recalculate total
        client.totalScore = (client.scores.round1 || 0) + (client.scores.round2 || 0);
        await client.save();

        updateAdminDashboard(); // Update leaderboards
    });

    // Client: Submit Text Answer (Batch) - Prevents Race Conditions
    socket.on('submit_text_batch', async ({ answers }) => {
        if (!socket.data.username) {
            console.log("[BATCH ERROR] No username in socket");
            return;
        }
        const username = socket.data.username;
        console.log(`[BATCH START] User: ${username}`);

        const results = {};

        try {
            const client = await Client.findOne({ username });
            if (!client) {
                console.log("[BATCH ERROR] Client not found in DB");
                return;
            }

            const roundConfig = await Round.findOne();
            if (!roundConfig || !roundConfig.textRoundConfig) {
                console.log("[BATCH ERROR] Round Config missing");
                return socket.emit('submit_error', 'Round config not found');
            }

            console.log(`[BATCH SUBMIT] Processing ${Object.keys(answers).length} answers for ${username}`);

            // Initialize fields if missing
            if (!client.answers) client.answers = {};
            if (!client.questionScores) client.questionScores = {};

            // Process each answer sequentially to ensure DB integrity
            const { EnigmaScore } = require('./utils/aiJudge');

            for (const [qid, val] of Object.entries(answers)) {
                if (!val) continue;

                const questionText = roundConfig.textRoundConfig[qid];
                const correctAns = roundConfig.textRoundConfig[qid + 'Ans'];

                if (!questionText) continue; // Skip invalid IDs

                console.log(`-> Scoring ${qid}...`);
                const aiResultRaw = await EnigmaScore(val, questionText, correctAns || "No specific answer key provided.");

                let score = 0;
                let reason = "AI Error";

                try {
                    // Robust JSON extraction
                    const jsonMatch = aiResultRaw.match(/\{[\s\S]*\}/);
                    const cleanJson = jsonMatch ? jsonMatch[0] : aiResultRaw;

                    const parsed = JSON.parse(cleanJson);
                    const rawScore = parseInt(parsed.score);
                    score = !isNaN(rawScore) ? rawScore : 0;
                    reason = parsed.reason || "No reason provided";
                    console.log(`   -> Parsed Score: ${score} | Reason: ${reason}`);
                } catch (e) {
                    console.error("Failed to parse AI response for", qid, "| Raw:", aiResultRaw);
                    reason = "Parsing Error";
                }

                // HIGH SCORE LOGIC
                const currentScore = client.questionScores[qid] || 0;
                let saved = false;

                if (score >= currentScore) {
                    // Update Local Object if new score is better or equal (to update answer text)
                    client.answers[qid] = val;
                    client.questionScores[qid] = score;
                    saved = true;
                }

                results[qid] = {
                    score, // Current attempt score
                    reason,
                    bestScore: saved ? score : currentScore,
                    saved
                };
            }

            // Recalculate Totals ONCE using the tracked High Scores
            const qs = client.questionScores;
            client.scores.round1 = (qs.q1 || 0) + (qs.q2 || 0) + (qs.q3 || 0);
            client.totalScore = (client.scores.round1 || 0) + (client.scores.round2 || 0);

            client.markModified('answers');
            client.markModified('questionScores');
            client.markModified('scores');

            await client.save();
            console.log(`[BATCH DONE] Saved scores for ${username}. Total: ${client.totalScore}`);

            socket.emit('batch_score_processed', results);
            updateAdminDashboard();

        } catch (e) {
            console.error("Batch Submit Error:", e);
            socket.emit('submit_error', 'Server Processing Error');
        }
    });

    // Admin: Update Image Round Config
    socket.on('update_img_round', async (args) => {
        const { q1Img, q1Ans, q2Img, q2Ans, q3Img, q3Ans, password } = args;
        try {
            let authorized = socket.data.isAdmin;
            if (!authorized && password) {
                const admin = await Admin.findOne({ username: 'admin' });
                if (admin && admin.password === password) authorized = true;
            }

            if (!authorized) return;

            await Round.updateOne({}, {
                'imgRoundConfig.q1Img': q1Img,
                'imgRoundConfig.q1Ans': q1Ans,
                'imgRoundConfig.q2Img': q2Img,
                'imgRoundConfig.q2Ans': q2Ans,
                'imgRoundConfig.q3Img': q3Img,
                'imgRoundConfig.q2Ans': q2Ans,
                'imgRoundConfig.q3Img': q3Img,
                'imgRoundConfig.q3Ans': q3Ans,
                'imgRoundConfig.timerDuration': parseInt(args.timerDuration || 0)
            });

            const newConfig = await Round.findOne();

            // Update Admins
            io.to('admins').emit('img_round_config', newConfig.imgRoundConfig);

            // Update Clients (Sanitized - No Answers)
            const publicConfig = {
                q1Img: newConfig.imgRoundConfig.q1Img,
                q2Img: newConfig.imgRoundConfig.q2Img,
                q3Img: newConfig.imgRoundConfig.q3Img
            };
            io.to('clients').emit('img_round_config', publicConfig);

            console.log("[DB UPDATE] Image Round Config Saved");
        } catch (e) {
            console.error("Update Image Round Error:", e.message);
        }
    });

    // Client: Submit Image Round Batch
    socket.on('submit_img_batch', async ({ answers }) => {
        if (!socket.data.username) {
            console.log("[IMG BATCH ERROR] No username");
            return;
        }
        const username = socket.data.username;
        const results = {};

        try {
            const client = await Client.findOne({ username });
            if (!client) {
                console.log("[IMG BATCH ERROR] Client not found");
                return;
            }

            const roundConfig = await Round.findOne();
            if (!roundConfig || !roundConfig.imgRoundConfig) {
                console.log("[IMG BATCH ERROR] Round Config missing");
                return socket.emit('submit_error', 'Round config not found');
            }

            console.log(`[IMG BATCH] Processing answers for ${username}`);

            // Initialize fields if missing
            if (!client.imgAnswers) client.imgAnswers = {};
            if (!client.imgScores) client.imgScores = {};

            const { EnigmaScore } = require('./utils/aiJudge');

            let totalRoundScore = 0;

            for (const [qid, val] of Object.entries(answers)) {
                // qid comes from client as "1", "2", "3"
                if (!val) continue;

                // Config keys are "q1Ans", "q2Ans"
                const configKey = 'q' + qid + 'Ans';
                const correctAns = roundConfig.imgRoundConfig[configKey];
                // For image round, the "question" is the image context, 
                // but for AI scoring we can treat the user's prompt as the "answer" 
                // and the admin's hidden prompt as the "target".

                // We'll use EnigmaScore(userAnswer, questionContext, correctAns)
                // Here: userAnswer = val, Context = "Image Description Prompt", Correct = correctAns

                console.log(`-> Scoring Img-${qid}...`);
                console.log(`   User: "${val}"`);
                console.log(`   Correct: "${correctAns}"`);

                const aiResultRaw = await EnigmaScore(val, "Describe the image based on this prompt", correctAns || "No answer key");
                console.log(`   AI Raw: ${aiResultRaw}`);

                let score = 0;
                let reason = "AI Error";

                try {
                    // Robust JSON extraction
                    const jsonMatch = aiResultRaw.match(/\{[\s\S]*\}/);
                    const cleanJson = jsonMatch ? jsonMatch[0] : aiResultRaw;

                    const parsed = JSON.parse(cleanJson);
                    const rawScore = parseInt(parsed.score);
                    score = !isNaN(rawScore) ? rawScore : 0;
                    reason = parsed.reason || "No reason provided";
                    console.log(`   -> Parsed Img Score: ${score} | Reason: ${reason}`);
                } catch (e) {
                    console.error("Failed to parse AI response for", qid, "| Raw:", aiResultRaw);
                    reason = "Parsing Error";
                }

                client.imgAnswers[qid] = val;
                client.imgScores[qid] = score;
                results[qid] = { score, reason };
                totalRoundScore += score;
            }

            client.scores.round2 = totalRoundScore;
            client.totalScore = (client.scores.round1 || 0) + (client.scores.round2 || 0);

            client.markModified('imgAnswers');
            client.markModified('imgScores');
            client.markModified('scores');

            await client.save();
            console.log(`[IMG BATCH DONE] Saved scores for ${username}. Round 2: ${totalRoundScore}`);

            socket.emit('img_batch_processed', results);
            updateAdminDashboard();

        } catch (e) {
            console.error("Image Batch Submit Error:", e);
            socket.emit('submit_error', 'Server Processing Error');
        }
    });

    socket.on('disconnect', async () => {
        if (socket.data.username) {
            console.log(`[DISCONNECT] User: ${socket.data.username} | Socket: ${socket.id}`);

            // Race condition fix: Only clear socketId if the stored one matches THIS socket
            // (Prevents clearing the NEW socket if the user reloaded/redirected fast)
            const client = await Client.findOne({ username: socket.data.username });
            if (client && client.socketId === socket.id) {
                console.log(`-> User ${socket.data.username} went offline. Preserving scores.`);

                // Only mark as offline, DO NOT wipe scores
                await Client.updateOne({ username: socket.data.username }, {
                    socketId: null
                });

                await updateAdminDashboard();
            } else {
                console.log(`-> Preserving new session for ${socket.data.username} (ignored old socket disconnect)`);
            }
        }
    });
});

async function updateAdminDashboard() {
    try {
        const clients = await Client.find({});

        // Accurate connection check
        const activeClients = [];
        for (const client of clients) {
            let isOnline = false;
            if (client.socketId) {
                const s = io.sockets.sockets.get(client.socketId);
                if (s && s.connected) {
                    isOnline = true;
                } else {
                    // Stale socket ID found, cleanup db
                    await Client.updateOne({ _id: client._id }, { socketId: null });
                    client.socketId = null;
                }
            }
            activeClients.push(client);
        }

        const connectedCount = activeClients.filter(c => c.socketId).length;

        // Leaderboard
        const leaderboard = activeClients.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

        console.log(`[DASHBOARD] Updating ${connectedCount} connected clients / ${clients.length} total.`);
        io.to('admins').emit('dashboard_update', {
            connectedCount,
            clients: activeClients, // Send full list for User Control
            leaderboard
        });
    } catch (e) {
        console.error("Dashboard Update Error:", e);
    }
}

const PORT = 5000; // Hardcoded or process.env.PORT

function startServer() {
    server.listen(PORT, () => {
        // Find local IP
        const interfaces = os.networkInterfaces();
        let localIP = 'localhost';
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    localIP = iface.address;
                    break;
                }
            }
        }

        console.log(`\n\x1b[32m[SERVER RUNNING]\x1b[0m`);
        console.log(`\x1b[36mLocal:\x1b[0m            http://localhost:${PORT}`);
        console.log(`\x1b[36mNetwork (LAN):\x1b[0m    http://${localIP}:${PORT}`);
        console.log(`\n\x1b[33m[ACCESS LINKS]\x1b[0m`);
        console.log(`\x1b[35mAdmin Dashboard:\x1b[0m  http://${localIP}:${PORT}/admin/admin.html`);
        console.log(`\x1b[35mClient Login:\x1b[0m     http://${localIP}:${PORT}/index.html`);
        console.log(`\n\x1b[90mPress Ctrl+C to stop\x1b[0m\n`);
    });
}
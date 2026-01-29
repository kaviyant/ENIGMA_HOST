const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // Unique within session? Or persistent. Let's make it persistent for now.
    ipAddress: { type: String },
    joinTime: { type: Date, default: Date.now },
    scores: {
        round1: { type: Number, default: 0 },
        round2: { type: Number, default: 0 }
    },
    answers: {
        q1: { type: String, default: "" },
        q2: { type: String, default: "" },
        q3: { type: String, default: "" }
    },
    pixelCode: { type: String, default: "" },      // Round 2 Submission
    pixelFeedback: { type: String, default: "" },  // Round 2 Feedback
    questionScores: {
        q1: { type: Number, default: 0 },
        q2: { type: Number, default: 0 },
        q3: { type: Number, default: 0 }
    },
    imgAnswers: { type: Object, default: {} }, // Stores { 1: "ans", 2: "ans"... }
    imgScores: { type: Object, default: {} },  // Stores { 1: 10, 2: 5... }
    totalScore: { type: Number, default: 0 },
    socketId: { type: String } // For real-time comms
});

module.exports = mongoose.model('Client', ClientSchema);

const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema({
    globalPassword: { type: String, required: true }, // Competition password (plain text)
    rounds: {
        lobby: { type: Boolean, default: true },
        round1: { type: Boolean, default: false },
        round2: { type: Boolean, default: false }
    },
    settings: {
        maxClients: { type: Number, default: 100 }
    },
    textRoundConfig: {
        q1: { type: String, default: "Question 1 Data..." },
        q1Ans: { type: String, default: "" },
        q2: { type: String, default: "Question 2 Data..." },
        q2Ans: { type: String, default: "" },
        q3: { type: String, default: "Question 3 Data..." },
        q3Ans: { type: String, default: "" },
        timerDuration: { type: Number, default: 0 }
    },
    round1EndTime: { type: Number, default: null }, // Timestamp
    imgRoundConfig: {
        q1Img: { type: String, default: "/assets/q1.png" },
        q1Ans: { type: String, default: "" },
        q2Img: { type: String, default: "/assets/q2.png" },
        q2Ans: { type: String, default: "" },
        q3Img: { type: String, default: "/assets/q3.png" },
        q3Ans: { type: String, default: "" },
        timerDuration: { type: Number, default: 0 } // Minutes
    },
    round2EndTime: { type: Number, default: null } // Timestamp
});

module.exports = mongoose.model('Round', RoundSchema);

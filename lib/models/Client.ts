import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    ipAddress: { type: String, default: '' },
    lastSeen: { type: Date, default: Date.now },
    answers: { type: Object, default: {} },
    imgAnswers: { type: Object, default: {} },
    questionScores: {
        q1: { type: Number, default: 0 },
        q2: { type: Number, default: 0 },
        q3: { type: Number, default: 0 }
    },
    imgScores: {
        q1: { type: Number, default: 0 },
        q2: { type: Number, default: 0 },
        q3: { type: Number, default: 0 }
    },
    scores: {
        round1: { type: Number, default: 0 },
        round2: { type: Number, default: 0 }
    },
    totalScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { minimize: false });

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);

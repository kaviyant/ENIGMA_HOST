import mongoose from 'mongoose';

const RoundSchema = new mongoose.Schema({
    globalPassword: { type: String, default: 'default_password' },
    rounds: {
        lobby: { type: Boolean, default: true },
        round1: { type: Boolean, default: false },
        round2: { type: Boolean, default: false }
    },
    textRoundConfig: {
        q1: { type: String, default: '' },
        q1Ans: { type: String, default: '' },
        q2: { type: String, default: '' },
        q2Ans: { type: String, default: '' },
        q3: { type: String, default: '' },
        q3Ans: { type: String, default: '' },
        timerDuration: { type: Number, default: 0 }
    },
    imgRoundConfig: {
        q1Img: { type: String, default: '' },
        q1Ans: { type: String, default: '' },
        q2Img: { type: String, default: '' },
        q2Ans: { type: String, default: '' },
        q3Img: { type: String, default: '' },
        q3Ans: { type: String, default: '' },
        timerDuration: { type: Number, default: 0 }
    },
    round1EndTime: { type: Date, default: null },
    round2EndTime: { type: Date, default: null }
}, { minimize: false, collection: 'rounds_config' });
// Using a specific collection name to avoid confusion with 'rounds' if strict naming is preferred

export default mongoose.models.Round || mongoose.model('Round', RoundSchema);

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/lib/models/Client';
import Round from '@/lib/models/Round';
import { EnigmaScore } from '@/lib/aiJudge';

/**
 * IMAGE ROUND SUBMISSION - PERMANENT STORAGE
 * 
 * IMPORTANT: All submitted image descriptions are PERMANENTLY STORED in the database.
 * - Answers are saved after each question to ensure persistence
 * - Scores are calculated by AI and stored permanently
 * - Submissions are NEVER automatically deleted
 * - Only manual admin deletion can remove submissions
 * 
 * Storage guarantees:
 * - Retry mechanism ensures data persistence (up to 3 attempts with exponential backoff)
 * - Partial progress is saved after each question
 * - Total scores are always calculated and saved
 */

// Retry mechanism for database saves to ensure persistence
async function saveClientWithRetry(client: any, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await client.save();
            return true;
        } catch (e: any) {
            console.error(`Save attempt ${i + 1} failed:`, e);
            if (i < maxRetries - 1) {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
            }
        }
    }
    return false;
}

export async function POST(req: Request) {
    let client: any = null;
    try {
        await dbConnect();
        const { username, answers, questionId } = await req.json();

        if (!username) return NextResponse.json({ success: false, message: 'Username required' }, { status: 400 });

        client = await Client.findOne({ username });
        let roundConfig = await Round.findOne();
        if (!roundConfig) {
            // Lazy Init to prevent crashes if config is wiped
            roundConfig = await Round.create({ globalPassword: 'default_password' });
        }

        if (!client) {
            // Lazy create to allow session recovery if DB is wiped
            client = await Client.create({
                username,
                lastSeen: new Date(),
                ipAddress: req.headers.get('x-forwarded-for') || 'recreated_in_submit'
            });
        }

        if (!roundConfig) {
            return NextResponse.json({ success: false, message: 'Server Configuration Error' }, { status: 500 });
        }

        // Initialize client fields if they don't exist
        if (!client.imgAnswers) client.imgAnswers = {};
        if (!client.imgScores) client.imgScores = {};
        if (!client.scores) client.scores = { round1: 0, round2: 0 };
        if (typeof client.totalScore !== 'number') client.totalScore = 0;

        const results: any = {};

        for (const [qid, val] of Object.entries(answers)) {
            // Filter if questionId is provided
            if (questionId && String(questionId) !== String(qid)) continue;
            if (!val) continue;

            // qid is "1", "2", "3"
            const configKey = 'q' + qid + 'Ans';

            const configAny = roundConfig.imgRoundConfig as any;
            const correctAns = configAny[configKey];

            const aiResultRaw = await EnigmaScore(val as string, "Compare the user's description of an image with the actual prompt used to generate it. Rate similarity out of 100.", correctAns || "No answer key", 'image');

            let score = 0;
            let reason = "AI Error";

            try {
                const jsonMatch = aiResultRaw.match(/\{[\s\S]*?\}/);
                const cleanJson = jsonMatch ? jsonMatch[0] : aiResultRaw;
                const parsed = JSON.parse(cleanJson);
                score = typeof parsed.score === 'number' ? parsed.score : parseInt(parsed.score) || 0;
                reason = parsed.reason || "No specific reason provided.";
            } catch (e) {
                console.error("AI Parse Error (Img)", e);
            }

            if (!client.imgAnswers) client.imgAnswers = {};
            if (!client.imgScores) client.imgScores = {};

            (client.imgAnswers as any)[qid] = val;

            const currentBest = (client.imgScores as any)[qid] || 0;
            const finalScore = Math.max(currentBest, score);
            (client.imgScores as any)[qid] = finalScore;

            results[qid] = { score: finalScore, attemptScore: score, reason };

            // Save after each question to ensure partial progress is persisted
            let sum = 0;
            if (client.imgScores) {
                for (const key in client.imgScores) {
                    sum += (client.imgScores as any)[key] || 0;
                }
            }
            client.scores.round2 = sum;
            client.totalScore = (client.scores.round1 || 0) + (client.scores.round2 || 0);
            await saveClientWithRetry(client);
        }

        // Final recalculation and save
        let sum = 0;
        if (client.imgScores) {
            for (const key in client.imgScores) {
                sum += (client.imgScores as any)[key] || 0;
            }
        }
        client.scores.round2 = sum;
        client.totalScore = (client.scores.round1 || 0) + (client.scores.round2 || 0);

        const saveSuccess = await saveClientWithRetry(client);
        if (!saveSuccess) {
            console.error("Failed to save client after max retries");
            return NextResponse.json({ success: false, message: 'Failed to persist score to database' }, { status: 500 });
        }

        return NextResponse.json({ success: true, results, totalScore: client.totalScore });

    } catch (e: any) {
        console.error("Submit Image Error:", e);

        // Attempt to save whatever progress was made before error
        if (client) {
            try {
                await saveClientWithRetry(client, 2);
            } catch (saveError) {
                console.error("Failed to save on error recovery:", saveError);
            }
        }

        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}

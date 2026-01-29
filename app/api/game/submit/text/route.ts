import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/lib/models/Client';
import Round from '@/lib/models/Round';
import { EnigmaScore } from '@/lib/aiJudge';

/**
 * TEXT ROUND SUBMISSION - PERMANENT STORAGE
 * 
 * IMPORTANT: All submitted answers are PERMANENTLY STORED in the database.
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

        if (!roundConfig) { // Should not happen with lazy init but strictly checking
            return NextResponse.json({ success: false, message: 'Server Configuration Error' }, { status: 500 });
        }

        // Initialize client fields if they don't exist
        if (!client.answers) client.answers = {};
        if (!client.questionScores) client.questionScores = { q1: 0, q2: 0, q3: 0 };
        if (!client.scores) client.scores = { round1: 0, round2: 0 };
        if (typeof client.totalScore !== 'number') client.totalScore = 0;

        const results: any = {};

        // Loop through answers
        for (const [qid, val] of Object.entries(answers)) {
            // Filter if questionId is provided. qid is 'q1', questionId is 1.
            if (questionId && qid !== `q${questionId}`) continue;

            if (!val) continue;

            // Cast to any to access dynamic properties
            const configAny = roundConfig.textRoundConfig as any;
            const questionText = configAny[qid];
            const correctAns = configAny[qid + 'Ans'];

            if (!questionText) continue;

            // Anti-Cheat / idiot check: If user just copies the question text as the answer, score 0.
            if (String(val).trim() === String(questionText).trim()) {
                results[qid] = { score: 0, reason: "Copied challenge text." };
                client.questionScores[qid] = 0;
                continue;
            }

            const aiResultRaw = await EnigmaScore(val as string, questionText, correctAns || "No specific answer key provided.", 'text');

            let score = 0;
            let reason = "AI Error";

            try {
                const jsonMatch = aiResultRaw.match(/\{[\s\S]*?\}/); // Lazy match to get the first object
                const cleanJson = jsonMatch ? jsonMatch[0] : aiResultRaw;
                const parsed = JSON.parse(cleanJson);
                score = typeof parsed.score === 'number' ? parsed.score : parseInt(parsed.score) || 0;
                reason = parsed.reason || "No specific reason provided.";
            } catch (e) {
                console.error("AI Parse Error", e);
            }

            if (client.answers instanceof Map) {
                client.answers.set(qid, val);
            } else {
                // Fallback - convert to plain object
                if (!client.answers) client.answers = {};
                (client.answers as any)[qid] = val;
            }

            // Update specific score field
            // Update specific score field (Keep highest)
            const currentBest = client.questionScores[qid] || 0;
            const finalScore = Math.max(currentBest, score);

            if (qid === 'q1') client.questionScores.q1 = finalScore;
            if (qid === 'q2') client.questionScores.q2 = finalScore;
            if (qid === 'q3') client.questionScores.q3 = finalScore;

            if (qid === 'q3') client.questionScores.q3 = finalScore;

            results[qid] = { score: finalScore, attemptScore: score, reason };

            // Save after each question to ensure partial progress is persisted
            const qs = client.questionScores;
            client.scores.round1 = (qs.q1 || 0) + (qs.q2 || 0) + (qs.q3 || 0);
            client.totalScore = (client.scores.round1 || 0) + (client.scores.round2 || 0);
            await saveClientWithRetry(client);
        }

        // Final recalculation and save
        const qs = client.questionScores;
        client.scores.round1 = (qs.q1 || 0) + (qs.q2 || 0) + (qs.q3 || 0);
        client.totalScore = (client.scores.round1 || 0) + (client.scores.round2 || 0);

        const saveSuccess = await saveClientWithRetry(client);
        if (!saveSuccess) {
            console.error("Failed to save client after max retries");
            return NextResponse.json({ success: false, message: 'Failed to persist score to database' }, { status: 500 });
        }

        return NextResponse.json({ success: true, results, totalScore: client.totalScore });

    } catch (e: any) {
        console.error("Submit Text Error:", e);

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

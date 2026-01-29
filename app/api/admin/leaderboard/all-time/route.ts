import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/lib/models/Client';

export const dynamic = 'force-dynamic';

/**
 * PERMANENT STORAGE POLICY:
 * This endpoint demonstrates that ALL user submissions are PERMANENTLY STORED in the database.
 * Once a user submits answers, those scores are saved permanently and NEVER automatically deleted.
 * Only manual deletion via admin interface can remove submissions.
 */
export async function GET(req: Request) {
    try {
        await dbConnect();

        const clients = await Client.find({});

        // All-time leaderboard: shows ALL clients sorted by total score
        // This proves that submissions are permanently stored
        const allTimeLeaderboard = clients
            .map((c: any) => ({
                ...c.toObject(),
            }))
            .sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));

        return NextResponse.json({
            total: allTimeLeaderboard.length,
            leaderboard: allTimeLeaderboard,
            note: "All-time leaderboard shows ALL submitted scores. Submissions are PERMANENTLY stored and only removed via manual admin deletion."
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

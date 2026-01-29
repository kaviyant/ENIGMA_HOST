import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/lib/models/Client';
import Round from '@/lib/models/Round';

export const dynamic = 'force-dynamic';

/**
 * PERMANENT STORAGE GUARANTEE:
 * All user submissions are PERMANENTLY STORED in the database.
 * 
 * Leaderboard Behavior:
 * - ALL players' scores are shown permanently, including offline players
 * - Scores are never automatically deleted
 * - Leaderboard always reflects database records
 * 
 * Deletion Policy:
 * - Submissions are NEVER automatically deleted
 * - Only manual admin deletion can remove submissions
 * - Endpoint: /api/admin/users/delete/{username}
 */
export async function GET(req: Request) {
    try {
        await dbConnect();

        const clients = await Client.find({});

        const now = new Date();
        const activeThreshold = new Date(now.getTime() - 10000); // 10s heartbeat window

        // Clients are "active" if lastSeen is recent
        const activeClients = clients.filter((c: any) => new Date(c.lastSeen) > activeThreshold);

        const clientsWithStatus = clients.map((c: any) => {
            const isOnline = new Date(c.lastSeen) > activeThreshold;
            return {
                ...c.toObject(),
                isOnline
            };
        });

        // Permanent leaderboard: shows ALL players (online and offline) with their scores
        // This ensures all submitted scores remain visible and permanent in the database
        const leaderboard = clientsWithStatus
            .sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));

        const config = await Round.findOne();

        return NextResponse.json({
            connectedCount: activeClients.length,
            clients: clientsWithStatus,
            leaderboard,
            config,
            note: 'Leaderboard displays all submitted scores permanently, including offline players'
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

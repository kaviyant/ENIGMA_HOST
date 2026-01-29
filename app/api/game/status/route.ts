import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Round from '@/lib/models/Round';
import Client from '@/lib/models/Client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        let clientWarning = null;

        if (username) {
            // Update heartbeat and get doc
            const c = await Client.findOneAndUpdate(
                { username },
                { lastSeen: new Date() },
                { new: true } // Return updated doc
            );
            
            // Check if user is kicked
            if (c && c.kicked) {
                return NextResponse.json({ 
                    kicked: true,
                    message: 'You have been kicked by an administrator' 
                }, { status: 403 });
            }
            
            if (c && c.warning) {
                clientWarning = c.warning;
            }
        }

        const config = await Round.findOne();
        if (!config) return NextResponse.json({});

        // Determine active warning (user or global, whichever is newer)
        let activeWarning = null;
        if (config.globalWarning && config.globalWarning.message) {
            activeWarning = config.globalWarning;
        }

        if (clientWarning && clientWarning.message) {
            if (!activeWarning || clientWarning.timestamp > activeWarning.timestamp) {
                activeWarning = clientWarning;
            }
        }

        return NextResponse.json({
            rounds: config.rounds,
            timers: {
                round1EndTime: config.round1EndTime,
                round2EndTime: config.round2EndTime
            },
            textConfig: {
                q1: config.textRoundConfig?.q1 || "",
                q2: config.textRoundConfig?.q2 || "",
                q3: config.textRoundConfig?.q3 || "",
                timerDuration: config.textRoundConfig?.timerDuration
            },
            imgConfig: {
                q1Img: config.imgRoundConfig?.q1Img || "",
                q2Img: config.imgRoundConfig?.q2Img || "",
                q3Img: config.imgRoundConfig?.q3Img || "",
                timerDuration: config.imgRoundConfig?.timerDuration
            },
            warning: activeWarning
        });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

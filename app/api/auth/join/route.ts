import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/lib/models/Client';
import Round from '@/lib/models/Round';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { username, password } = await req.json();

        let config = await Round.findOne();
        if (!config) {
            // Lazy Init
            config = await Round.create({ globalPassword: 'default_password' });
        }

        if (password !== config.globalPassword) {
            return NextResponse.json({ success: false, message: 'Incorrect Competition Password' }, { status: 401 });
        }

        let client = await Client.findOne({ username });
        if (!client) {
            client = await Client.create({
                username,
                ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
                lastSeen: new Date()
            });
        } else {
            client.lastSeen = new Date();
            client.ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
            await client.save();
        }

        return NextResponse.json({
            success: true,
            username,
            rounds: config.rounds,
            textConfig: {
                q1: config.textRoundConfig?.q1 || "",
                q2: config.textRoundConfig?.q2 || "",
                q3: config.textRoundConfig?.q3 || "",
                timerDuration: config.textRoundConfig?.timerDuration || 0
            },
            imgConfig: {
                q1Img: config.imgRoundConfig?.q1Img || "",
                q2Img: config.imgRoundConfig?.q2Img || "",
                q3Img: config.imgRoundConfig?.q3Img || "",
                timerDuration: config.imgRoundConfig?.timerDuration || 0
            },
            timers: {
                round1EndTime: config.round1EndTime || null,
                round2EndTime: config.round2EndTime || null
            }
        });

    } catch (error: any) {
        console.error("Join Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

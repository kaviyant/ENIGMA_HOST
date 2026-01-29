import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Round from '@/lib/models/Round';
import Admin from '@/lib/models/Admin';

async function checkAuth(password: string) {
    if (!password) return false;
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) return false;
    return password === admin.password;
}

export async function POST(req: Request) {
    await dbConnect();
    const { round, state, password } = await req.json();

    if (!await checkAuth(password)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let config = await Round.findOne({});
    if (!config) {
        config = await Round.create({});
    }

    if (state) {
        // Exclusive On
        if (!config.rounds) config.rounds = {};
        config.rounds.lobby = (round === 'lobby');
        config.rounds.round1 = (round === 'round1');
        config.rounds.round2 = (round === 'round2');

        if (round === 'round1') {
            const duration = config.textRoundConfig?.timerDuration || 0;
            if (duration > 0) {
                config.round1EndTime = Date.now() + (duration * 60 * 1000);
                config.round2EndTime = null;
            } else {
                config.round1EndTime = null;
            }
        } else if (round === 'round2') {
            const duration = config.imgRoundConfig?.timerDuration || 0;
            if (duration > 0) {
                config.round2EndTime = Date.now() + (duration * 60 * 1000);
                config.round1EndTime = null;
            } else {
                config.round2EndTime = null;
            }
        } else {
            config.round1EndTime = null;
            config.round2EndTime = null;
        }
    } else {
        // Off
        if (config.rounds) config.rounds[round] = false;
        if (round === 'round1') config.round1EndTime = null;
        if (round === 'round2') config.round2EndTime = null;
    }

    await config.save();

    return NextResponse.json({ success: true });
}

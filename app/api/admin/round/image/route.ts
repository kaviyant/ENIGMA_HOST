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
    const { q1Img, q1Ans, q2Img, q2Ans, q3Img, q3Ans, timerDuration, password } = await req.json();

    if (!await checkAuth(password)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let config = await Round.findOne({});
    if (!config) {
        config = await Round.create({});
    }

    config.imgRoundConfig = {
        q1Img, q1Ans, q2Img, q2Ans, q3Img, q3Ans,
        timerDuration: parseInt(timerDuration || '0')
    };

    await config.save();

    return NextResponse.json({ success: true });
}

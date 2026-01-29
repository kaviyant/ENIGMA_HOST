import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/lib/models/Client';
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
    const { username, message, password } = await req.json();

    if (!await checkAuth(password)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const timestamp = Date.now();
    const warnMsg = message || 'ADMIN WARNING ISSUED';

    if (username) {
        // Individual Warn
        const client = await Client.findOne({ username });
        if (client) {
            client.warning = { message: warnMsg, timestamp };
            await client.save();
        }
    } else {
        // Global Warn
        let config = await Round.findOne({});
        if (!config) config = await Round.create({});

        config.globalWarning = { message: warnMsg, timestamp };
        await config.save();
    }

    return NextResponse.json({ success: true });
}

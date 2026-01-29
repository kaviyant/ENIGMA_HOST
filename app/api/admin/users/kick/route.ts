import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/lib/models/Client';
import Admin from '@/lib/models/Admin';

async function checkAuth(password: string) {
    if (!password) return false;
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) return false;
    return password === admin.password;
}

export async function POST(req: Request) {
    await dbConnect();
    const { username, password } = await req.json();

    if (!await checkAuth(password)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const client = await Client.findOne({ username });
    if (client) {
        client.kicked = true;
        await client.save();
    }

    return NextResponse.json({ success: true });
}

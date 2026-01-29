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
    try {
        await dbConnect();
        const { newPassword, authPassword } = await req.json();

        // Check using authPassword (which is the Admin Password)
        if (!await checkAuth(authPassword)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        let config = await Round.findOne({});
        if (!config) {
            config = await Round.create({});
        }

        // Update the GLOBAL Round Password
        config.globalPassword = newPassword;
        await config.save();

        return NextResponse.json({ success: true, message: 'Global Password Updated' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

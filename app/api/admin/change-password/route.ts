import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { newPassword, currentPassword } = await req.json();

        // Security check: Verify current password matches the 'admin' user
        // We assume the user logged in is 'admin' for this simple system
        const admin = await Admin.findOne({ username: 'admin' });

        if (!admin) {
            return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
        }

        // Direct comparison
        if (currentPassword !== admin.password) {
            return NextResponse.json({ success: false, message: 'Unauthorized: Invalid current password' }, { status: 401 });
        }

        // Update Password (Plain Text)
        admin.password = newPassword;
        await admin.save();

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

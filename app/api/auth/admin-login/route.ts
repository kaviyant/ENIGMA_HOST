import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { username, password } = await req.json();

        let admin = await Admin.findOne({ username });

        if (!admin && username === 'admin') {
            console.log('Creating default admin user');
            // Store plain text
            admin = await Admin.create({ username: 'admin', password: 'admin123' });
        }

        // Auto-fix: Reset hashed password to plain text default if migration occurred
        try {
            if (admin && admin.password?.startsWith('$2a$')) {
                console.log('Migrating admin password from hash to plain text default');
                admin.password = 'admin123';
                await admin.save();
            }
        } catch (migError) {
            console.error('Migration error:', migError);
            // Non-fatal, continue to validation
        }

        if (!admin) {
            return NextResponse.json({ success: false, message: 'Invalid Credentials' }, { status: 401 });
        }

        // Direct string comparison
        if (password !== admin.password) {
            return NextResponse.json({ success: false, message: 'Invalid Credentials' }, { status: 401 });
        }

        return NextResponse.json({ success: true, username });

    } catch (error: any) {
        console.error('Admin Login Error:', error);
        if (error.name === 'MongooseError' || error.message?.includes('ECONNREFUSED') || error.message?.includes('querySrv')) {
            return NextResponse.json({ success: false, message: 'Database Connection Failed. Check Internet.' }, { status: 500 });
        }
        return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

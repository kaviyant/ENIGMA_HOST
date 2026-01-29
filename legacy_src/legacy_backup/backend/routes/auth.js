const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

router.post('/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[ADMIN-LOGIN] Attempt: ${username}`);

        const admin = await Admin.findOne({ username }).maxTimeMS(5000);
        console.log(`[ADMIN-LOGIN] User Found: ${!!admin}`);

        if (!admin) return res.status(401).json({ success: false, message: 'Invalid User' });

        let match = false;
        try {
            // Attempt Bcrypt compare first
            match = await bcrypt.compare(password, admin.password);
        } catch (err) {
            // If bcrypt errors (e.g. invalid salt/hash), ignore
        }

        // Fallback to plain text if bcrypt failed or returned false (and password looks like plain)
        if (!match) {
            if (password === admin.password) {
                match = true;
            }
        }

        console.log(`[ADMIN-LOGIN] Password Match: ${match}`);

        if (match) return res.json({ success: true });
        res.status(401).json({ success: false, message: 'Invalid Password' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;

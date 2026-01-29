const express = require('express');
const router = express.Router();
const Round = require('../models/Round');
const bcrypt = require('bcrypt');

router.post('/set-password', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Password required' });

        await Round.updateOne({}, { globalPassword: password });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

const Admin = require('../models/Admin');
router.post('/add-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ success: false, message: 'Credentials required' });

        const existing = await Admin.findOne({ username });
        if (existing) return res.status(400).json({ success: false, message: 'Admin already exists' });

        // const hashed = await bcrypt.hash(password, 10);
        await Admin.create({ username, password: password }); // Storing plaintext as requested
        res.json({ success: true, message: 'Admin created' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
module.exports = router;

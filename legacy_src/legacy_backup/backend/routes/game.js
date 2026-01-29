const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

router.get('/leaderboard', async (req, res) => {
    try {
        const clients = await Client.find({});
        const leaderboard = clients.sort((a, b) => b.totalScore - a.totalScore);
        res.json(leaderboard);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

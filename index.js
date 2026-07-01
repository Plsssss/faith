const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const pending = {};

app.post('/verify', async (req, res) => {
    const { key, hwid } = req.body;
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    pending[id] = { key, hwid, resolved: false, valid: false };

    await axios.post(WEBHOOK_URL, {
        content: `🔑 **Key Check**\nKey: \`${key}\`\nHWID: \`${hwid}\`\nRequest ID: \`${id}\``
    });

    let waited = 0;
    while (!pending[id].resolved && waited < 60) {
        await new Promise(r => setTimeout(r, 1000));
        waited++;
    }
    const result = pending[id];
    delete pending[id];
    res.json({ valid: result.valid });
});

app.post('/response', (req, res) => {
    const { requestId, valid } = req.body;
    if (pending[requestId]) {
        pending[requestId].resolved = true;
        pending[requestId].valid = valid;
        res.json({ success: true });
    } else {
        res.json({ success: false, error: "ID not found" });
    }
});

app.listen(process.env.PORT || 3000, () => console.log('Proxy running on port ' + (process.env.PORT || 3000)));

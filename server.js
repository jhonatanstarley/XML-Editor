const express = require('express');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use(express.static('public'));

// Endpoint para upload do XML
app.post('/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const xmlFile = req.files.xmlFile;
    const sessionId = uuidv4();
    const uploadPath = path.join(__dirname, 'uploads', `${sessionId}.xml`);

    xmlFile.mv(uploadPath, (err) => {
        if (err) return res.status(500).send(err);
        res.json({ sessionId });
    });
});

// Endpoint para obter o XML pelo UUID
app.get('/xml/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    const filePath = path.join(__dirname, 'uploads', `${sessionId}.xml`);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

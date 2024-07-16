const express = require('express');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Configurar o mecanismo de visualização EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(fileUpload());
app.use(express.static('./public'));

// Rota para renderizar o index.ejs
app.get('/', (req, res) => {
    res.render('index');
});

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

// WebSocket para atualizações em tempo real
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinSession', (sessionId) => {
        socket.join(sessionId);
    });

    socket.on('saveChanges', (data) => {
        const filePath = path.join(__dirname, 'uploads', `${data.sessionId}.xml`);
        fs.writeFile(filePath, data.xmlContent, (err) => {
            if (err) {
                console.error('Error saving XML:', err);
            } else {
                io.to(data.sessionId).emit('updateXML', data.xmlContent);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

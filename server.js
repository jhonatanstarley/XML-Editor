const express = require('express');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// Configurar o mecanismo de visualização EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(fileUpload());

// Rota para renderizar o index.ejs
app.get('/', (req, res) => {
    res.render('index');
});

// Endpoint para upload do XML
app.post('/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const xmlFile = req.files.xmlFile;
    const sessionId = uuidv4();
    const uploadPath = path.join(__dirname, 'uploads', `${sessionId}.xml`);

    xmlFile.mv(uploadPath, (err) => {
        if (err) return res.status(500).json({ error: err.message });
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
        res.status(404).json({ error: 'File not found.' });
    }
});

// Configurar socket.io para sincronização em tempo real
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinSession', (sessionId) => {
        socket.join(sessionId);
        console.log(`Client joined session ${sessionId}`);
    });

    socket.on('updateXML', (data) => {
        const { sessionId, xmlContent } = data;
        const filePath = path.join(__dirname, 'uploads', `${sessionId}.xml`);
        fs.writeFileSync(filePath, xmlContent);
        socket.to(sessionId).emit('updateXML', xmlContent);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');

const app = express();

// Load SSL certificate and key with correct path
const options = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+2.pem'))
};

const server = https.createServer(options, app);
const io = socketIo(server, {
    cors: {
       origin: "https://192.168.1.113:4200",  // Update with HTTPS URL
        //origin: "https://localhost:4200",  // Update with HTTPS URL
        //origin: "*",  // Allow all origins temporarily for testing

        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('offer', (offer) => {
        console.log('Received offer');  // Log when offer is received
        socket.broadcast.emit('offer', offer);  // Broadcast the offer to all other connected clients
    });

    socket.on('answer', (answer) => {
        console.log('Received answer');  // Log when answer is received
        socket.broadcast.emit('answer', answer);  // Broadcast the answer back to the caller
    });

    socket.on('candidate', (candidate) => {
        console.log('Received candidate');  // Log when candidate is received
        socket.broadcast.emit('candidate', candidate);  // Broadcast candidate to the other peer
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


server.listen(3000, () => console.log('Server running on https://192.168.1.113:3000'));

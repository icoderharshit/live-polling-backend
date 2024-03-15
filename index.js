const express = require('express');
const http = require('http');
const {Server} = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server,{ cors:{
    origin:'*'
}});
const cors = require('cors');

let activePoll = null;
let studentAnswers = {};

app.use(cors({
    origin: 'https://live-polling-system.netlify.app'
}));

app.use('/socket.io', (req, res) => {
    res.send({ socketio: 'is here!' });
});

// Socket.io event handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    // Handle messages or events from clients
    socket.on('askQuestion', (pollData) => {
        activePoll = pollData;
        io.emit('askQuestion', activePoll); // Emit 'askQuestion' event to all clients
    });

    // Handle answer submission
    socket.on('submitAnswer', (answer) => { 
        // Store the answer for the student
        const { studentId, selectedOption } = answer;
        studentAnswers[studentId] = selectedOption;

        // Calculate option results
        const optionResults = activePoll.options.map((option, index) => ({
            option: option.text,
            count: Object.values(studentAnswers).filter((studentAnswer) => studentAnswer === index).length,
            totalStudents: Object.values(studentAnswers).length, // Total students who submitted an answer
        }));

        io.emit('questionResults', { question: activePoll.question, optionResults,correctAnswerIndex: activePoll.correctAnswerIndex });
    });

    // Handle clear screen and ask another question
    socket.on('clearScreen', () => {
        activePoll = null;
        studentAnswers = {};
        io.emit('clearScreen');
    });

    socket.on('revealAnswer', (correctAnswerIndex) => {
        io.emit('revealAnswer', correctAnswerIndex);
    });    

});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

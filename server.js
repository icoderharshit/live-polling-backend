const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let activePoll = null;
let studentAnswers = {};

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
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

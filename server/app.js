import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv'; // Import dotenv

const app = express();
app.use(cors());
dotenv.config();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Add a basic route for the root
app.get('/', (req, res) => {
  res.send('Chat server is running!');
});

let activeUsers = {}; // Store active users with socket IDs

io.on('connection', (socket) => {
  // Listen for 'join' event to register the username
  socket.on('join', ({ username }) => {
    socket.username = username;
    activeUsers[socket.id] = username; // Add user to active users

    // Notify everyone (including the joining user) about the new user
    io.emit("joinedPersonName", `${username} has joined the chat.`);
    
    // Send the list of active users to the newly joined user
    socket.emit('activeUsers', Object.values(activeUsers));

    // Broadcast the updated list of active users to everyone
    io.emit('updateUserList', Object.values(activeUsers));
  });

  // Listen for 'sendMessage' event
  socket.on('sendMessage', (message) => {
    io.emit('receiveMessage', message); // Broadcast message to all clients
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.username) {
      delete activeUsers[socket.id]; // Remove user from active users

      // Notify everyone that this user has disconnected
      io.emit('joinedPersonName', `${socket.username} has disconnected`);
      
      // Broadcast the updated list of active users to everyone
      io.emit('updateUserList', Object.values(activeUsers));
    }
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

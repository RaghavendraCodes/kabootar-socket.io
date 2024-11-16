import { Container, Typography, TextField, Button, Paper, Box, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

function App() {

  // console.log('Localhost Server:', process.env.REACT_APP_LOCALHOST_SERVER);

  const socket = useMemo(() => io("https://kabootar-jaa-kabootar.onrender.com"), []);

  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]); // Track active users
  const messagesEndRef = useRef(null);

  // Function to handle username submission
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsConnected(true);
      socket.emit('join', { username }); // Emit the username to the server
    }
  };

  useEffect(() => {
    // Listen for join and disconnect notifications
    socket.on('joinedPersonName', (notification) => {
      setNotifications((prevNotifications) => [...prevNotifications, notification]);
    });

    // Receive and display active users list when joining or updating
    socket.on('activeUsers', (users) => {
      setActiveUsers(users);
    });

    socket.on('updateUserList', (users) => {
      setActiveUsers(users);
    });

    return () => {
      socket.off('joinedPersonName');
      socket.off('activeUsers');
      socket.off('updateUserList');
    };
  }, [socket]);

  // Receive and display messages from the server
  useEffect(() => {
    socket.on('receiveMessage', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [socket]);

  // Send message to the server
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() !== '') {
      const newMessage = { username, text: message };
      socket.emit('sendMessage', newMessage); // Send to server
      setMessage('');
    }
  };

  // Scroll to the bottom when a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Container maxWidth="sm" sx={{ padding: '1em', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" component="h3" textAlign="center" sx={{ marginBottom: '1em' }}>
        Kabootar jaa Kabootar
      </Typography>

      {!isConnected ? (
        <form onSubmit={handleUsernameSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            label="Enter the name of your kabootar"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ marginBottom: '1em' }}
          />
          <Button variant="contained" type="submit" fullWidth>
            Join Kabootar
          </Button>
        </form>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Paper elevation={3} sx={{ padding: '1em', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <Typography variant="h6" marginBottom="0.5em">
              Active Kabootars:
            </Typography>
            <Box sx={{ marginBottom: '1em', backgroundColor: 'lightyellow', padding: '1em', borderRadius: '8px' }}>
              {activeUsers.map((user, index) => (
                <Typography key={index} variant="body1">
                  {user}
                </Typography>
              ))}
            </Box>

            <Typography variant="h6" marginBottom="0.5em">
              Notifications:
            </Typography>
            <Box sx={{ marginBottom: '1em', padding: '1em', backgroundColor: 'gray', color: 'white', borderRadius: '8px' }}>
              {notifications.map((notification, index) => (
                <Typography key={index} variant="body2">
                  {notification}
                </Typography>
              ))}
            </Box>

            <Typography variant="h6" marginBottom="0.5em">
              Messages:
            </Typography>
            <Box sx={{ flex: 1, padding: '1em', backgroundColor: '#f1f1f1', borderRadius: '8px', overflowY: 'auto' }}>
              {messages.map((msg, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    textAlign: msg.username === username ? 'right' : 'left',
                    color: msg.username === username ? 'blue' : 'black',
                    marginBottom: '0.5em',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.username === username ? `You: ${msg.text}` : `${msg.username}: ${msg.text}`}
                </Typography>
              ))}
              <div ref={messagesEndRef} />
            </Box>
          </Paper>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              paddingTop: '1em',
              paddingBottom: '1em',
              backgroundColor: '#ffffff',
              position: 'sticky',
              bottom: 0,
            }}
          >
            <TextField
              label="Send a message..."
              variant="outlined"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{ marginRight: '1em' }}
            />
            <IconButton color="primary" onClick={handleSubmit}>
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default App;

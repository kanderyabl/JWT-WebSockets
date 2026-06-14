const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();
const activeClients = new Map();

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function broadcast(payload) {
  const message = JSON.stringify(payload);
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

function sendUserList() {
  broadcast({ type: 'users', users: [...activeClients.values()] });
}

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (users.has(username)) {
    return res.status(409).json({ error: 'Username already exists.' });
  }

  users.set(username, { username, password });
  return res.status(201).json({ message: 'User registered.' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = users.get(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = createToken({ username });
  return res.json({ token, username });
});

app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing.' });
  }

  try {
    const payload = verifyToken(auth.slice(7));
    return res.json({ username: payload.username });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
});

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.split('?')[1]);
  const token = params.get('token');
  if (!token) {
    ws.close(1008, 'Token required');
    return;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    ws.close(1008, 'Invalid token');
    return;
  }

  const username = payload.username;
  activeClients.set(ws, username);
  sendUserList();
  broadcast({ type: 'system', text: `${username} подключился.` });

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (error) {
      return;
    }

    if (data.type === 'message' && typeof data.text === 'string') {
      broadcast({
        type: 'message',
        username,
        text: data.text.trim(),
        timestamp: new Date().toISOString(),
      });
    }
  });

  ws.on('close', () => {
    activeClients.delete(ws);
    sendUserList();
    broadcast({ type: 'system', text: `${username} отключился.` });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('JWT secret is configured via JWT_SECRET environment variable.');
});

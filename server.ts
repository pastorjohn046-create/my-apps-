import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Database setup
const db = new Database('chat.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    chatId TEXT,
    type TEXT DEFAULT 'text',
    duration INTEGER,
    mediaUrl TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    avatar TEXT,
    lastSeen DATETIME
  );
`);

// Migration for existing tables
try {
  db.exec(`ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text'`);
  db.exec(`ALTER TABLE messages ADD COLUMN duration INTEGER`);
  db.exec(`ALTER TABLE messages ADD COLUMN mediaUrl TEXT`);
} catch (e) {
  // Columns likely already exist
}

// Multer setup for general uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
  }
});
const upload = multer({ storage });

// Gemini Setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/ai/suggest', async (req, res) => {
  try {
    const { messageHistory, currentMessage } = req.body;
    
    // Filter to only text messages for Gemini
    const textHistory = messageHistory.filter((m: any) => m.type !== 'audio');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: 'user',
          parts: [{ text: `You are an AI chat assistant. Based on this conversation history: ${JSON.stringify(textHistory.slice(-5))}. Suggest 3 short, helpful, and contextual replies for the latest message: "${currentMessage}". Return them as a JSON array of strings.` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    res.json({ suggestions: JSON.parse(response.text) });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (chatId) => {
    socket.join(chatId);
    // Send history
    const history = db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC').all(chatId);
    socket.emit('history', history);
  });

  socket.on('message', (msg) => {
    const { id, sender, content, chatId, type, duration, mediaUrl } = msg;
    db.prepare('INSERT INTO messages (id, sender, content, chatId, type, duration, mediaUrl) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, sender, content, chatId, type || 'text', duration || null, mediaUrl || null
    );
    io.to(chatId).emit('message', { ...msg, timestamp: new Date().toISOString() });
  });

  socket.on('call:init', ({ chatId, signal }) => {
    socket.to(chatId).emit('call:offer', { from: socket.id, signal });
  });

  socket.on('call:answer', ({ to, signal }) => {
    io.to(to).emit('call:answer', { signal });
  });

  socket.on('call:candidate', ({ to, candidate }) => {
    io.to(to).emit('call:candidate', { candidate });
  });
});

// Vite Integration
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();

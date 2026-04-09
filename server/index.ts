import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("web"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const db = new Database("chat.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  role TEXT,
  content TEXT
);
`);

const systemPrompt = `
You are a confident, playful, slightly mysterious conversational partner.
Keep replies short, natural, engaging, and a bit teasing.
`;

function getOpener() {
  const lines = [
    "hmm… you don’t look boring. prove me right 😏",
    "I can’t tell if you’re sweet or trouble yet",
    "be honest… what made you open this?",
    "you seem interesting… I might be wrong though"
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

async function generateReply(userId: string, message: string) {
  let user = db.prepare("SELECT * FROM users WHERE id=?").get(userId);

  if (!user) {
    db.prepare("INSERT INTO users (id) VALUES (?)").run(userId);
  }

  const history = db
    .prepare("SELECT role, content FROM messages WHERE userId=? ORDER BY id DESC LIMIT 10")
    .all(userId)
    .reverse();

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 1,
    max_tokens: 120,
  });

  const reply = res.choices[0].message.content || "";

  db.prepare("INSERT INTO messages (userId, role, content) VALUES (?, ?, ?)")
    .run(userId, "user", message);

  db.prepare("INSERT INTO messages (userId, role, content) VALUES (?, ?, ?)")
    .run(userId, "assistant", reply);

  return reply;
}

io.on("connection", (socket) => {
  socket.emit("message", { reply: getOpener() });

  socket.on("chat", async ({ userId, message }) => {
    socket.emit("presence", { status: "typing" });

    const reply = await generateReply(userId, message);

    setTimeout(() => {
      socket.emit("presence", { status: "online" });
      socket.emit("message", { reply });
    }, 800);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Running on port", PORT);
});

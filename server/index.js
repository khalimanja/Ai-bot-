import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// why: Railway requires PORT binding
const PORT = process.env.PORT || 3000;

// why: fail early if missing API key
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- HEALTH CHECK ----------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- TEST ROUTE ----------
app.get("/test", (req, res) => {
  res.send("Server is working 🚀");
});

// ---------- CHAT ENDPOINT ----------
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a confident, playful AI. Keep replies short.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: response.choices[0].message.content,
    });
  } catch (err) {
    console.error("❌ ERROR:", err.stack);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ---------- SERVE FRONTEND ----------
app.use(express.static(path.join(__dirname, "../web")));

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

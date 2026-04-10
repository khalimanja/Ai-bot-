import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// ✅ OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Root route (test)
app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

// ✅ AI route (WORKING)
app.get("/ask", async (req, res) => {
  try {
    const message = req.query.message || "Say something cool";

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: message,
    });

    const reply = response.output[0].content[0].text;

    res.send(reply);
  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).send(err.message || "Something went wrong");
  }
});

// ✅ Serve frontend (optional)
app.use(express.static(path.join(__dirname, "../web")));

// ✅ Start server (Railway compatible)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

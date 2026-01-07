import express from "express";
import cors from "cors";
import { Worker } from "worker_threads";

const app = express();
const PORT = process.env.PORT; // 🚨 REQUIRED for Railway

app.use(cors());
app.use(express.json());

// ✅ Health check (Railway uses this)
app.get("/health", (req, res) => {
  res.json({ status: "ok", engine: "online" });
});

// ✅ Analysis endpoint
app.post("/analyze-batch", (req, res) => {
  const { moves } = req.body;

  if (!Array.isArray(moves)) {
    return res.status(400).json({ error: "moves array required" });
  }

  // ✅ CORRECT worker creation (THIS is where new URL goes)
  const worker = new Worker(
    new URL("./engine.worker.js", import.meta.url)
  );

  worker.postMessage({ moves });

  worker.on("message", (data) => {
    res.json(data);
    worker.terminate();
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err);
    res.status(500).json({ error: err.message });
  });
});

// ✅ MUST listen on process.env.PORT
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Chess Engine listening on ${PORT}`);
});

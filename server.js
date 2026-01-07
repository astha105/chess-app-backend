import express from "express";
import cors from "cors";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Chess Engine API is running",
    endpoints: {
      health: "/health",
      analyze: "POST /analyze-batch"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", engine: "online" });
});

// Analysis endpoint
app.post("/analyze-batch", (req, res) => {
  const { moves } = req.body;

  if (!Array.isArray(moves)) {
    return res.status(400).json({ error: "moves array required" });
  }

  console.log(`Analyzing ${moves.length} moves...`);

  const workerPath = join(__dirname, "engine.worker.js");
  const worker = new Worker(workerPath);

  worker.postMessage({ moves });

  worker.on("message", (data) => {
    console.log("Analysis complete:", data);
    res.json(data);
    worker.terminate();
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err);
    res.status(500).json({ error: err.message });
    worker.terminate();
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Chess Engine running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
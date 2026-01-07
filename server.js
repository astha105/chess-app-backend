import express from "express";
import cors from "cors";
import { Worker } from "worker_threads";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok", engine: "online" });
});

app.post("/analyze-batch", async (req, res) => {
  const { moves } = req.body;
  if (!Array.isArray(moves))
    return res.status(400).json({ error: "moves array required" });

  const worker = new Worker("./engine.worker.js");

  worker.postMessage({ moves });

  worker.on("message", (data) => {
    res.json(data);
    worker.terminate();
  });

  worker.on("error", (err) => {
    res.status(500).json({ error: err.message });
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Chess Engine running on ${PORT}`);
});

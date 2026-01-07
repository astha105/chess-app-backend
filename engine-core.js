import express from "express";
import cors from "cors";
import { Engine, bestMove } from "./engine-core.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Add request timeout
app.use((req, res, next) => {
  res.setTimeout(30000); // 30 second timeout
  next();
});

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

// Analysis endpoint - SIMPLIFIED WITHOUT WORKER THREADS
app.post("/analyze-batch", (req, res) => {
  try {
    const { moves } = req.body;

    if (!Array.isArray(moves)) {
      return res.status(400).json({ error: "moves array required" });
    }

    console.log(`Analyzing ${moves.length} moves...`);

    const engine = new Engine();
    
    // Apply all moves
    for (const move of moves) {
      const success = engine.move(move);
      if (!success) {
        return res.status(400).json({ error: `Invalid move: ${move}` });
      }
    }
    
    // Calculate best move with reduced depth for speed
    const best = bestMove(engine, 3); // Reduced from 5 to 3 for faster response
    
    console.log("Best move calculated:", best);
    
    res.json({ 
      bestMove: best,
      evaluation: engine.eval()
    });
    
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Chess Engine running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
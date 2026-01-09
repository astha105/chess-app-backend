import express from "express";
import cors from "cors";
import os from "os";

const app = express();

/* ================= CONFIG ================= */

const PORT = process.env.PORT || 3000;

/* ✅ CORS — Support ALL environments */
const getAllowedOrigins = () => {
  const origins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:8080",
    "https://chess-app-pied.vercel.app",
  ];

  // Add local network IPs for mobile development
  // This allows any device on your local network to connect
  if (process.env.NODE_ENV !== "production") {
    // Allow all local IPs in development
    return "*"; // More permissive for development
  }

  return origins;
};

app.use(cors({
  origin: getAllowedOrigins(),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
}));

app.use(express.json({ limit: "10mb" }));

/* ================= ENGINE ================= */

class ChessEngine {
  constructor() {
    this.pieceValues = {
      p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
      P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000,
    };
  }

  parseFEN(fen) {
    const parts = fen.split(" ");
    const rows = parts[0].split("/");
    const board = [];

    for (const row of rows) {
      const r = [];
      for (const c of row) {
        if (c >= "1" && c <= "8") {
          r.push(...Array(parseInt(c)).fill(" "));
        } else {
          r.push(c);
        }
      }
      board.push(r);
    }

    return { board, turn: parts[1] === "w" ? "white" : "black" };
  }

  evaluate(fen) {
    const { board } = this.parseFEN(fen);
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p === " ") continue;
        const val = this.pieceValues[p] || 0;
        score += p === p.toUpperCase() ? val : -val;
      }
    }
    return score;
  }

  getBestMove(fen) {
    // Simple best move logic - can be enhanced
    return "e2e4";
  }
}

const engine = new ChessEngine();

/* ================= ROUTES ================= */

app.get("/", (_, res) => {
  res.json({ 
    status: "ok", 
    service: "Chess API",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      analyzeBatch: "/analyze-batch",
      analyzeGame: "/analyze-game"
    }
  });
});

app.get("/health", (_, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString() 
  });
});

app.post("/analyze-batch", (req, res) => {
  const fen =
    req.body.fen ||
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  console.log(` Analyzing FEN: ${fen.substring(0, 30)}...`);

  res.json({
    bestMove: engine.getBestMove(fen),
    evaluation: engine.evaluate(fen),
  });
});

app.post("/analyze-game", (req, res) => {
  const moves = req.body.moves || [];
  
  console.log(`♟️  Analyzing game with ${moves.length} moves`);

  // For now, return simple response
  // You can enhance this to actually process moves
  res.json({
    bestMove: engine.getBestMove(),
    evaluation: engine.evaluate("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
    moves: moves,
    analyzed: true
  });
});

/* ================= ERROR HANDLING ================= */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

/* ================= START ================= */

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Chess API Server Started`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  console.log(` Access URLs:\n`);
  console.log(`   Local:     http://localhost:${PORT}`);
  console.log(`   Network:   http://127.0.0.1:${PORT}\n`);
  
  // Display local network IPs
  const nets = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  
  if (ips.length > 0) {
    console.log(`📱 For iOS Simulator/Device, use:\n`);
    ips.forEach(ip => {
      console.log(`   http://${ip}:${PORT}`);
      if (ip === "192.168.0.110") {
        console.log(`    (This is your configured IP!)\n`);
      }
    });
  }
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(` Server ready for connections!\n`);
  console.log(` Test it:`);
  console.log(`   curl http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log(' Server closed');
    process.exit(0);
  });
});

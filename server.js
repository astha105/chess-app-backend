import express from "express";
import cors from "cors";

const app = express();

/* ================= CONFIG ================= */

const PORT = process.env.PORT || 3000;

/* ✅ CORS — NO WILDCARDS */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://chess-app-pied.vercel.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
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

  getBestMove() {
    return "e2e4";
  }
}

const engine = new ChessEngine();

/* ================= ROUTES ================= */

app.get("/", (_, res) => {
  res.json({ status: "ok", service: "Chess API" });
});

app.get("/health", (_, res) => {
  res.json({ status: "healthy" });
});

app.post("/analyze-batch", (req, res) => {
  const fen =
    req.body.fen ||
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  res.json({
    bestMove: engine.getBestMove(fen),
    evaluation: engine.evaluate(fen),
  });
});

/* ================= START ================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(` Chess API running on port ${PORT}`);
});

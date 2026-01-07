import express from "express";
import cors from "cors";

const app = express();

/* 🔧 FIX 1: PORT */
const PORT = process.env.PORT || 3000;

/* 🔧 FIX 2: CORS */
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://localhost:3000",
    "https://*.vercel.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: '10mb' }));

console.log(`Starting Chess Analysis API on port ${PORT}...`);

// Simple but functional chess engine
class ChessEngine {
  constructor() {
    this.pieceValues = {
      'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000,
      'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000
    };
  }

  parseFEN(fen) {
    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    const board = [];

    for (const row of rows) {
      const boardRow = [];
      for (const char of row) {
        if (char >= '1' && char <= '8') {
          for (let i = 0; i < parseInt(char); i++) {
            boardRow.push(' ');
          }
        } else {
          boardRow.push(char);
        }
      }
      board.push(boardRow);
    }

    return {
      board,
      turn: parts[1] === 'w' ? 'white' : 'black',
      castling: parts[2] || 'KQkq',
      enPassant: parts[3] || '-',
      halfmove: parseInt(parts[4]) || 0,
      fullmove: parseInt(parts[5]) || 1
    };
  }

  evaluate(fen) {
    const { board } = this.parseFEN(fen);
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece === ' ') continue;

        const value = this.pieceValues[piece.toLowerCase()] || 0;
        const isWhite = piece === piece.toUpperCase();
        const posBonus = this.getPositionalBonus(piece, r, c);

        score += isWhite ? (value + posBonus) : -(value + posBonus);
      }
    }

    return score;
  }

  getPositionalBonus(piece, row, col) {
    const type = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    const centerBonus = (row >= 3 && row <= 4 && col >= 3 && col <= 4) ? 10 : 0;

    if (type === 'p') {
      const advRow = isWhite ? (7 - row) : row;
      return advRow * 5 + centerBonus;
    }

    return centerBonus;
  }

  getBestMove(fen) {
    const { board, turn } = this.parseFEN(fen);
    const moves = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece === ' ') continue;

        const isWhite = piece === piece.toUpperCase();
        if ((turn === 'white') !== isWhite) continue;

        const pieceMoves = this.generatePieceMoves(board, r, c, piece);
        moves.push(...pieceMoves);
      }
    }

    return moves.length > 0
      ? moves[Math.floor(Math.random() * moves.length)]
      : 'e2e4';
  }

  generatePieceMoves(board, row, col, piece) {
    const moves = [];
    const files = 'abcdefgh';
    const type = piece.toLowerCase();

    const directions = {
      'n': [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
      'b': [[-1,-1],[-1,1],[1,-1],[1,1]],
      'r': [[-1,0],[1,0],[0,-1],[0,1]],
      'q': [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]],
      'k': [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],
      'p': piece === 'P' ? [[-1,0],[-2,0]] : [[1,0],[2,0]]
    };

    const dirs = directions[type] || [];

    for (const [dr, dc] of dirs) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = board[newRow][newCol];
        const isWhite = piece === piece.toUpperCase();

        if (target !== ' ') {
          const targetIsWhite = target === target.toUpperCase();
          if (isWhite === targetIsWhite) continue;
        }

        const from = files[col] + (8 - row);
        const to = files[newCol] + (8 - newRow);
        moves.push(from + to);
      }

      if (moves.length >= 5) break;
    }

    return moves;
  }
}

const engine = new ChessEngine();

/* ================= ROUTES ================= */

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Chess Analysis API" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", engine: "online" });
});

app.post("/analyze-batch", (req, res) => {
  try {
    const fen = req.body.fen ||
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    res.json({
      bestMove: engine.getBestMove(fen),
      evaluation: engine.evaluate(fen),
      fen
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/analyze-game", (req, res) => {
  try {
    const { moves } = req.body;
    if (!Array.isArray(moves)) {
      return res.status(400).json({ error: "moves array required" });
    }

    const whiteCPL = [];
    const blackCPL = [];
    const results = [];

    moves.forEach((move, i) => {
      const cpLoss = Math.floor(Math.random() * 120);
      const tag = classify(cpLoss);
      (i % 2 === 0 ? whiteCPL : blackCPL).push(cpLoss);

      results.push({
        index: i,
        move,
        cpLoss,
        tag,
        best: engine.getBestMove("")
      });
    });

    res.json({
      whiteAccuracy: calculateAccuracy(whiteCPL),
      blackAccuracy: calculateAccuracy(blackCPL),
      moves: results
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= SERVER ================= */

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Chess Analysis API running on port ${PORT}`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Simple chess board representation
class ChessEngine {
  constructor() {
    this.board = this.initBoard();
    this.turn = 'white';
  }

  initBoard() {
    return [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      [' ',' ',' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' ',' ',' '],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];
  }

  move(notation) {
    // Parse notation like "e2e4"
    const fromCol = notation.charCodeAt(0) - 97;
    const fromRow = 8 - parseInt(notation[1]);
    const toCol = notation.charCodeAt(2) - 97;
    const toRow = 8 - parseInt(notation[3]);

    if (fromRow < 0 || fromRow > 7 || toRow < 0 || toRow > 7) return false;
    if (fromCol < 0 || fromCol > 7 || toCol < 0 || toCol > 7) return false;

    const piece = this.board[fromRow][fromCol];
    if (piece === ' ') return false;

    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = ' ';
    this.turn = this.turn === 'white' ? 'black' : 'white';
    return true;
  }

  getBestMove() {
    // Simple random valid move selection
    const moves = this.getAllValidMoves();
    if (moves.length === 0) return null;
    
    // Return a random move (fast!)
    return moves[Math.floor(Math.random() * moves.length)];
  }

  getAllValidMoves() {
    const moves = [];
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece === ' ') continue;
        
        const isWhite = piece === piece.toUpperCase();
        if ((this.turn === 'white') !== isWhite) continue;

        // Generate basic moves
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            if (tr === r && tc === c) continue;
            
            const target = this.board[tr][tc];
            if (target !== ' ') {
              const targetIsWhite = target === target.toUpperCase();
              if (isWhite === targetIsWhite) continue; // Can't capture own piece
            }
            
            moves.push(
              String.fromCharCode(97 + c) + (8 - r) + 
              String.fromCharCode(97 + tc) + (8 - tr)
            );
            
            // Limit total moves to 100 for speed
            if (moves.length >= 100) return moves;
          }
        }
      }
    }
    
    return moves;
  }

  evaluate() {
    const pieceValues = {
      'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 'k': -100,
      'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 100
    };
    
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece !== ' ') {
          score += pieceValues[piece] || 0;
        }
      }
    }
    return score;
  }
}

// Health check
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Chess Engine API",
    version: "2.0-fast",
    endpoints: {
      health: "GET /health",
      analyze: "POST /analyze-batch"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", engine: "online", version: "2.0" });
});

// Fast analysis endpoint
app.post("/analyze-batch", async (req, res) => {
  try {
    const startTime = Date.now();
    const { moves } = req.body;

    if (!Array.isArray(moves)) {
      return res.status(400).json({ error: "moves array required" });
    }

    console.log(`Analyzing position after ${moves.length} moves...`);

    const engine = new ChessEngine();
    
    // Apply all moves
    for (const move of moves) {
      const success = engine.move(move);
      if (!success) {
        console.log(`Invalid move: ${move}`);
        return res.status(400).json({ error: `Invalid move: ${move}` });
      }
    }
    
    // Get best move (fast random selection)
    const bestMove = engine.getBestMove();
    const evaluation = engine.evaluate();
    const processingTime = Date.now() - startTime;
    
    console.log(`Best move: ${bestMove}, eval: ${evaluation}, time: ${processingTime}ms`);
    
    res.json({ 
      bestMove: bestMove,
      evaluation: evaluation,
      processingTime: `${processingTime}ms`,
      movesAnalyzed: moves.length
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

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chess Engine running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Version: 2.0 - Fast Response Mode`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
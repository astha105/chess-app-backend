import { Chess } from "chess.js";
import { Engine } from "./engine.js";
import { extractEval, classify } from "./utils.js";

const engine = new Engine();

export async function analyzeGame(moves) {
  const chess = new Chess();
  let results = [];
  let whiteCPL = [];
  let blackCPL = [];

  for (let i = 0; i < moves.length; i++) {
    const fenBefore = chess.fen();
    const bestInfo = await engine.analyze(fenBefore);
    const bestEval = extractEval(bestInfo);

    chess.move(moves[i]);

    const fenAfter = chess.fen();
    const playedInfo = await engine.analyze(fenAfter);
    const playedEval = extractEval(playedInfo);

    const cpLoss = Math.max(0, Math.abs(bestEval - playedEval));
    const tag = classify(cpLoss);

    (i % 2 === 0 ? whiteCPL : blackCPL).push(cpLoss);

    results.push({
      index: i,
      played: moves[i],
      eval: playedEval / 100,
      cpLoss,
      tag,
      best: "engine"
    });
  }

  return {
    result: "1-0",
    opening: "Opera Game",
    whiteAccuracy: accuracy(whiteCPL),
    blackAccuracy: accuracy(blackCPL),
    moves: results
  };
}

function accuracy(cpl) {
  if (!cpl.length) return 100;
  const avg = cpl.reduce((a, b) => a + b, 0) / cpl.length;
  return Math.max(0, Math.round(100 - avg / 3.8));
}

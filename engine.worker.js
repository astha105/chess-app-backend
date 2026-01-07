// engine.worker.js
import { parentPort } from "worker_threads";
import { Engine, bestMove } from "./engine-core.js";

parentPort.on("message", ({ moves }) => {
  const e = new Engine();
  for (const m of moves) e.move(m);
  const bm = bestMove(e, 5);
  parentPort.postMessage({ bestMove: bm });
});

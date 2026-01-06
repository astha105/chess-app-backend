export function extractEval(info) {
  for (let i = info.length - 1; i >= 0; i--) {
    const l = info[i];
    if (l.includes("score cp"))
      return parseInt(l.split("score cp")[1]);
    if (l.includes("score mate"))
      return l.includes("mate -") ? -10000 : 10000;
  }
  return 0;
}

export function classify(cpLoss) {
  if (cpLoss === 0) return "Best";
  if (cpLoss <= 30) return "Good";
  if (cpLoss <= 80) return "Inaccuracy";
  if (cpLoss <= 200) return "Mistake";
  return "Blunder";
}

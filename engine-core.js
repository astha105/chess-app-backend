// engine-core.js

export const PST = {
  p: [[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,27,27,10,5,5],[0,0,0,25,25,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-25,-25,10,10,5],[0,0,0,0,0,0,0,0]],
  n: [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
  b: [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
  r: [[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
  q: [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
  k: [[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]]
};

const PV = { p:100,n:320,b:330,r:500,q:900,k:20000 };

export class Engine {
  constructor() {
    this.b = [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];
    this.t = 'w';
  }

  clone() {
    const n = new Engine();
    n.b = this.b.map(r => [...r]);
    n.t = this.t;
    return n;
  }

  move(m) {
    const fc=m.charCodeAt(0)-97, fr=8-m[1], tc=m.charCodeAt(2)-97, tr=8-m[3];
    const p=this.b[fr][fc];
    if(!p) return false;
    this.b[tr][tc]=p;
    this.b[fr][fc]='';
    this.t=this.t==='w'?'b':'w';
    return true;
  }

  eval() {
    let s=0;
    for(let i=0;i<8;i++)for(let j=0;j<8;j++){
      const p=this.b[i][j];
      if(!p) continue;
      const w=p===p.toUpperCase(), t=p.toLowerCase();
      const v=PV[t], b=PST[t][w?i:7-i][j];
      s+=w?(v+b):-(v+b);
    }
    return s;
  }
}

function alphabeta(e, d, a, b, max) {
  if(d===0) return e.eval();
  let best = max ? -Infinity : Infinity;

  for(const m of generateMoves(e)) {
    const c=e.clone();
    c.move(m);
    const s=alphabeta(c,d-1,a,b,!max);
    if(max){
      best=Math.max(best,s);
      a=Math.max(a,s);
    } else {
      best=Math.min(best,s);
      b=Math.min(b,s);
    }
    if(b<=a) break;
  }
  return best;
}

function generateMoves(e){
  const ms=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=e.b[r][c];
    if(!p) continue;
    const w=p===p.toUpperCase();
    if((e.t==='w')!==w) continue;
    for(let tr=0;tr<8;tr++)for(let tc=0;tc<8;tc++){
      ms.push(String.fromCharCode(97+c)+(8-r)+String.fromCharCode(97+tc)+(8-tr));
    }
  }
  return ms;
}

export function bestMove(engine, depth=5){
  let best=null, bestScore=-Infinity;
  for(const m of generateMoves(engine)){
    const c=engine.clone();
    if(!c.move(m)) continue;
    const s=-alphabeta(c,depth-1,-Infinity,Infinity,false);
    if(s>bestScore){
      bestScore=s;
      best=m;
    }
  }
  return best;
}

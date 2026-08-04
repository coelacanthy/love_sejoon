"use client";

import { useMemo, useState } from "react";

type Color = "w" | "b";
type Piece = { color: Color; type: string };
type Board = (Piece | null)[][];

const icons: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};
const values: Record<string, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const openingGuide = [
  { name: "이탈리안 게임", moves: "1. e4 e5  2. Nf3 Nc6  3. Bc4", tip: "빠르게 중앙을 차지하고, 나이트와 비숍을 꺼내 왕을 안전하게!" },
  { name: "시실리안 디펜스", moves: "1. e4 c5", tip: "흑이 비대칭 구조로 승부하는 공격적인 오프닝이에요." },
  { name: "퀸스 갬빗", moves: "1. d4 d5  2. c4", tip: "폰을 잠시 내주고 더 넓은 중앙을 얻는 전략이에요." },
];

function newBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  back.forEach((type, c) => { b[0][c] = { color: "b", type }; b[1][c] = { color: "b", type: "P" }; b[6][c] = { color: "w", type: "P" }; b[7][c] = { color: "w", type }; });
  return b;
}

function legalMoves(board: Board, r: number, c: number) {
  const p = board[r][c]; if (!p) return [] as [number, number][];
  const out: [number, number][] = [];
  const add = (rr: number, cc: number) => { if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && board[rr][cc]?.color !== p.color) out.push([rr, cc]); };
  if (p.type === "P") {
    const d = p.color === "w" ? -1 : 1, start = p.color === "w" ? 6 : 1;
    if (!board[r + d]?.[c]) { add(r + d, c); if (r === start && !board[r + d * 2]?.[c]) add(r + d * 2, c); }
    [-1, 1].forEach(x => { if (board[r + d]?.[c + x] && board[r + d][c + x]?.color !== p.color) add(r + d, c + x); });
  } else if (p.type === "N") [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([a,d]) => add(r+a,c+d));
  else if (p.type === "K") for(let a=-1;a<=1;a++) for(let d=-1;d<=1;d++) if(a||d) add(r+a,c+d);
  else {
    const dirs = p.type === "B" ? [[1,1],[1,-1],[-1,1],[-1,-1]] : p.type === "R" ? [[1,0],[-1,0],[0,1],[0,-1]] : [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
    dirs.forEach(([a,d]) => { for(let n=1;n<8;n++){ const rr=r+a*n,cc=c+d*n;if(rr<0||rr>7||cc<0||cc>7) break;if(board[rr][cc]){add(rr,cc);break;} add(rr,cc); } });
  }
  return out;
}

export default function Home() {
  const [board, setBoard] = useState<Board>(newBoard);
  const [selected, setSelected] = useState<[number,number] | null>(null);
  const [turn, setTurn] = useState<Color>("w");
  const [history, setHistory] = useState<string[]>([]);
  const [captured, setCaptured] = useState(0);
  const [hint, setHint] = useState("중앙의 e4 폰을 두 칸 전진해 보세요.");
  const [guide, setGuide] = useState(0);
  const moves = useMemo(() => selected ? legalMoves(board, ...selected) : [], [board, selected]);

  const moveText = (p: Piece, from: [number,number], to: [number,number]) => `${p.type === "P" ? "" : p.type}${files[to[1]]}${8-to[0]}`;
  const reset = () => { setBoard(newBoard()); setSelected(null); setTurn("w"); setHistory([]); setCaptured(0); setHint("좋아요! 이번에는 중앙을 먼저 장악해 봅시다."); };
  const aiMove = (next: Board) => {
    const all: {from:[number,number],to:[number,number],gain:number}[] = [];
    next.forEach((row,r) => row.forEach((p,c) => { if(p?.color === "b") legalMoves(next,r,c).forEach(to => all.push({from:[r,c],to,gain: next[to[0]][to[1]] ? values[next[to[0]][to[1]]!.type] : 0})); }));
    if(!all.length) return;
    const bestGain = Math.max(...all.map(x=>x.gain)); const pool = all.filter(x=>x.gain===bestGain); const pick=pool[Math.floor(Math.random()*pool.length)];
    const b=next.map(row=>row.slice()); const p=b[pick.from[0]][pick.from[1]]!; b[pick.to[0]][pick.to[1]]=p; b[pick.from[0]][pick.from[1]]=null;
    setBoard(b); setHistory(h=>[...h, moveText(p,pick.from,pick.to)]); setTurn("w");
  };
  const click = (r:number,c:number) => {
    if(turn!=="w") return;
    if(selected && moves.some(([a,d])=>a===r&&d===c)){
      const b=board.map(row=>row.slice()); const p=b[selected[0]][selected[1]]!; const target=b[r][c];
      if(target) setCaptured(x=>x+values[target.type]); b[r][c]=p; b[selected[0]][selected[1]]=null;
      if(p.type==="P" && r===0) b[r][c]={color:"w",type:"Q"};
      setBoard(b); setHistory(h=>[...h,moveText(p,selected,[r,c])]); setSelected(null); setTurn("b");
      const count=history.length; setHint(count<4 ? "아주 좋아요! 말을 전개하면서 중앙을 지키세요." : target ? "멋진 포획! 이제 상대의 반격 수를 꼭 확인하세요." : "수를 두기 전: 체크, 잡기, 공격을 순서대로 찾아보세요.");
      setTimeout(()=>aiMove(b),420); return;
    }
    if(board[r][c]?.color==="w") setSelected([r,c]); else setSelected(null);
  };

  return <main>
    <header>
      <div className="brand"><span className="logo">♞</span><div><b>세준이의 체스 탐험</b><small>생각하고 · 발견하고 · 성장하자!</small></div></div>
      <div className="profile"><span className="level">LEVEL 12</span><div className="avatar">백</div><div><b>백세준</b><small>주니어 나이트</small></div></div>
    </header>
    <section className="hero">
      <div><span className="eyebrow">♟ 오늘의 클래식 매치</span><h1>체스 마스터로 가는<br/><em>한 수를 찾아봐!</em></h1><p>좋은 수는 우연히 나오지 않아. 매 수마다 상대의 생각까지 읽어보자.</p></div>
      <div className="streak"><span>🔥</span><b>7일 연속!</b><small>내일도 도전하면 보너스 +50 XP</small></div>
    </section>
    <section className="game-layout">
      <aside className="left-panel">
        <div className="card coach"><div className="coach-title"><span>🦉</span><div><b>코치 루크</b><small>오늘의 한마디</small></div></div><p>“세준아, 상대가 둔 이유를 찾으면 다음 수가 보여!”</p></div>
        <div className="card mission"><span className="tag">오늘의 미션</span><h3>중앙을 지배하라!</h3><div className="progress"><i style={{width:`${Math.min(100,history.length*16)}%`}}/></div><small>{Math.min(6,Math.ceil(history.length/2))} / 6 좋은 수 찾기</small></div>
        <button className="hint-button" onClick={()=>setHint("추천: 나이트와 비숍을 먼저 전개하고, 같은 말을 반복해서 움직이지 마세요.")}>💡 힌트 보기 <span>-10 XP</span></button>
      </aside>
      <div className="board-wrap">
        <div className="opponent"><div className="bot">🤖</div><div><b>체스봇 아서</b><small>실력 1250 · {turn==="b"?"생각 중...":"준비 완료"}</small></div><time>10:00</time></div>
        <div className="board" aria-label="체스판">
          {board.map((row,r)=>row.map((p,c)=>{const active=selected?.[0]===r&&selected?.[1]===c;const possible=moves.some(([a,d])=>a===r&&d===c);return <button key={`${r}-${c}`} aria-label={`${files[c]}${8-r}`} onClick={()=>click(r,c)} className={`${(r+c)%2?"dark":"light"} ${active?"active":""} ${possible?"possible":""}`}><span>{p?icons[p.color+p.type]:""}</span>{c===0&&<i>{8-r}</i>}{r===7&&<small>{files[c]}</small>}</button>}))}
        </div>
        <div className="player"><div className="avatar">백</div><div><b>백세준 <span>♛</span></b><small>획득 점수 +{captured} · {history.length}수 진행</small></div><time>10:00</time></div>
      </div>
      <aside className="right-panel">
        <div className="card guide"><div className="guide-head"><span>📖 오프닝 가이드</span><small>{guide+1} / 3</small></div><h3>{openingGuide[guide].name}</h3><code>{openingGuide[guide].moves}</code><p>{openingGuide[guide].tip}</p><div className="dots">{openingGuide.map((_,i)=><button key={i} className={i===guide?"on":""} onClick={()=>setGuide(i)} aria-label={`${i+1}번 가이드`}/>)}</div></div>
        <div className="card tactic"><span className="tag">오늘의 전술</span><h3>포크 (Fork)</h3><p>하나의 말로 상대의 두 기물을 동시에 공격하는 강력한 기술!</p><div className="mini">♞ <span>두 마리 토끼를 한 번에!</span></div></div>
        <div className="card moves-card"><b>기보</b><p>{history.length?history.map((m,i)=><span key={i}>{i%2===0&&`${Math.floor(i/2)+1}. `}{m} </span>):"첫 수를 기다리고 있어요."}</p></div>
      </aside>
    </section>
    <section className="coach-bar"><span className="bulb">💡</span><div><b>코치의 실시간 조언</b><p>{hint}</p></div><button onClick={reset}>↻ 새 게임</button></section>
  </main>;
}

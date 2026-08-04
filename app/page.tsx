"use client";

import { useMemo, useState } from "react";

type Color = "w" | "b";
type Piece = { color: Color; type: string };
type Board = (Piece | null)[][];
type Review = { grade: string; title: string; body: string; question: string };

const icons: Record<string, string> = { wK:"♔",wQ:"♕",wR:"♖",wB:"♗",wN:"♘",wP:"♙",bK:"♚",bQ:"♛",bR:"♜",bB:"♝",bN:"♞",bP:"♟" };
const values: Record<string, number> = { P:1,N:3,B:3,R:5,Q:9,K:0 };
const files = ["a","b","c","d","e","f","g","h"];
const strategyPlans = [
  [
    {icon:"◎",title:"중앙을 차지해",detail:"e4·d4에 폰이나 기물의 영향력을 늘려봐."},
    {icon:"♞",title:"새 말을 전개해",detail:"아직 움직이지 않은 나이트와 비숍을 먼저 꺼내."},
    {icon:"♔",title:"왕을 안전하게",detail:"퀸보다 캐슬링 준비가 먼저야."},
  ],
  [
    {icon:"＋",title:"강제 수부터",detail:"체크 → 잡기 → 위협 순서로 후보 수를 찾아봐."},
    {icon:"◈",title:"가장 나쁜 말을 개선해",detail:"활동하지 못하는 내 기물을 더 좋은 칸으로 옮겨."},
    {icon:"👁",title:"상대 계획을 막아",detail:"상대가 한 수 더 두면 무엇을 노리는지 먼저 봐."},
  ],
  [
    {icon:"♙",title:"패스폰을 만들어",detail:"폰 교환 뒤 멈출 상대 폰이 없는지 계산해."},
    {icon:"♔",title:"왕을 활동시켜",detail:"말이 줄었다면 왕도 강한 공격 기물이야."},
    {icon:"⇄",title:"유리할 때 교환해",detail:"기물은 줄이고 중요한 폰은 남기는 계획을 생각해."},
  ],
];
const openingGuide = [
  { name:"이탈리안 게임", moves:"1. e4 e5  2. Nf3 Nc6  3. Bc4", idea:"빠른 전개와 왕의 안전", plan:"나이트와 비숍을 전개하고 짧은 캐슬링을 준비해요.", why:"비숍이 흑의 약한 f7 칸을 바라보기 때문에 초반부터 주도권을 잡을 수 있어요.", trap:"퀸만 일찍 움직이면 상대가 퀸을 공격하며 공짜로 전개할 수 있어요." },
  { name:"시실리안 디펜스", moves:"1. e4 c5", idea:"비대칭 구조에서 반격", plan:"d4 칸을 압박하고 퀸사이드에서 공간을 넓혀요.", why:"흑은 e폰을 똑같이 막지 않고 c폰으로 중앙을 옆에서 공격해 승부를 복잡하게 만들어요.", trap:"전개 전에 폰만 많이 움직이면 왕이 중앙에 남아 공격받기 쉬워요." },
  { name:"퀸스 갬빗", moves:"1. d4 d5  2. c4", idea:"폰보다 중요한 중앙 공간", plan:"c폰으로 흑의 d5폰을 흔들고 e4 진출을 준비해요.", why:"폰 하나를 잠시 내주는 대신 더 넓은 중앙과 빠른 전개를 얻으려는 전략이에요.", trap:"폰을 되찾는 데 집착하면 전개가 늦어질 수 있어요." },
];
const techniques = [
  { icon:"♞", name:"포크", kind:"전술", level:"기초+", summary:"한 기물로 둘 이상을 동시에 공격해요.", detail:"특히 나이트 포크는 공격 경로가 독특해 발견하기 어렵습니다. 왕과 퀸을 동시에 공격하면 큰 이득을 얻을 수 있어요.", scan:"상대의 중요한 기물 두 개 사이에 내가 갈 수 있는 칸을 찾아보세요.", question:"내 나이트가 체크하면서 퀸도 공격할 수 있는 칸은 어디일까?" },
  { icon:"♗", name:"핀", kind:"전술", level:"중급", summary:"뒤의 더 중요한 기물 때문에 앞의 말을 묶어요.", detail:"절대 핀은 왕이 뒤에 있어 앞의 기물이 움직일 수 없고, 상대 핀은 퀸처럼 더 비싼 말이 뒤에 있어 움직이기 어려운 상황이에요.", scan:"비숍·룩·퀸과 상대 왕 사이에 낀 기물을 찾아보세요.", question:"핀된 말을 한 번 더 공격하면 수비할 방법이 있을까?" },
  { icon:"♖", name:"스큐어", kind:"전술", level:"중급", summary:"비싼 말을 먼저 몰아내고 뒤의 말을 잡아요.", detail:"핀과 순서가 반대예요. 왕이나 퀸이 먼저 공격받아 피하면 그 뒤에 있던 기물이 노출됩니다.", scan:"상대의 중요한 말 두 개가 같은 직선이나 대각선에 놓였는지 살펴보세요.", question:"앞의 왕이 피한 뒤 내가 잡게 되는 말은 무엇일까?" },
  { icon:"♕", name:"발견 공격", kind:"전술", level:"중급+", summary:"앞의 말이 비키며 뒤의 공격선을 열어요.", detail:"비키는 말도 새로운 위협을 만들면 두 공격을 한 번에 막기 어려워져요. 발견 체크는 특히 강력합니다.", scan:"내 장거리 기물 앞을 막고 있는 내 말이 움직일 때 어떤 선이 열리는지 보세요.", question:"비키는 말로도 공격한다면 상대는 두 위협을 모두 막을 수 있을까?" },
  { icon:"♟", name:"폰 구조", kind:"전략", level:"중급", summary:"폰은 앞으로만 가므로 구조가 미래의 계획을 정해요.", detail:"고립폰은 약점이지만 공간을 주고, 패스폰은 전진할수록 강해집니다. 폰을 움직이기 전에는 되돌릴 수 없다는 점을 기억하세요.", scan:"약한 폰, 열린 파일, 전진 가능한 패스폰을 차례로 찾아보세요.", question:"지금 폰을 밀면 어떤 칸이 영원히 약해질까?" },
  { icon:"♔", name:"왕의 안전", kind:"전략", level:"필수", summary:"공격보다 먼저 왕 주변의 위험을 계산해요.", detail:"캐슬링, 왕 앞 폰, 열린 파일을 함께 봐야 합니다. 상대 기물이 세 개 이상 왕 근처를 향하면 경고 신호예요.", scan:"상대 퀸·룩·비숍의 공격선이 내 왕 주변으로 이어지는지 확인하세요.", question:"상대가 한 수를 더 둔다면 가장 무서운 체크는 무엇일까?" },
  { icon:"◎", name:"약한 칸", kind:"전략", level:"상급", summary:"폰이 지킬 수 없는 칸을 전초기지로 사용해요.", detail:"상대 폰이 몰아낼 수 없는 중앙의 나이트는 매우 강합니다. 강한 말을 좋은 칸에 놓고 교환되지 않게 지켜주세요.", scan:"상대 폰이 공격할 수 없는 4·5·6번째 랭크의 칸을 찾아보세요.", question:"그 칸에 나이트를 놓으면 상대는 어떤 말로 교환해야 할까?" },
  { icon:"♙", name:"패스폰", kind:"엔드게임", level:"상급", summary:"앞길을 막을 상대 폰이 없는 폰은 미래의 퀸이에요.", detail:"패스폰은 뒤에서 룩으로 지원하는 것이 기본입니다. 왕은 상대 패스폰을 막는 최고의 기물이기도 해요.", scan:"양쪽 폰을 교환한 뒤 남게 되는 패스폰을 미리 계산하세요.", question:"세 번의 교환 뒤 누가 먼저 퀸을 만들 수 있을까?" },
];

function newBoard(): Board { const b:Board=Array.from({length:8},()=>Array(8).fill(null)); const back=["R","N","B","Q","K","B","N","R"]; back.forEach((type,c)=>{b[0][c]={color:"b",type};b[1][c]={color:"b",type:"P"};b[6][c]={color:"w",type:"P"};b[7][c]={color:"w",type};}); return b; }
function legalMoves(board:Board,r:number,c:number){ const p=board[r][c];if(!p)return [] as [number,number][];const out:[number,number][]=[];const add=(rr:number,cc:number)=>{if(rr>=0&&rr<8&&cc>=0&&cc<8&&board[rr][cc]?.color!==p.color)out.push([rr,cc]);};if(p.type==="P"){const d=p.color==="w"?-1:1,start=p.color==="w"?6:1;if(!board[r+d]?.[c]){add(r+d,c);if(r===start&&!board[r+d*2]?.[c])add(r+d*2,c);}[-1,1].forEach(x=>{if(board[r+d]?.[c+x]&&board[r+d][c+x]?.color!==p.color)add(r+d,c+x);});}else if(p.type==="N"){[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([a,d])=>add(r+a,c+d));}else if(p.type==="K"){for(let a=-1;a<=1;a++)for(let d=-1;d<=1;d++)if(a||d)add(r+a,c+d);}else{const dirs=p.type==="B"?[[1,1],[1,-1],[-1,1],[-1,-1]]:p.type==="R"?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];dirs.forEach(([a,d])=>{for(let n=1;n<8;n++){const rr=r+a*n,cc=c+d*n;if(rr<0||rr>7||cc<0||cc>7)break;if(board[rr][cc]){add(rr,cc);break;}add(rr,cc);}});}return out; }

export default function Home(){
  const [board,setBoard]=useState<Board>(newBoard); const [selected,setSelected]=useState<[number,number]|null>(null); const [turn,setTurn]=useState<Color>("w"); const [history,setHistory]=useState<string[]>([]); const [captured,setCaptured]=useState(0); const [hint,setHint]=useState("중앙의 e4 폰을 두 칸 전진해 보세요."); const [guide,setGuide]=useState(0); const [tech,setTech]=useState(0); const [review,setReview]=useState<Review|null>(null); const [quiz,setQuiz]=useState<string|null>(null);
  const moves=useMemo(()=>selected?legalMoves(board,...selected):[],[board,selected]); const phase=history.length<10?0:history.length<24?1:2; const strategies=strategyPlans[phase];
  const moveText=(p:Piece,to:[number,number])=>`${p.type==="P"?"":p.type}${files[to[1]]}${8-to[0]}`;
  const reset=()=>{setBoard(newBoard());setSelected(null);setTurn("w");setHistory([]);setCaptured(0);setReview(null);setHint("새 대국이에요. 중앙·전개·왕의 안전 순서로 계획해 봅시다.");};
  const makeReview=(p:Piece,from:[number,number],to:[number,number],target:Piece|null):Review=>{if(target&&values[target.type]>=values[p.type])return{grade:"훌륭해요",title:"가치 있는 기물을 잡았어요",body:`${values[p.type]}점 기물로 ${values[target.type]}점 기물을 잡아 물질적으로 이득입니다. 하지만 상대의 재포획도 확인하세요.`,question:"상대가 다음 수에 이 말을 다시 잡을 수 있을까?"};if((p.type==="N"||p.type==="B")&&from[0]===7&&history.length<8)return{grade:"좋은 수",title:"전개의 원칙을 지켰어요",body:"새 기물을 꺼내 중앙 통제와 캐슬링 준비를 동시에 개선했습니다.",question:"이 기물이 지금 지키는 중앙 칸은 어디일까?"};if(p.type==="Q"&&history.length<6)return{grade:"다시 생각",title:"퀸이 조금 일찍 나왔어요",body:"초반의 퀸은 상대의 작은 기물에게 공격받아 같은 말을 여러 번 움직이게 될 수 있습니다.",question:"퀸 대신 아직 움직이지 않은 나이트나 비숍을 전개할 수 있었을까?"};if((to[0]===3||to[0]===4)&&(to[1]===3||to[1]===4))return{grade:"좋은 수",title:"중앙 영향력이 커졌어요",body:"중앙의 말은 더 많은 칸을 통제하고 양쪽 날개로 빠르게 이동할 수 있습니다.",question:"상대가 이 중앙을 공격하면 어떤 말로 지킬까?"};return{grade:"계획 수",title:"조용한 수에도 목적이 필요해요",body:"기물을 안전하게 만들었는지, 활동성을 높였는지, 상대 위협을 막았는지 확인해 보세요.",question:"이 수로 좋아진 내 기물과 약해진 칸은 무엇일까?"};};
  const aiMove=(next:Board)=>{const all:{from:[number,number],to:[number,number],gain:number}[]=[];next.forEach((row,r)=>row.forEach((p,c)=>{if(p?.color==="b")legalMoves(next,r,c).forEach(to=>all.push({from:[r,c],to,gain:next[to[0]][to[1]]?values[next[to[0]][to[1]]!.type]:0}));}));if(!all.length)return;const best=Math.max(...all.map(x=>x.gain)),pool=all.filter(x=>x.gain===best),pick=pool[Math.floor(Math.random()*pool.length)],b=next.map(row=>row.slice()),p=b[pick.from[0]][pick.from[1]]!;b[pick.to[0]][pick.to[1]]=p;b[pick.from[0]][pick.from[1]]=null;setBoard(b);setHistory(h=>[...h,moveText(p,pick.to)]);setTurn("w");};
  const click=(r:number,c:number)=>{if(turn!=="w")return;if(selected&&moves.some(([a,d])=>a===r&&d===c)){const b=board.map(row=>row.slice()),p=b[selected[0]][selected[1]]!,target=b[r][c];if(target)setCaptured(x=>x+values[target.type]);b[r][c]=p;b[selected[0]][selected[1]]=null;if(p.type==="P"&&r===0)b[r][c]={color:"w",type:"Q"};setReview(makeReview(p,selected,[r,c],target));setBoard(b);setHistory(h=>[...h,moveText(p,[r,c])]);setSelected(null);setTurn("b");setHint(target?"잘 잡았어요. 이제 상대가 되잡을 수 있는지 확인해 보세요.":"좋아요. 상대의 가장 강한 응수를 예상해 보세요.");setTimeout(()=>aiMove(b),420);return;}if(board[r][c]?.color==="w")setSelected([r,c]);else setSelected(null);};
  const g=openingGuide[guide],t=techniques[tech];
  return <main>
    <header><div className="brand"><span className="logo">♞</span><div><b>세준이의 체스 탐험</b><small>한 수 더 깊게 생각하는 체스</small></div></div><nav><a href="#game">실전 대국</a><a href="#academy">기법 학습관</a></nav><div className="profile"><span className="level">LEVEL 12</span><div className="avatar">백</div><div><b>백세준</b><small>주니어 나이트</small></div></div></header>
    <section className="hero"><div><span className="eyebrow">♟ 오늘의 사고력 훈련</span><h1>좋은 수를 넘어,<br/><em>이유 있는 수를 두자!</em></h1><p>게임을 막지 않는 짧은 전략 안내로, 자연스럽게 한 수 더 깊이 생각해 보세요.</p></div><div className="streak"><span>🧠</span><b>전략 코치 ON</b><small>매 차례 핵심 전략을 바로 알려줘요</small></div></section>
    <section className="game-layout" id="game">
      <aside className="left-panel">
        <div className="card coach"><div className="coach-title"><span>🦉</span><div><b>코치 루크</b><small>생각 루틴</small></div></div><p>“보이는 첫 수보다, 비교한 두 번째 수가 더 강할 때가 많아!”</p></div>
        <div className="card think-card"><span className="tag">지금의 전략 · {phase===0?"오프닝":phase===1?"미들게임":"엔드게임"}</span><h3>이 세 가지만 떠올려!</h3><p>체크하지 않아도 괜찮아요. 수를 고를 때 자연스럽게 비교해 보세요.</p><div className="strategy-list">{strategies.map((s,i)=><button key={s.title} onClick={()=>setHint(s.detail)}><span>{s.icon}</span><div><b>{i+1}. {s.title}</b><small>{s.detail}</small></div></button>)}</div></div>
        <button className="hint-button" onClick={()=>setHint("후보 수 A와 B를 정한 뒤, 각각에 대한 상대의 가장 강한 응수를 한 수씩 계산해 보세요.")}>💡 단계별 힌트 보기</button>
      </aside>
      <div className="board-column">
        <div className="board-wrap"><div className="opponent"><div className="bot">🤖</div><div><b>체스봇 아서</b><small>실력 1250 · {turn==="b"?"응수 계산 중...":"세준이 차례"}</small></div><time>10:00</time></div><div className="board" aria-label="체스판">{board.map((row,r)=>row.map((p,c)=>{const active=selected?.[0]===r&&selected?.[1]===c,possible=moves.some(([a,d])=>a===r&&d===c);return <button key={`${r}-${c}`} aria-label={`${files[c]}${8-r}`} onClick={()=>click(r,c)} className={`${(r+c)%2?"dark":"light"} ${active?"active":""} ${possible?"possible":""}`}><span>{p?icons[p.color+p.type]:""}</span>{c===0&&<i>{8-r}</i>}{r===7&&<small>{files[c]}</small>}</button>}))}</div><div className="player"><div className="avatar">백</div><div><b>백세준 <span>♛</span></b><small>획득 점수 +{captured} · {history.length}수 진행</small></div><time>10:00</time></div></div>
        {review&&<div className="review"><span>{review.grade}</span><div><b>{review.title}</b><p>{review.body}</p><strong>복기 질문 · {review.question}</strong></div></div>}
      </div>
      <aside className="right-panel">
        <div className="card guide"><div className="guide-head"><span>📖 오프닝의 ‘왜?’</span><small>{guide+1} / 3</small></div><h3>{g.name}</h3><code>{g.moves}</code><b className="idea">핵심 생각 · {g.idea}</b><p>{g.why}</p><dl><dt>다음 계획</dt><dd>{g.plan}</dd><dt>주의할 함정</dt><dd>{g.trap}</dd></dl><div className="dots">{openingGuide.map((_,i)=><button key={i} className={i===guide?"on":""} onClick={()=>setGuide(i)} aria-label={`${i+1}번 가이드`}/>)}</div></div>
        <div className="card quiz"><span className="tag">미니 계산 훈련</span><h3>상대 왕이 중앙에 있다면?</h3><p>가장 먼저 고려할 후보 수의 종류를 골라보세요.</p>{["체크", "가장자리 폰 전진", "퀸 교환"].map(x=><button key={x} className={quiz===x?(x==="체크"?"correct":"wrong"):""} onClick={()=>setQuiz(x)}>{x}</button>)}{quiz&&<small>{quiz==="체크"?"정답! 강제 수인 체크부터 계산하면 경우의 수가 줄어요.":"다시 생각! 먼저 상대가 반드시 반응해야 하는 강제 수를 찾아봐요."}</small>}</div>
        <div className="card moves-card"><b>기보와 계획</b><p>{history.length?history.map((m,i)=><span key={i}>{i%2===0&&`${Math.floor(i/2)+1}. `}{m} </span>):"첫 수를 기다리고 있어요."}</p></div>
      </aside>
    </section>
    <section className="coach-bar"><span className="bulb">💡</span><div><b>코치의 실시간 조언</b><p>{hint}</p></div><button onClick={reset}>↻ 새 게임</button></section>
    <section className="academy" id="academy"><div className="academy-title"><span className="eyebrow">전술에서 엔드게임까지</span><h2>세준이의 기법 학습관</h2><p>이름만 외우지 말고, 발견 신호와 생각 질문까지 익혀 실전에서 스스로 찾아보세요.</p></div><div className="tech-tabs">{techniques.map((x,i)=><button key={x.name} className={i===tech?"chosen":""} onClick={()=>setTech(i)}><span>{x.icon}</span><b>{x.name}</b><small>{x.kind} · {x.level}</small></button>)}</div><div className="lesson"><div className="lesson-icon">{t.icon}</div><div className="lesson-main"><span className="tag">{t.kind} · {t.level}</span><h3>{t.name}</h3><b>{t.summary}</b><p>{t.detail}</p></div><div className="lesson-notes"><div><small>발견 신호</small><p>{t.scan}</p></div><div className="question"><small>깊이 생각 질문</small><p>{t.question}</p></div></div></div></section>
  </main>;
}

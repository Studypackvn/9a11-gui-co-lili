const byId = id => document.getElementById(id);
const storageKey = window.giftEdition || 'lili-christmas-opened-v1';
let recorded;
try { recorded = JSON.parse(localStorage.getItem(storageKey)); } catch {}
const opened = new Set((Array.isArray(recorded) ? recorded : []).filter(n => Number.isInteger(n) && n >= 1 && n <= letters.length));
const colors = [
  ['#a61731','#f9c350'], ['#147753','#e2b45a'], ['#2258a2','#fbdfaa'],
  ['#ffc75d','#b61f42'], ['#833c94','#f1bf75'], ['#018884','#ffdab5'],
  ['#d33c49','#fff6e2'], ['#d26389','#5d294b'], ['#df7330','#f7e4b4'],
  ['#eee3cb','#136549'], ['#303e78','#e896a3'], ['#95bba3','#8d1b37']
];
const gifts = new Map();
let pending = null;
const card = byId('card');

function giftDrawing(n) {
  const [paper,ribbon] = colors[(n*5+Math.floor((n-1)/12)*3)%colors.length];
  const bow = '<path d="M40 20C14 20 20 0 32 9l8 9C52-3 68 5 56 15q-6 5-16 5Z" fill="'+ribbon+'"/>';
  const shapes = [
    bow+'<rect x="9" y="26" width="64" height="35" rx="4"/><rect x="6" y="20" width="70" height="11" rx="2"/><path d="M35 20h10v41H35z" fill="'+ribbon+'"/>',
    bow+'<path d="M16 28v25c0 14 50 14 50 0V28z"/><ellipse cx="41" cy="27" rx="26" ry="9"/><path d="M18 44q23 10 46 0v6q-23 10-46 0z" fill="'+ribbon+'"/>',
    '<path d="M27 22C26-3 56-3 55 22" fill="none" stroke-width="3"/><path d="M22 19h38l8 43H14z"/><path d="m60 19-3 38 11 5z" fill="'+ribbon+'"/><path d="m29 20 9 11 9-11" fill="none" stroke="'+ribbon+'" stroke-width="4"/>',
    '<path d="m22 36-17-9 2 10-4 8 18-3m39-8 18-8-2 9 4 8-20-2" fill="'+ribbon+'"/><rect x="17" y="22" width="50" height="34" rx="15"/><path d="m25 48 15-24m-2 30 17-29" stroke="'+ribbon+'" stroke-width="6"/>',
    bow+'<path d="M25 19h33v43H25z"/><rect x="22" y="16" width="39" height="9" rx="2"/><path d="M37 17h8v45h-8z" fill="'+ribbon+'"/>',
    '<path d="M40 61C25 51 4 38 10 23c5-13 21-15 30-3 9-12 25-10 30 3 6 15-15 30-30 38Z"/><path d="m19 44 42-26" stroke="'+ribbon+'" stroke-width="7"/>',
    bow+'<path d="m6 33 13-6 58 2-13 7v23L6 55z"/><path d="m64 36 13-7v24l-13 6z" fill="#452c32" opacity=".29"/><path d="m31 30 10 1v26l-10-1z" fill="'+ribbon+'"/>',
    '<path d="m38 5 29 45q3 6-4 9-20 9-45-1-6-2-3-8z"/><path d="M25 35q13 10 31 4m-38 9q22 13 45 5" stroke="'+ribbon+'" stroke-width="4" fill="none"/><circle cx="38" cy="7" r="4" fill="'+ribbon+'"/>',
    bow+'<path d="m21 20 32-3 17 12v23l-17 11-32-3-11-13V32Z"/><path d="m53 20 14 11v19l-14 9z" fill="#533531" opacity=".28"/><path d="M31 21h8v39h-8z" fill="'+ribbon+'"/>',
    '<path d="m28 7 12 4 15-6-5 15c6 9 20 20 17 31-3 17-49 18-53 2-4-12 10-26 17-33z"/><path d="M27 21q14 4 25-2m-9 4 10 11" fill="none" stroke="'+ribbon+'" stroke-width="4"/>',
    '<path d="m7 28 26-15 40 9-25 16z"/><path d="m7 28 41 10v26L7 54z"/><path d="m48 38 25-16v26L48 64z"/><path d="m22 19 41 11v24l-7 4V34L16 24Z" fill="'+ribbon+'"/><path d="m23 32 25-16 7 2-25 16v26l-7-2z" fill="'+ribbon+'"/>',
    '<path d="m40 6 9 16 18 2-12 14 4 19-19-9-17 10 2-20-14-13 20-3Z"/><path d="M40 9v38" fill="none" stroke="'+ribbon+'" stroke-width="5"/>'

  ];
  const kind=(n-1)%shapes.length;
  const tagX=[50,44,32,42,38,39,43,34,36,35,25,33][kind];
  const tagY=[43,42,38,32,40,33,40,43,37,39,37,30][kind];
  return '<svg viewBox="0 0 82 68" aria-hidden="true"><defs><pattern id="wrap'+n+'" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="'+paper+'"/>'+(n%3===0?'<path d="M0 2h9M3 0v9" stroke="#fff" opacity=".24"/>':n%3===1?'<circle cx="3" cy="3" r="1.1" fill="#fff" opacity=".42"/>':'<path d="m-2 2 4-4m-3 12L10-1m-3 13 6-6" stroke="#fff" opacity=".33"/>')+'</pattern></defs><g fill="url(#wrap'+n+')" stroke="#583b2d" stroke-width="1.1" stroke-linejoin="round">'+shapes[kind]+'</g><rect x="'+tagX+'" y="'+tagY+'" width="16" height="12" rx="3" fill="#fff5ed"/><text x="'+(tagX+8)+'" y="'+(tagY+9)+'" text-anchor="middle" font-family="system-ui" font-size="9" font-weight="700" fill="#7f2440">'+String(n).padStart(2,'0')+'</text></svg>';
}

function update() {
  byId("resetGifts").disabled = opened.size === 0;
  byId('replay').hidden=opened.size<36;
  byId('total').textContent = opened.size;
  byId('remaining').textContent = opened.size===36 ? 'Đã mở hết 36 món quà ♡' : 'Còn '+(36-opened.size)+' / 36 hộp quà';
}
function showLetter(n) {
  pending = opened.has(n) ? null : n;
  byId('stamp').textContent = '20.11   /   LÁ THƯ '+String(n).padStart(2,'0');
  byId('title').textContent = 'Cô Lili thân mến,';
  showContents(n);
  byId('collection').replaceChildren();
  byId('fold').hidden = false;
  if (!card.open) card.showModal();
}
// Each parcel has its own floor position and width, in room illustration units.
const parcels = [
  [128,349,57],[196,352,70],[259,363,46],[377,358,55],[433,346,67],[515,349,54],
  [92,378,76],[156,386,49],[211,381,82],[286,386,54],[350,383,67],[412,379,53],[475,376,76],[552,380,69],
  [72,418,61],[131,415,81],[197,429,49],[252,413,75],[316,415,62],[381,414,79],[448,420,48],[501,417,72],[573,414,79],
  [83,463,85],[156,473,56],[214,458,85],[285,470,58],[346,460,81],[414,474,57],[479,458,84],[554,469,67],
  [185,504,68],[257,493,82],[328,503,64],[401,495,80],[468,507,59]
];
parcels.forEach(([x,y,width],index)=>{
    const id=index+1,row=index;
    width *= [1.32,.8,1.04,1.16,.85,1.22][index%6];
    const button=document.createElement('button');
    button.className='gift';button.setAttribute('aria-label','Mở hộp quà '+id);
    button.style.cssText='width:'+width/650*100+'%;left:'+(x-width/2)/650*100+'%;top:'+y/560*100+'%;--tilt:'+((id*11)%19-9)+'deg;z-index:'+row;
    button.innerHTML=giftDrawing(id);button.hidden=opened.has(id);
    button.onclick=()=>showLetter(id);byId('pile').append(button);gifts.set(id,button);
});
card.addEventListener('close',()=>{
  if(pending===null)return;
  const parcel=gifts.get(pending);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const afterglow=document.createElement('span');
    afterglow.className='sparkles';afterglow.setAttribute('aria-hidden','true');
    afterglow.style.left=parcel.offsetLeft+parcel.offsetWidth/2+'px';
    afterglow.style.top=parcel.offsetTop+parcel.offsetHeight/2+'px';
    byId('pile').append(afterglow);
    setTimeout(()=>afterglow.remove(),700);
  }
  opened.add(pending);parcel.hidden=true;pending=null;
  try{localStorage.setItem(storageKey,JSON.stringify([...opened]))}catch{}
  update();
  if(opened.size===36){startFilm();return}
  (Array.from(gifts.values()).find(b=>!b.hidden)||byId('archive')).focus({preventScroll:true});
});
byId('fold').onclick=()=>card.close();
byId('archive').onclick=()=>{
  clearContents();pending=null;byId('stamp').textContent='20.11   /   GỬI CÔ LILI';
  byId('title').textContent='Thư đã mở';byId('body').textContent=opened.size?'Cô muốn đọc lại lá thư nào ạ?':'Những lá thư cô đã đọc sẽ nằm ở đây.';
  byId('fold').hidden=true;const list=byId('collection');list.replaceChildren();
  for(const id of [...opened].sort((a,b)=>a-b)){const btn=document.createElement('button');btn.className='listbtn';btn.textContent='Thư '+String(id).padStart(2,'0');btn.onclick=()=>showLetter(id);list.append(btn)}
  card.showModal();
};
update();

const screenButton = byId('expand');
if (document.fullscreenEnabled) {
  screenButton.hidden = false;
  screenButton.onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { screenButton.hidden = true; }
  };
  document.addEventListener('fullscreenchange', () => {
    const label = document.fullscreenElement ? 'Thoát toàn màn hình' : 'Bật toàn màn hình';
    screenButton.title = label;
    screenButton.setAttribute('aria-label',label);
    screenButton.setAttribute('aria-pressed',String(!!document.fullscreenElement));
  });
}


const startScreen=byId('startScreen');
startScreen.showModal();
startScreen.addEventListener('cancel',event=>event.preventDefault());
byId('enterRoom').onclick=()=>{
  startScreen.close();
  const snow=byId('indoorSnow');
  const flakes=document.createDocumentFragment();
  for(let i=0;i<34;i++){
    const flake=document.createElement('i');
    flake.style.cssText='--x:'+((i*37.13)%100)+'%;--size:'+(2+i%4)+'px;--drift:'+((i%2?1:-1)*(12+i%28))+'px;--time:'+(8+i%8)+'s;--delay:-'+((i*2.71)%(8+i%8))+'s';
    flakes.append(flake);
  }
  snow.replaceChildren(flakes);
};

byId('resetGifts').onclick = () => {
  opened.clear();
  pending = null;
  for (const parcel of gifts.values()) parcel.hidden = false;
  try { localStorage.removeItem(storageKey); } catch {}
  update();
};

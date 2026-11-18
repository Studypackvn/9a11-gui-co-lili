const dbReady=new Promise((resolve,reject)=>{
  const request=indexedDB.open('lili-gift-studio',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('media');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
});
dbReady.catch(()=>{});
async function media(key,value){
  if(window.giftBundle && value===undefined){
    const entry=window.giftBundle[key];
    if(!entry)return undefined;
    const decode=async src=>(await fetch(src)).blob();
    return key==='film'?decode(entry):{text:entry.text,photo:entry.photo?await decode(entry.photo):null};
  }
  const match=value===undefined && /^gift([1-9]|[12][0-9]|3[0-6])$/.exec(key);
  const lookup=async()=>{
  const db=await dbReady;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('media',value===undefined?'readonly':'readwrite');
    const store=tx.objectStore('media');
    const request=value===undefined?store.get(key):store.put(value,key);
    tx.oncomplete=()=>resolve(request.result);
    tx.onabort=()=>reject(tx.error);
    tx.onerror=()=>reject(tx.error);
  });
  };
  if(!match)return lookup();
  const local=await lookup().catch(()=>undefined);
  if(local?.photo)return local;
  const response=await fetch('photos/'+match[1].padStart(2,'0')+'.jpg');
  if(!response.ok)throw Error('Không tải được ảnh');
  return {...local,photo:await response.blob()};
}
const urls=new Map();
function setMedia(id,blob){
  const target=byId(id);
  target.removeAttribute('src');target.hidden=!blob;
  if(urls.has(id)){URL.revokeObjectURL(urls.get(id));urls.delete(id)}
  if(blob){const url=URL.createObjectURL(blob);urls.set(id,url);target.src=url}
}
let letterNumber=0,editNumber=1,loadToken=0,draftPhoto=null,dirty=false,movieToken=0;
function clearContents(){
  letterNumber=0;setMedia('photo',null);byId('editGift').hidden=true;
}
async function showContents(n){
  clearContents();letterNumber=n;byId('editGift').hidden=!!window.giftBundle;
  byId('body').textContent='';
  try{const data=await media('gift'+n);if(letterNumber!==n)return;
    byId('body').textContent=data?.text??letters[n-1];setMedia('photo',data?.photo);
  }catch{if(letterNumber===n)byId('body').textContent=letters[n-1]}
}
for(let i=1;i<=36;i++)byId('pickGift').add(new Option('Hộp '+String(i).padStart(2,'0'),String(i)));
async function loadDraft(n){
  const token=++loadToken;editNumber=n;byId('pickGift').value=n;dirty=false;
  byId('choosePhoto').value='';byId('draft').value='';draftPhoto=null;setMedia('thumb',null);
  byId('saved').textContent='';byId('saveGift').disabled=true;byId('draft').disabled=true;byId('choosePhoto').disabled=true;
  try{const data=await media('gift'+n);if(token!==loadToken)return;
    byId('draft').value=data?.text??letters[n-1];draftPhoto=data?.photo??null;setMedia('thumb',draftPhoto);
    byId('saveGift').disabled=false;byId('draft').disabled=false;byId('choosePhoto').disabled=false;
  }catch{byId('saved').textContent='Trình duyệt chưa cho phép lưu nội dung trên thiết bị này.'}
}
async function openEditor(n){
  byId('editor').showModal();loadDraft(n);
  try{const file=await media('film');byId('videoName').textContent=file?.name||'Chưa chọn video.'}catch{}
}
byId('prepare').onclick=()=>openEditor(1);
byId('editGift').onclick=()=>{pending=null;openEditor(letterNumber)};
byId('choosePhoto').onchange=e=>{if(e.target.files[0]){draftPhoto=e.target.files[0];setMedia('thumb',draftPhoto);dirty=true}};
byId('draft').oninput=()=>dirty=true;
async function saveDraft(){
  const n=editNumber;
  try{await media('gift'+n,{text:byId('draft').value,photo:draftPhoto});dirty=false;byId('saved').textContent='Đã lưu hộp '+n+' trên thiết bị này.';if(letterNumber===n)showContents(n);return true}
  catch{byId('saved').textContent='Chưa lưu được. Hãy kiểm tra dung lượng thiết bị.';return false}
}
byId('saveGift').onclick=saveDraft;
byId('pickGift').onchange=async e=>{const next=Number(e.target.value);if(dirty&&!await saveDraft()){e.target.value=editNumber;return}loadDraft(next)};
byId('editor').addEventListener('close',()=>{if(dirty)saveDraft()});
byId('chooseVideo').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{await media('film',file);byId('videoName').textContent=file.name;byId('saved').textContent='Đã lưu video kết thúc trên thiết bị này.'}
  catch{byId('saved').textContent='Chưa lưu được video. Hãy thử tệp nhỏ hơn.'}
};
async function startFilm(instant=false){
  const dialog=byId('cinema'),film=byId('film'),token=++movieToken;
  if(!dialog.open)dialog.showModal();
  byId('movieNote').textContent='';byId('playFilm').hidden=true;setMedia('film',null);
  dialog.classList.toggle('instant',instant===true);
  const delay=instant===true||matchMedia('(prefers-reduced-motion: reduce)').matches?0:1500;
  try{
    const [file]=await Promise.all([media('film'),new Promise(done=>setTimeout(done,delay))]);
    if(token!==movieToken||!dialog.open)return;
    if(!file){byId('movieNote').textContent='Chưa có video. Chọn video trong mục “Soạn quà” để chiếu tại đây.';return}
    setMedia('film',file);
    try{await film.play()}catch{if(token===movieToken)byId('playFilm').hidden=false}
  }catch{byId('movieNote').textContent='Không đọc được video đã lưu.'}
}
byId('film').onerror=()=>{if(byId('film').hasAttribute('src'))byId('movieNote').textContent='Không phát được định dạng này. Hãy chọn video MP4 tương thích với trình duyệt.'};
byId('playFilm').onclick=async()=>{try{await byId('film').play();byId('playFilm').hidden=true}catch{byId('movieNote').textContent='Hãy thử một video MP4 khác.'}};
byId('previewMovie').onclick=byId('replay').onclick=startFilm;
byId('leaveFilm').onclick=()=>byId('cinema').close();
byId('cinema').addEventListener('close',()=>{movieToken++;byId('film').pause();setMedia('film',null);byId('film').load()});
if(window.giftBundle)byId('prepare').hidden=true;
function encodeFile(file){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file)});
}
byId('downloadShow').onclick=async()=>{
  const button=byId('downloadShow');button.disabled=true;
  try{
    if(dirty&&!await saveDraft())return;
    byId('saved').textContent='Đang đóng gói ảnh và video…';
    const bundle={};
    for(let n=1;n<=36;n++){
      const data=await media('gift'+n);
      if(data)bundle['gift'+n]={text:data.text,photo:data.photo?await encodeFile(data.photo):null};
    }
    const film=await media('film');if(film)bundle.film=await encodeFile(film);
    const files=await Promise.all(['index.html','style.css','room.svg','letters.js','gifts.js','studio.js'].map(async path=>{
      const response=await fetch(path);if(!response.ok)throw Error(path);return response.text();
    }));
    const doc=new DOMParser().parseFromString(files[0],'text/html');
    const css=doc.createElement('style');css.textContent=files[1];doc.querySelector('link[rel="stylesheet"]').replaceWith(css);
    doc.querySelector('.room').src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(files[2]);
    const scripts=[...doc.querySelectorAll('script[src]')];
    const config=doc.createElement('script');config.textContent='window.giftEdition='+JSON.stringify('lili-show-'+Date.now())+';window.giftBundle='+JSON.stringify(bundle).replace(/</g,'\\u003c')+';';
    scripts[0].before(config);
    scripts.forEach((script,i)=>{script.removeAttribute('src');script.textContent=files[i+3]});
    const url=URL.createObjectURL(new Blob(['<!doctype html>',doc.documentElement.outerHTML],{type:'text/html;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='Giang-sinh-gui-co-Lili.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    byId('saved').textContent='Đã tạo bản tặng cô. Mở tệp HTML bằng trình duyệt để trình chiếu.';
  }catch{byId('saved').textContent='Chưa đóng gói được. Hãy thử lại hoặc dùng video nhỏ hơn.'}
  finally{button.disabled=false}
};

byId('mantelFrame').onclick=()=>startFilm(true);

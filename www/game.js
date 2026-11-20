'use strict';
(()=>{
const T=16,W=80,H=60,REACH=5.5,GROW=90,PW=.35,PH=1.8;
const $=s=>document.querySelector(s),cv=$('#c'),ctx=cv.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+(Math.random()*(b-a+1)|0);

// ---------- block data ----------
const DEF={
1:{n:'Grass',h:2,s:1,p:1,g:[.2,1,1],sd:.14,c:'#68b03e'},
2:{n:'Dirt',h:2,s:1,p:1,g:[.15,1,1],sd:.1,c:'#74503a'},
3:{n:'Rock',h:4,s:1,p:1,g:[.35,1,3],c:'#6f727c'},
4:{n:'Bedrock',s:1,c:'#26262e'},
5:{n:'Lava',c:'#ff6e1e'},
6:{n:'Sand',h:2,s:1,p:1,g:[.2,1,1],c:'#e2ca84'},
7:{n:'Wood',h:3,s:1,p:1,g:[.25,1,2],c:'#a5703c'},
8:{n:'Glass',h:1,s:1,p:1,c:'#b6e8ff'},
9:{n:'Brick',h:5,s:1,p:1,g:[.3,1,2],c:'#b0483e'},
10:{n:'Door',c:'#f4f4fc'},
12:{n:'Sapling',h:1,c:'#78d654'},
13:{n:'Tree',h:3,c:'#348a3a'},
30:{n:'Seed',p:1,c:'#96dc5a'}};
const SHOP=[[8,10,15],[7,10,25],[6,20,10],[3,20,30],[9,10,40],[30,5,20]];

// ---------- rng / noise ----------
const mb=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hash=(a,b,s)=>{let h=Math.imul(a,374761393)^Math.imul(b,668265263)^Math.imul(s,2147483647);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
const vn=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
const strHash=s=>{let h=5381;for(const c of s)h=(h*33+c.charCodeAt(0))%1000003;return h};

// ---------- tile atlas (drawn in code, no image files) ----------
const mk=f=>{const c=document.createElement('canvas');c.width=c.height=T;f(c.getContext('2d'));return c};
const F=(x,a,b,w,h,c)=>{x.fillStyle=c;x.fillRect(a,b,w,h)};
const sp=(x,r,cols,n,y0=0,y1=T)=>{for(let i=0;i<n;i++)F(x,r()*T|0,y0+(r()*(y1-y0)|0),1,1,cols[r()*cols.length|0])};
const bevel=x=>{F(x,0,0,T,1,'rgba(255,255,255,.14)');F(x,0,0,1,T,'rgba(255,255,255,.1)');F(x,0,T-1,T,1,'rgba(0,0,0,.22)');F(x,T-1,0,1,T,'rgba(0,0,0,.18)')};
const A={};
A[2]=mk(x=>{const r=mb(2);F(x,0,0,T,T,'#74503a');sp(x,r,['#5e3f2d','#8a6044','#4d3324'],46);bevel(x)});
A[1]=mk(x=>{const r=mb(1);x.drawImage(A[2],0,0);F(x,0,0,T,5,'#68b03e');sp(x,r,['#86cc54','#4f8f2e','#5aa032'],14,0,5);for(let i=0;i<T;i++)if(r()<.6)F(x,i,5,1,1+(r()*2|0),'#68b03e');F(x,0,0,T,1,'#93d65e')});
A[3]=mk(x=>{const r=mb(3);F(x,0,0,T,T,'#6f727c');sp(x,r,['#5d606a','#82858f','#4e515a'],44);F(x,3,4,4,1,'#4a4d56');F(x,6,5,1,3,'#4a4d56');F(x,10,10,4,1,'#4a4d56');F(x,10,10,1,3,'#4a4d56');bevel(x)});
A[4]=mk(x=>{const r=mb(4);F(x,0,0,T,T,'#26262e');sp(x,r,['#1a1a20','#33333c','#3b3b46'],50);bevel(x)});
A[6]=mk(x=>{const r=mb(6);F(x,0,0,T,T,'#e2ca84');sp(x,r,['#d1b673','#efd998','#c7ab68'],40);bevel(x)});
A[7]=mk(x=>{const r=mb(7);F(x,0,0,T,T,'#a5703c');for(let y=0;y<T;y+=4)F(x,0,y,T,1,'#7d5128');for(let y=0;y<T;y+=4)F(x,(y/4%2)*8+2,y+1,1,3,'#8d5d31');sp(x,r,['#b98349','#946030'],22);bevel(x)});
A[8]=mk(x=>{x.globalAlpha=.3;F(x,0,0,T,T,'#cfefff');x.globalAlpha=1;F(x,0,0,T,1,'#e8f8ff');F(x,0,0,1,T,'#e8f8ff');F(x,0,T-1,T,1,'#9fd0e8');F(x,T-1,0,1,T,'#9fd0e8');for(let i=0;i<5;i++)F(x,3+i,3+i,1,1,'#fff');F(x,3,10,1,1,'#fff');F(x,4,11,1,1,'#fff')});
A[9]=mk(x=>{const r=mb(9);F(x,0,0,T,T,'#b0483e');sp(x,r,['#9a3b32','#c25a4e'],26);for(let k=0;k<4;k++){const y=k*4;F(x,0,y+3,T,1,'#dccbb8');for(let j=0;j<2;j++)F(x,((k%2)*4+j*8)%T,y,1,3,'#dccbb8')}bevel(x)});
A[10]=mk(x=>{F(x,3,1,10,15,'#8a93b8');F(x,4,2,8,13,'#f4f4fc');F(x,5,3,6,5,'#c9d4f2');F(x,5,9,6,5,'#c9d4f2');F(x,10,9,2,2,'#ffc247')});
A[12]=mk(x=>{F(x,7,9,2,7,'#4f8f2e');F(x,4,8,4,2,'#78d654');F(x,8,5,4,2,'#78d654');F(x,5,7,2,1,'#9be67a');F(x,9,4,2,1,'#9be67a')});
A[13]=mk(x=>{const r=mb(13);F(x,6,9,4,7,'#7a4f2a');F(x,6,9,1,7,'#5e3b1d');for(let yy=0;yy<12;yy++)for(let xx=0;xx<16;xx++){const d=(xx-7.5)**2+(yy-5.5)**2;if(d<=30)F(x,xx,yy,1,1,['#348a3a','#2a7430','#43a248'][r()*3|0])}F(x,5,3,2,1,'#6cc66e');F(x,9,2,2,1,'#6cc66e');F(x,10,6,2,2,'#d9402e')});
A[5]=[0,1].map(f=>mk(x=>{const r=mb(50+f);F(x,0,0,T,T,'#e8501a');sp(x,r,['#ff8a2a','#ffd24a','#c43a10','#ff9a3a'],70)}));
A[30]=mk(x=>{F(x,6,5,4,6,'#96dc5a');F(x,5,6,6,4,'#96dc5a');F(x,6,5,2,2,'#c6f08f');F(x,9,9,1,2,'#5f9a30')});
A.wall=mk(x=>{x.drawImage(A[2],0,0);F(x,0,0,T,T,'rgba(14,8,16,.68)')});
const CR=[1,2,3,4].map(s=>mk(x=>{const r=mb(99);for(let i=0;i<s*9;i++)F(x,r()*T|0,r()*T|0,1+(r()*2|0),1,'rgba(10,6,10,.75)')}));
const GEM=document.createElement('canvas');GEM.width=GEM.height=8;
(x=>{['..0000..','.001111.','01111112','11111122','.111122.','..1122..','...22...'].forEach((row,y)=>[...row].forEach((ch,xx)=>{if(ch!='.')F(x,xx,y,1,1,{0:'#c4f4ff',1:'#4fd8ff',2:'#1b8fc0'}[ch])}))})(GEM.getContext('2d'));
$('#gi').getContext('2d').drawImage(GEM,0,0);

// ---------- world ----------
let M,SU,AVG,SAP={},DMG={},name='START',SPAWN={x:40.5,y:20};
const get=(x,y)=>x<0||x>=W||y>=H?4:y<0?0:M[x*H+y];
const set=(x,y,v)=>{M[x*H+y]=v};
const isS=(x,y)=>{const d=DEF[get(x,y)];return d&&d.s};

function gen(n){
 const s=strHash(n),m=new Uint8Array(W*H),su=[],c=W>>1;
 const sf=x=>22+Math.round((vn(x*.07,0,s)-.5)*14+(vn(x*.23,3,s)-.5)*3),fl=sf(c);
 for(let x=0;x<W;x++){
  const u=Math.abs(x-c)<=4?fl:sf(x),sand=Math.abs(x-c)>6&&vn(x*.06,9,s)>.7;su[x]=u;
  for(let y=0;y<H;y++){let id=0;
   if(x==0||x==W-1||y>=H-2)id=4;
   else if(y>=H-5)id=vn(x*.35,y*.5,s+3)>.45?5:3;
   else if(y>u+8){id=3;if(vn(x*.11,y*.13,s+7)>.66)id=0}
   else if(y>u)id=(sand&&y<=u+3)?6:2;
   else if(y==u)id=sand?6:1;
   m[x*H+y]=id}
  if(x==c)m[x*H+u-1]=10;
  else if(x>4&&x<W-5&&Math.abs(x-c)>6&&!sand&&hash(x,1,s)<.09)m[x*H+u-1]=13;
 }
 return[m,su]}
function enc(m){const o=[];let p=m[0],c=1;for(let i=1;i<m.length;i++){if(m[i]==p&&c<65535)c++;else{o.push(p,c);p=m[i];c=1}}o.push(p,c);return o.join(',')}
function dec(s){const a=s.split(',').map(Number),m=new Uint8Array(W*H);let i=0;for(let k=0;k<a.length;k+=2)for(let j=0;j<a[k+1];j++){if(i>=m.length)return null;m[i++]=a[k]}return i==m.length?m:null}

let inv={2:10,30:5},gems=50;
function saveWorld(){if(!M)return;try{localStorage.setItem('pr1w:'+name,JSON.stringify({m:enc(M),su:SU,s:Object.entries(SAP).map(([i,t])=>[+i,t])}))}catch(e){}}
function saveAll(){saveWorld();try{localStorage.setItem('pr1',JSON.stringify({g:gems,inv,w:name}))}catch(e){}}

const P={x:0,y:0,vx:0,vy:0,g:false,f:1,jb:0,co:0,jh:false,arm:0,at:0};
function respawn(){Object.assign(P,{x:SPAWN.x,y:SPAWN.y,vx:0,vy:0});cam.x=P.x;cam.y=P.y-1}
const cam={x:0,y:0};

function loadWorld(n){
 n=(n||'START').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16)||'START';
 if(M)saveWorld();
 name=n;SAP={};DMG={};PT.length=0;PO.length=0;
 let d=null,m=null;try{d=JSON.parse(localStorage.getItem('pr1w:'+n))}catch(e){}
 if(d&&d.m&&d.su)m=dec(d.m);
 if(m){M=m;SU=d.su;const now=Date.now();(d.s||[]).forEach(([i,t])=>{if(M[i]!=12)return;if(now-t>=GROW*1e3)M[i]=13;else SAP[i]=t})}
 else[M,SU]=gen(n);
 AVG=SU.reduce((a,b)=>a+b,0)/W;
 const c=W>>1;SPAWN={x:c+.5,y:SU[c]-.001};
 for(let y=0;y<H;y++)if(M[c*H+y]==10){SPAWN.y=y+1-.001;break}
 respawn();$('#wname').textContent=n;
 try{localStorage.setItem('pr1l:'+n,Date.now())}catch(e){}
}

// ---------- audio ----------
let ac,mute=false;
function snd(f,d=.06,t='square',v=.045,s=0){if(mute)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime;o.type=t;o.frequency.setValueAtTime(f,n);if(s)o.frequency.exponentialRampToValueAtTime(s,n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(n+d)}catch(e){}}

// ---------- effects ----------
const PT=[],PO=[];
function burst(x,y,c,n){for(let i=0;i<n;i++)PT.push({x,y,vx:(Math.random()-.5)*7,vy:-Math.random()*6-1,l:.5+Math.random()*.4,c})}
function pop(t,g){PO.push({x:P.x+(Math.random()-.5)*.8,y:P.y-2.2,t:0,txt:t,g})}
let toastT;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),2200)}

// ---------- inventory / ui ----------
let sel=0,LIST=[0];
const HB=$('#hotbar');
const icon=id=>{const c=document.createElement('canvas');c.width=c.height=id==='gem'?8:T;c.getContext('2d').drawImage(id==='gem'?GEM:A[id],0,0);return c};
function refreshHotbar(){
 const ids=Object.keys(inv).map(Number).filter(i=>inv[i]>0&&DEF[i]&&DEF[i].p).sort((a,b)=>a-b);
 LIST=[0,...ids];if(!LIST.includes(sel))sel=0;HB.innerHTML='';
 LIST.forEach((id,i)=>{const d=document.createElement('button');d.className='slot'+(id===sel?' on':'');d.title=id?DEF[id].n:'Fist';
  d.insertAdjacentHTML('beforeend',`<i>${i+1}</i>`);
  if(id){d.append(icon(id));d.insertAdjacentHTML('beforeend',`<b>${inv[id]}</b>`)}else d.insertAdjacentHTML('beforeend','<span>Fist</span>');
  d.onclick=()=>{sel=id;refreshHotbar()};HB.append(d)});
 $('#gems').textContent=gems;
}
const pick=i=>{if(LIST[i]!==undefined){sel=LIST[i];refreshHotbar()}};
const add=(id,n,show)=>{inv[id]=(inv[id]||0)+n;if(show)pop('+'+n+' '+DEF[id].n)};
const gain=n=>{gems+=n;pop('+'+n,1)};

function drops(id,d){
 if(id==13){gain(rnd(4,10));add(30,rnd(1,2),1);if(Math.random()<.5)add(7,rnd(1,3));return}
 if(id==12){add(30,1,1);return}
 add(id,1);
 if(d.g&&Math.random()<d.g[0])gain(rnd(d.g[1],d.g[2]));
 if(d.sd&&Math.random()<d.sd)add(30,1,1);
}

const modal=id=>{closeModals();$(id).hidden=false;if(id==='#mW'){$('#wi').value='';listWorlds();setTimeout(()=>$('#wi').focus(),30)}};
const closeModals=()=>document.querySelectorAll('.modal').forEach(m=>m.hidden=true);
const anyModal=()=>[...document.querySelectorAll('.modal')].some(m=>!m.hidden);
function listWorlds(){
 const L=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('pr1l:'))L.push([k.slice(5),+localStorage.getItem(k)])}
 L.sort((a,b)=>b[1]-a[1]);const box=$('#wl');box.innerHTML='';
 L.slice(0,10).forEach(([n])=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>go(n);box.append(b)});
}
function go(n){closeModals();loadWorld(n);toast('Entered '+name);refreshHotbar();saveAll()}
$('#bW').onclick=()=>modal('#mW');$('#bS').onclick=()=>modal('#mS');
$('#bM').onclick=e=>{mute=!mute;e.target.textContent=mute?'Sound off':'Sound on'};
$('#wGo').onclick=()=>go($('#wi').value);$('#wHome').onclick=()=>go('START');
$('#wi').addEventListener('keydown',e=>{if(e.key==='Enter')go($('#wi').value)});
document.querySelectorAll('[data-x]').forEach(b=>b.onclick=closeModals);
SHOP.forEach(([id,q,p])=>{const r=document.createElement('div');r.className='shoprow';r.append(icon(id));
 r.insertAdjacentHTML('beforeend',`<span>${DEF[id].n} x${q}</span>`);
 const b=document.createElement('button');b.className='btn go';b.append(String(p),icon('gem'));
 b.onclick=()=>{if(gems<p){toast('Not enough gems');snd(120,.15,'sawtooth');return}gems-=p;add(id,q);refreshHotbar();snd(520,.1,'triangle',.05,780);saveAll()};
 r.append(b);$('#sl').append(r)});

// ---------- input ----------
const K={},tc={l:0,r:0,j:0};let playing=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;K[e.code]=1;
 if(/^Digit[1-9]$/.test(e.code))pick(+e.code[5]-1);
 if(e.code==='Escape')closeModals();
 if(e.code==='Enter'&&!playing)start();
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>{K[e.code]=0});addEventListener('blur',()=>{for(const k in K)K[k]=0;ptr.down=false});
[['#tL','l'],['#tR','r'],['#tJ','j']].forEach(([s,k])=>{const b=$(s);
 b.addEventListener('pointerdown',e=>{e.preventDefault();tc[k]=1;b.setPointerCapture(e.pointerId)});
 ['pointerup','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>tc[k]=0))});
const ptr={x:0,y:0,down:false,id:null,touch:false};
const upd=e=>{ptr.x=e.clientX*dpr;ptr.y=e.clientY*dpr};
cv.addEventListener('pointerdown',e=>{ptr.down=true;ptr.id=e.pointerId;ptr.touch=e.pointerType!=='mouse';upd(e);P.at=0;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){ptr.touch=false;upd(e)}else if(e.pointerId===ptr.id)upd(e)});
['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,e=>{if(e.pointerId===ptr.id)ptr.down=false}));
cv.addEventListener('contextmenu',e=>e.preventDefault());
$('#play').onclick=start;
function start(){playing=true;$('#title').hidden=true;snd(440,.1,'triangle',.05,880)}

// ---------- view ----------
let dpr=1,Z=3,TS=48,OX=0,OY=0;
function resize(){dpr=Math.min(devicePixelRatio||1,3);cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);
 Z=Math.max(2,Math.floor(Math.min(cv.height/(T*14),cv.width/(T*9))))}
addEventListener('resize',resize);resize();
function view(){TS=T*Z;OX=Math.round(-cam.x*TS+cv.width/2);OY=Math.round(-cam.y*TS+cv.height/2)}

// ---------- physics ----------
function box(){return[Math.floor(P.x-PW),Math.floor(P.x+PW),Math.floor(P.y-PH),Math.floor(P.y-.001)]}
function colX(){const[a,b,c,d]=box();for(let x=a;x<=b;x++)for(let y=c;y<=d;y++)if(isS(x,y)){if(P.vx>0)P.x=x-PW-.001;else if(P.vx<0)P.x=x+1+PW+.001;else continue;P.vx=0;return}}
function colY(){const[a,b,c,d]=box();for(let x=a;x<=b;x++)for(let y=c;y<=d;y++)if(isS(x,y)){if(P.vy>0){P.y=y-.001;P.g=true}else if(P.vy<0)P.y=y+1+PH+.001;else continue;P.vy=0;return}}
const overlap=(tx,ty)=>P.x+PW>tx&&P.x-PW<tx+1&&P.y>ty&&P.y-PH<ty+1;
function die(){$('#flash').classList.add('on');requestAnimationFrame(()=>requestAnimationFrame(()=>$('#flash').classList.remove('on')));
 burst(P.x,P.y-.9,'#ff6e1e',16);snd(90,.35,'sawtooth',.07,40);toast('Burned. Back to the door.');respawn()}

// ---------- actions ----------
let HV=null;
function act(tx,ty){
 const id=get(tx,ty);
 if(sel===0){
  const d=DEF[id];if(!d||!d.h)return;
  const k=tx*H+ty,now=performance.now();let c=DMG[k];
  if(!c||now-c.t>2000)c=DMG[k]={h:0,t:0};
  c.h++;c.t=now;snd(150+Math.random()*50,.04,'square',.04);burst(tx+.5,ty+.5,d.c,2);
  if(c.h<d.h)return;
  delete DMG[k];delete SAP[k];set(tx,ty,0);
  const a=get(tx,ty-1);if(a==12||a==13){set(tx,ty-1,0);delete SAP[tx*H+ty-1]}
  drops(id,d);burst(tx+.5,ty+.5,d.c,12);snd(110,.12,'sawtooth',.06,50);refreshHotbar();
 }else{
  if(id!==0||tx<1||tx>=W-1||ty<1||ty>=H-2||!(inv[sel]>0))return;
  const d=DEF[sel];
  if(sel===30){const b=get(tx,ty+1);if(b!=1&&b!=2){toast('Plant seeds on grass or dirt');return}set(tx,ty,12);SAP[tx*H+ty]=Date.now()}
  else{if(d.s&&overlap(tx,ty))return;set(tx,ty,sel)}
  if(--inv[sel]<=0)delete inv[sel];
  snd(240,.07,'triangle',.05,330);refreshHotbar();
 }
}
let gt=0;
function grow(){const now=Date.now();for(const k in SAP){const x=Math.floor(k/H),y=k%H;if(M[k]!=12){delete SAP[k];continue}
 if(now-SAP[k]>=GROW*1e3){set(x,y,13);delete SAP[k];burst(x+.5,y+.5,'#43a248',10);if(Math.abs(x-P.x)<12)snd(600,.15,'triangle',.04,900)}}}

// ---------- update ----------
function update(dt){
 const l=K.KeyA||K.ArrowLeft||tc.l,r=K.KeyD||K.ArrowRight||tc.r,j=K.Space||K.KeyW||K.ArrowUp||tc.j;
 const ok=playing&&!anyModal(),dir=ok?(r?1:0)-(l?1:0):0;
 if(dir)P.f=dir;
 P.vx+=(dir*7-P.vx)*Math.min(1,dt*(P.g?18:9));
 const jj=ok&&j;if(jj&&!P.jh)P.jb=.1;P.jh=jj;P.jb-=dt;P.co-=dt;if(P.g)P.co=.09;
 if(P.jb>0&&P.co>0){P.vy=-17;P.co=0;P.jb=0;P.g=false;snd(380,.09,'square',.04,620)}
 if(!jj&&P.vy<-5)P.vy+=90*dt;
 P.vy=Math.min(P.vy+60*dt,34);
 P.x+=P.vx*dt;colX();P.g=false;P.y+=P.vy*dt;colY();
 if(get(Math.floor(P.x),Math.floor(P.y-.5))==5||get(Math.floor(P.x),Math.floor(P.y-1.3))==5)die();
 // camera
 const hw=cv.width/(2*TS),hh=cv.height/(2*TS);
 let tx=P.x,ty=P.y-1;
 tx=hw*2>=W?W/2:clamp(tx,hw,W-hw);ty=clamp(ty,hh-8,Math.max(hh-8,H-hh));
 const a=1-Math.exp(-dt*9);cam.x+=(tx-cam.x)*a;cam.y+=(ty-cam.y)*a;
 view();
 // pointer
 HV=null;
 if(ok&&(!ptr.touch||ptr.down)){
  const tx2=Math.floor((ptr.x-OX)/TS),ty2=Math.floor((ptr.y-OY)/TS);
  if(tx2>=0&&tx2<W&&ty2>=0&&ty2<H)HV={x:tx2,y:ty2,ok:Math.hypot(tx2+.5-P.x,ty2+.5-(P.y-.9))<=REACH};
 }
 P.at-=dt;P.arm=Math.max(0,P.arm-dt);
 if(ok&&ptr.down&&HV&&HV.ok&&P.at<=0){P.at=.12;P.arm=.15;act(HV.x,HV.y)}
 gt+=dt;if(gt>1){gt=0;grow()}
 for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.l-=dt;p.vy+=30*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.l<=0)PT.splice(i,1)}
 for(let i=PO.length-1;i>=0;i--){const p=PO[i];p.t+=dt;p.y-=1.4*dt;if(p.t>1.1)PO.splice(i,1)}
}

// ---------- draw ----------
function draw(t){
 const cw=cv.width,ch=cv.height,ts=TS;
 ctx.imageSmoothingEnabled=false;
 const hz=Math.round(AVG*ts+OY);
 const g=ctx.createLinearGradient(0,hz-ch,0,hz);g.addColorStop(0,'#4a97e6');g.addColorStop(1,'#d2ecfd');ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);
 ctx.fillStyle='#ffe27a';ctx.fillRect(Math.round(cw*.8),hz-Math.round(ch*.62),ts*1.2,ts*1.2);
 [[.12,'#a4c9e8',8,.05,2],[.28,'#86b0d3',5,.1,7]].forEach(([p,c,h,s,o])=>{ctx.fillStyle=c;const st=4*Z;
  for(let px=-st;px<cw+st;px+=st){const u=(px+cam.x*ts*p)/ts,hg=Math.round((vn(u*s*3,o,7)*h+1.5)*ts*.7/st)*st;ctx.fillRect(px,hz-hg,st+1,hg+ts*8)}});
 ctx.fillStyle='rgba(255,255,255,.92)';
 for(let i=0;i<6;i++){const x=((i*263+t*(5+i*2)-cam.x*ts*.06)%(cw+400)+cw+400)%(cw+400)-200,y=hz-Math.round((5+(i%3)*2.6)*ts),w=(7+(i%3)*3)*Z*2;
  ctx.fillRect(x,y,w,Z*4);ctx.fillRect(x+Z*4,y-Z*3,w-Z*10,Z*3)}
 const x0=Math.max(0,Math.floor(-OX/ts)),x1=Math.min(W-1,Math.ceil((cw-OX)/ts)),y0=Math.max(0,Math.floor(-OY/ts)),y1=Math.min(H-1,Math.ceil((ch-OY)/ts)),lf=Math.floor(t*3)%2;
 for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
  const id=M[x*H+y],px=x*ts+OX,py=y*ts+OY,under=y>SU[x];
  if(id===0){if(under)ctx.drawImage(A.wall,px,py,ts,ts);continue}
  if(under&&!DEF[id].s)ctx.drawImage(A.wall,px,py,ts,ts);
  ctx.drawImage(id===5?A[5][lf]:A[id],px,py,ts,ts)}
 for(const k in DMG){const c=DMG[k],id=M[k];if(!DEF[id]||!DEF[id].h||c.h<1)continue;
  ctx.drawImage(CR[clamp(Math.ceil(c.h/DEF[id].h*4),1,4)-1],Math.floor(k/H)*ts+OX,k%H*ts+OY,ts,ts)}
 if(HV){const px=HV.x*ts+OX,py=HV.y*ts+OY;
  if(sel&&HV.ok&&get(HV.x,HV.y)===0){ctx.globalAlpha=.45;ctx.drawImage(A[sel],px,py,ts,ts);ctx.globalAlpha=1}
  ctx.lineWidth=Z;ctx.strokeStyle=HV.ok?'#fff':'#ff5a5a';ctx.strokeRect(px+Z/2,py+Z/2,ts-Z,ts-Z)}
 // player
 {const fx=Math.round(P.x*ts+OX),fy=Math.round(P.y*ts+OY),u=Z,f=P.f,walk=Math.abs(P.vx)>.8&&P.g,an=walk?Math.round(Math.sin(t*16)*1.5):0;
  const R=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(fx+a*u,fy+b*u,w*u,h*u)};
  R(-5,-1,10,1,'rgba(0,0,0,.25)');
  R(-3+an,-8,2,8,'#2e3a73');R(1-an,-8,2,8,'#2e3a73');R(-3+an,-1,2,1,'#1b2147');R(1-an,-1,2,1,'#1b2147');
  R(-4,-18,8,10,'#d9582b');R(-4,-10,8,1,'#8a2f14');
  R(-4,-27,8,9,'#f2c79b');R(-4,-27,8,3,'#4a2c1a');R(f>0?-4:3,-24,1,3,'#4a2c1a');R(f>0?1:-2,-23,1,2,'#1b1226');
  if(P.arm>0){R(f>0?3:-9,-16,6,2,'#b8451f');R(f>0?9:-11,-17,2,3,'#f2c79b')}else R(f>0?3:-5,-17,2,7,'#b8451f')}
 for(const p of PT){ctx.globalAlpha=clamp(p.l*2.5,0,1);ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x*ts+OX),Math.round(p.y*ts+OY),Z*2,Z*2)}ctx.globalAlpha=1;
 ctx.font=`${Math.round(4.5*Z)}px "Press Start 2P",monospace`;ctx.textBaseline='middle';
 for(const p of PO){const px=Math.round(p.x*ts+OX),py=Math.round(p.y*ts+OY);ctx.globalAlpha=clamp(2-p.t*1.8,0,1);
  ctx.fillStyle='#000';ctx.fillText(p.txt,px+Z,py+Z);ctx.fillStyle=p.g?'#4fd8ff':'#f3e6c4';ctx.fillText(p.txt,px,py);
  if(p.g)ctx.drawImage(GEM,px+ctx.measureText(p.txt).width+Z*2,py-Z*4,Z*8,Z*8);ctx.globalAlpha=1}
 // cave light
 const dk=clamp((P.y-AVG-4)/26,0,.78);
 if(dk>0){const cx=P.x*ts+OX,cy=(P.y-.9)*ts+OY,gr=ctx.createRadialGradient(cx,cy,ts*3,cx,cy,ts*11);gr.addColorStop(0,'rgba(6,3,12,0)');gr.addColorStop(1,`rgba(6,3,12,${dk})`);ctx.fillStyle=gr;ctx.fillRect(0,0,cw,ch)}
}

// ---------- boot ----------
try{const d=JSON.parse(localStorage.getItem('pr1'));if(d){gems=d.g??50;inv=d.inv||inv}loadWorld(d&&d.w)}catch(e){loadWorld('START')}
refreshHotbar();
let last=0;
function loop(ms){const t=ms/1000,dt=Math.min(.05,t-last||.016);last=t;update(dt);draw(t);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
setInterval(saveAll,5000);
addEventListener('beforeunload',saveAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveAll()});
})();

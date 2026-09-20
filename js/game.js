window.Game = (() => {
const canvas=document.getElementById("canvas"),ctx=canvas.getContext("2d");
const W=1000,H=760,riverY=380,laneX=[330,670];
let units=[],particles=[],mana=5,aiBlessing=5,time=180,selected=null,gameOver=false,last=performance.now(),aiThink=1.5,effects=[],floaters=[];
const towers=[
 {team:"player",x:500,y:705,hp:3000,max:3000,kind:"king",range:270,dmg:78,rate:.75,last:0},
 {team:"player",x:330,y:650,hp:1900,max:1900,kind:"tower",range:230,dmg:52,rate:.8,last:0,lane:0},
 {team:"player",x:670,y:650,hp:1900,max:1900,kind:"tower",range:230,dmg:52,rate:.8,last:0,lane:1},
 {team:"ai",x:500,y:55,hp:3000,max:3000,kind:"king",range:270,dmg:78,rate:.75,last:0},
 {team:"ai",x:330,y:110,hp:1900,max:1900,kind:"tower",range:230,dmg:52,rate:.8,last:0,lane:0},
 {team:"ai",x:670,y:110,hp:1900,max:1900,kind:"tower",range:230,dmg:52,rate:.8,last:0,lane:1}
];
function spawn(card,team,lane){
 const y=team==="player"?575:185;
 units.push({team,x:laneX[lane]+Math.random()*34-17,y,hp:card.hp,max:card.hp,dmg:card.dmg,range:card.range,speed:card.speed,rate:card.rate,last:0,color:card.color,name:card.name,lane,age:0});
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function burst(x,y,color,count=8){for(let i=0;i<count;i++)particles.push({x,y,r:2+Math.random()*4,vx:(Math.random()-.5)*70,vy:(Math.random()-.5)*70,life:.55,max:.55,color})}
function cardArrival(x,y,color){for(let i=0;i<18;i++)effects.push({x:x+(Math.random()-.5)*28,y:y+(Math.random()-.5)*28,r:4+Math.random()*10,life:.7,max:.7,color,spin:Math.random()*6})}
function drawEffects(dt){effects.forEach(e=>{e.life-=dt;e.r+=45*dt;ctx.globalAlpha=Math.max(0,e.life/e.max);ctx.strokeStyle=e.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1});effects=effects.filter(e=>e.life>0)}
function hpbar(x,y,w,h,hp,max){ctx.fillStyle="#07100bdd";ctx.fillRect(x-w/2,y,w,h);ctx.fillStyle=hp/max>.5?"#65df77":hp/max>.25?"#f2ca57":"#e55b5b";ctx.fillRect(x-w/2,y,w*Math.max(0,hp/max),h);ctx.strokeStyle="#ffffff55";ctx.strokeRect(x-w/2,y,w,h)}
function drawBackground(){
 ctx.fillStyle="#183522";ctx.fillRect(0,0,W,H);
 // subtle field stripes
 for(let y=0;y<H;y+=38){ctx.fillStyle=y%76===0?"#1b3b26":"#1a3824";ctx.fillRect(0,y,W,19)}
 // river
 ctx.fillStyle="#28688c";ctx.fillRect(0,riverY-40,W,80);
 for(let x=0;x<W;x+=55){ctx.strokeStyle="#4b91ae88";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,riverY-12);ctx.quadraticCurveTo(x+15,riverY-20,x+30,riverY-12);ctx.stroke()}
 // bridges
 laneX.forEach(x=>{ctx.fillStyle="#9b6c3d";ctx.fillRect(x-55,riverY-47,110,94);ctx.fillStyle="#c08a50";for(let bx=x-45;bx<=x+45;bx+=18)ctx.fillRect(bx,riverY-43,10,86);ctx.strokeStyle="#5e4028";ctx.strokeRect(x-55,riverY-47,110,94)});
 // lane markings
 laneX.forEach(x=>{ctx.strokeStyle="#ffffff12";ctx.setLineDash([8,12]);ctx.beginPath();ctx.moveTo(x,15);ctx.lineTo(x,riverY-50);ctx.stroke();ctx.beginPath();ctx.moveTo(x,riverY+50);ctx.lineTo(x,H-15);ctx.stroke();ctx.setLineDash([])})
}
function drawTower(t){
 if(t.hp<=0)return;
 const w=t.kind==="king"?82:68,h=t.kind==="king"?78:64;
 ctx.save();ctx.translate(t.x,t.y);
 ctx.fillStyle="#0007";ctx.fillRect(-w/2+5,-h/2+8,w,h);
 ctx.fillStyle=t.team==="player"?"#557fbe":"#b35c5c";ctx.fillRect(-w/2,-h/2,w,h);
 ctx.fillStyle="#d8c58b";ctx.fillRect(-w/2+8,-h/2-12,w-16,12);
 ctx.fillStyle="#f1dfaa";ctx.fillRect(-7,-h/2+8,14,h-16);
 ctx.fillStyle="#eee";ctx.font=`bold ${t.kind==="king"?30:24}px serif`;ctx.textAlign="center";ctx.fillText("✝",0,10);
 ctx.fillStyle="#fff";ctx.fillRect(-w/2+12,-h/2+3,9,7);ctx.fillRect(w/2-21,-h/2+3,9,7);
 ctx.restore();
 hpbar(t.x,t.y-h/2-23,t.kind==="king"?105:88,8,t.hp,t.max);
}
function drawUnit(u){
 const pulse=1+Math.sin(u.age*5)*.03;ctx.save();ctx.translate(u.x,u.y);ctx.scale(pulse,pulse);
 ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(0,20,19,7,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=u.color;ctx.strokeStyle=u.team==="player"?"#7fc2ff":"#ff8b8b";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle="#fff";ctx.font="bold 17px serif";ctx.textAlign="center";ctx.fillText(u.name==="Light"?"✦":"✝",0,6);ctx.restore();
 hpbar(u.x,u.y-29,46,5,u.hp,u.max);
 ctx.fillStyle="#fff";ctx.font="9px system-ui";ctx.textAlign="center";ctx.fillText(u.name,u.x,u.y-35);
}
function draw(){ctx.clearRect(0,0,W,H);drawBackground();towers.forEach(drawTower);units.forEach(drawUnit);particles.forEach(p=>{ctx.globalAlpha=p.life/p.max;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1})}
function chooseTarget(u){
 // Units first fight opposing units in their own lane.
 const enemyUnits=units.filter(v=>v.team!==u.team&&v.hp>0&&v.lane===u.lane);
 if(enemyUnits.length)return enemyUnits.sort((a,b)=>dist(u,a)-dist(u,b))[0];
 // Then attack ONLY an opposing tower. Prefer the tower in the same lane.
 const enemyTowers=towers.filter(t=>t.team!==u.team&&t.hp>0);
 const laneTower=enemyTowers.find(t=>t.kind==="tower"&&t.lane===u.lane);
 if(laneTower)return laneTower;
 return enemyTowers.find(t=>t.kind==="king")||null;
}
function update(dt){
 if(gameOver)return;
 time=Math.max(0,time-dt);if(time<=0)return finish("TIME!");
 mana=Math.min(10,mana+dt*.75);
 aiThink-=dt;if(aiThink<=0){aiThink=1.5+Math.random()*1.7;const c=CARDS[Math.floor(Math.random()*CARDS.length)];spawn(c,"ai",Math.random()<.5?0:1);}
 units.forEach(u=>{
   if(u.hp<=0)return;u.age+=dt;
   const target=chooseTarget(u);if(!target)return;const d=dist(u,target);
   if(d<=u.range){u.last-=dt;if(u.last<=0){u.last=u.rate;target.hp-=u.dmg;burst(target.x,target.y,u.team==="player"?"#ffe27a":"#ff7777",5)}}
   else{const dx=target.x-u.x,dy=target.y-u.y,l=Math.hypot(dx,dy)||1;u.x+=dx/l*u.speed*dt;u.y+=dy/l*u.speed*dt}
 });
 towers.forEach(t=>{if(t.hp<=0)return;t.last-=dt;if(t.last>0)return;const target=units.filter(u=>u.team!==t.team&&u.hp>0&&dist(t,u)<=t.range).sort((a,b)=>dist(t,a)-dist(t,b))[0];if(target){t.last=t.rate;target.hp-=t.dmg;burst(target.x,target.y,"#fff",6)}});
 units=units.filter(u=>u.hp>0);drawEffects(dt);particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt});particles=particles.filter(p=>p.life>0);
 const aiKing=towers.find(t=>t.team==="ai"&&t.kind==="king"),playerKing=towers.find(t=>t.team==="player"&&t.kind==="king");
 if(aiKing.hp<=0)finish("VICTORY!");else if(playerKing.hp<=0)finish("DEFEAT");
}
function finish(text){gameOver=true;document.getElementById("result").textContent=text;document.getElementById("message").style.display="block";document.getElementById("restart").style.display="inline-block"}
function deploy(x,y){
 if(selected===null||gameOver)return;const hand=DeckSystem.getHand(),card=hand[selected];if(!card||mana<card.cost)return;if(y<riverY+20||y>690)return;
 mana-=card.cost;const lane=x<500?0:1;spawn(card,"player",lane);cardArrival(laneX[lane],575,card.color||"#ffe27a");const playedIndex=selected;DeckSystem.play(selected);selected=null;UI.renderHand();UI.animateReplacement(playedIndex);
}
canvas.addEventListener("click",e=>{const r=canvas.getBoundingClientRect();deploy((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)});
function start(){units=[];particles=[];effects=[];mana=5;aiBlessing=5;time=180;selected=null;gameOver=false;DeckSystem.setup();UI.renderHand();last=performance.now();requestAnimationFrame(loop)}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();UI.update(mana,time,selected);requestAnimationFrame(loop)}
return {start,select:i=>{selected=i}};
})();

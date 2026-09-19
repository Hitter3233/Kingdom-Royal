window.Game = (() => {
const canvas=document.getElementById("canvas"),ctx=canvas.getContext("2d");
const W=1000,H=760,riverY=380,laneX=[330,670];
let units=[],particles=[],mana=5,time=180,selected=null,gameOver=false,last=performance.now(),aiThink=2;
const towers=[
 {team:"player",x:330,y:665,hp:2600,max:2600,kind:"king",range:250,dmg:70,rate:.75,last:0},
 {team:"player",x:670,y:665,hp:1700,max:1700,kind:"tower",range:210,dmg:48,rate:.8,last:0},
 {team:"player",x:330,y:95,hp:1700,max:1700,kind:"tower",range:210,dmg:48,rate:.8,last:0},
 {team:"player",x:670,y:95,hp:1700,max:1700,kind:"tower",range:210,dmg:48,rate:.8,last:0},
 {team:"ai",x:500,y:45,hp:2600,max:2600,kind:"king",range:250,dmg:70,rate:.75,last:0}
];

function spawn(card,team,lane){
 units.push({team,x:laneX[lane]+Math.random()*34-17,y:team==="player"?600:160,hp:card.hp,max:card.hp,dmg:card.dmg,range:card.range,speed:card.speed,rate:card.rate,last:0,color:card.color,name:card.name,lane});
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function burst(x,y,color){for(let i=0;i<5;i++)particles.push({x,y,r:2+Math.random()*3,vx:(Math.random()-.5)*40,vy:(Math.random()-.5)*40,life:.6,color})}
function hpbar(x,y,w,h,hp,max){ctx.fillStyle="#000b";ctx.fillRect(x-w/2,y,w,h);ctx.fillStyle=hp/max>.5?"#55d66f":hp/max>.25?"#f0c64b":"#e45d5d";ctx.fillRect(x-w/2,y,w*Math.max(0,hp/max),h)}
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle="#254b2c";ctx.fillRect(0,0,W,H);
 ctx.fillStyle="#326b91";ctx.fillRect(0,riverY-34,W,68);
 laneX.forEach(x=>{ctx.fillStyle="#8a633f";ctx.fillRect(x-48,riverY-40,96,80)});
 towers.forEach(t=>{if(t.hp<=0)return;ctx.fillStyle=t.kind==="king"?"#d7b95e":"#aab5c5";ctx.fillRect(t.x-34,t.y-34,68,68);ctx.fillStyle=t.team==="player"?"#5b87c9":"#a35b5b";ctx.fillRect(t.x-22,t.y-22,44,22);ctx.fillStyle="#fff";ctx.font="bold 25px serif";ctx.textAlign="center";ctx.fillText(t.kind==="king"?"✝":"☩",t.x,t.y+14);hpbar(t.x,t.y-48,90,7,t.hp,t.max)});
 units.forEach(u=>{ctx.fillStyle=u.color;ctx.strokeStyle=u.team==="player"?"#1e5bba":"#9b2c2c";ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x,u.y,18,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 18px serif";ctx.textAlign="center";ctx.fillText(u.name==="Light"?"✦":"✝",u.x,u.y+6);hpbar(u.x,u.y-27,42,5,u.hp,u.max)});
 particles.forEach(p=>{ctx.globalAlpha=p.life/.6;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1});
}
function update(dt){
 if(gameOver)return;
 time=Math.max(0,time-dt); if(time<=0)return finish("TIME!");
 mana=Math.min(10,mana+dt*.75);
 aiThink-=dt;if(aiThink<=0){aiThink=2+Math.random()*1.5;const c=CARDS[Math.floor(Math.random()*CARDS.length)];spawn(c,"ai",Math.random()<.5?0:1)}
 units.forEach(u=>{
   if(u.hp<=0)return;
   let target=units.filter(v=>v.team!==u.team&&v.hp>0&&v.lane===u.lane).sort((a,b)=>dist(u,a)-dist(u,b))[0];
   if(!target) target=towers.filter(t=>t.team!==u.team&&t.hp>0).sort((a,b)=>dist(u,a)-dist(u,b))[0];
   if(!target)return;
   const d=dist(u,target);
   if(d<=u.range){u.last-=dt;if(u.last<=0){u.last=u.rate;target.hp-=u.dmg;burst(target.x,target.y,u.team==="player"?"#ffe27a":"#ff7777")}}
   else{const dx=target.x-u.x,dy=target.y-u.y,l=Math.hypot(dx,dy)||1;u.x+=dx/l*u.speed*dt;u.y+=dy/l*u.speed*dt}
 });
 towers.forEach(t=>{
   if(t.hp<=0)return;t.last-=dt;if(t.last>0)return;
   const target=units.filter(u=>u.team!==t.team&&u.hp>0&&dist(t,u)<=t.range)[0];
   if(target){t.last=t.rate;target.hp-=t.dmg;burst(target.x,target.y,"#fff")}
 });
 units=units.filter(u=>u.hp>0);particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt});particles=particles.filter(p=>p.life>0);
 if(towers.find(t=>t.team==="ai"&&t.kind==="king").hp<=0)finish("VICTORY!");
 if(towers.find(t=>t.team==="player"&&t.kind==="king").hp<=0)finish("DEFEAT");
}
function finish(text){gameOver=true;document.getElementById("result").textContent=text;document.getElementById("message").style.display="block";document.getElementById("restart").style.display="inline-block"}
function deploy(x,y){
 if(selected===null||gameOver)return;
 const hand=DeckSystem.getHand(),card=hand[selected];if(!card||mana<card.cost)return;
 if(y<riverY+20||y>690)return;
 mana-=card.cost;spawn(card,"player",x<500?0:1);DeckSystem.play(selected);selected=null;UI.renderHand();
}
canvas.addEventListener("click",e=>{const r=canvas.getBoundingClientRect();deploy((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)});
function start(){DeckSystem.setup();UI.renderHand();requestAnimationFrame(loop)}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();UI.update(mana,time,selected);requestAnimationFrame(loop)}
return {start,select:i=>{selected=i}};
})();
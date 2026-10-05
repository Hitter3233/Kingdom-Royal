window.KingdomClashOnline=(()=>{const SERVER="wss://kingdom-clash-server.onrender.com";let socket=null,room=null,role=null,inMatch=false;
const $=id=>document.getElementById(id);function status(s){if($("onlineStatus"))$("onlineStatus").textContent=s}
function roomUI(c){if($("roomCode"))$("roomCode").textContent=c||"-----"}
function emit(n,d={}){window.dispatchEvent(new CustomEvent(n,{detail:d}))}
function connect(){return new Promise((resolve,reject)=>{if(socket&&socket.readyState===1)return resolve();status("Connecting...");socket=new WebSocket(SERVER);
socket.addEventListener("open",()=>{status("Connected");resolve()},{once:true});
socket.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}switch(m.type){
case"connected":status("Connected");break;
case"room_created":case"room_joined":room=m.room;role=m.role;roomUI(room);status(m.type==="room_created"?"Room created — waiting for friend.":"Joined room — waiting for match.");emit(m.type==="room_created"?"kingdom-room-created":"kingdom-room-joined",m);break;
case"opponent_joined":status("Friend connected — ready!");emit("kingdom-opponent-joined",m);break;
case"match_start":inMatch=true;status("⚔ Match started!");emit("kingdom-match-start",m);break;
case"opponent_action":emit("kingdom-opponent-action",m);break;
case"match_end":inMatch=false;emit("kingdom-match-end",m);break;
case"opponent_left":inMatch=false;status("Opponent disconnected.");emit("kingdom-opponent-left",m);break;
case"error":status(m.message||"Server error.");emit("kingdom-online-error",m);break}};socket.onclose=()=>{inMatch=false;status("Disconnected")};socket.onerror=e=>{status("Connection failed");reject(e)}})}
function send(type,p={}){if(!socket||socket.readyState!==1)return false;socket.send(JSON.stringify({type,...p}));return true}
return{connect,createRoom:()=>send("create_room"),joinRoom:c=>{c=String(c||"").trim().toUpperCase();if(!c){status("Enter a room code.");return false}return send("join_room",{room:c})},startMatch:()=>send("start_match"),playCard:(cardId,lane)=>inMatch&&send("play_card",{cardId,lane}),endMatch:(winner,reason="normal")=>send("match_end",{winner,reason}),getRoom:()=>room,getRole:()=>role,isInMatch:()=>inMatch}})();

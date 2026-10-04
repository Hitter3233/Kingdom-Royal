window.Multiplayer = (() => {
  const SERVER_URL = "wss://kingdom-clash-server.onrender.com";

  let socket = null;
  let roomCode = null;
  let role = null;

  function setStatus(text) {
    const el = document.getElementById("onlineStatus");
    if (el) el.textContent = text;
  }

  function setRoom(code) {
    const el = document.getElementById("roomCode");
    if (el) el.textContent = code || "-----";
  }

  function connect() {
    return new Promise((resolve, reject) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        setStatus("Connected");
        resolve();
        return;
      }

      setStatus("Connecting...");

      socket = new WebSocket(SERVER_URL);

      socket.addEventListener("open", () => {
        setStatus("Connected");
        resolve();
      }, { once: true });

      socket.addEventListener("message", event => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "connected") {
          setStatus("Connected");
        }

        if (msg.type === "room_created") {
          roomCode = msg.room;
          role = "host";
          setRoom(roomCode);
          setStatus("Room created — waiting for opponent.");
          window.dispatchEvent(new CustomEvent("multiplayer-room-created", {
            detail: { room: roomCode, role }
          }));
        }

        if (msg.type === "room_joined") {
          roomCode = msg.room;
          role = "guest";
          setRoom(roomCode);
          setStatus("Joined room — waiting for match.");
          window.dispatchEvent(new CustomEvent("multiplayer-room-joined", {
            detail: { room: roomCode, role }
          }));
        }

        if (msg.type === "opponent_joined") {
          setStatus("Opponent connected!");
          window.dispatchEvent(new CustomEvent("multiplayer-opponent-joined"));
        }

        if (msg.type === "opponent_left") {
          setStatus("Opponent disconnected.");
          window.dispatchEvent(new CustomEvent("multiplayer-opponent-left"));
        }

        if (msg.type === "battle") {
          window.dispatchEvent(new CustomEvent("multiplayer-battle", {
            detail: msg
          }));
        }

        if (msg.type === "error") {
          setStatus(msg.message || "Server error.");
          window.dispatchEvent(new CustomEvent("multiplayer-error", {
            detail: { message: msg.message || "Server error." }
          }));
        }
      });

      socket.addEventListener("close", () => {
        setStatus("Disconnected");
      });

      socket.addEventListener("error", () => {
        setStatus("Connection failed");
        reject(new Error("WebSocket connection failed"));
      });
    });
  }

  function createRoom() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setStatus("Connect first.");
      return;
    }
    socket.send(JSON.stringify({ type: "create_room" }));
  }

  function joinRoom(code) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setStatus("Connect first.");
      return;
    }

    const clean = String(code || "").trim().toUpperCase();

    if (!clean) {
      setStatus("Enter a room code.");
      return;
    }

    socket.send(JSON.stringify({
      type: "join_room",
      room: clean
    }));
  }

  function sendBattle(action) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: "battle",
      action
    }));
  }

  return {
    connect,
    createRoom,
    joinRoom,
    sendBattle,
    getRoom: () => roomCode,
    getRole: () => role,
    getServerUrl: () => SERVER_URL
  };
})();

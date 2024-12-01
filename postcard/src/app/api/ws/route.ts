type ClientWithRoom = {
  client: import("ws").WebSocket;
  roomId: string;
};

const strokes: Record<string, object[]> = {};
let clients: ClientWithRoom[] = [];

export function GET() {
  const headers = new Headers();
  headers.set("Connection", "Upgrade");
  headers.set("Upgrade", "websocket");
  return new Response("Upgrade Required", { status: 426, headers });
}

export function SOCKET(client: import("ws").WebSocket) {
  let roomId: string = "default";
  const { send, broadcast } = createHelpers(client);

  client.on("message", (data) => {
    const dataParsed = JSON.parse(data.toString());

    console.log(dataParsed);

    if (dataParsed.action === "ping") {
      send({
        username: "Server",
        action: "pong",
        content: "Pong!",
      });
    } else if (dataParsed.action === "join") {
      roomId = dataParsed.roomId;
      clients.push({ client, roomId });
      if (!strokes[roomId]) {
        strokes[roomId] = [];
      }
      send({
        username: "Server",
        action: "join-response",
        content: JSON.stringify(strokes[roomId]),
      });
    } else if (dataParsed.action === "stroke") {
      if (roomId) {
        strokes[roomId].push(dataParsed.content);
        broadcast(dataParsed, roomId);
      }
    } else if (dataParsed.action === "clear") {
      if (roomId) {
        strokes[roomId] = [];
        broadcast(dataParsed, roomId);
      }
    } else {
      if (roomId) {
        broadcast(dataParsed, roomId);
      }
    }
  });

  client.on("close", () => {
    clients = clients.filter((c) => c.client !== client);
    broadcast(
      { author: "Server", content: "A client has disconnected." },
      roomId
    );
  });
}

function createHelpers(client: import("ws").WebSocket) {
  const send = (payload: unknown) => client.send(JSON.stringify(payload));
  const broadcast = (payload: unknown, roomId: string | null) => {
    if (payload instanceof Buffer) payload = payload.toString();
    if (typeof payload !== "string") payload = JSON.stringify(payload);
    for (const { client: otherClient, roomId: otherRoomId } of clients) {
      if (otherClient !== client && otherRoomId === roomId) {
        otherClient.send(String(payload));
      }
    }
  };
  return { send, broadcast };
}

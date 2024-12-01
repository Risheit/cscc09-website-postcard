// TODO: VERY MUCH WIP AND TESTING
export type Message = {
  userId: string;
  username: string;
  action:
    | "ping"
    | "pong"
    | "join"
    | "join-response"
    | "stroke"
    | "clear"
    | "undo"
    | "redo"
    | "leave";
  content?: string;
};

export default function WebSocketComponent() {
  return <></>;
}

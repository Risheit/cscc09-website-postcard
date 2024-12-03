export type Message = {
  userId: string;
  username: string;
  action:
    | 'ping'
    | 'pong'
    | 'join'
    | 'join-response'
    | 'stroke'
    | 'clear'
    | 'undo'
    | 'redo'
    | 'leave'
    | 'close';
  content?: string;
};

import pool from './cloudsql';

export type Room = {
  id: string;
  name: string;
};

export function fromRawRoom(roomRaw?: { room_id: string; room_name: string }) {
  return roomRaw
    ? ({
        id: roomRaw?.room_id,
        name: roomRaw?.room_name,
      } as Room)
    : undefined;
}

export async function getImageConnectedToRoom(roomId: string) {
  const imageRaw = await pool.query(
    'SELECT * FROM rooms WHERE room_id = $1::text LIMIT 1',
    [roomId]
  );

  return fromRawRoom(imageRaw.rows[0]);
}

export async function createRoom(fileId?: string) {
  let roomId = crypto.randomUUID();
  let roomRaw = await pool.query(
    'INSERT INTO rooms (id, image_content) VALUES ($1::text, $2::text) ON CONFLICT (id) DO NOTHING RETURNING *',
    [roomId, fileId]
  );
  while (!roomRaw?.rows[0]) {
    roomId = crypto.randomUUID();
    roomRaw = await pool.query(
      'INSERT INTO rooms (id, image_content) VALUES ($1::text, $2::text) ON CONFLICT (id) DO NOTHING RETURNING *',
      [roomId, fileId]
    );
  }

  return fromRawRoom(roomRaw.rows[0]);
}

export async function deleteRoom(roomId: string) {
  const roomRaw = await pool.query(
    'DELETE FROM rooms WHERE id = $1::text RETURNING *',
    [roomId]
  );

  return fromRawRoom(roomRaw.rows[0]);
}

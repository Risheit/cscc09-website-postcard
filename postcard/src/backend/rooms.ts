import pool from './cloudsql';

export type Room = {
  roomId: string;
  imageId: string;
};

export function fromRawRoom(roomRaw?: { id: string; image_content: string }) {
  return roomRaw
    ? ({
        roomId: roomRaw?.id,
        imageId: roomRaw?.image_content,
      } as Room)
    : undefined;
}

export async function getImageConnectedToRoom(roomId: string) {
  const imageRaw = await pool.query(
    'SELECT * FROM rooms WHERE id = $1::text LIMIT 1',
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

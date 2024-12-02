import { collectImage } from '@/backend/bucket';
import { getImageConnectedToRoom } from '@/backend/rooms';
import { NextRequest } from 'next/server';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  const imageId = await getImageConnectedToRoom(roomId);

  if (!imageId) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const image = await collectImage(imageId.imageId);
  if (!image) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const fileData = await image.arrayBuffer();
  return new Response(fileData, {
    headers: { 'Content-Type': image.type },
    status: 200,
  });
}

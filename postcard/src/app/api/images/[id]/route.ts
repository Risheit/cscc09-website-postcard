import { collectImage } from '@/backend/bucket';
import { NextRequest } from 'next/server';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await collectImage(id);
  if (!image) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const fileData = await image.arrayBuffer();
  return new Response(fileData, {
    headers: { 'Content-Type': image.type },
    status: 200,
  });
}

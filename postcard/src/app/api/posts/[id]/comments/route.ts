import { NextRequest } from 'next/server';
import pool from '@/backend/cloudsql';
import { authorizeSession, DBSession } from '@/app/api/auth/config';
import { asReadablePostQuery } from '@/backend/posts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const searchParams = req.nextUrl.searchParams;
  const limit = searchParams.get('limit') ?? 10;
  const offset = searchParams.get('offset') ?? 0;
  const { id } = await params;

  const query = await pool.query(
    `SELECT ${asReadablePostQuery} FROM posts
      WHERE comment_of = $1::integer
      ORDER BY created DESC LIMIT $2::bigint OFFSET $3::bigint`,
    [id, limit, offset]
  );

  return Response.json(query.rows, {
    status: 200,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await authorizeSession()) as DBSession;
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 405 });
  }

  const { textContent, imagePath, locationName, lat, lng, postedTime } =
    await req.json();
  const { id } = await params;


  if (!lat || !lng || !postedTime || !locationName) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const query = await pool.query(
    `INSERT INTO posts (text_content, image_content, location_name, location,
      comment_of, owner, posted_time)
    VALUES ($1::text, $2::text, $3::text, ST_MakePoint($4::decimal,$5::decimal),
      $6::integer, $7::integer, $8::timestamp)
    RETURNING ${asReadablePostQuery}`,
    [
      textContent ?? null,
      imagePath ?? null,
      locationName,
      lng,
      lat,
      id,
      session.account?.userId,
      postedTime,
    ]
  );

  return Response.json(query.rows[0], { status: 200 });
}

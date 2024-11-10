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

  const { textContent, imagePath, lat, lng } = await req.json();
  const { id } = await params;

  if (lat === undefined || lng === undefined) {
    return Response.json(
      { error: 'Missing lat and lng fields' },
      { status: 400 }
    );
  }

  const query = await pool.query(
    `INSERT INTO posts (text_content, image_content, location, comment_of, owner)
    VALUES ($1::text, $2::text, ST_MakePoint($3::decimal,$4::decimal), $5::integer, $6::integer)
    RETURNING ${asReadablePostQuery}`,
    [
      textContent ?? null,
      imagePath ?? null,
      lng,
      lat,
      id,
      13 //session.account?.userId,
    ]
  );

  return Response.json(query.rows[0], { status: 200 });
}

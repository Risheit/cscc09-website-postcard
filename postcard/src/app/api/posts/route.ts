import { NextRequest } from 'next/server';
import pool from '@/backend/cloudsql';
import { QueryResult } from 'pg';
import { getUserByUsername } from '@/backend/users';
import { authorizeSession } from '@/app/api/auth/config';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const x = searchParams.get('x');
  const y = searchParams.get('y');
  const ownerName = searchParams.get('owner');
  const distance = searchParams.get('distance') ?? 10000;
  const limit = searchParams.get('limit') ?? 10;
  const offset = searchParams.get('offset') ?? 0;

  const owner = ownerName ? await getUserByUsername(ownerName) : undefined;
  const ownerCondition = owner ? `AND owner = $6::integer` : '';

  let query: QueryResult;
  if (!x || !y) {
    query = await pool.query(
      `SELECT id, text_content, image_content, created, likes, dislikes,
      ST_X(location::geometry) AS xloc, ST_Y(location::geometry) as yloc
      FROM posts
      WHERE 1=1 ${ownerCondition}
      ORDER BY created DESC LIMIT $1::bigint OFFSET $2::bigint`,
      [limit, offset]
    );
  } else {
    query = await pool.query(
      `SELECT id, text_content, image_content, created, likes, dislikes,
      ST_X(location::geometry) AS xloc, ST_Y(location::geometry) as yloc
      FROM posts
      WHERE ST_DWithin(posts.location, ST_MakePoint($1::integer,$2::integer)::geography, $3::integer)
      ${ownerCondition}
      ORDER BY posts.location <-> ST_MakePoint($1::integer,$2::integer)::geography, created DESC
      LIMIT $4::bigint OFFSET $5::bigint`,
      [x, y, distance, limit, offset].concat(owner ? [owner?.id] : [])
    );
  }

  return Response.json(query.rows, {
    status: 200,
  });
}

export async function POST(req: NextRequest) {
  const session = await authorizeSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 405 });
  }

  return Response.json({ req, session });
}

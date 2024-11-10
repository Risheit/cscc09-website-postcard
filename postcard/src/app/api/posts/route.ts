import { NextRequest } from 'next/server';
import pool from '@/backend/cloudsql';
import { QueryResult } from 'pg';
import { getUserByUsername } from '@/backend/users';
import { authorizeSession, DBSession } from '@/app/api/auth/config';
import { asReadablePostQuery } from '@/backend/posts';

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
  console.log('ownerCondition', ownerCondition, owner);

  // Distance search comes from: https://stackoverflow.com/a/49307081/25875922

  let query: QueryResult;
  if (!x || !y) {
    query = await pool.query(
      `SELECT ${asReadablePostQuery} FROM posts
      WHERE 1=1 ${ownerCondition}
      ORDER BY created DESC LIMIT $1::bigint OFFSET $2::bigint`,
      [limit, offset]
    );
  } else {
    query = await pool.query(
      `SELECT ${asReadablePostQuery} FROM posts
      WHERE ST_DWithin(posts.location, ST_MakePoint($1::decimal,$2::decimal)::geography, $3::decimal)
      ${ownerCondition}
      ORDER BY posts.location <-> ST_MakePoint($1::decimal,$2::decimal)::geography, created DESC
      LIMIT $4::bigint OFFSET $5::bigint`,
      [x, y, distance, limit, offset].concat(owner ? [owner?.id] : [])
    );
  }

  return Response.json(query.rows, {
    status: 200,
  });
}

export async function POST(req: NextRequest) {
  const session = (await authorizeSession()) as DBSession;
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 405 });
  }

  const { textContent, imagePath, lat, lng } = await req.json();

  if (lat === undefined || lng === undefined) {
    return Response.json(
      { error: 'Missing lat and lng fields' },
      { status: 400 }
    );
  }

  const query = await pool.query(
    `INSERT INTO posts (text_content, image_content, location, owner)
    VALUES ($1::text, $2::text, ST_MakePoint($3::decimal,$4::decimal), $5::integer)
    RETURNING ${asReadablePostQuery}`,
    [textContent ?? null, imagePath ?? null, lng, lat, session.account?.userId]
  );

  return Response.json(query.rows[0], { status: 200 });
}

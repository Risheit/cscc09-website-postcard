import pool from '@/backend/cloudsql';
import { NextRequest } from 'next/server';
import { asReadablePostQuery } from '@/backend/posts';
import { authorizeSession, DBSession } from '../../auth/config';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('params', await params);
  const { id } = await params;

  const query = await pool.query(
    `SELECT ${asReadablePostQuery} FROM posts WHERE id = $1::integer LIMIT 1
    `,
    [parseInt(id)]
  );

  return Response.json(query.rows[0], {
    status: 200,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authorizeSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 405 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action === 'like') {
    const query = await pool.query(
      `UPDATE posts SET likes = likes + 1 WHERE id = $1::integer 
        RETURNING ${asReadablePostQuery}
      `,
      [parseInt(id)]
    );

    return Response.json(query.rows[0], {
      status: 200,
    });
  } else if (action === 'dislike') {
    const query = await pool.query(
      `UPDATE posts SET dislikes = dislikes + 1 WHERE id = $1::integer 
        RETURNING ${asReadablePostQuery}
      `,
      [parseInt(id)]
    );

    return Response.json(query.rows[0], {
      status: 200,
    });
  }

  return Response.json(
    { error: 'Invalid action, not "like" or "dislike"' },
    { status: 400 }
  );
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await authorizeSession()) as DBSession;
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 405 });
  }

  const { id } = await params;
  if (parseInt(id) !== session.account?.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const query = await pool.query(
    `DELETE FROM posts WHERE id = $1::integer RETURNING ${asReadablePostQuery}`,
    [parseInt(id)]
  );

  if (query.rowCount === 0) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }

  return Response.json(query.rows[0], { status: 200 });
}

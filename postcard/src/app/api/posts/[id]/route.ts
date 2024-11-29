import pool from '@/backend/cloudsql';
import { NextRequest } from 'next/server';
import { asReadablePostQuery } from '@/backend/posts';
import { authorizeSession } from '../../auth/config';
import { deleteImage } from '@/backend/bucket';
import DbSession from '@/app/models/DbSession';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const session = (await authorizeSession()) as DbSession;
  if (!session || !session.dbUser?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 405 });
  }

  const { id } = await params;
  const { action } = await req.json();

  const existing = await pool.query(
    `SELECT * FROM likes WHERE post_id = $1::integer AND user_id = $2::text`,
    [parseInt(id), session.dbUser?.id]
  );
  const previousAction = existing.rows[0]?.action;

  if (action !== 'like' && action !== 'dislike') {
    return Response.json(
      { error: 'Invalid action, not "like" or "dislike"' },
      { status: 400 }
    );
  }

  const isSameAction = previousAction && action === previousAction;
  const result = isSameAction ? 'removed' : action;
  const postColumn = action == 'like' ? 'likes' : 'dislikes';
  const otherPostColumn = action == 'like' ? 'dislikes' : 'likes';

  let query;
  if (isSameAction) {
    await pool.query(
      `DELETE FROM likes WHERE post_id = $1::integer AND user_id = $2::text RETURNING *`,
      [parseInt(id), session.dbUser?.id]
    );
    query = await pool.query(
      `UPDATE posts SET ${postColumn} = ${postColumn} - 1 WHERE id = $1::integer 
        RETURNING ${asReadablePostQuery}
      `,
      [parseInt(id)]
    );
  } else {
    await pool.query(
      ` INSERT INTO likes (action, post_id, user_id) VALUES ($1::text, $2::integer, $3::text)
        ON CONFLICT (post_id, user_id) DO UPDATE SET action = $1::text
        RETURNING *
      `,
      [action, parseInt(id), session.dbUser?.id]
    );
    if (previousAction) {
      query = await pool.query(
        `UPDATE posts SET ${postColumn} = ${postColumn} + 1, ${otherPostColumn} = ${otherPostColumn} - 1
         WHERE id = $1::integer 
         RETURNING ${asReadablePostQuery}
        `,
        [parseInt(id)]
      );
    } else {
      query = await pool.query(
        `UPDATE posts SET ${postColumn} = ${postColumn} + 1 WHERE id = $1::integer 
         RETURNING ${asReadablePostQuery}
        `,
        [parseInt(id)]
      );
    }
  }

  return Response.json({ ...query.rows[0], action, result }, { status: 200 });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await authorizeSession()) as DbSession;
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 405 });
  }

  const { id } = await params;
  if (id !== session.dbUser?.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const query = await pool.query(
    `DELETE FROM posts WHERE id = $1::integer RETURNING ${asReadablePostQuery}`,
    [parseInt(id)]
  );

  if (query.rowCount === 0) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }

  const fileId = query.rows[0].imageContent;
  if (fileId) {
    await deleteImage(fileId);
  }

  return Response.json(query.rows[0], { status: 200 });
}

import { NextRequest } from 'next/server';
import pool from '@/backend/cloudsql';
import { authorizeSession } from '@/app/api/auth/config';
import { asReadablePostQuery } from '@/backend/posts';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { uploadNewImage } from '@/backend/bucket';
import DbSession from '@/app/models/DbSession';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const searchParams = req.nextUrl.searchParams;
  const limit = searchParams.get('limit') ?? 10;
  const offset = searchParams.get('offset') ?? 0;
  const { id } = await params;

  const query = await pool.query(
    `SELECT  ${asReadablePostQuery}, users.display_name as poster_display_name,
        users.profile_pic as poster_profile_pic, action, parent.title as remix_of_title, parent.id as remix_of,
        original.display_name as remix_of_poster_display_name, original.profile_pic as remix_of_poster_profile_pic,
        users.external_profile_pic as poster_external_profile_pic, 
        original.external_profile_pic as remix_of_poster_external_profile_pic
      FROM posts
       JOIN users on posts.owner = users.id
       LEFT OUTER JOIN posts as parent on parent.id = posts.comment_of
       LEFT OUTER JOIN users as original on parent.owner = original.id
       LEFT OUTER JOIN likes on (posts.id, posts.owner) = (post_id, user_id)
       WHERE posts.comment_of = $1::integer
       ORDER BY created DESC`,
    [id]
  );

  return Response.json(query.rows, {
    status: 200,
  });
}

const createPostSchema = zfd.formData({
  textContent: zfd.text(z.string().optional()),
  image: zfd.file(z.instanceof(File).optional()),
  locationName: zfd.text(),
  lat: zfd.numeric(),
  lng: zfd.numeric(),
  postedTime: zfd.text(),
  title: zfd.text(z.string().optional()),
});

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const sessionPromise = authorizeSession();
  const formDataPromise = req.formData();

  return Promise.all([sessionPromise, paramsPromise, formDataPromise]).then(
    async ([session, params, formData]) => {
      const dbSession = session as DbSession;
      const { id } = params;
      if (!dbSession) {
        return Response.json({ error: 'Unauthorized' }, { status: 405 });
      }

      const userId = dbSession.dbUser?.id;
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 405 });
      }

      const parseResult = createPostSchema.safeParse(formData);
      if (!parseResult.success) {
        return Response.json({ error: parseResult.error }, { status: 400 });
      }

      const { textContent, image, locationName, lat, lng, postedTime, title } =
        parseResult.data;

      const owner_image = await pool.query(
        `SELECT image_content FROM posts WHERE id = $1::integer`,
        [id]
      );
      if (!owner_image.rows[0].image_content) {
        return Response.json({ error: 'Cannot remix a text post' }, { status: 400 });
      }
      
      let fileId: string | undefined;
      if (image) {
        fileId = await uploadNewImage({ file: image, owner: userId });
        if (!fileId) {
          return Response.json({ error: 'Invalid image' }, { status: 400 });
        }
      }

      const query = await pool.query(
        `INSERT INTO posts (title, text_content, image_content, location_name, location,
          comment_of, owner, posted_time, num_comments)
          VALUES ($1::text, $2::text, $3::text, $4::text, ST_MakePoint($5::decimal,$6::decimal),
          $7::integer, $8::text, $9::timestamp, 0)
          RETURNING ${asReadablePostQuery}`,
        [
          title ?? null,
          textContent ?? null,
          fileId ?? null,
          locationName,
          lng,
          lat,
          id,
          userId,
          postedTime,
        ]
      );

      if (query.rows.length !== 0) {
        await pool.query(
          `UPDATE posts SET num_comments = num_comments + 1 WHERE id = $1::integer`,
          [id]
        );
      }

      return Response.json(query.rows[0], { status: 200 });
    }
  );
}

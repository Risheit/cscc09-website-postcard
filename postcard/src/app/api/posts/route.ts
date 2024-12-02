import { NextRequest } from 'next/server';
import pool from '@/backend/cloudsql';
import { QueryResult } from 'pg';
import { getUserByUsername } from '@/backend/users';
import { authorizeSession } from '@/app/api/auth/config';
import { asReadablePostQuery } from '@/backend/posts';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { uploadNewImage } from '@/backend/bucket';
import DbSession from '@/app/models/DbSession';

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

  // Distance search comes from: https://stackoverflow.com/a/49307081/25875922

  let query: QueryResult;
  if (!x || !y) {
    query = await pool.query(
      `SELECT ${asReadablePostQuery}, users.display_name as poster_display_name,
        users.profile_pic as poster_profile_pic, action
       FROM posts 
       JOIN users on owner = users.id
       LEFT OUTER JOIN likes on (posts.id, owner) = (post_id, user_id)
       WHERE comment_of is NULL
       ${ownerCondition}
       ORDER BY created DESC LIMIT $1::bigint OFFSET $2::bigint
      `,
      [limit, offset]
    );
  } else {
    query = await pool.query(
      `SELECT ${asReadablePostQuery}, users.display_name as poster_display_name, 
        users.profile_pic as poster_profile_pic, action
       FROM posts 
       JOIN users on owner = users.id
       LEFT OUTER JOIN likes on (posts.id, owner) = (post_id, user_id)
       WHERE ST_DWithin(posts.location, ST_MakePoint($1::decimal,$2::decimal)::geography, $3::decimal)
       AND comment_of is NULL
       ${ownerCondition}
       ORDER BY posts.location <-> ST_MakePoint($1::decimal,$2::decimal)::geography, created DESC
       LIMIT $4::bigint OFFSET $5::bigint
      `,
      [x, y, distance, limit, offset].concat(owner ? [owner?.id] : [])
    );
  }

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
  title: zfd.text(),
});

export async function POST(req: NextRequest) {
  const sessionPromise = authorizeSession();
  const formDataPromise = req.formData();

  return Promise.all([sessionPromise, formDataPromise]).then(
    async ([session, formData]) => {
      const dbSession = session as DbSession;
      

      if (!dbSession) {
        return Response.json({ error: 'Unauthorized' }, { status: 405 });
      }

      const parseResult = createPostSchema.safeParse(formData);
      if (!parseResult.success) {
        return Response.json(
          { error: parseResult.error.issues },
          { status: 400 }
        );
      }

      const { textContent, image, locationName, lat, lng, postedTime, title } =
        parseResult.data;

      const userId = dbSession.dbUser?.id;
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 405 });
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
          owner, posted_time, num_comments)
          VALUES ($1::text, $2::text, $3::text, $4::text, ST_MakePoint($5::decimal,$6::decimal),
          $7::text, $8::timestamp, 0)
          RETURNING ${asReadablePostQuery}`,
        [
          title ?? null,
          textContent ?? null,
          fileId ?? null,
          locationName,
          lng,
          lat,
          userId,
          null,
          postedTime,
        ]
      );

      return Response.json(query.rows[0], { status: 200 });
    }
  );
}

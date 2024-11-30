import pool from '@/backend/cloudsql';
import { NextRequest } from 'next/server';
import { authorizeSession } from '../../auth/config';
import DbSession from '@/app/models/DbSession';
import { deleteImage, uploadNewImage } from '@/backend/bucket';
import { getUserById } from '@/backend/users';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getUserById(id);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json(user, {
    status: 200,
  });
}

const updateUserSchema = zfd.formData({
  displayName: zfd.text(z.string().optional()),
  aboutMe: zfd.text(z.string().optional()),
  profilePic: zfd.file(z.instanceof(File).optional()),
});

export async function PATCH(
  req: NextRequest,
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

  const parseResult = updateUserSchema.safeParse(await req.formData());
  if (!parseResult.success) {
    return Response.json({ error: parseResult.error.issues }, { status: 400 });
  }

  const existingUser = await getUserById(id);
  if (!existingUser) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const { displayName, aboutMe, profilePic } = parseResult.data;
  const profilePicId = profilePic
    ? await uploadNewImage({ file: profilePic, owner: id })
    : undefined;

  if (!profilePicId && profilePic) {
    return Response.json({ error: 'Invalid picture' }, { status: 400 });
  }

  if (existingUser.profilePicturePath && !existingUser.externalProfilePic) {
    deleteImage(existingUser.profilePicturePath);
  }

  const query = createPatchQuery(id, { displayName, aboutMe, profilePicId });

  if (!query) {
    return Response.json({ error: 'No fields to update' }, { status: 400 });
  }
  const userRaw = await pool.query(query.query, query.values);

  return Response.json(userRaw.rows[0], {
    status: 200,
  });
}

function createPatchQuery(
  id: string,
  data: {
    displayName?: string;
    aboutMe?: string;
    profilePicId?: string;
  }
) {
  if (!data.displayName && !data.aboutMe && !data.profilePicId) {
    return undefined;
  }

  let values = [id];
  const valueMappings = Object.entries(data)
    .filter(([_, param]) => param !== undefined && param !== null)
    .map(([key, val], idx) => {
      let column = '';
      switch (key) {
        case 'displayName':
          column = 'display_name';
          break;
        case 'aboutMe':
          column = 'about_me';
          break;
        case 'profilePicId':
          column = 'profile_pic';
          break;
      }
      values = values.concat([val]);
      return `${column} = $${idx + 2}::text`;
    })
    .join(', ');
  
  console.log('data', data);
  console.log('valueMappings', valueMappings);
  console.log('values', values);

  const query = `UPDATE users SET ${valueMappings} WHERE id = $1::text RETURNING *`;

  return { query, values };
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
    `DELETE FROM users WHERE id = $1::text RETURNING *`,
    [id]
  );

  if (query.rowCount === 0) {
    return Response.json({ error: 'Post not found' }, { status: 404 });
  }

  const fileId = query.rows[0].profile_picture;
  if (fileId) {
    deleteImage(fileId);
  }

  return Response.json(query.rows[0], { status: 200 });
}

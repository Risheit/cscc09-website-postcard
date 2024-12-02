import { NextRequest } from 'next/server';
import { authorizeSession } from '@/app/api/auth/config';
import { zfd } from 'zod-form-data';
import { uploadNewImage } from '@/backend/bucket';
import DbSession from '@/app/models/DbSession';
import { createRoom } from '@/backend/rooms';

const createRoomSchema = zfd.formData({
  image: zfd.file(),
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

      const parseResult = createRoomSchema.safeParse(formData);
      if (!parseResult.success) {
        return Response.json(
          { error: parseResult.error.issues },
          { status: 400 }
        );
      }

      const { image } = parseResult.data;

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
      } else {
        return Response.json({ error: 'Missing image' }, { status: 400 });
      }

      const res = await createRoom(fileId);

      return Response.json(res, { status: 200 });
    }
  );
}

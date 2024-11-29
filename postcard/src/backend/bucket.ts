import { writeFile, readFile, unlink, readdir } from 'fs/promises';
import ImageCache from '@/backend/image-cache';
import { resolve } from 'path';

const bucketPath = process.env.UPLOADS_PATH || '/usr/share/uploads';
const imagePath = resolve(process.cwd(), `${bucketPath}/images`);

type UploadedFile = {
  file: File;
  owner: string;
};

async function ifImageExists(id: string) {
  const files = await readdir(imagePath);
  const foundFile = files.find((file) => {
    const basename = file.substring(0, file.lastIndexOf('.'));
    return basename === id
  });
  return foundFile;
}

export async function uploadNewImage(image: UploadedFile) {
  const { file, owner } = image;

  if (!file.type.includes('image')) {
    return undefined;
  }

  const suffix = file.type.split('/')[1];

  let fileId = `${owner}_${Date.now()}`;
  while (await ifImageExists(fileId)) {
    fileId = `${owner}_${Date.now()}`;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFile(`${imagePath}/${fileId}.${suffix}`, buffer);
  const cached = new File([buffer], `${fileId}.${suffix}`, { type: file.type });
  ImageCache.insert(fileId, cached);
  return fileId;
}

export async function collectImage(id: string) {
  const cacheResult = ImageCache.query(id);
  if (cacheResult) {
    console.log('pulling from cache...', cacheResult);
    return cacheResult;
  }

  const imageFile = await ifImageExists(id);
  if (!imageFile) {
    return undefined;
  }

  const ext = imageFile.split('.').pop();
  const buffer = await readFile(`${imagePath}/${imageFile}`);
  const file = new File([buffer], imageFile, { type: `image/${ext}` });
  ImageCache.insert(id, file);
  return file;
}

export async function deleteImage(id: string) {
  ImageCache.delete(id);

  const imageFile = await ifImageExists(id);
  if (!imageFile) {
    return { success: false };
  }

  await unlink(`${imagePath}/${id}`);
  return { success: true };
}

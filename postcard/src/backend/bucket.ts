import { writeFile, readFile, unlink, readdir } from "fs/promises";
import ImageCache from "@/backend/image-cache";
import { basename } from "path";

const bucketPath = process.env.UPLOADS_PATH || '/usr/share/uploads';
const imagePath = `${bucketPath}/images`;

type UploadedFile = {
    file: File;
    owner: number;
};

async function ifImageExists(id: string) {
    const files = await readdir(imagePath);
    return files.find((file) => basename(file) === id);
}

export async function uploadNewImage(image: UploadedFile) {
    const { file, owner } = image;

    if (!file.type.includes('image')) {
        throw new Error('Invalid file type');
    }

    const suffix = file.type.split('/')[1];

    let file_id = `${owner}_${Date.now()}`;
    while (await ifImageExists(file_id)) {
        file_id = `${owner}_${Date.now()}`;
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    writeFile(`${imagePath}/${file_id}.${suffix}`, buffer);
    ImageCache.insert(file_id, file);
    return file_id;
}

export async function collectImage(id: string) {
    const cacheResult = ImageCache.query(id);
    if (cacheResult) {
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
        return;
    }

    return unlink(`${imagePath}/${id}`);
}
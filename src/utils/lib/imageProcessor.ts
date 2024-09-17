import { parentPort } from 'worker_threads';
import sharp from 'sharp';
import { Readable } from 'stream';
import { putObjectR2 } from '../../services/3rdParty/Cloudflare/r2'; // Adjust the path

export async function processAndUploadImage(buffer: Buffer, bucketName: string, userId: string, fileOriginalName: string) {
    const objectKey = `${userId}/${fileOriginalName.replace(/\.[^/.]+$/, '')}.webp`;

    const transformer = sharp()
        .resize({
            width: 1200,
            height: 800,
            fit: 'inside'
        })
        .webp({ quality: 80 });

    const readableStream = Readable.from(buffer);
    const processedStream = readableStream.pipe(transformer);

    await putObjectR2(bucketName, objectKey, processedStream);

    return { success: true, uri: objectKey };
}

parentPort?.on('message', async (data) => {

    console.log(data, "VOOU")
    try {
        const result = await processAndUploadImage(data.buffer, data.bucketName, data.userId, data.fileOriginalName);
        parentPort?.postMessage(result);
    } catch (error) {
        parentPort?.postMessage({ success: false, error: (error as Error).message });
    }
});

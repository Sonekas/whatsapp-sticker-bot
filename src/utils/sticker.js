import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import webpmux from 'node-webpmux';

// Configura o fluent-ffmpeg para usar o binário estático baixado via npm
ffmpeg.setFfmpegPath(ffmpegStatic);

function createExif(packname, author) {
    const json = {
        "sticker-pack-id": crypto.randomBytes(32).toString('hex'),
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        "emojis": ["🤖"]
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    return exif;
}

async function addExif(webpBuffer) {
    const img = new webpmux.Image();
    await img.load(webpBuffer);
    const exif = createExif('bot fig sonekas', '🤖');
    img.exif = exif;
    return await img.save(null);
}

/**
 * Converte um buffer de imagem para uma figurinha estática (WebP)
 */
async function createStickerFromImage(imageBuffer) {
    const webpBuffer = await sharp(imageBuffer)
        .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 80 })
        .toBuffer();
    
    return await addExif(webpBuffer);
}

/**
 * Converte um buffer de vídeo/GIF para uma figurinha animada (WebP)
 */
async function createStickerFromVideo(videoBuffer) {
    return new Promise((resolve, reject) => {
        const tempId = crypto.randomBytes(16).toString('hex');
        const tempVideoPath = path.join(os.tmpdir(), `${tempId}.mp4`);
        const tempWebpPath = path.join(os.tmpdir(), `${tempId}.webp`);

        // Salva arquivo temporário para o ffmpeg processar
        fs.writeFileSync(tempVideoPath, videoBuffer);

        ffmpeg(tempVideoPath)
            .inputOptions(['-t 6']) // Força limite de 6 segundos de leitura, por segurança
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=\'min(512,iw)\':min\'(512,ih)\':force_original_aspect_ratio=decrease,fps=10,pad=512:512:-1:-1:color=white@0.0,split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse',
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
            ])
            .toFormat('webp')
            .on('end', async () => {
                try {
                    const webpBuffer = fs.readFileSync(tempWebpPath);
                    // Deleta temporários
                    fs.unlinkSync(tempVideoPath);
                    fs.unlinkSync(tempWebpPath);
                    
                    const finalBuffer = await addExif(webpBuffer);
                    resolve(finalBuffer);
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (err) => {
                try {
                    // Tenta limpar em caso de erro no ffmpeg
                    if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
                    if (fs.existsSync(tempWebpPath)) fs.unlinkSync(tempWebpPath);
                } catch (e) {
                    // Ignora erro de cleanup
                }
                reject(err);
            })
            .save(tempWebpPath);
    });
}

export {
    createStickerFromImage,
    createStickerFromVideo
};

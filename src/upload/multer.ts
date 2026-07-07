import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import multer, { type FileFilterCallback } from 'multer';
import { env } from '../config/env';
import { badRequest } from '../errors/AppError';

const uploadDir = resolve(process.cwd(), env.uploadDir);

/** Configured Multer instance: local disk storage, image-only, size-limited. */
export const upload = multer({
  storage: multer.diskStorage({
    destination: async (
      _req,
      _file,
      cb: (error: Error | null, destination: string) => void,
    ): Promise<void> => {
      await mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (_req, file, cb: (error: Error | null, filename: string) => void): void => {
      const ext = extname(file.originalname) || '';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: env.uploadMaxBytes },
  fileFilter: (_req, file, cb: FileFilterCallback): void => {
    if (/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(badRequest('Only image files (png, jpg, jpeg, gif, webp) are allowed.'));
    }
  },
});

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir('./uploads/resumes');
ensureDir('./uploads/avatars');
ensureDir('./uploads/logos');
ensureDir('./uploads/certificates');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/misc';
    if (file.fieldname === 'resume') folder = 'uploads/resumes';
    else if (file.fieldname === 'avatar') folder = 'uploads/avatars';
    else if (file.fieldname === 'logo') folder = 'uploads/logos';
    else if (file.fieldname === 'certificate') folder = 'uploads/certificates';
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    resume: ['.pdf', '.doc', '.docx'],
    avatar: ['.jpg', '.jpeg', '.png', '.webp'],
    logo: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
    certificate: ['.pdf', '.jpg', '.jpeg', '.png'],
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = allowedTypes[file.fieldname] || ['.pdf', '.jpg', '.png'];

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

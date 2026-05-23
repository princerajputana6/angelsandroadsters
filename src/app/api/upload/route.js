import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getCurrentUser } from '@/lib/auth';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function generateSignature(paramsToSign) {
  // Sort params alphabetically and join as key=value pairs
  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');
  return createHmac('sha256', API_SECRET).update(sorted + API_SECRET).digest('hex');
}

async function uploadToCloudinary(fileBuffer, fileName, mimeType) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'angels-roadsters';

  const paramsToSign = { folder, timestamp };
  const signature = generateSignature(paramsToSign);

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append('file', blob, fileName);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json();
  return data.secure_url;
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    // Allow up to 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5 MB.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use Cloudinary if configured, otherwise fall back to local disk
    if (CLOUD_NAME && API_KEY && API_SECRET) {
      const url = await uploadToCloudinary(buffer, file.name, file.type);
      return NextResponse.json({ success: true, url, size: file.size, type: file.type });
    }

    // Local fallback (dev without Cloudinary credentials)
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 10);
    const ext = file.name.split('.').pop();
    const filename = `${timestamp}-${rand}.${ext}`;
    await writeFile(join(uploadsDir, filename), buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }
}

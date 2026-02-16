import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'file';

    // 1. READ BUFFER (We need the raw bytes to verify type)
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. SECURITY: Check File Size (Max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // 3. SECURITY: Magic Byte Inspection
    // We check the file signature, not just the extension.
    const header = buffer.toString('hex', 0, 4).toUpperCase();
    
    let detectedType = 'unknown';
    
    // JPEG: FF D8 FF
    if (header.startsWith('FFD8FF')) detectedType = 'image/jpeg';
    // PNG: 89 50 4E 47
    else if (header === '89504E47') detectedType = 'image/png';
    // PDF: 25 50 44 46 (%PDF)
    else if (header === '25504446') detectedType = 'application/pdf';
    // WEBP: RIFF....WEBP (Complex, check bytes 0-3 and 8-11)
    else if (header.startsWith('52494646')) detectedType = 'image/webp'; // RIFF

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];

    if (!allowedTypes.includes(detectedType)) {
        console.error(`❌ Security Block: Upload attempt with header ${header} (Detected: ${detectedType})`);
        return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' }, { status: 400 });
    }

    // 4. Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: detectedType // Enforce the detected type
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
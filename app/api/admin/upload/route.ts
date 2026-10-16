import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest, isCsrfValid } from '@/lib/admin';
import { detectImageKind, IMAGE_KIND_INFO, NOT_ALLOWED_MESSAGE } from '@/lib/upload-types';

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isCsrfValid(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const bucket = (form.get('bucket') as string | null) ?? 'team-photos';
  const folder = ((form.get('folder') as string | null) ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Trust the file's real contents, never its name or the type the browser reports.
  const bytes = await file.arrayBuffer();
  const kind = detectImageKind(new Uint8Array(bytes.slice(0, 16)));
  if (!kind) {
    return NextResponse.json({ error: `This is not a valid image file. ${NOT_ALLOWED_MESSAGE}` }, { status: 400 });
  }
  if (kind === 'heic') {
    return NextResponse.json({ error: 'HEIC images must be converted to JPEG before upload.' }, { status: 400 });
  }
  const { mime, ext } = IMAGE_KIND_INFO[kind];

  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = folder ? `${folder}/${name}` : name;

  const supabase = getSupabaseAdmin();

  // Ensure bucket exists and is public
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === bucket)) {
    await supabase.storage.createBucket(bucket, { public: true });
  }

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: mime,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

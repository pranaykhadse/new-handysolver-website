import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest, isCsrfValid } from '@/lib/admin';

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

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const allowed = ['jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'webp', 'avif', 'gif'];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'File type not allowed. Use JPG, JPEG, JFIF, PNG, WEBP, AVIF, GIF or HEIC.' }, { status: 400 });
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = folder ? `${folder}/${name}` : name;
  const bytes = await file.arrayBuffer();

  const supabase = getSupabaseAdmin();

  // Ensure bucket exists and is public
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === bucket)) {
    await supabase.storage.createBucket(bucket, { public: true });
  }

  const jfifTypes = ['jfif', 'pjpeg', 'pjp'];
  const contentType = jfifTypes.includes(ext) ? 'image/jpeg' : file.type;

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

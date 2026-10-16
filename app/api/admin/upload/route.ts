import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin';

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const bucket = (form.get('bucket') as string | null) ?? 'team-photos';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const supabase = getSupabaseAdmin();

  // Ensure bucket exists and is public
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === bucket)) {
    await supabase.storage.createBucket(bucket, { public: true });
  }

  const { error } = await supabase.storage.from(bucket).upload(filename, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}

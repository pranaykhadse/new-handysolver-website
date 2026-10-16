export const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'avif', 'gif', 'heic', 'heif'];
export const IMAGE_ACCEPT = ALLOWED_IMAGE_EXTS.map(e => `.${e}`).join(',');
export const ALLOWED_IMAGE_LABEL = 'JPG, JPEG, JFIF, PNG, WEBP, AVIF, GIF, HEIC';

export type ImageKind = 'jpeg' | 'png' | 'gif' | 'webp' | 'avif' | 'heic';

export const IMAGE_KIND_INFO: Record<ImageKind, { mime: string; ext: string }> = {
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
  png: { mime: 'image/png', ext: 'png' },
  gif: { mime: 'image/gif', ext: 'gif' },
  webp: { mime: 'image/webp', ext: 'webp' },
  avif: { mime: 'image/avif', ext: 'avif' },
  heic: { mime: 'image/heic', ext: 'heic' },
};

const ascii = (b: Uint8Array, start: number, len: number) =>
  String.fromCharCode(...Array.from(b.subarray(start, start + len)));

// Identify an image by its real file signature, ignoring the file name and the browser-reported type.
export function detectImageKind(b: Uint8Array): ImageKind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b[0] === 0x89 && ascii(b, 1, 3) === 'PNG' && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png';
  if (b.length >= 6 && (ascii(b, 0, 6) === 'GIF87a' || ascii(b, 0, 6) === 'GIF89a')) return 'gif';
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'webp';
  if (b.length >= 12 && ascii(b, 4, 4) === 'ftyp') {
    const brand = ascii(b, 8, 4);
    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1', 'heif'].includes(brand)) return 'heic';
  }
  return null;
}

export const NOT_ALLOWED_MESSAGE = `Only ${ALLOWED_IMAGE_LABEL} images are allowed.`;

// Returns an error message, or null when the file really is an allowed image.
export async function checkImageFile(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) return `${file.name}: ${NOT_ALLOWED_MESSAGE}`;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!detectImageKind(head)) return `${file.name}: this is not a valid image file. ${NOT_ALLOWED_MESSAGE}`;
  return null;
}

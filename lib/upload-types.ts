export const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'avif', 'gif', 'heic', 'heif'];
export const IMAGE_ACCEPT = ALLOWED_IMAGE_EXTS.map(e => `.${e}`).join(',');
export const ALLOWED_IMAGE_LABEL = 'JPG, JPEG, JFIF, PNG, WEBP, AVIF, GIF, HEIC';

export function isAllowedImage(file: { name: string }): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_IMAGE_EXTS.includes(ext);
}

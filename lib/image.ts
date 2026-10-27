// Picks a right-sized, modern-format copy of a picture. On the live site Vercel resizes and caches it
// (see `images` in next.config.ts); in local development the original file is used untouched.
// Widths must be in Next's allowed list: its default imageSizes and deviceSizes.
const WIDTHS = [128, 256, 384, 640, 828, 1080, 1920];
const OPTIMISABLE = /\.(jpe?g|png|webp)(\?.*)?$/i;
const live = process.env.NODE_ENV === 'production';

function at(src: string, width: number, quality = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

export function responsiveImage(src: string, sizes: string, widths: number[] = [384, 640, 828, 1080]): { src: string; srcSet?: string; sizes?: string } {
  if (!live || !OPTIMISABLE.test(src)) return { src };
  const usable = widths.filter(w => WIDTHS.includes(w));
  return {
    src: at(src, usable[Math.min(1, usable.length - 1)]),
    srcSet: usable.map(w => `${at(src, w)} ${w}w`).join(', '),
    sizes,
  };
}

// For small fixed-size pictures such as the logo: one copy for normal screens and one for sharp screens.
export function fixedImage(src: string, width: number): { src: string; srcSet?: string } {
  if (!live || !OPTIMISABLE.test(src)) return { src };
  const double = WIDTHS.find(w => w >= width * 2) ?? WIDTHS[WIDTHS.length - 1];
  const single = WIDTHS.find(w => w >= width) ?? double;
  return { src: at(src, single), srcSet: `${at(src, single)} 1x, ${at(src, double)} 2x` };
}

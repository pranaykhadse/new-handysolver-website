// The old handysolver.com website served these pictures from /assets/. That address now belongs to this site,
// so the files that could be recovered are kept in public/legacy and old links are pointed there.
const RECOVERED = new Set([
  'images/client/mischa-handysolver-client.png',
  'images/client/scondee-logo.png',
  'images/client/shawn-handysolver-client.png',
  'images/dummy/urban_square_office_suites.jpg',
  'images/employees/Ajay.jpg',
  'images/employees/Kanchan.jpg',
  'images/employees/Lakshay.jpg',
  'images/employees/Mayank.jpg',
  'images/employees/Meena.jpg',
  'images/employees/Navneet.jpg',
  'images/employees/Piyush.jpg',
  'images/employees/Rahul.jpg',
  'images/employees/Ravi.jpg',
  'images/employees/Saleem.png',
  'images/employees/Sanjesh.JPG',
  'images/employees/Satish.jpg',
  'images/employees/Saurabh.jpg',
  'images/employees/Shubham.jpg',
  'images/employees/Sufiyan.jpg',
  'images/employees/Vinay.jpg',
  'images/employees/Yashwant.jpg',
  'images/employees/abhishek-bw.jpg',
  'images/employees/aravind.jpg',
  'images/employees/ashi-bw.jpg',
  'images/employees/isa-bw.jpg',
  'images/employees/manisha.jpg',
  'images/employees/manmohan-bw.jpg',
  'images/employees/manmohan.jpg',
  'images/employees/manoj.jpg',
  'images/employees/neerad-bw.jpg',
  'images/employees/neha-bw.jpg',
  'images/employees/paranay-bw.png',
  'images/employees/ravi-pratap.jpg',
  'images/employees/sachin.jpg',
  'images/employees/sagar.jpg',
  'images/employees/sourabh-bw.png',
  'images/employees/vishnu.jpg',
  'images/rock-n-roll/birthday-cake.jpg',
  'images/rock-n-roll/foosball-short.jpg',
  'images/rock-n-roll/table-tennis.jpg',
]);

const OLD_HOST = /^https?:\/\/(www\.)?handysolver\.com\/assets\//i;

// Returns the same address for anything that is not an old-site picture. Old-site pictures that could not be
// recovered return an empty string, so callers can skip them instead of showing a broken image.
export function legacyAsset(url: string | null | undefined): string {
  if (!url) return '';
  if (!OLD_HOST.test(url)) return url;
  const path = decodeURIComponent(url.replace(OLD_HOST, '').split(/[?#]/)[0]);
  return RECOVERED.has(path) ? `/legacy/${path}` : '';
}

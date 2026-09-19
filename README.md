This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Roadtrip

`/roadtrip` reuses the site's typography, colors, paper texture, and administrator login.

- Upload multiple JPG, PNG, or WebP photos. The browser reads GPS and capture time before resizing; the server validates and converts the image to WebP, at most 1920 pixels on its longest side.
- Select a photo on the map or in the list to view its memo. Administrators can edit the memo and coordinates, pick a location on the map, or delete the photo.
- Photos without GPS remain in the list and can be located manually. Photos, memos, and coordinates are publicly visible, just like the gallery.
- The app stores metadata in `data/roadtrip.json` and images in `public/uploads/roadtrip/`. Keep both existing persistent mounts when deploying. File-backed writes are serialized within one Node process; run one app instance against these files.

Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` for local use. Enable Maps JavaScript API and permit the site's domain and localhost in the key's HTTP referrer restrictions.

The Docker build accepts the same variable as a build argument. The production workflow reads the repository Actions variable `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; configure it before deployment. This browser key is delivered to visitors by design, so restrict its allowed APIs and referrers. No key value is committed.

Run `npm run lint`, `npm run build`, and `npm run test:roadtrip`. Browser tests use Edge on Windows or Playwright Chromium elsewhere; install Chromium with `npx playwright install chromium` when necessary. Tests require local login environment settings and a working Maps key, use port 3100, create temporary photos, and remove them afterward.

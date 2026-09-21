# HandySolver developer handoff

Complete source snapshot of the published website, including all latest fixes and the careers floating open-roles button.

## Stack
React 19, TypeScript, Vinext (Next.js-compatible routing), Vite 8, Tailwind CSS 4, Radix UI and Lucide icons. The existing build targets Cloudflare Workers. This is a source project, not standalone HTML.

## Local setup
Use Node.js 22.13 or newer and npm. Extract the ZIP and open the handysolver directory.

```sh
npm ci
npm run dev
```
Open the local address printed by Vite. Linux/macOS shells support the provided scripts; Windows users can use WSL.

## Build
```sh
npm run build
npm start
```
The supplied build wrapper requires Bash and GNU timeout (Linux/WSL). On systems without GNU timeout, use `npx vinext build` directly. The production source passed the build in the original environment; the ZIP has not been run on your developer's machine.

## Pages
- / : homepage, case studies, service cards, workflow audit, testimonials and process
- /careers : culture and floating open-roles link
- /careers/open-roles : live vacancies and links to apply
- /team : team page
- /lets-talk : WhatsApp and email contact options
- /api/open-roles : server-side recruitment feed

## Where to edit
Pages and feature styles are in app/. Shared UI primitives are in components/ui/. Local images are in public/. Case-study content is in app/case-study-showcase.tsx. Testimonials are in app/testimonials.tsx. Navigation is in app/playful-header.tsx.

## External services and assets
Open roles fetch data from handysolver.myhandydash.com; candidate applications use the existing recruitment portal. Contact actions open WhatsApp (+91 9971815001) or email (connect@handysolver.com). They do not submit to a new database in this website. Some team/office images remain hosted on handysolver.com and require network access. Review these integrations and image URLs when moving domains.

## Hosting handoff
Preserve the existing Vite/Vinext and Worker configuration when targeting Cloudflare. The .openai/hosting.json file identifies the existing ChatGPT Site; it is not a hosting credential. For independent hosting, your developer must configure their own Cloudflare account/deployment, or adapt the application to another runtime. An ordinary static HTML upload will not support the live roles API.

## Contents
Tracked source, local assets, package-lock.json and configuration are included. Dependencies, Git history, caches and generated build output are excluded. No account credentials are supplied. START-HERE.md is the handoff guide; older scaffold README material may describe the original environment.

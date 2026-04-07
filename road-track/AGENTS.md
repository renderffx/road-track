<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

# RoadTrack Project Rules

## Stack
- Next.js 16.2 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Leaflet (maps)

## Commands
```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint check
```

## Key Paths
- Main app: `src/app/page.tsx`
- Admin: `src/app/admin/page.tsx`
- Components: `src/components/`
- Store: `src/store/index.ts`
- API routes: `src/app/api/`

## Database
Uses in-memory storage by default. For persistence, add Upstash KV:
```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

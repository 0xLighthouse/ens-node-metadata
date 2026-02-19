# Docs

```sh
# Local docs dev server
pnpm --dir apps/docs dev

# Regenerate schema pages from packages/schemas/published
pnpm --dir apps/docs schemas:generate
```

## Deploy to Vercel (separate project)

Use a dedicated Vercel project for docs (`apps/docs`), separate from `apps/interface`.

```sh
# One-time: link docs directory to a Vercel project
pnpm dlx vercel link --cwd apps/docs

# Preview deployment
pnpm dlx vercel --cwd apps/docs

# Production deployment
pnpm dlx vercel --cwd apps/docs --prod
```

Notes:
- `apps/docs/vercel.json` builds docs with `pnpm build` and serves `dist`.
- Keep docs and interface linked from their own directories so each has its own `.vercel/project.json`.

# ENS Metadata Manager

The goal of this interface is to surface as much derived onchain as information.

## Getting Started

```bash
yarn dev
```

## UI

We use [shadcn](https://ui.shadcn.com/) for now.

```sh
npx shadcn@latest add button
```

## Domain Tree Layout

- The tree uses a fixed node size based on the card dimensions.
- After layout, visible node bounds are measured and auto-fit/centered within the viewport with padding.
- Zoom scales the fitted layout; collapsing/expanding nodes recalculates the bounds.

# Claude Development Notes - Interface App

## Package management

- Use `pnpm` to manage packages

## UI Conventions

### Icons

- **Always use `lucide-react` icons** - Never create custom SVG icons unless explicitly instructed
- Import icons from `lucide-react` package: `import { IconName } from 'lucide-react'`
- Common icons used in the project:
  - `Search` - Search/inspect functionality
  - `Loader2` - Loading spinners (use with `animate-spin` class)
  - `ChevronUp` / `ChevronDown` - Collapse/expand controls
  - `Plus` - Add/create actions
  - `ExternalLink` - External links
  - `Lock` - Security/address display
  - `DollarSign` - Treasury/financial nodes

## Store Architecture

### Primary Store: `useAppStore` (`/stores/app.ts`)

- **Main application state management**
- Handles authentication, user data, and space management
- **Persists**: `user`, `activeSpace` (but NOT `availableSpaces` - always fetched fresh)
- **Key functions**:
  - `initialize()` - called on app startup to restore auth state and fetch spaces
  - `setBearerToken()` - sets token and triggers space fetching
  - `setActiveSpace()` - used by space selection components
  - `fetchSpaces()` - fetches available spaces via GraphQL

### Component Usage

- **Space selection**: Uses `useAppStore` (`select-active-space.tsx`)
- **Breadcrumbs**: Uses `useAppStore` (`page-breadcrumbs.tsx`)

### Key Architectural Points

1. **Single source of truth**: `useAppStore` is the primary state manager
2. **Persistence strategy**: Only persist user and activeSpace, always fetch fresh data
3. **Hydration**: App store handles its own persistence without custom hydration logic
4. **Initialization**: App store auto-initializes on client load (`useAppStore.getState().initialize()`)

## Tree Visualization Architecture

The tree visualization uses React Flow (`@xyflow/react`) for rendering and Dagre (`@dagrejs/dagre`) for layout.

**Key Files:**

- `/app/components/tree/Tree.tsx` - Main visualization component
- `/app/components/tree/TreeContainer.tsx` - Container with loading/controls
- `/app/components/tree/TreeControls.tsx` - Control buttons
- `/app/components/tree/nodes/` - Custom node components (DefaultNode, TreasuryNode, SignerNode)
- `/stores/tree-controls.ts` - UI state (selection, orientation, collapse)
- `/hooks/useTreeData.tsx` - Tree data management

**Node Type System:**
Set `node.type` field to render custom node components. Register types in `Tree.tsx` `nodeTypes` object.

**Layout Recompute:**
Call `useTreeControlsStore().triggerLayout()` after dynamic node additions/removals to refit viewport.

## Schemas & Node Editing

**Schemas** define structure and attributes for node types (Treasury, Role, Application, etc.).

**Key Files:**

- `/packages/schemas/src/` - Schema definitions (treasury.ts, application.ts, etc.)
- `/stores/schemas.ts` - Schema store for loading and selection
- `/app/api/schemas/route.ts` - API endpoint to fetch schemas
- `/app/components/tree/drawers/EditNodeDrawer.tsx` - Node property editor with schema selector
- `/app/components/tree/drawers/CreateNodeDrawer.tsx` - Bulk node creator for suggestions

**Schema Flow:**

1. Schemas defined in `/packages/schemas/src/`
2. EditNodeDrawer shows schema selector
3. User selects schema → sets `node.schema` and `node.type`
4. `node.type` determines which custom component renders the node
5. Changes saved to `useTreeEditStore` as pending mutations
6. Preview tree shows changes in real-time

## Contract Inspection & Computed Nodes

**TreasuryNode** has an inspect button that detects Safe multisig contracts via `/app/api/inspect/route.ts`.

**Inspection Flow:**

1. API reads contract with `viem` (requires `RPC_URL` env var)
2. For Safe: reads `getOwners()` and `getThreshold()`
3. Resolves ENS names/avatars for each signer
4. Returns inspection metadata
5. Creates computed child nodes (`isComputed: true`) for signers
6. Computed nodes stored in `parent.inspectionData.computedChildren`
7. Auto-merged into preview tree with special styling (animated amber edges, sparkles icon)

**Computed nodes:**

- Not saved to database (derived from on-chain data)
- Automatically render when parent inspected
- Excluded from Apply Changes dialog
- Visual indicator: sparkles icon (top right)

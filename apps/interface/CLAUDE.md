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

### Legacy Store: `useSpacesStore` (`/stores/spaces.ts`)

- **⚠️ LEGACY/UNUSED** - appears to be old implementation
- Should NOT be used for new components
- Similar functionality to appStore but not connected to the app flow

### Component Usage

- **Space selection**: Uses `useAppStore` (`select-active-space.tsx`)
- **Breadcrumbs**: Uses `useAppStore` (`page-breadcrumbs.tsx`)
- **Context wrapper**: Uses `useSpacesStore` (`SpaceContext.tsx`) - may need migration

### Key Architectural Points

1. **Single source of truth**: `useAppStore` is the primary state manager
2. **Persistence strategy**: Only persist user and activeSpace, always fetch fresh data
3. **Hydration**: App store handles its own persistence without custom hydration logic
4. **Initialization**: App store auto-initializes on client load (`useAppStore.getState().initialize()`)

## Common Issues

- **Wrong store usage**: Always use `useAppStore` for space-related functionality
- **Hydration issues**: App store handles persistence correctly, no need for custom hydration logic
- **Space not showing on refresh**: Usually caused by using `useSpacesStore` instead of `useAppStore`

## Tree Visualization Architecture

### Overview

The ENS domain tree visualization uses `@visx` (Airbnb's D3 wrapper library) for rendering hierarchical tree structures with custom card-style nodes.

### Store: `useTreeControlsStore` (`/stores/tree-controls.ts`)

Manages tree visualization state using Zustand:

**State:**

- `selectedNodeName` - Currently selected node
- `orientation` - 'vertical' or 'horizontal' layout
- `collapsedNodes` - Set of collapsed node names
- `nodePositions` - Custom drag positions (persisted)
- `layoutTrigger` - Counter to trigger layout recompute

**Key Actions:**

- `setSelectedNode()` - Select/deselect nodes
- `setOrientation()` - Toggle between vertical/horizontal
- `toggleNodeCollapsed()` - Collapse/expand individual nodes
- `collapseAll()` - Collapse all nodes with children
- `expandAll()` - Expand all nodes
- `setNodePosition()` - Store custom node position after drag
- `clearNodePositions()` - Reset all custom positions
- `triggerLayout()` - **Recompute layout and fit view** (use after dynamic node changes)
- `reset()` - Reset all state to defaults

**Layout Helper: `triggerLayout()`**

Call this function when you dynamically add/remove nodes and want to recompute the layout:

```typescript
import { useTreeControlsStore } from '@/stores/tree-controls'

const { triggerLayout } = useTreeControlsStore()

// After adding computed nodes or making structural changes
triggerLayout()
```

**When to use:**
- After adding computed nodes (e.g., signers from Safe inspection)
- After bulk node operations that change tree structure
- When layout becomes messy and needs re-fitting
- After programmatic expand/collapse operations

**Note:** Layout automatically recomputes on orientation change, so no need to call manually for that.

### Context: `TreeDataContext` (`/contexts/TreeDataContext.tsx`)

Provides tree data to components:

**Interface:**

```typescript
interface DomainTreeNode {
  name: string
  children?: DomainTreeNode[]
  address?: string
  wearerCount?: number
  maxWearers?: number
  icon?: string
  color?: string
}
```

**Usage:**

- `<DomainTreeProvider>` - Wrap components that need tree data
- `useTreeData()` - Access tree data in components
- `sourceTree` - Canonical tree data (no pending edits)
- `previewTree` - Derived tree with pending creations merged for display
- Currently provides hardcoded sample data for testing

### Components

#### `DomainTree` (`/app/components/tree/DomainTree.tsx`)

Main tree visualization component using @visx:

**Key Features:**

- Uses `@visx/hierarchy` for tree layout calculations
- Uses `@visx/zoom` for zoom/pan functionality
- Memoizes hierarchy creation for performance
- Supports vertical/horizontal orientations
- Filters nodes based on collapse state
- Custom card rendering via `foreignObject`

**Implementation Details:**

- Uses dagre for automatic tree layout
- Fixed node dimensions: 280x100px
- Spacing: `nodesep: 32`, `ranksep: 48`
- Auto-fits and centers visible node bounds after layout
- Handles both vertical (`TB`) and horizontal (`LR`) orientations
- Layout recomputes when tree structure or orientation changes

#### `DomainTreeNodeCard` (`/app/components/tree/DomainTreeNode.tsx`)

Custom card-style node renderer:

**Features:**

- Icon with colored background
- Domain name display (short + full)
- Address display (truncated)
- Wearer count badge
- Collapse/expand button for parent nodes
- Children count badge when collapsed
- Selection state with ring indicator
- Memoized for performance

**Styling:**

- Fixed width: 280px (full) or 200px (compact)
- Fixed height: 100px
- Custom colors per node
- Hover states and transitions

#### `TreeControls` (`/app/components/tree/TreeControls.tsx`)

Control panel with buttons:

**Controls:**

- **Suggestions** - Open suggestions dialog
- **Refresh** - Reload tree data from API
- **Flip Tree** - Switch vertical/horizontal orientation
- **Fit View** - Recompute layout and fit to viewport (useful after dynamic changes)
- **Collapse All / Expand All** - Toggle all node expansion
- **Reset Layout** - Clear all custom node positions (shown only when nodes have been dragged)

#### `TreeContainer` (`/app/components/tree/TreeContainer.tsx`)

Responsive wrapper:

- Uses `@visx/responsive` for automatic sizing
- Uses a viewport-based height via `h-[calc(100vh-12rem)]`
- Provides tree data from context
- Renders controls and tree

### Dependencies

**Core packages:**

- `@xyflow/react` (React Flow) - Node-based graph visualization with zoom/pan
- `@dagrejs/dagre` - Hierarchical graph layout algorithm
- `lucide-react` - Icon library

### Key Architectural Decisions

1. **Dagre for layout** - Automatic hierarchical tree layout
2. **Fixed node dimensions** - All nodes use consistent 280x100px size for predictable layout
3. **Memoization** - Layout calculation and node cards are memoized for performance
4. **Collapse state** - Stored in Set for O(1) lookup, managed centrally in store
5. **React Flow** - Modern flow library with built-in zoom, pan, and node interaction
6. **Dynamic layout recompute** - Trigger system for recalculating layout after structural changes

### Common Patterns

**Adding a new control:**

1. Add state to `useTreeStore`
2. Add action function to store
3. Add button to `TreeControls`
4. Use state in `DomainTree` rendering logic

**Customizing node appearance:**

1. Modify `DomainTreeNode` interface in context
2. Update sample data in `TreeDataContext`
3. Update rendering in `DomainTreeNodeCard`

**Adjusting tree spacing:**

- Modify `nodesep` and `ranksep` in dagre graph configuration (Tree.tsx)
- Adjust padding in `fitView()` calls (default: 0.15)

### Performance Considerations

- **Memoization**: `hierarchy()` is memoized to prevent recalculation on every render
- **Node memoization**: `DomainTreeNodeCard` is wrapped in `memo()` to prevent unnecessary re-renders
- **Filtering before render**: Collapsed nodes are filtered out before rendering, not hidden with CSS
- **Efficient collapse check**: Uses Set for O(1) lookup when checking if node is collapsed

## Schema-Based Node System

### Overview

Nodes can be enhanced with schemas that define their structure and enable custom rendering. Schemas provide typed attributes and metadata for different node types (Treasury, Role, Team, etc.).

### Schema Store: `useSchemaStore` (`/stores/schemas.ts`)

Manages available schemas and schema selection:

**State:**
- `schemas` - Array of available schemas
- `selectedSchemaId` - Currently selected schema ID

**Key Actions:**
- `loadSchemas()` - Load schemas into store
- `fetchSchemas()` - Fetch schemas from API
- `selectSchema()` - Set active schema
- `getSelectedSchema()` - Get currently selected schema

**Schema Interface:**
```typescript
interface Schema {
  id: string
  name: string
  version: string
  description: string
  source: string // GitHub URL or source location
  attributes: SchemaAttribute[]
}

interface SchemaAttribute {
  key: string // Field key (e.g., '_.name', '_.description')
  name: string // Display name
  type: string // Field type ('string', 'number', etc.)
  description: string // Help text
  isRequired: boolean
  notes?: string // Additional notes
}
```

### Schema Package: `@ensipXX/schemas`

Located at `/packages/schemas`, this package contains:
- Schema definitions (e.g., `treasury.ts`, `role.ts`)
- Schema types and interfaces
- Exported as a monorepo package

**Example Schema:**
```typescript
// packages/schemas/src/treasury.ts
export const TREASURY_SCHEMA: Schema = {
  name: 'Treasury',
  version: '1.0.0',
  description: 'A treasury for managing organizational funds and assets.',
  source: 'https://github.com/...',
  attributes: [
    { name: 'Name', type: 'string', key: '_.name', isRequired: true },
    { name: 'Description', type: 'string', key: '_.description', isRequired: false },
    { name: 'Type', type: 'string', key: '_.type', description: 'e.g., Multisig, Safe, DAO' },
  ]
}
```

### Schema API: `/api/schemas`

Stub API for fetching schemas from the `@ensipXX/schemas` package:
- Loads schemas from package
- Adds generated IDs and metadata
- Returns schema list

### Node Edit System

#### NodeEditDrawer (`/app/components/tree/NodeEditDrawer.tsx`)

Drawer component for editing node properties:

**Features:**
- Schema selector component (`SchemaVersion`)
- Dynamic form generation based on selected schema attributes
- Shows extra attributes not in schema (with warning styling)
- Saves both data changes and schema metadata (`schema`, `type` fields)
- Preview changes before applying

**Key Behavior:**
- When schema is selected, sets `node.schema = schema.id` and `node.type = schema.name`
- The `type` field determines which custom node component to render
- Changes are saved to `useTreeEditStore` as pending mutations
- Preview tree merges pending edits for real-time preview

#### SchemaVersion Component (`/app/components/tree/SchemaVersion.tsx`)

Inline schema selector with:
- Schema name heading with external link icon
- Version dropdown with search functionality
- Refresh button to reload schemas
- Compact inline display

### Custom Node Types

Nodes can have custom rendering based on their `type` field:

#### TreasuryNode (`/app/components/tree/nodes/TreasuryNode.tsx`)

Custom node for Treasury type with:

**Visual Styling:**
- Amber color scheme (#f59e0b)
- Double width (560px vs 280px default)
- Larger icon (80px) with dollar sign
- Enhanced shadows and borders
- "TREASURY" badge

**Inspect Feature:**
- Circular inspect button at bottom center edge of card
- Positioned absolutely: `-bottom-6` with white border
- Detects Safe multisig contracts on-chain
- Shows detected type and metadata (threshold, signers)
- Uses `/api/inspect` endpoint

**Inspect Button:**
- 48px circular button
- Amber background with white icon
- Shows Search icon (default) or Loader2 (inspecting)
- Positioned at bottom center edge of card

**Inspection Results Display:**
- Shows detected contract type (e.g., "Safe Multisig")
- Displays threshold ratio (e.g., "3/5")
- Shows signer count
- Includes inspection timestamp
- Styled with amber theme matching card

### Inspect API: `/app/api/inspect/route.ts`

Next.js API endpoint for contract inspection:

**Features:**
- Accepts node data (address, type)
- Uses `viem` with RPC provider to read contract state
- For Treasury nodes, attempts to detect Safe multisig
- Reads `getOwners()` and `getThreshold()` from Safe contract
- Falls back to EOA detection via bytecode check
- Returns structured inspection data

**Environment:**
- Requires `RPC_URL` environment variable (or uses public RPC fallback)
- See `.env.example` for setup instructions

**Response Format:**
```typescript
{
  address: string
  type: string
  detectedType: string | null // e.g., "Safe Multisig", "EOA"
  metadata: {
    signers?: Array<{
      address: Address
      ensName: string | null
      ensAvatar: string | null
    }>
    threshold?: number
    signerCount?: number
    thresholdRatio?: string // e.g., "3/5"
    note?: string
  }
}
```

**Usage Flow:**
1. User clicks inspect button on TreasuryNode
2. POST request to `/api/inspect` with node data
3. API attempts Safe contract detection
4. If Safe detected:
   - Reads signer addresses from `getOwners()`
   - Resolves ENS names for each signer using `getEnsName()`
   - Fetches ENS avatars for resolved names using `getEnsAvatar()`
   - Returns array of `{ address, ensName, ensAvatar }` objects
5. Results saved to `node.inspectionData` via `useTreeEditStore`
6. Computed signer child nodes created with ENS data
7. Inspection metadata displayed on card
8. Layout auto-triggers to refit view
9. Changes applied when user confirms mutations

### Computed Nodes

Nodes marked with `isComputed: true` are derived from on-chain data and not user-created:

**Key Properties:**
- `isComputed: true` - Marks node as computed/derived
- Not added to `pendingMutations` queue
- Stored in parent's `inspectionData.computedChildren`
- Automatically included in preview tree
- Not displayed in Apply Changes dialog (only parent inspection is shown)

**Example: Safe Signers**
When a Treasury node is inspected and detected as Safe multisig:
1. Signer addresses fetched from `getOwners()`
2. ENS names and avatars resolved for each signer address
3. Signer nodes created with `isComputed: true` and `type: 'Signer'`
4. Stored in `treasuryNode.inspectionData.computedChildren`
5. Preview tree merges computed children automatically
6. Signers render with `SignerNode` component
7. Visual grouping via amber edges and "AUTO" badge

**Visual Grouping:**
- Edges from Treasury to Signers: Amber color (#f59e0b), thicker (2px), animated
- Signer nodes: Indigo theme with "AUTO" badge
- Edge type: `straight` for computed children vs `default` for normal children

### Node Types

**SignerNode** (`/app/components/tree/nodes/SignerNode.tsx`)
- Compact node for Safe multisig signers
- Indigo color scheme (#6366f1)
- 320px width (smaller than default)
- Shows "SIGNER" badge + "AUTO" badge if computed
- **ENS Integration:**
  - Displays ENS name as primary label if resolved
  - Shows ENS avatar if available (otherwise shows UserCheck icon)
  - Falls back to signer address display if no ENS name
- Displays signer address in footer

### Node Type Registration

Register custom node types in `Tree.tsx`:

```typescript
import { DefaultNode, TreasuryNode } from './nodes'

const nodeTypes = {
  default: DefaultNode,
  Treasury: TreasuryNode,
}

// Node type determined by node.type field
const nodeType = (node as any).type || 'default'
```

### Tree Data Hooks: `useTreeData()`

**Key Concepts:**
- `sourceTree` - Original tree data from API (no pending changes)
- `previewTree` - Computed tree with pending edits, creations, AND computed children merged
- Preview tree updates automatically when mutations change
- Allows real-time preview of schema changes before applying

**Preview Merging:**
```typescript
const mergePendingChanges = (node) => {
  // Apply pending edits (including schema/type changes)
  const pendingEdit = pendingMutations.find(m => !m.isCreate && m.nodeName === node.name)
  if (pendingEdit?.changes) {
    node = { ...node, ...pendingEdit.changes }
  }

  // Merge pending creations
  const creations = pendingMutations.filter(m => m.isCreate && m.parentName === node.name)
  // ... add created nodes as children

  // Add computed children from inspection data
  const computedChildren = node.inspectionData?.computedChildren || []

  // Combine all children
  const allChildren = [...processedChildren, ...pendingNodes, ...computedChildren]
}
```

**Node Interface Fields:**
```typescript
interface BaseTreeNode {
  // ... other fields
  isPendingCreation?: boolean // User-created, pending save
  isComputed?: boolean // Derived from on-chain data
  inspectionData?: {
    detectedType?: string
    metadata?: Record<string, any>
    inspectedAt?: string
    computedChildren?: TreeNodes[] // Auto-generated child nodes
  }
}
```

### Apply Changes Dialog

Shows pending changes before applying:
- Groups changes into "Added" and "Modified" sections
- Filters out empty/null values
- Displays schema and type changes
- Shows nested node creations recursively
- **Excludes** inspectionData and computed nodes (visible in preview tree instead)
- Counts total changes across all mutations (excluding computed nodes)

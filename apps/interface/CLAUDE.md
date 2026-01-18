# Claude Development Notes - Interface App

## Package management

- Use `pnpm` to manage packages

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

### Store: `useTreeStore` (`/stores/tree.ts`)

Manages tree visualization state using Zustand:

**State:**

- `selectedNodeName` - Currently selected node
- `orientation` - 'vertical' or 'horizontal' layout
- `viewMode` - 'full' or 'compact' node display
- `zoomLevel` - Current zoom level (0.1 to 3)
- `collapsedNodes` - Set of collapsed node names

**Key Actions:**

- `setSelectedNode()` - Select/deselect nodes
- `setOrientation()` - Toggle between vertical/horizontal
- `setViewMode()` - Toggle between full/compact card view
- `toggleNodeCollapsed()` - Collapse/expand individual nodes
- `collapseAll()` - Collapse all nodes with children
- `expandAll()` - Expand all nodes
- `zoomIn()` / `zoomOut()` / `resetZoom()` - Zoom controls

### Context: `DomainTreeContext` (`/contexts/DomainTreeContext.tsx`)

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
- `useDomainTree()` - Access tree data in components
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

- Uses `LinkVertical`/`LinkHorizontal` from `@visx/shape` with orientation-aware accessors
- Separation algorithm: `(a.parent === b.parent ? 1 : 1.2)`
- Auto-fits and centers visible node bounds after layout; zoom scales the fitted layout
- Handles both vertical and horizontal layouts
- Node spacing derives from card dimensions plus minimal padding

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

- **Compact View / Show Full Tree** - Toggle node detail level
- **Flip Tree** - Switch vertical/horizontal orientation
- **Collapse All / Expand All** - Toggle all node expansion
- **Zoom Controls** - +/- buttons with percentage display

#### `DomainTreeContainer` (`/app/components/tree/DomainTreeContainer.tsx`)

Responsive wrapper:

- Uses `@visx/responsive` for automatic sizing
- Uses a viewport-based height via `h-[calc(100vh-12rem)]`
- Provides tree data from context
- Renders controls and tree

### Dependencies

**@visx packages:**

- `@visx/hierarchy` - Tree layout algorithms
- `@visx/zoom` - Zoom and pan functionality
- `@visx/group` - SVG group positioning
- `@visx/responsive` - Responsive sizing
- `@visx/gradient` - Linear gradients
- `@visx/shape` - Link components (LinkVertical/LinkHorizontal)

### Key Architectural Decisions

1. **Cartesian layout only** - Polar layout was removed due to complexity and overlapping issues
2. **Fixed node sizes** - 280x100px (full) or 200x100px (compact) for consistent spacing
3. **Memoization** - Hierarchy creation and node cards are memoized for performance
4. **Collapse state** - Stored in Set for O(1) lookup, managed centrally in store
5. **visx over raw D3** - Better React integration, less imperative DOM manipulation
6. **foreignObject for nodes** - Allows HTML/React components instead of pure SVG

### Common Patterns

**Adding a new control:**

1. Add state to `useTreeStore`
2. Add action function to store
3. Add button to `TreeControls`
4. Use state in `DomainTree` rendering logic

**Customizing node appearance:**

1. Modify `DomainTreeNode` interface in context
2. Update sample data in `DomainTreeContext`
3. Update rendering in `DomainTreeNodeCard`

**Adjusting tree spacing:**

- Modify `separation` function in `DomainTree`
- Adjust `defaultMargin` for padding
- Tune `nodeSpacingX`, `nodeSpacingY`, or `fitPadding` in `DomainTree`

### Performance Considerations

- **Memoization**: `hierarchy()` is memoized to prevent recalculation on every render
- **Node memoization**: `DomainTreeNodeCard` is wrapped in `memo()` to prevent unnecessary re-renders
- **Filtering before render**: Collapsed nodes are filtered out before rendering, not hidden with CSS
- **Efficient collapse check**: Uses Set for O(1) lookup when checking if node is collapsed

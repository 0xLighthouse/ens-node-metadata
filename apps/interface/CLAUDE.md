# Claude Development Notes - Interface App

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

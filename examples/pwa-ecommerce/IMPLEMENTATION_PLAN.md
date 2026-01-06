# PWA E-Commerce Implementation Plan (Expo Router)

## 🚀 Quick Start

**First Step:** Create `IMPLEMENTATION_PLAN.md` in project root (Phase 0) ✅

**Tech Stack:**
- ✅ Expo SDK 54 + Expo Router (file-based routing)
- ✅ React Native Web for PWA support
- ✅ React Native Paper for UI components
- ✅ KF AI SDK for data management
- ✅ React Query for state management
- ✅ TypeScript for type safety

**Key Decision:** Using **Expo Router** (recommended by Expo) instead of React Navigation for cleaner file-based routing and better web support.

---

## Overview
Build a PWA version of the e-commerce app using **Expo Router** (file-based routing) with React Native Web, supporting Buyer and Seller roles with basic offline caching.

## User Requirements
- **Roles**: Buyer (shopping) + Seller (product management)
- **Platform**: Expo SDK 54 + React Native Web + Expo Router
- **Scope**: Product browsing, cart, product management (NO checkout)
- **Offline**: Basic caching (static assets + images)
- **Navigation**: Expo Router (file-based routing, recommended by Expo)

## Project Structure (Expo Router Pattern)

```
examples/pwa-ecommerce/
├── app/                             # Expo Router app directory
│   ├── _layout.tsx                 # Root layout (replaces App.tsx)
│   ├── index.tsx                   # Entry screen (redirects to login)
│   ├── login.tsx                   # Role selection screen
│   ├── (buyer)/                    # Route group for buyer (doesn't affect URLs)
│   │   ├── _layout.tsx             # Buyer tabs layout
│   │   ├── products/               # /products route
│   │   │   ├── index.tsx           # Product list
│   │   │   └── [id].tsx            # Product details (dynamic route)
│   │   ├── cart.tsx                # /cart route
│   │   └── profile.tsx             # /profile route
│   ├── (seller)/                   # Route group for seller
│   │   ├── _layout.tsx             # Seller stack layout
│   │   └── manage.tsx              # /manage route (product management)
│   └── +not-found.tsx              # 404 page
├── components/
│   ├── ui/                         # React Native Paper-based
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Select.tsx
│   ├── Header.tsx                  # Top nav with cart badge
│   ├── ProductCard.tsx
│   └── InstallPrompt.tsx           # PWA install (web only)
├── providers/
│   ├── AuthProvider.tsx            # Role management context
│   └── QueryProvider.tsx           # React Query setup
├── hooks/
│   ├── useAuth.ts                  # Auth/role hook
│   └── useCart.ts                  # Cart operations
├── utils/
│   ├── apiClient.ts                # SDK init (AsyncStorage)
│   ├── storage.ts                  # Cross-platform storage
│   └── formatting.ts               # Currency/date formatting
├── constants/
│   ├── theme.ts                    # Colors, spacing, typography
│   └── categories.ts               # Product categories
├── types/
│   └── index.ts                    # TypeScript types
├── public/                         # Public assets for web
│   ├── manifest.json               # PWA manifest
│   └── favicon.ico                 # Favicon
├── app.json                        # Expo config (UPDATE)
├── package.json                    # Dependencies (UPDATE)
└── tsconfig.json                   # TypeScript config
```

## Implementation Phases

### Phase 0: Create Implementation Plan Document ✅ COMPLETED

**Action:**
Create `IMPLEMENTATION_PLAN.md` file in the project root documenting the complete implementation strategy, technical decisions, and step-by-step guide.

---

### Phase 1: Foundation & Setup (2-3 hours)

**Dependencies to Install:**
```bash
# Expo Router (file-based routing)
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# Web support
npx expo install react-dom react-native-web @expo/metro-runtime

# UI & Styling
npx expo install react-native-paper @expo/vector-icons react-native-svg expo-image

# State Management
npm install @tanstack/react-query

# Storage & Utils
npx expo install @react-native-async-storage/async-storage
npm install react-native-toast-message

# KF AI SDK (already in monorepo)
# Reference: ../../sdk/
```

**Key Files to Create:**
1. `/constants/theme.ts` - Design tokens (colors, spacing, typography)
2. `/constants/categories.ts` - Product categories array
3. `/utils/storage.ts` - Platform-agnostic storage wrapper
4. `/utils/apiClient.ts` - SDK initialization (adapted from `/examples/e-commerce/src/utils/mockApiClient.ts`)
5. `/utils/formatting.ts` - Currency and date formatting helpers
6. `/public/manifest.json` - PWA web manifest
7. `/public/favicon.ico` - Favicon (copy from assets or generate)

**Key Files to Update:**
1. `/package.json` - Add all dependencies, update scripts
2. `/app.json` - Configure Expo Router, PWA metadata, web settings
3. Remove `/App.tsx` and `/index.ts` (replaced by Expo Router's app directory)

**Reference Files:**
- `/examples/e-commerce/src/utils/mockApiClient.ts` - Adaptation pattern for AsyncStorage

---

### Phase 2: Expo Router Setup & Providers (2-3 hours)

**Create Provider Layer:**
1. `/providers/QueryProvider.tsx` - React Query setup (1 min stale time)
2. `/providers/AuthProvider.tsx` - Role state management with AsyncStorage

**Create Expo Router Structure:**
1. `/app/_layout.tsx` - Root layout with providers (QueryProvider > AuthProvider > Slot)
2. `/app/index.tsx` - Entry point (redirect to login or products based on auth)
3. `/app/login.tsx` - Role selection screen
4. `/app/(buyer)/_layout.tsx` - Buyer tabs layout (Products, Cart, Profile)
5. `/app/(seller)/_layout.tsx` - Seller stack layout
6. `/app/+not-found.tsx` - 404 page

**Create Custom Hooks:**
1. `/hooks/useAuth.ts` - Access AuthProvider context
2. `/hooks/useCart.ts` - Cart count and operations

**Expo Router Key Concepts:**
- `_layout.tsx` files define navigation structure
- Route groups `(buyer)` and `(seller)` don't affect URLs
- `Slot` component renders child routes
- Protected routes via conditional rendering in layouts

**Reference Files:**
- `/examples/e-commerce/src/App.tsx` - Role switching logic, cart count query (lines 30-84)

---

### Phase 3: UI Component Library (3-4 hours)

**Base Components (React Native Paper + Custom):**
1. `/components/ui/Button.tsx` - Wrapper around Paper Button with variant support
2. `/components/ui/Card.tsx` - Wrapper around Paper Card
3. `/components/ui/Input.tsx` - TextInput with validation states
4. `/components/ui/Badge.tsx` - Custom badge component (stock status, categories)
5. `/components/ui/Select.tsx` - Menu-based dropdown selector

**Composite Components:**
1. `/components/Header.tsx` - Top navigation with logo, cart badge, user menu
2. `/components/ProductCard.tsx` - Product card for grid display
3. `/components/InstallPrompt.tsx` - PWA install banner (web only)

**Styling Approach:**
- Use React Native StyleSheet.create()
- Platform-specific styles with Platform.select()
- Theme constants from `/constants/theme.ts`

---

### Phase 4: Buyer Features (4-5 hours)

**Screens to Create:**

1. **LoginScreen** (`/app/login.tsx`)
   - Two cards: "Login as Buyer", "Login as Seller"
   - Call `setRole()` from AuthProvider
   - Navigate based on role

2. **ProductListScreen** (`/app/(buyer)/products/index.tsx`)
   - Use SDK's `useTable` hook with BDO_AmazonProductMaster
   - FlatList with numColumns={2} for grid layout
   - Category filters (sidebar on web, modal on mobile)
   - Search bar integrated with table.search
   - Pagination controls
   - "Add to Cart" quick action on cards
   - **Reference**: `/examples/e-commerce/src/pages/BuyerProductListPage.tsx`

3. **ProductDetailsScreen** (`/app/(buyer)/products/[id].tsx`)
   - Product image, title, price, description
   - Quantity selector (stepper component)
   - Stock availability indicator
   - Add to Cart button with cart mutation
   - Use React Query's useMutation for cart operations

4. **CartScreen** (`/app/(buyer)/cart.tsx`)
   - FlatList of cart items
   - Quantity adjustment (+/- buttons)
   - Remove item action
   - Clear cart button
   - Order summary (subtotal, total)
   - Use SDK's Cart source for CRUD

**Key Patterns:**
- FlatList instead of div grids
- Image component with caching: `expo-image`
- Toast notifications: `react-native-toast-message`
- React Query for cart count (refetchInterval: 30s)

---

### Phase 5: Seller Features (3-4 hours)

**Screens to Create:**

1. **ProductManagementScreen** (`/app/(seller)/manage.tsx`)
   - Use SDK's `useTable` hook for product list
   - FlatList with product rows (or DataTable from RN Paper)
   - Search functionality
   - Add Product button → opens modal with form
   - Edit/Delete actions per row
   - Product form in Dialog/Modal with SDK's `useForm`
   - Form sections: Basic Info, Pricing, Inventory
   - **Reference**: `/examples/e-commerce/src/pages/SellerProductsPage.tsx`

**Key Components:**
- React Native Paper's DataTable OR custom FlatList
- Dialog component for product form
- Form validation with SDK's useForm hook
- Mutations for create/update/delete

---

### Phase 6: PWA Configuration (2 hours)

**Step 1: Configure app.json for Web/PWA**
```json
{
  "expo": {
    "name": "PrimeStore",
    "slug": "pwa-ecommerce",
    "scheme": "primestore",
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro",
      "output": "static"
    }
  }
}
```

**Step 2: Create PWA Manifest** (`/public/manifest.json`)

**Step 3: Service Worker Setup (Optional)** - Using Workbox

**Step 4: Image Caching** - Using expo-image with cachePolicy="disk"

**Step 5: Install Prompt Component** - Web-only PWA install banner

---

### Phase 7: Testing & Polish (2-3 hours)

**Testing Checklist:**
- [ ] Role switching (Buyer ↔ Seller)
- [ ] Product browsing with filters
- [ ] Cart operations (add, update, remove, clear)
- [ ] Product management (CRUD operations)
- [ ] Navigation flows
- [ ] Responsive design (mobile, tablet, web)
- [ ] PWA install on Chrome/Edge
- [ ] Offline image caching

**Polish:**
- Loading states (skeleton screens)
- Error boundaries
- Empty states for cart and products
- Toast notifications for actions
- Form validation errors

---

## Build & Run Commands

**Development:**
```bash
npx expo start              # Start dev server (all platforms)
npx expo start --web        # Web only (PWA development)
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator
npx expo start --clear      # Clear cache if needed
```

**Production Build:**
```bash
# Build for web (PWA) - outputs to dist/ directory
npx expo export --platform web

# Build with service worker (if workbox configured)
npm run build:web

# Build for app stores (requires EAS)
eas build --platform ios
eas build --platform android
```

**Deployment:**
```bash
# Deploy to hosting providers:
netlify deploy --dir=dist --prod
# or
vercel --prod dist
# or
firebase deploy --only hosting
```

---

## Key Reference Files

1. `/examples/e-commerce/src/App.tsx` - Navigation & role management
2. `/examples/e-commerce/src/pages/BuyerProductListPage.tsx` - useTable implementation
3. `/examples/e-commerce/src/pages/SellerProductsPage.tsx` - useForm & product CRUD
4. `/examples/e-commerce/src/utils/mockApiClient.ts` - SDK initialization pattern

---

## Success Criteria

✅ Users can browse products (grid, filter, search, pagination)
✅ Users can view product details and add to cart
✅ Cart operations work (add, update quantity, remove, clear)
✅ Sellers can manage products (create, edit, delete)
✅ PWA is installable on Chrome/Edge
✅ Images cache for offline viewing
✅ App works on iOS, Android, and Web from single codebase

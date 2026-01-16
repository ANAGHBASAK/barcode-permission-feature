# Barcode Permission Control Feature

## Overview

This feature adds permission-based visibility control for barcode UI elements in the Morpheus application. When a user doesn't have the `barcode_app` permission, barcode images and icons are automatically hidden from the user interface.

## What It Does

This feature ensures that barcode-related UI elements are only visible to users who have the `barcode_app` permission. Specifically, it hides:

1. **Barcode images in All Scans section** - The barcode image displayed next to each slide in the slide list
2. **QR code icon in mobile tiling view** - The QrCode2Icon button in the mobile gamma viewer
3. **Barcode component in sidebar** - The barcode display component in the sidebar of the tiling view

## Files Modified

1. **`frontend/src/component/dashboard/slidelist_utils.js`**
   - Modified `getLabelComponent()` function to check `barcode_app` permission before rendering barcode image

2. **`frontend/src/component/gammaviewer/mobileGammaView.js`**
   - Added imports for permission checking utilities
   - Modified QrCode2Icon button to conditionally render based on `barcode_app` permission

3. **`frontend/src/component/gammaviewer/sidebarBottom_apps/barcode.js`**
   - Added import for permission checking
   - Added permission check in `render()` method to hide component when permission is missing

## Dependencies

This feature requires the following to exist in the main codebase:

- `aclPermissions.barcode_app` constant in `frontend/src/const/ACLPermissions.js`
- `hasPermissions()` function from `frontend/src/const/ACLPermissions.js`
- `checkAppPermission()` utility from `frontend/src/component/gammaviewer/utils/gammaScanUtils.js`
- `barcodeApp` object from `frontend/src/component/gammaviewer/app_maker.js`

All of these dependencies already exist in the main Morpheus codebase - no new dependencies are required.

## Backend Configuration Required

**IMPORTANT:** For this feature to work correctly, the `barcode_app` permission must be removed from the `viewer-policy` in the backend configuration file:

**File:** `django_server/api/resources/default_policies.json`

**Change:** Remove `"barcode_app"` from the `viewer-policy` permissions list (line ~36). Keep it in `staff-policy` only.

This ensures that only staff users have access to barcode features, not regular viewers.

**Note:** After modifying `default_policies.json`, you may need to:
1. Re-run the organization setup routine to apply changes to existing organizations
2. Or manually update existing policies in the database

## How It Works

The feature uses the existing permission system in Morpheus:

1. Permissions are fetched from the backend during login and stored in cookies
2. The `hasPermissions()` function checks if the user has the required permission
3. UI components check permissions before rendering barcode-related elements
4. If permission is missing, components return `null` (React doesn't render anything)

## Testing

To test this feature:

1. **With permission:**
   - Log in as a user with `barcode_app` permission
   - Verify barcode images and icons are visible in:
     - All Scans section
     - Mobile tiling view
     - Sidebar in tiling view

2. **Without permission:**
   - Remove `barcode_app` permission from a test user
   - Log in as that user
   - Verify barcode images and icons are hidden in all locations
   - Verify no console errors occur

## Notes

- The sidebar icon in desktop view is already controlled by the existing `checkAppPermission()` function in the sidebar rendering logic, so no changes were needed there
- All changes are backward compatible - users with permissions will see no difference in behavior
- The feature uses feature markers in code comments (`// FEATURE: Barcode Permission Control`) for easy identification

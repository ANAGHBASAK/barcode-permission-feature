# Barcode Permission Control Feature

## Overview

This feature adds permission-based visibility control for barcode UI elements in the Morpheus application. When a user doesn't have the `barcode_app` permission, barcode images and icons are automatically hidden from the user interface.

## What It Does

This feature ensures that barcode-related UI elements are only visible to users who have the `barcode_app` permission. Specifically, it hides:

1. **Barcode images in All Scans section** - The barcode image displayed next to each slide in the slide list
2. **QR code icon in mobile tiling view** - The QrCode2Icon button in the mobile gamma viewer
3. **Barcode component in sidebar** - The barcode display component in the sidebar of the tiling view

## Files Modified

### Frontend Files:
1. **`frontend/src/component/dashboard/slidelist_utils.js`**
   - Modified `getLabelComponent()` function to check `barcode_app` permission before rendering barcode image

2. **`frontend/src/component/gammaviewer/mobileGammaView.js`**
   - Added imports for permission checking utilities
   - Modified QrCode2Icon button to conditionally render based on `barcode_app` permission

3. **`frontend/src/component/gammaviewer/sidebarBottom_apps/barcode.js`**
   - Added import for permission checking
   - Added permission check in `render()` method to hide component when permission is missing

### Backend Files:
4. **`django_server/api/resources/default_policies.json`**
   - Removed `barcode_app` from all three default policies (viewer-policy, staff-policy, anonymous-share-policy)
   - Makes `barcode_app` a standalone permission that must be granted directly to users

5. **`django_server/api/views/views.py`** (Patch file included)
   - Fix for `ModuleNotFoundError: No module named 'bin'` in `build_access_policy()` and `set_signed_cookies()` functions
   - Adds `MORPHLE_APP` to `sys.path` before importing `bin.signedcookie`
   - **Note:** This is a bug fix required for the app to work properly when loading slides

## Dependencies

This feature requires the following to exist in the main codebase:

- `aclPermissions.barcode_app` constant in `frontend/src/const/ACLPermissions.js`
- `hasPermissions()` function from `frontend/src/const/ACLPermissions.js`
- `checkAppPermission()` utility from `frontend/src/component/gammaviewer/utils/gammaScanUtils.js`
- `barcodeApp` object from `frontend/src/component/gammaviewer/app_maker.js`

All of these dependencies already exist in the main Morpheus codebase - no new dependencies are required.

## Backend Configuration Required

**IMPORTANT:** For this feature to work correctly, the `barcode_app` permission must be removed from **ALL** policies in the backend configuration file. This makes `barcode_app` a standalone permission that must be granted directly to users, not through policy inheritance.

**File:** `django_server/api/resources/default_policies.json`

**Change:** Remove `"barcode_app"` from **all three policies**:
- `viewer-policy` (should not have `barcode_app`)
- `staff-policy` (remove `barcode_app` from line ~94)
- `anonymous-share-policy` (remove `barcode_app` from line ~141)

This ensures that `barcode_app` is a standalone permission that must be explicitly assigned to users who need it, rather than being inherited through any default policy.

**Note:** After modifying `default_policies.json`, you may need to:
1. Re-run the organization setup routine to apply changes to existing organizations
2. Or manually update existing policies in the database
3. Users who previously had `barcode_app` through policy inheritance will need to have it assigned directly via the "Edit User Permissions" UI

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

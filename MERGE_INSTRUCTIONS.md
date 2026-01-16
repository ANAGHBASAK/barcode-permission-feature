# Merge Instructions - Barcode Permission Control Feature

This document provides step-by-step instructions for merging this standalone repository into any branch of the main Morpheus repository.

## Prerequisites

- Git installed and configured
- Access to the main Morpheus repository
- The target branch where you want to merge this feature

## Method 1: Merge as Remote (Recommended)

This method adds the standalone repository as a remote and merges it into your target branch.

### Step 1: Navigate to Main Repository

```bash
cd /path/to/morpheus-dev-cloud-fixes-v6.4.1
# Or your main repository path
```

### Step 2: Checkout Target Branch

```bash
git checkout <target-branch>
# Example: git checkout main, git checkout develop, etc.
```

### Step 3: Add Standalone Repository as Remote

```bash
# If repository is local
git remote add barcode-feature /home/morphle/Desktop/morhpeus_og/barcode-permission-feature

# If repository is on a server/remote location
# git remote add barcode-feature <url-to-repository>
```

### Step 4: Fetch the Feature Branch

```bash
git fetch barcode-feature
```

### Step 5: Merge the Feature

```bash
git merge barcode-feature/master --allow-unrelated-histories
# Note: If the default branch is 'main' instead of 'master', use:
# git merge barcode-feature/main --allow-unrelated-histories
```

### Step 6: Resolve Conflicts (if any)

If there are merge conflicts:

1. Git will mark conflicted files
2. Open each conflicted file and resolve conflicts manually
3. Look for conflict markers: `<<<<<<<`, `=======`, `>>>>>>>`
4. Keep the changes from the feature branch (they have `// FEATURE: Barcode Permission Control` comments)
5. After resolving, stage the files:
   ```bash
   git add <resolved-files>
   ```
6. Complete the merge:
   ```bash
   git commit
   ```

### Step 7: Verify Merge

```bash
# Check that files were merged correctly
git log --oneline -5
git status

# Verify the modified files exist
ls -la frontend/src/component/dashboard/slidelist_utils.js
ls -la frontend/src/component/gammaviewer/mobileGammaView.js
ls -la frontend/src/component/gammaviewer/sidebarBottom_apps/barcode.js
```

### Step 8: Clean Up Remote (Optional)

After successful merge, you can remove the remote:

```bash
git remote remove barcode-feature
```

## Method 2: Direct Path Merge

If the standalone repository is in a known location, you can merge directly:

```bash
cd /path/to/morpheus-dev-cloud-fixes-v6.4.1
git checkout <target-branch>
git pull /home/morphle/Desktop/morhpeus_og/barcode-permission-feature master --allow-unrelated-histories
```

## Method 3: Cherry-pick Commits

If you prefer to cherry-pick specific commits:

```bash
cd /path/to/morpheus-dev-cloud-fixes-v6.4.1
git checkout <target-branch>
git remote add barcode-feature /home/morphle/Desktop/morhpeus_og/barcode-permission-feature
git fetch barcode-feature
git cherry-pick <commit-hash>
```

## Post-Merge Testing

After merging, perform the following tests:

### 1. Build Check

```bash
cd frontend
npm install  # or yarn install
npm run build  # Verify no build errors
```

### 2. Functional Testing

1. **Test with permission:**
   - Log in as a user with `barcode_app` permission
   - Navigate to "All Scans" section
   - Verify barcode images are visible next to slides
   - Open a slide in tiling view
   - Verify barcode component is visible in sidebar
   - Test on mobile view - verify QR code icon is visible

2. **Test without permission:**
   - Remove `barcode_app` permission from a test user
   - Log in as that user
   - Navigate to "All Scans" section
   - Verify barcode images are NOT visible
   - Open a slide in tiling view
   - Verify barcode component is NOT visible in sidebar
   - Test on mobile view - verify QR code icon is NOT visible
   - Check browser console for any errors

### 3. Code Review

- Review the merged changes
- Verify feature markers (`// FEATURE: Barcode Permission Control`) are present
- Check that imports are correct
- Ensure no syntax errors

## Rollback Instructions

If you need to rollback the merge:

### Option 1: Revert the Merge Commit

```bash
git revert -m 1 <merge-commit-hash>
```

### Option 2: Reset to Before Merge

```bash
# WARNING: This will lose any commits after the merge
git reset --hard <commit-before-merge>
```

### Option 3: Manual Rollback

Manually revert changes in the three modified files:

1. `frontend/src/component/dashboard/slidelist_utils.js`
   - Remove permission check from `getLabelComponent()` function

2. `frontend/src/component/gammaviewer/mobileGammaView.js`
   - Remove added imports
   - Restore original QrCode2Icon button code

3. `frontend/src/component/gammaviewer/sidebarBottom_apps/barcode.js`
   - Remove import
   - Remove permission check from `render()` method

## Troubleshooting

### Issue: Merge conflicts

**Solution:** 
- Conflicts are likely if the files have been modified in the target branch
- Use `git status` to see conflicted files
- Manually resolve conflicts, keeping the feature changes
- Look for `// FEATURE: Barcode Permission Control` comments to identify feature code

### Issue: Import errors after merge

**Solution:**
- Verify that `aclPermissions` and `hasPermissions` exist in `frontend/src/const/ACLPermissions.js`
- Verify that `checkAppPermission` exists in `frontend/src/component/gammaviewer/utils/gammaScanUtils.js`
- Verify that `barcodeApp` exists in `frontend/src/component/gammaviewer/app_maker.js`

### Issue: Permission not working

**Solution:**
- Verify user permissions are loaded correctly (check cookies: `access_permissions`)
- Verify `barcode_app` permission exists in the backend enum
- Check browser console for JavaScript errors
- Verify the permission check logic is correct

## Support

If you encounter issues during merge:

1. Check the git merge output for specific error messages
2. Review the conflicted files carefully
3. Ensure all dependencies are present in the target branch
4. Test in a separate branch first before merging to production

## Success Criteria

The merge is successful when:

- ✅ All three files are merged without syntax errors
- ✅ Build completes successfully
- ✅ Barcode images are hidden for users without permission
- ✅ Barcode images are visible for users with permission
- ✅ No console errors occur
- ✅ All tests pass

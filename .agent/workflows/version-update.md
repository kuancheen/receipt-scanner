---
description: Update project version and sync documentation
---
# Version Update Workflow

This workflow automates the process of updating the project version across all relevant files and keeping documentation in sync.

## Steps

1. **Calculate New Version**:
   - Current Version: v0.1.0
   - Determine next version (Major, Minor, or Patch) based on changes.

2. **Update Files**:
   - **index.html**: Update version string and cache-bursting parameters.
   - **README.md**: Update version badge.
   - **CHANGELOG.md**: Add new version entry with the current date.

3. **Verification**:
   - Ensure all version strings are consistent.
   - Verify `CHANGELOG.md` follows "Keep a Changelog" format.

4. **Git Operations**:
   - Stage all changes.
   - Commit with message: `chore: bump version to vX.Y.Z`.
   - Tag the commit: `git tag vX.Y.Z`.
   - Push to GitHub: `git push origin main --tags`.

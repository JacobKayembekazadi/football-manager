# Git Troubleshooting Guide

**Last Updated**: January 2025  
**Purpose**: Common git issues and solutions for PitchSide AI project

---

## 🔍 Verifying Push Status

### Check if commits were pushed

```bash
# Check unpushed commits
git log origin/master..HEAD --oneline
```

**Result interpretation:**
- **Shows commits**: These commits are NOT pushed to GitHub
- **Empty output**: All commits are pushed (success!)

### Check current git status

```bash
git status
```

**Expected after successful push:**
```
On branch master
Your branch is up to date with 'origin/master'.
nothing to commit, working tree clean
```

**If you see unpushed commits:**
```
Your branch is ahead of 'origin/master' by X commits.
```

---

## ❌ Common Issues

### Issue 1: Push appeared to succeed but didn't

**Symptoms:**
- `git push` command shows success message
- But `git log origin/master..HEAD` still shows commits
- Changes not visible on GitHub

**Possible causes:**
1. Network interruption during push
2. Authentication failure (silent failure)
3. Branch name mismatch
4. Remote URL incorrect

**Solution:**
```bash
# 1. Verify remote URL
git remote -v
# Should show: https://github.com/JacobKayembekazadi/pitchsideAI.git

# 2. Check current branch
git branch
# Should be on 'master'

# 3. Try pushing again with verbose output
git push origin master --verbose

# 4. If authentication issue, re-authenticate
# For HTTPS: Update credentials in Windows Credential Manager
# For SSH: Check SSH key is added to GitHub
```

---

### Issue 2: Authentication Required

**Symptoms:**
- Push fails with "authentication failed"
- Or silent failure with no error

**Solution - HTTPS:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Use token as password when pushing
4. Or update Windows Credential Manager:
   - Search "Credential Manager" in Windows
   - Find GitHub credentials
   - Update password with new token

**Solution - SSH:**
```bash
# Check if SSH key exists
ls ~/.ssh/id_rsa.pub

# If not, generate one
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Add to GitHub
# Copy public key: cat ~/.ssh/id_rsa.pub
# Add to GitHub → Settings → SSH Keys

# Test connection
ssh -T git@github.com
```

---

### Issue 3: Branch Name Mismatch

**Symptoms:**
- Push fails with "refusing to merge unrelated histories"
- Or "upstream branch doesn't exist"

**Solution:**
```bash
# Check remote branches
git branch -r

# If remote uses 'main' instead of 'master'
git push origin master:main

# Or set upstream
git push -u origin master
```

---

### Issue 4: Need to Pull First

**Symptoms:**
- Push fails with "updates were rejected"
- Or "non-fast-forward" error

**Solution:**
```bash
# Pull latest changes first
git pull origin master

# Resolve any conflicts if they occur
# Then push again
git push origin master
```

---

### Issue 5: Large Files / Timeout

**Symptoms:**
- Push hangs or times out
- Large files causing issues

**Solution:**
```bash
# Check repository size
git count-objects -vH

# If files are too large, use Git LFS
git lfs install
git lfs track "*.large-file-extension"
git add .gitattributes
git commit -m "Add LFS tracking"

# Or remove large files from history (if needed)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/large-file" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## ✅ Complete Push Workflow

### Step-by-step reliable push

```bash
# 1. Check current status
git status

# 2. Stage all changes
git add -A

# 3. Commit with descriptive message
git commit -m "feat: Description of changes

- Detailed change 1
- Detailed change 2
- Detailed change 3"

# 4. Verify commit was created
git log --oneline -1

# 5. Push to remote
git push origin master

# 6. Verify push succeeded
git log origin/master..HEAD --oneline
# Should be EMPTY if successful

# 7. Final status check
git status
# Should show "up to date with origin/master"
```

---

## 🔧 Diagnostic Commands

### Useful commands for troubleshooting

```bash
# Check remote configuration
git remote -v

# Check current branch
git branch -v

# Check unpushed commits
git log origin/master..HEAD --oneline

# Check commit history
git log --oneline -5

# Check what files changed
git diff HEAD~1 --stat

# Verify local and remote are in sync
git fetch origin
git log --oneline --graph --all --decorate -10

# Check for uncommitted changes
git diff --name-only
```

---

## 🚨 Emergency: Force Push (Use with Caution!)

**⚠️ WARNING: Only use if you're sure!**

If you need to overwrite remote history (e.g., after rewriting local history):

```bash
# Check what you're about to overwrite
git log origin/master..HEAD --oneline

# Force push (destructive!)
git push origin master --force

# Or safer: force with lease (prevents overwriting others' work)
git push origin master --force-with-lease
```

**When to use:**
- Only if you're the only one working on the branch
- After rebasing/squashing commits
- After removing sensitive data from history

**When NOT to use:**
- On shared branches
- If others have pushed since your last pull
- On production/main branches

---

## 📝 Best Practices

1. **Always verify after push:**
   ```bash
   git log origin/master..HEAD --oneline
   ```

2. **Use descriptive commit messages:**
   ```
   feat: Add new feature
   fix: Fix bug description
   docs: Update documentation
   ```

3. **Pull before pushing:**
   ```bash
   git pull origin master
   git push origin master
   ```

4. **Check status frequently:**
   ```bash
   git status
   ```

5. **Keep commits small and focused:**
   - One logical change per commit
   - Easier to review and revert if needed

---

## 🔗 Project-Specific Notes

### Repository Details
- **Remote URL**: `https://github.com/JacobKayembekazadi/pitchsideAI.git`
- **Default Branch**: `master`
- **Project Path**: `C:\Users\jacob\Downloads\football manager`

### Common Commit Patterns

**Feature additions:**
```bash
git commit -m "feat: Add [feature name]

- Implementation details
- Files modified
- Related changes"
```

**Bug fixes:**
```bash
git commit -m "fix: Fix [issue description]

- Problem identified
- Solution applied
- Testing done"
```

**Documentation:**
```bash
git commit -m "docs: Update [doc name]

- What was updated
- Why it was updated
- Related changes"
```

---

**Remember**: Always verify your push with `git log origin/master..HEAD --oneline` before assuming it succeeded!


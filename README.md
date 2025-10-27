# AfkBot 🤖

Welcome to **AfkBot**, a Node.js-based bot project for Minecraft and Discord integration! This guide will walk you through everything you need to know to get started, make changes, and collaborate on this repository.

## Repository Branches 🌿

This repository uses a protected main branch workflow:

- **`main`** - The protected production branch (requires Pull Request to merge)
- **`updates`** - The development branch where you push your changes

## Table of Contents
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Setting Up the Project](#setting-up-the-project)
- [Making Edits](#making-edits)
- [Branch Management for Collaborators](#branch-management-for-collaborators)
- [Committing and Pushing Changes](#committing-and-pushing-changes)
- [Fetching the Latest Changes](#fetching-the-latest-changes)
- [Troubleshooting](#troubleshooting)

## Prerequisites 📋

Before you begin, ensure you have the following installed on your machine:

- **Git**: Version control system. Download from [git-scm.com](https://git-scm.com/).
- **Node.js**: JavaScript runtime. Download from [nodejs.org](https://nodejs.org/). (Recommended: LTS version)
- **GitHub Account**: Sign up at [github.com](https://github.com/) if you don't have one.
- **Code Editor**: Like Visual Studio Code (VS Code) for editing files.

## Getting Started 🚀

### Step 1: Clone the Repository

To get a copy of the repository on your local machine:

1. Open your terminal or command prompt.
2. Navigate to the directory where you want to store the project (e.g., `cd Desktop/Projects`).
3. Run the following command to clone the repo:

   ```bash
   git clone https://github.com/your-username/AfkBot.git
   ```

   Replace `your-username` with the actual GitHub username where the repo is hosted.

4. Change into the project directory:

   ```bash
   cd AfkBot
   ```

### Step 2: Verify the Clone

Check if everything is set up correctly:

```bash
git status
```

You should see something like: `On branch main` and `nothing to commit, working tree clean`.

## Setting Up the Project ⚙️

1. Install the dependencies:

   ```bash
   npm install
   ```

   This will install all the required packages like `discord.js`, `mineflayer`, etc.

2. Configure settings: Check `settings.json` for configuration options including:
   - **Bot account settings** (username, password, auth type)
   - **Server connection** (IP, port, version)
   - **Feature toggles** (breakitem, local world support)
   - **Discord webhooks** for notifications
   - **Utility settings** (anti-AFK, chat messages, etc.)

## Making Edits ✏️

1. Open the project in your code editor (e.g., VS Code):

   ```bash
   code .
   ```

2. Make your changes to the files (e.g., edit `index.js`, `settings.json`, etc.).

3. Test your changes locally if possible (e.g., run the bot with `node index.js`).

## Protected Branch Workflow for Collaborators 👥

### ⚠️ IMPORTANT: Main Branch is Protected!

The `main` branch is protected and requires Pull Requests. Always work on the `updates` branch.

### Step-by-Step Workflow

#### 1. **Get Latest Updates (CRITICAL FIRST STEP)**

```bash
# Fetch all latest changes from GitHub
git fetch origin

# Switch to updates branch
git checkout updates

# Pull the latest changes to your local updates branch
git pull origin updates
```

#### 2. **Make Your Changes**

```bash
# Make your edits to files (index.js, settings.json, etc.)
# Test your changes locally
node .
```

#### 3. **Commit Your Changes**

```bash
# Add all your changes
git add .

# Commit with a descriptive message
git commit -m "Add feature: [description of your changes]"
```

#### 4. **Push to Updates Branch**

```bash
# Push to the updates branch (NOT main!)
git push origin updates
```

#### 5. **Create Pull Request**

1. Go to GitHub repository
2. Click "Compare & pull request" 
3. Set base: `main` ← compare: `updates`
4. Add description and create PR
5. Wait for review/approval to merge

### Complete Workflow Example

```bash
# 1. Get latest updates
git fetch origin
git checkout updates
git pull origin updates

# 2. Make your changes (edit files)
# 3. Test your changes
node .

# 4. Commit changes
git add .
git commit -m "Add new feature: breakitem toggle"

# 5. Push to updates branch
git push origin updates

# 6. Create Pull Request on GitHub
```

### Safety Rules 🛡️

- **NEVER** push directly to `main` branch (it's protected)
- **ALWAYS** work on `updates` branch
- **ALWAYS** pull latest changes before starting work
- **ALWAYS** test your changes before committing
- **USE** descriptive commit messages
- **CREATE** Pull Requests to merge changes to main

## Committing and Pushing Changes 📤

Once you've made edits, follow these steps to upload them to GitHub:

1. **Switch to updates branch:**
   ```bash
   git checkout updates
   ```

2. **Check the status of your changes:**
   ```bash
   git status
   ```

3. **Add your changes to the staging area:**
   ```bash
   git add .
   ```

4. **Commit your changes with a descriptive message:**
   ```bash
   git commit -m "Add feature: [brief description of changes]"
   ```

5. **Push your changes to the updates branch:**
   ```bash
   git push origin updates
   ```

6. **Create a Pull Request on GitHub to merge into main**

## Fetching the Latest Changes 📥

### Always Get Latest Updates Before Working

**CRITICAL:** Always fetch the latest changes before making any modifications to avoid conflicts.

```bash
# Step 1: Fetch all latest changes from GitHub
git fetch origin

# Step 2: Switch to updates branch
git checkout updates

# Step 3: Pull the latest changes to your local updates branch
git pull origin updates
```

### What This Does

- **`git fetch origin`** - Downloads all the latest changes from GitHub
- **`git checkout updates`** - Switches to the updates branch
- **`git pull origin updates`** - Applies the latest changes to your local updates branch

### If There Are Conflicts

If you get merge conflicts when pulling:

1. **Resolve conflicts** in your editor by choosing which changes to keep
2. **Add the resolved files:**
   ```bash
   git add .
   ```
3. **Commit the resolution:**
   ```bash
   git commit -m "Resolve merge conflicts"
   ```
4. **Continue with your work**

## Troubleshooting 🛠️

### General Issues:
- **Permission Denied**: Ensure you have push access to the repository. If not, ask the owner to add you as a collaborator.
- **Merge Conflicts**: Edit the conflicting files, choose the desired changes, and commit.
- **Node Modules Issues**: Delete `node_modules` and run `npm install` again.
- **Git Errors**: Check your Git configuration with `git config --list`.

### Common Git Issues:

- **"Your branch is ahead"**: This means you have local commits that haven't been pushed. Run `git push origin updates`
- **"Your branch is behind"**: This means there are new changes on GitHub. Run `git pull origin updates`
- **"Merge conflicts"**: Resolve conflicts manually and commit the resolution
- **"Nothing to commit"**: No changes detected. Make sure you've saved your files
- **"Remote rejected"**: Someone else pushed changes. Pull first with `git pull origin updates`
- **"Cannot push to main"**: Main branch is protected! Use `git push origin updates` instead
- **"Branch not found"**: Create the updates branch with `git checkout -b updates`

## Contributing 🤝

Feel free to contribute! Follow the steps above for making changes. If you have questions, reach out to the repo owner.

Happy coding! 🎉

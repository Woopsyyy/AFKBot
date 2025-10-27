# AfkBot 🤖

Welcome to **AfkBot**, a Node.js-based bot project for Minecraft and Discord integration! This guide will walk you through everything you need to know to get started, make changes, and collaborate on this repository.

## Repository Branches 🌿

This repository has two main branches:

- **`main`** - The stable, production-ready branch with all tested features
- **`updates`** - The development branch for new features and updates

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

2. (Optional) Configure settings: Check `settings.json` for any configuration options.

## Making Edits ✏️

1. Open the project in your code editor (e.g., VS Code):

   ```bash
   code .
   ```

2. Make your changes to the files (e.g., edit `index.js`, `settings.json`, etc.).

3. Test your changes locally if possible (e.g., run the bot with `node index.js`).

## Branch Management for Collaborators 👥

### For New Collaborators - Initial Setup

If you're a new collaborator, follow these steps to set up your local repository:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Woopsyyy/AFKBot.git
   cd AFKBot
   ```

2. **Switch to the development branch:**
   ```bash
   git checkout jaypee-update
   ```

3. **Set up tracking for the remote branch:**
   ```bash
   git branch --set-upstream-to=origin/jaypee-update jaypee-update
   ```

### For Existing Collaborators - Updating Your Repository

If you already have the repository cloned, follow these steps to update your `jaypee-update` branch:

1. **Switch to the jaypee-update branch:**
   ```bash
   git checkout jaypee-update
   ```

2. **Fetch the latest changes from GitHub:**
   ```bash
   git fetch origin
   ```

3. **Update your local jaypee-update branch:**
   ```bash
   git pull origin jaypee-update
   ```

4. **If you want to sync with the latest main branch changes:**
   ```bash
   git merge origin/main
   ```

5. **Push your updated branch:**
   ```bash
   git push origin jaypee-update
   ```

### Working on Features

When working on new features:

1. **Always work on the `jaypee-update` branch:**
   ```bash
   git checkout jaypee-update
   ```

2. **Make your changes and test them**

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add feature: [description of your changes]"
   ```

4. **Push to the development branch:**
   ```bash
   git push origin jaypee-update
   ```

### Branch Workflow Summary

- **Development**: Work on `jaypee-update` branch
- **Testing**: Test features on `jaypee-update` branch
- **Production**: Stable code is merged to `main` branch
- **Updates**: Always pull latest changes before starting work

## Committing and Pushing Changes 📤

Once you've made edits, follow these steps to upload them to GitHub:

1. Check the status of your changes:

   ```bash
   git status
   ```

   This shows which files have been modified.

2. Add your changes to the staging area:

   ```bash
   git add .
   ```

   Or add specific files: `git add index.js`

3. Commit your changes with a descriptive message:

   ```bash
   git commit -m "Add feature: [brief description of changes]"
   ```

4. Push your changes to GitHub:

   ```bash
   git push origin main
   ```

   If it's your first push, you might need to set the upstream branch:

   ```bash
   git push -u origin main
   ```

## Fetching the Latest Changes 📥

### For jaypee-update branch (Development):

1. **Switch to the development branch:**
   ```bash
   git checkout jaypee-update
   ```

2. **Fetch the latest changes:**
   ```bash
   git fetch origin
   ```

3. **Update your local jaypee-update branch:**
   ```bash
   git pull origin jaypee-update
   ```

### For main branch (Production):

1. **Switch to the main branch:**
   ```bash
   git checkout main
   ```

2. **Fetch the latest changes:**
   ```bash
   git fetch origin
   ```

3. **Update your local main branch:**
   ```bash
   git pull origin main
   ```

### Syncing Between Branches:

If you want to sync your `jaypee-update` branch with the latest `main` branch:

1. **Switch to jaypee-update:**
   ```bash
   git checkout jaypee-update
   ```

2. **Fetch all branches:**
   ```bash
   git fetch origin
   ```

3. **Merge main into jaypee-update:**
   ```bash
   git merge origin/main
   ```

If there are conflicts, resolve them in your editor and commit the resolution.

## Troubleshooting 🛠️

### General Issues:
- **Permission Denied**: Ensure you have push access to the repository. If not, ask the owner to add you as a collaborator.
- **Merge Conflicts**: Edit the conflicting files, choose the desired changes, and commit.
- **Node Modules Issues**: Delete `node_modules` and run `npm install` again.
- **Git Errors**: Check your Git configuration with `git config --list`.

### Branch-Specific Issues:

- **Wrong Branch**: If you're on the wrong branch, use `git checkout jaypee-update` or `git checkout main`
- **Branch Not Tracking Remote**: Use `git branch --set-upstream-to=origin/jaypee-update jaypee-update`
- **Outdated Branch**: Always run `git fetch origin` before pulling changes
- **Merge Conflicts Between Branches**: Resolve conflicts manually and commit the resolution
- **Can't Push to Branch**: Make sure you're pushing to the correct branch: `git push origin jaypee-update`

## Contributing 🤝

Feel free to contribute! Follow the steps above for making changes. If you have questions, reach out to the repo owner.

Happy coding! 🎉

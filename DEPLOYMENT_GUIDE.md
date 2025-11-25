# Deployment Guide for Pro.casa.kz

This guide covers the steps to upload your project to GitHub and deploy it to your server.

## Part 1: GitHub Setup (Local Machine)

1.  **Open Terminal** in your project folder: `/Users/gibatolla/Pro.casa.kz project`
2.  **Make the setup script executable**:
    ```bash
    chmod +x deploy_scripts/setup_git.sh
    ```
3.  **Run the setup script**:
    ```bash
    ./deploy_scripts/setup_git.sh
    ```
    *This initializes the git repo and adds the remote `https://github.com/AGGIB/pro-casa.git`.*

4.  **Push to GitHub**:
    ```bash
    git push -u origin main
    ```
    *You will be asked for your GitHub username and password (or Personal Access Token).*

## Part 2: Server Setup (Remote Server)

**Prerequisites**: You have SSH access to your server.

1.  **SSH into your server**:
    ```bash
    ssh root@<YOUR_SERVER_IP>
    ```

2.  **Install Docker**:
    Copy the contents of `deploy_scripts/server_setup.sh` to a file on your server (e.g., `install_docker.sh`), make it executable, and run it.
    *Or run these commands manually:*
    ```bash
    # (Commands from server_setup.sh)
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose-v2
    ```

3.  **Generate SSH Key for GitHub** (on the server):
    Run this command:
    ```bash
    ssh-keygen -t ed25519 -C "server_deploy_key"
    ```
    **IMPORTANT**: When asked "Enter file in which to save the key", **JUST PRESS ENTER**. Do not type or paste anything.
    Press Enter again for the passphrase (twice) to leave it empty.

    Then, display the key:
    ```bash
    cat ~/.ssh/id_ed25519.pub
    ```
    *Copy the output key.*

4.  **Add Key to GitHub**:
    *   Go to your Repo Settings -> Deploy Keys -> Add deploy key.
    *   Paste the key and give it a name (e.g., "Production Server").

## Part 3: Deploying the App

1.  **Clone the Repository** (on the server):
    ```bash
    git clone git@github.com:AGGIB/pro-casa.git
    cd pro-casa
    ```

2.  **Configure Environment**:
    *   Create a `.env` file if needed (though `docker-compose.yml` has defaults, for production you might want to override them).
    *   **IMPORTANT**: Update `NEXT_PUBLIC_API_URL` in `docker-compose.yml` or `.env` to use your Server's IP instead of `localhost` if accessing from outside.
    *   Example `.env`:
        ```env
        NEXT_PUBLIC_API_URL=http://<YOUR_SERVER_IP>:3001
        ```

3.  **Run the Application**:
    ```bash
    docker compose up -d --build
    ```

## Part 4: Updating the App

When you make changes locally and push to GitHub:

1.  **SSH into server**.
2.  **Go to project folder**: `cd pro-casa`
3.  **Run update**:
    ```bash
    git pull origin main
    docker compose up -d --build
    ```

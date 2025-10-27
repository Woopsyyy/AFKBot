# Environment Configuration Guide

The `.env` file is designed as a **quick server switcher** - you only need to change the server details to use the bot on different servers!

## 🚀 Quick Server Switching

1. **Edit the `.env` file:**
   ```env
   SERVER_IP=your.new.server.ip
   SERVER_PORT=25565
   SERVER_VERSION=1.12.1
   ```

2. **Run the bot:**
   ```bash
   node .
   ```

That's it! The bot will connect to the new server with all your existing settings.

## 📋 Environment Variables

### Server Settings (Only these are in .env)
- `SERVER_IP` - Minecraft server IP address
- `SERVER_PORT` - Minecraft server port (default: 25565)
- `SERVER_VERSION` - Minecraft version (default: 1.12.1)

## 🔄 How It Works

The bot uses a **hybrid system**:
1. **Server settings:** From `.env` file (for easy switching)
2. **Everything else:** From `settings.json` (bot account, Discord webhooks, utilities, etc.)

## 🎯 Use Cases

### Switching Between Servers
```env
# Server 1
SERVER_IP=play.server1.com
SERVER_PORT=25565

# Server 2  
SERVER_IP=play.server2.com
SERVER_PORT=25566
```

### Different Minecraft Versions
```env
# For 1.20.1 server
SERVER_VERSION=1.20.1

# For 1.12.1 server
SERVER_VERSION=1.12.1
```

## 🔒 Security & Configuration

- **`.env` file:** Only server connection details (safe to share)
- **`settings.json`:** Contains sensitive data like Discord webhooks and bot passwords
- **Never commit `settings.json`** with real credentials to public repos

## 📝 Example .env File

```env
# AFKBot Server Configuration
# Only server settings - everything else is in settings.json

# Server Settings
SERVER_IP=play.example.com
SERVER_PORT=25565
SERVER_VERSION=1.12.1
```

## 🎉 Benefits

- **Quick server switching** - Just change 3 lines in .env
- **Keep all settings** - Bot account, Discord webhooks, etc. stay the same
- **Easy sharing** - Share .env with server details, keep settings.json private
- **Version flexibility** - Easy to switch between Minecraft versions

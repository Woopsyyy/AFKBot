const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock, GoalNear } = require('mineflayer-pathfinder').goals;
const Vec3 = require('vec3');
const https = require('https');

const config = require('./settings.json');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot has arrived');
});

app.listen(8000, () => {
  console.log('Server started');
});

function createBot() {
   const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      auth: config['bot-account']['type'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version,
   });

   bot.loadPlugin(pathfinder);
   const mcData = require('minecraft-data')(bot.version);
   const defaultMove = new Movements(bot, mcData);
   defaultMove.allowFreeMotion = true;
   defaultMove.canOpenDoors = true;
   defaultMove.canDig = true; // Enable breaking blocks for faster paths (Baritone-style)
   defaultMove.canPlaceOn = ['dirt', 'cobblestone', 'stone', 'planks', 'oak_planks', 'grass_block', 'sand', 'gravel', 'log', 'oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log']; // Allow placing blocks on common surfaces for bridging and building
   defaultMove.allow1by1towers = true; // Enable climbing stairs and uneven terrain
   defaultMove.scafoldingBlocks = ['dirt', 'cobblestone', 'stone', 'planks', 'oak_planks', 'carpet', 'white_carpet', 'orange_carpet', 'magenta_carpet', 'light_blue_carpet', 'yellow_carpet', 'lime_carpet', 'pink_carpet', 'gray_carpet', 'light_gray_carpet', 'cyan_carpet', 'purple_carpet', 'blue_carpet', 'brown_carpet', 'green_carpet', 'red_carpet', 'black_carpet', 'ladder', 'scaffolding', 'vine', 'iron_bars']; // Include climbing blocks like ladders, scaffolding, vines, and iron bars for faster vertical movement
   defaultMove.canSprint = true; // Enable sprinting for faster pathfinding
   defaultMove.allowSprinting = true;
   defaultMove.allowDoorInteraction = true; // Allow opening doors
   defaultMove.maxDropDown = 10; // Allow dropping down up to 10 blocks for better long-distance navigation
   defaultMove.allowParkour = true; // Enable parkour for jumping over obstacles
   defaultMove.maxFallDistance = 5; // Limit fall distance to avoid damage

   let pendingPromise = Promise.resolve();
   let lastMovementTime = Date.now();
   let isInAfkPool = false;
   let activePotions = new Map(); // Track active potions and their expiration

   let activeRequest = null; // Track active request timer
   let randomWalkInterval = null; // Interval for random walking
   let gatheringTravel = false; // Flag for gathering 200-block travel
   let diedDuringRequest = false; // Flag if died during request
   let previousInventory = new Map(); // Track previous inventory for change detection
   let previousHealth = 0;
   let previousFood = 0;
   let justDied = false; // Flag to capture death message
   let lastSurfacePosition = null; // Remember last surface position for cave escape

   function sendRegister(password) {
      return new Promise((resolve, reject) => {
         bot.chat(`/register ${password} ${password}`);
         console.log(`[Auth] Sent /register command.`);

         bot.once('chat', (username, message) => {
            console.log(`[ChatLog] <${username}> ${message}`); // Log all chat messages

            // Check for various possible responses
            if (message.includes('successfully registered')) {
               console.log('[INFO] Registration confirmed.');
               resolve();
            } else if (message.includes('already registered')) {
               console.log('[INFO] Bot was already registered.');
               resolve(); // Resolve if already registered
            } else if (message.includes('Invalid command')) {
               reject(`Registration failed: Invalid command. Message: "${message}"`);
            } else {
               reject(`Registration failed: unexpected message "${message}".`);
            }
         });
      });
   }

   function sendLogin(password) {
      return new Promise((resolve, reject) => {
         bot.chat(`/login ${password}`);
         console.log(`[Auth] Sent /login command.`);

         bot.once('chat', (username, message) => {
            console.log(`[ChatLog] <${username}> ${message}`); // Log all chat messages

            if (message.includes('successfully logged in')) {
               console.log('[INFO] Login successful.');
               resolve();
            } else if (message.includes('Invalid password')) {
               reject(`Login failed: Invalid password. Message: "${message}"`);
            } else if (message.includes('not registered')) {
               reject(`Login failed: Not registered. Message: "${message}"`);
            } else {
               reject(`Login failed: unexpected message "${message}".`);
            }
         });
      });
   }

   function sendDiscordWebhook(message, webhookUrl = 'https://discord.com/api/webhooks/1431906519078932541/UE8w6Qfnuyo4kL2PS5F3NHEmBTwO2X0hqFkYGKYDlppzU5eLf8arZHtTUweB0uEkSW20') {
      const data = JSON.stringify({ content: message });

      const url = new URL(webhookUrl);
      const options = {
         hostname: url.hostname,
         path: url.pathname,
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
         }
      };

      const req = https.request(options, (res) => {
         console.log(`[WEBHOOK] Status: ${res.statusCode}`);
      });

      req.on('error', (e) => {
         console.error(`[WEBHOOK ERROR] ${e.message}`);
      });

      req.write(data);
      req.end();
   }







   function managePotions() {
      const now = Date.now();
      const idleTime = now - lastMovementTime;

      // Only manage potions if moving (not idle for 5+ seconds)
      if (idleTime < 5000) {
         // Check for expired potions and reapply
         for (const [potionType, expiration] of activePotions) {
            if (now > expiration) {
               activePotions.delete(potionType);
               applyPotion(potionType);
            }
         }

         // Apply beneficial potions if not active
         const beneficialPotions = ['speed', 'strength', 'regeneration', 'jump_boost', 'fire_resistance', 'water_breathing', 'night_vision'];
         for (const potion of beneficialPotions) {
            if (!activePotions.has(potion)) {
               applyPotion(potion);
            }
         }
      }
   }

   function applyPotion(potionType) {
      let potionItem = null;
      for (let i = 0; i < bot.inventory.slots.length; i++) {
         const item = bot.inventory.slots[i];
         if (item && item.name.includes('potion') && item.displayName && item.displayName.toLowerCase().includes(potionType)) {
            potionItem = item;
            break;
         }
      }

      if (potionItem) {
         // Determine if splash or drink
         if (potionItem.name.includes('splash')) {
            bot.activateItem(potionItem); // Splash potion
         } else {
            bot.consume(potionItem); // Drink potion
         }

         // Set expiration (assume 3 minutes for most potions)
         const expiration = Date.now() + 180000; // 3 minutes
         activePotions.set(potionType, expiration);
         console.log(`[INFO] Applied ${potionType} potion.`);
         console.log(`[BOT]: Drinking ${potionType} potion.`);
      }
   }

   function detectAfkPool() {
      // Simple detection: if bot is moving in circles (position changes but stays in small area)
      // This is a basic implementation; can be improved
      if (bot.entity && bot.entity.position) {
         const pos = bot.entity.position;
         // Track position history (simplified)
         if (!bot.positionHistory) bot.positionHistory = [];
         bot.positionHistory.push({x: pos.x, y: pos.y, z: pos.z, time: Date.now()});

         // Keep only last 10 positions
         if (bot.positionHistory.length > 10) {
            bot.positionHistory.shift();
         }

         // Check if bot is circling (positions close to each other over time)
         if (bot.positionHistory.length >= 10) {
            const firstPos = bot.positionHistory[0];
            const lastPos = bot.positionHistory[bot.positionHistory.length - 1];
            const dist = Math.sqrt((lastPos.x - firstPos.x)**2 + (lastPos.z - firstPos.z)**2);
            isInAfkPool = dist < 5;
         }
      }
   }



   function startGatheringTravel() {
      gatheringTravel = true;
      const angle = Math.random() * 2 * Math.PI;
      // const distance = 1000; // Customize gathering travel distance (default: 1000 blocks)
      const distance = 1000;
      const randomX = bot.entity.position.x + distance * Math.cos(angle);
      const randomZ = bot.entity.position.z + distance * Math.sin(angle);
      const randomY = bot.entity.position.y;
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalNear(randomX, randomY, randomZ, 3));
      console.log(`[BOT]: Starting gathering travel to (${randomX.toFixed(2)}, ${randomY.toFixed(2)}, ${randomZ.toFixed(2)})`);
   }

   function startRandomWalk() {
      if (randomWalkInterval) clearInterval(randomWalkInterval);

      // Set initial goal immediately
      const currentPos = bot.entity.position;
      const angle = Math.random() * 2 * Math.PI;
      const distance = 100 + Math.random() * 100; // Random distance between 100-200 blocks
      const randomX = currentPos.x + distance * Math.cos(angle);
      const randomZ = currentPos.z + distance * Math.sin(angle);
      const randomY = currentPos.y;
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalNear(randomX, randomY, randomZ, 3));
      console.log(`[BOT]: Wandering to (${randomX.toFixed(2)}, ${randomY.toFixed(2)}, ${randomZ.toFixed(2)})`);

      randomWalkInterval = setInterval(() => {
         if (!activeRequest) {
            clearInterval(randomWalkInterval);
            randomWalkInterval = null;
            return;
         }
         const currentPos = bot.entity.position;
         const angle = Math.random() * 2 * Math.PI;
         const distance = 100 + Math.random() * 100; // Random distance between 100-200 blocks
         const randomX = currentPos.x + distance * Math.cos(angle);
         const randomZ = currentPos.z + distance * Math.sin(angle);
         const randomY = currentPos.y;
         bot.pathfinder.setMovements(defaultMove);
         bot.pathfinder.setGoal(new GoalNear(randomX, randomY, randomZ, 3));
         console.log(`[BOT]: Wandering to (${randomX.toFixed(2)}, ${randomY.toFixed(2)}, ${randomZ.toFixed(2)})`);
      }, 10000 + Math.random() * 10000); // Every 10-20 seconds
   }

   function detectHostileMobs() {
      if (activeRequest) return; // Skip fleeing if gathering request is active
      const entities = Object.values(bot.entities);
      const hostileMobs = ['creeper', 'skeleton', 'zombie', 'spider', 'enderman', 'witch', 'blaze', 'ghast', 'magma_cube', 'slime', 'guardian', 'elder_guardian', 'wither_skeleton', 'stray', 'husk', 'drowned', 'phantom', 'ravager', 'piglin_brute', 'warden'];
      for (const entity of entities) {
         if (entity.type === 'mob' && hostileMobs.includes(entity.name) && entity.position.distanceTo(bot.entity.position) < 16) { // Within 16 blocks
            console.log(`[INFO] Hostile mob detected: ${entity.name} at distance ${entity.position.distanceTo(bot.entity.position).toFixed(2)}`);
            // Flee by moving away
            const direction = bot.entity.position.minus(entity.position).normalize();
            const fleeX = bot.entity.position.x + direction.x * 20;
            const fleeZ = bot.entity.position.z + direction.z * 20;
            const fleeY = bot.entity.position.y;
            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.setGoal(new GoalNear(fleeX, fleeY, fleeZ, 5));
            bot.setControlState('sprint', true);
            bot.setControlState('jump', true);
            setTimeout(() => {
               bot.setControlState('sprint', false);
               bot.setControlState('jump', false);
            }, 3000); // Sprint and jump for 3 seconds
            break; // Only flee from the first detected mob
         }
      }
   }

   function detectWater() {
      if (bot.entity && bot.entity.position) {
         const block = bot.blockAt(bot.entity.position);
         if (block && (block.name === 'water' || block.name === 'flowing_water')) {
            console.log('[INFO] Bot is in water, swimming/float.');
            // Set control states to swim/float
            bot.setControlState('forward', true);
            bot.setControlState('jump', true);
            setTimeout(() => {
               bot.setControlState('forward', false);
               bot.setControlState('jump', false);
            }, 5000); // Swim/float for 5 seconds
         }
      }
   }

   function isUnderground() {
      // Simple check: if Y coordinate is below 40, consider underground
      if (!bot.entity || !bot.entity.position) return false;
      return bot.entity.position.y < 40;
   }

   function escapeCave() {
      if (lastSurfacePosition) {
         console.log(`[INFO] Attempting to escape cave to surface position: (${lastSurfacePosition.x.toFixed(2)}, ${lastSurfacePosition.y.toFixed(2)}, ${lastSurfacePosition.z.toFixed(2)})`);
         bot.pathfinder.setMovements(defaultMove);
         bot.pathfinder.setGoal(new GoalNear(lastSurfacePosition.x, lastSurfacePosition.y, lastSurfacePosition.z, 5));
      } else {
         console.log(`[INFO] No last surface position known, cannot escape cave.`);
      }
   }

   function getTimePerStack(item) {
      const woodTypes = ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'oak_planks', 'spruce_planks', 'birch_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks'];
      const stoneTypes = ['stone', 'cobblestone', 'andesite', 'diorite', 'granite', 'stone_bricks'];
      if (woodTypes.includes(item)) return 3;
      if (stoneTypes.includes(item)) return 5;
      return 15; // default for other items
   }

   bot.once('spawn', () => {
      console.log('\x1b[33m[AfkBot] Bot joined the server', '\x1b[0m');

      // If reconnected during active request, send restart message
      if (activeRequest) {
         bot.chat('restart me');
         console.log('[BOT]: Sent restart message after reconnection.');
      }

      // If respawned after death during request, restart gathering travel
      if (diedDuringRequest) {
         diedDuringRequest = false;
         if (activeRequest && !gatheringTravel) {
            console.log('[BOT]: Respawned after death during request, restarting gathering travel.');
            startGatheringTravel();
         }
      }

      // Initialize last surface position to spawn location
      lastSurfacePosition = bot.entity.position.clone();

      // Initialize inventory tracking on spawn
      for (let i = 0; i < bot.inventory.slots.length; i++) {
         const item = bot.inventory.slots[i];
         if (item) {
            previousInventory.set(item.name, item.count);
         }
      }
      previousHealth = bot.health;
      previousFood = bot.food;

      // Inventory change detection
      bot.inventory.on('update', () => {
         console.log('[DEBUG] Inventory update event triggered.');
         const currentInventory = new Map();
         for (let i = 0; i < bot.inventory.slots.length; i++) {
            const item = bot.inventory.slots[i];
            if (item) {
               currentInventory.set(item.name, item.count);
            }
         }

         // Check for added items
         for (const [itemName, count] of currentInventory) {
            const prevCount = previousInventory.get(itemName) || 0;
            if (count > prevCount) {
               console.log(`[INFO] Inventory added: ${itemName} from ${prevCount} to ${count}`);
               const now = new Date();
               const time24 = now.toTimeString().split(' ')[0];
               const date = now.toISOString().split('T')[0];
               const message = `-----(${time24}) (${date})-----\n📦 **Inventory Update**\nAdded: ${itemName} ${count}\n--------------------------------------------------`;
               sendDiscordWebhook(message, 'https://discord.com/api/webhooks/1431909754497925150/DUjL0tSOCd8uOcpFHiEc163wuQOJnXmDgaR2mjXRxkKbt5zROcZTT1ITR8smKstCkaBG');
            }
         }

         // Check for removed items
         for (const [itemName, prevCount] of previousInventory) {
            const count = currentInventory.get(itemName) || 0;
            if (count < prevCount) {
               console.log(`[INFO] Inventory removed: ${itemName} from ${prevCount} to ${count}`);
               const now = new Date();
               const time24 = now.toTimeString().split(' ')[0];
               const date = now.toISOString().split('T')[0];
               const message = `-----(${time24}) (${date})-----\n📦 **Inventory Update**\nRemoved: ${itemName} ${count}\n--------------------------------------------------`;
               sendDiscordWebhook(message, 'https://discord.com/api/webhooks/1431909754497925150/DUjL0tSOCd8uOcpFHiEc163wuQOJnXmDgaR2mjXRxkKbt5zROcZTT1ITR8smKstCkaBG');
            }
         }

         // Update previous inventory
         previousInventory = new Map(currentInventory);

         // Check and equip armor if available
         autoEquipArmor();
      });

      // Periodic inventory check as fallback (every 30 seconds)
      setInterval(() => {
         const currentInventory = new Map();
         for (let i = 0; i < bot.inventory.slots.length; i++) {
            const item = bot.inventory.slots[i];
            if (item) {
               currentInventory.set(item.name, item.count);
            }
         }

         // Check for changes
         let hasChanges = false;
         for (const [itemName, count] of currentInventory) {
            const prevCount = previousInventory.get(itemName) || 0;
            if (count !== prevCount) {
               hasChanges = true;
               if (count > prevCount) {
                  console.log(`[INFO] Periodic check: added ${itemName} from ${prevCount} to ${count}`);
                  const now = new Date();
                  const time24 = now.toTimeString().split(' ')[0];
                  const date = now.toISOString().split('T')[0];
                  const message = `-----(${time24}) (${date})-----\n📦 **Inventory Update**\n➕ Added: ${itemName} ${count}\n--------------------------------------------------`;
                  sendDiscordWebhook(message, 'https://discord.com/api/webhooks/1431909754497925150/DUjL0tSOCd8uOcpFHiEc163wuQOJnXmDgaR2mjXRxkKbt5zROcZTT1ITR8smKstCkaBG');
               }
            }
         }
         for (const [itemName, prevCount] of previousInventory) {
            const count = currentInventory.get(itemName) || 0;
            if (count < prevCount) {
               hasChanges = true;
               console.log(`[INFO] Periodic check: removed ${itemName} from ${prevCount} to ${count}`);
               const now = new Date();
               const time24 = now.toTimeString().split(' ')[0];
               const date = now.toISOString().split('T')[0];
               const message = `-----(${time24}) (${date})-----\n📦 **Inventory Update**\n➖ Removed: ${itemName} ${count}\n--------------------------------------------------`;
               sendDiscordWebhook(message, 'https://discord.com/api/webhooks/1431909754497925150/DUjL0tSOCd8uOcpFHiEc163wuQOJnXmDgaR2mjXRxkKbt5zROcZTT1ITR8smKstCkaBG');
            }
         }

         if (hasChanges) {
            previousInventory = new Map(currentInventory);
         }
      }, 30000); // 30 seconds

      if (config.utils['auto-auth'].enabled) {
         console.log('[INFO] Started auto-auth module');

         const password = config.utils['auto-auth'].password;

         pendingPromise = pendingPromise
            .then(() => sendRegister(password))
            .then(() => sendLogin(password))
            .catch(error => console.error('[ERROR]', error));
      }

      if (config.utils['chat-messages'].enabled) {
         console.log('[INFO] Started chat-messages module');
         const messages = config.utils['chat-messages']['messages'];

         if (config.utils['chat-messages'].repeat) {
            const delay = config.utils['chat-messages']['repeat-delay'];
            let i = 0;

            let msg_timer = setInterval(() => {
               bot.chat(`${messages[i]}`);

               if (i + 1 === messages.length) {
                  i = 0;
               } else {
                  i++;
               }
            }, delay * 1000);
         } else {
            messages.forEach((msg) => {
               bot.chat(msg);
            });
         }
      }

      const pos = config.position;

      if (config.position.enabled) {
         console.log(
            `\x1b[32m[Afk Bot] Starting to move to target location (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`
         );
         bot.pathfinder.setMovements(defaultMove);
         bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
      }

      if (config.utils['anti-afk'].enabled) {
         bot.setControlState('jump', true);
         if (config.utils['anti-afk'].sneak) {
            bot.setControlState('sneak', true);
         }
      }
   });

   bot.on('goal_reached', () => {
      console.log(
         `\x1b[32m[AfkBot] Bot arrived at the target location. ${bot.entity.position}\x1b[0m`
      );

      // If this was the initial gathering travel, start random walking
      if (gatheringTravel) {
         gatheringTravel = false; // Reset flag
         if (activeRequest) {
            startRandomWalk();
         }
      }
   });

   function autoEquipArmor() {
      const armorSlots = ['head', 'torso', 'legs', 'feet'];
      const armorTypes = {
         head: ['diamond_helmet', 'iron_helmet', 'chainmail_helmet', 'leather_helmet'],
         torso: ['diamond_chestplate', 'iron_chestplate', 'chainmail_chestplate', 'leather_chestplate'],
         legs: ['diamond_leggings', 'iron_leggings', 'chainmail_leggings', 'leather_leggings'],
         feet: ['diamond_boots', 'iron_boots', 'chainmail_boots', 'leather_boots']
      };

      for (const slot of armorSlots) {
         const currentArmor = bot.inventory.slots[bot.getEquipmentDestSlot(slot)];
         let bestArmor = null;
         for (const armor of armorTypes[slot]) {
            const item = bot.inventory.items().find(i => i.name === armor);
            if (item) {
               bestArmor = item;
               break; // Equip the best available
            }
         }
         if (bestArmor && (!currentArmor || currentArmor.name !== bestArmor.name)) {
            bot.equip(bestArmor, slot)
               .then(() => {
                  console.log(`[INFO] Equipped ${bestArmor.name} in ${slot}.`);
               })
               .catch((err) => {
                  console.log(`[ERROR] Failed to equip ${bestArmor.name} in ${slot}: ${err.message}`);
               });
         }
      }
   }

   // Passive behaviors
   setInterval(() => {
      managePotions();
      detectAfkPool();
      detectHostileMobs();
      detectWater();
   }, 1000); // Check every second

   // Auto equip armor every 1 minute
   setInterval(() => {
      autoEquipArmor();
   }, 60000); // 60 seconds

   // Health and hunger change detection
   bot.on('health', () => {
      const currentHealth = bot.health;
      const currentFood = bot.food;

      if (currentHealth !== previousHealth || currentFood !== previousFood) {
         const now = new Date();
         const time24 = now.toTimeString().split(' ')[0]; // HH:MM:SS
         const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
         const message = `-----(${time24}) (${date})-----\nHealth: ${currentHealth}\nHunger: ${currentFood}\n-----------------------------------`;
         sendDiscordWebhook(message, 'https://discord.com/api/webhooks/1431910449737240738/y-ng69ZsEC5arkWkNjgKAFBd631oHbANI0B5Xpei0Wfq9n5-I3Tw5mTTVioKHKOi3kr8');
         previousHealth = currentHealth;
         previousFood = currentFood;
      }
   });

   bot.on('move', () => {
      lastMovementTime = Date.now();
      // Update last surface position if on surface
      if (!isUnderground()) {
         lastSurfacePosition = bot.entity.position.clone();
      }
   });

   bot.on('death', () => {
      console.log(
         `\x1b[33m[AfkBot] Bot has died and was respawned at ${bot.entity.position}`,
         '\x1b[0m'
      );
      justDied = true; // Set flag to capture death message

      // Send initial death notification
      sendDiscordWebhook('💀 AFKBot died', 'https://discord.com/api/webhooks/1431908696082092172/11ZnlxYfXxj64gBhnQDQzbnki5JvkXryqfnSxJkIZ0zPAOMLO2miqPnyyZ89xczxxMxn');

      // If bot died during a request, set flag to restart travel on respawn
      if (activeRequest) {
         diedDuringRequest = true;
         gatheringTravel = false; // Reset to allow restarting gathering travel
         sendDiscordWebhook('💀 AFKBot died during gathering, continuing process.');
      }
   });

   if (config.utils['auto-reconnect']) {
      bot.on('end', () => {
         setTimeout(() => {
            createBot();
         }, config.utils['auto-recconect-delay']);
      });
   }

   bot.on('kicked', (reason) =>
      console.log(
         '\x1b[33m',
         `[AfkBot] Bot was kicked from the server. Reason: \n${reason}`,
         '\x1b[0m'
      )
   );

   bot.on('error', (err) =>
      console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m')
   );

   bot.on('message', (message) => {
      console.log(`[MESSAGE] ${message}`); // Debug: log all messages

      // Capture death reason if just died
      if (justDied) {
         const deathMessage = message.toString();
         lastDeathReason = deathMessage;
         console.log(`[INFO] Death reason: ${deathMessage}`);
         sendDiscordWebhook(`💀 AFKBot died: ${deathMessage}`, 'https://discord.com/api/webhooks/1431908696082092172/11ZnlxYfXxj64gBhnQDQzbnki5JvkXryqfnSxJkIZ0zPAOMLO2miqPnyyZ89xczxxMxn');
         justDied = false; // Reset flag
      }

      // Auto accept TPA requests - case insensitive
      if (!activeRequest && message.toString().toLowerCase().includes('[simpletpa]') && message.toString().toLowerCase().includes('has sent you a teleport request')) {
         bot.chat('/tpaccept');
         console.log(`[BOT]: Accepted TPA request.`);
      }
   });

   bot.on('chat', (username, message) => {
      if (message === '!come') {
         const player = bot.players[username];
         if (player && player.entity) {
            const playerPos = player.entity.position;
            const playerUnderground = playerPos.y < 40;
            const botUnderground = isUnderground();
            if (!playerUnderground && botUnderground) {
               // Player on surface, bot underground: surface first
               escapeCave();
               console.log(`[BOT]: Surfacing to meet ${username} on surface.`);
               bot.chat('Surfacing to come to you!');
            } else {
               // Player underground or both on same level: pathfind directly
               bot.pathfinder.setMovements(defaultMove);
               bot.pathfinder.setGoal(new GoalNear(playerPos.x, playerPos.y, playerPos.z, 1));
               console.log(`[BOT]: Going to ${username}.`);
               bot.chat('Coming to you!');
            }
         } else {
            bot.chat('Cannot find your position.');
         }
      } else if (message.startsWith('!tp ')) {
         const parts = message.split(' ');
         if (parts.length === 2) {
            let targetUsername = parts[1];
            if (targetUsername === 'me') {
               targetUsername = username;
            }
            bot.chat(`/tp ${targetUsername}`);
            console.log(`[BOT]: Instant to ${targetUsername}.`);
            bot.chat(`Teleporting to ${targetUsername}!`);
         } else {
            bot.chat('Usage: !tp [username] or !tp me');
         }
      } else if (message.startsWith('!request ')) {
         const parts = message.split(' ');
         if (parts.length === 4) {
            const item = parts[1];
            const stacks = parseInt(parts[2]);
            if (isNaN(stacks) || stacks <= 0) {
               bot.chat('Invalid number of stacks.');
               return;
            }
            let playerName = parts[3];
            if (playerName === 'me') {
               playerName = username;
            }
            if (activeRequest) {
               bot.chat('Already processing a request. Please wait.');
               return;
            }
            const totalTimeMinutes = stacks * getTimePerStack(item);
            const totalTimeMs = totalTimeMinutes * 60 * 1000;
            const amount = stacks * 64;
            bot.chat(`gathering, wait ${totalTimeMinutes} minutes`);
            console.log(`[BOT]: Starting request for ${amount} ${item} (${stacks} stacks) to ${playerName}.`);
            const now = new Date();
            const time24 = now.toTimeString().split(' ')[0];
            const date = now.toISOString().split('T')[0];
            const message = `-----(${time24}) (${date})-----\n📦 **Request Started**\nItem: ${item}\nStacks: ${stacks}\nTime: ${totalTimeMinutes} minutes\nUser: ${username}\n--------------------------------------------------`;
            sendDiscordWebhook(message);
            activeRequest = {
               item: item,
               stacks: stacks,
               playerName: playerName,
               startTime: Date.now(),
               startPosition: bot.entity.position.clone(),
               intervals: []
            };
            // Set up progress updates every 10 minutes
            const progressIntervals = Math.floor(totalTimeMinutes / 10);
            for (let i = 1; i <= progressIntervals; i++) {
               const interval = setTimeout(() => {
                  const remaining = totalTimeMinutes - i * 10;
                  sendDiscordWebhook(`ITEM: ${item}\nTIME: ${remaining} minutes\nUSER: ${username}`);
               }, i * 600000); // 10 minutes * i
               activeRequest.intervals.push(interval);
            }
            // Set up nearly done message at totalTimeMinutes - 5 minutes
            if (totalTimeMinutes > 5) {
               const nearlyDoneTime = (totalTimeMinutes - 5) * 60 * 1000;
               const nearlyDoneInterval = setTimeout(() => {
                  sendDiscordWebhook(`ITEM: ${item}\nTIME: nearly done, give me 5 minutes\nUSER: ${username}`);
               }, nearlyDoneTime);
               activeRequest.intervals.push(nearlyDoneInterval);
            }
            // Start gathering travel immediately
            startGatheringTravel();
            // Apply invisibility effect after 10 seconds
            setTimeout(() => {
               bot.chat('/effect give @s minecraft:invisibility 60 99 false');
               bot.chat('/effect give @s minecraft:saturation infinite 99 true');
               console.log('[BOT]: Applied invisibility and saturation effects.');
               bot.chat('INVISIBLE: can\'t see me bitches');
               console.log('[BOT]: Sent invisibility message.');
            }, 10000); // 10 seconds
            setTimeout(() => {
               if (randomWalkInterval) {
                  clearInterval(randomWalkInterval);
                  randomWalkInterval = null;
                  console.log(`[BOT]: Stopped random walk.`);
               }
               bot.chat(`/give @s ${item} ${amount}`);
               console.log(`[BOT]: Gave ${amount} ${item} to self.`);
               // Now teleport to the player or spawn if not found
               const player = bot.players[playerName];
               if (player && player.entity) {
                  console.log(`[BOT]: Using /tp ${playerName}`);
                  bot.chat(`/tp ${playerName}`);
                  console.log(`[BOT]: Teleported to ${playerName} and sent kill message.`);
               } else {
                  console.log(`[BOT]: Player ${playerName} not found, teleporting to spawn.`);
                  bot.chat('/spawn');
                  console.log(`[BOT]: Teleported to spawn and sent kill message.`);
               }
               bot.chat('kill me so the item will drop');
               // Calculate distance traveled
               const endPosition = bot.entity.position;
               const distanceTraveled = Math.sqrt(
                  Math.pow(endPosition.x - activeRequest.startPosition.x, 2) +
                  Math.pow(endPosition.z - activeRequest.startPosition.z, 2)
               );
               console.log(`[BOT]: Request completed. Distance traveled: ${distanceTraveled.toFixed(2)} blocks.`);
               // Clear intervals and send completion message
               activeRequest.intervals.forEach(clearTimeout);
               sendDiscordWebhook(`job done`);
               activeRequest = null;
            }, totalTimeMs);
} else if (parts.length === 2 && parts[1] === 'cancel') {
            if (activeRequest) {
               // Clear intervals
               activeRequest.intervals.forEach(clearTimeout);
               // Stop random walk
               if (randomWalkInterval) {
                  clearInterval(randomWalkInterval);
                  randomWalkInterval = null;
                  console.log(`[BOT]: Stopped random walk due to cancel.`);
               }
               // Send Discord message
               sendDiscordWebhook(`Request cancelled by ${username}`);
               // Chat message
               bot.chat('Request cancelled.');
               console.log(`[BOT]: Request cancelled by ${username}.`);
               // Teleport back to the user
               bot.chat(`/tp ${username}`);
               console.log(`[BOT]: Teleporting back to ${username} due to cancel.`);
               // Reset activeRequest
               activeRequest = null;
            } else {
               bot.chat('No active request to cancel.');
            }
         } else {
            bot.chat('Usage: !request <item> <stacks> <player> or !request cancel');
         }
      } else if (username === 'woopsyy69') {
         if (message === '!setspawn') {
            bot.chat('/spawnpoint');
            bot.chat('Spawn set successfully!');
            sendDiscordWebhook('Bot spawn set successfully!', 'https://discord.com/api/webhooks/1431908538162090087/R8gt7MFv66_nknp9ttQflKvqZJWg48g_6cyQPPNAMLQvRXdlUQm20FOqCZl-M2bz-UkT');
         }
      }
   });
}

createBot();

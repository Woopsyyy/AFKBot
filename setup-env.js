#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 AFKBot Environment Setup\n');

// Check if .env already exists
if (fs.existsSync('.env')) {
   console.log('⚠️  .env file already exists!');
   console.log('   If you want to recreate it, delete the existing .env file first.');
   process.exit(0);
}

// Check if env.example exists
if (!fs.existsSync('env.example')) {
   console.log('❌ env.example file not found!');
   console.log('   Please make sure you have the env.example file in your project directory.');
   process.exit(1);
}

// Copy env.example to .env
try {
   fs.copyFileSync('env.example', '.env');
   console.log('✅ Successfully created .env file!');
   console.log('\n📝 Next steps:');
   console.log('   1. Edit the .env file with your settings');
   console.log('   2. Update SERVER_IP, SERVER_PORT, and other values');
   console.log('   3. Add your Discord webhook URLs');
   console.log('   4. Run: npm start');
   console.log('\n💡 Tip: Never commit .env files to version control!');
} catch (error) {
   console.log('❌ Error creating .env file:', error.message);
   process.exit(1);
}

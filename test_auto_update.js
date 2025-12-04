// 测试自动更新功能
const { autoUpdater } = require('electron-updater');

// 配置
autoUpdater.autoDownload = false;

console.log('🧪 Testing Auto-Update...');
console.log('Current Version:', require('./frontend/package.json').version);

// 监听所有事件
autoUpdater.on('checking-for-update', () => {
  console.log('🔍 Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('✨ Update available!');
  console.log('  New version:', info.version);
  console.log('  Release date:', info.releaseDate);
  console.log('  Release notes:', info.releaseNotes);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('✅ App is up to date');
  console.log('  Current version:', info.version);
});

autoUpdater.on('error', (err) => {
  console.error('❌ Update check failed:', err.message);
});

// 执行检查
autoUpdater.setFeedURL({
  provider: 'github',
  owner: '676662805-cmd',
  repo: 'RecallAI'
});

setTimeout(() => {
  autoUpdater.checkForUpdates()
    .then(result => {
      console.log('\n📊 Check result:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error:', err);
      process.exit(1);
    });
}, 1000);

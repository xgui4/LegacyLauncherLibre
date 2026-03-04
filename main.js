const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const DiscordRPC = require('discord-rpc');

const clientId = '1346541144141103114'; 
let rpc;

function initRPC() {
  rpc = new DiscordRPC.Client({ transport: 'ipc' });

  rpc.on('ready', () => {
    console.log('Discord RPC ready');
    setActivity();
  });

  rpc.on('error', (err) => {
    console.error('Discord RPC Error:', err);
  });

  rpc.on('disconnected', () => {
    console.log('Discord RPC disconnected, retrying...');
    setTimeout(connectRPC, 15000);
  });

  connectRPC();
}

function connectRPC() {
  rpc.login({ clientId }).catch(err => {

    console.log('Discord RPC connection failed, retrying in 20s...');
    setTimeout(connectRPC, 20000);
  });
}


initRPC();

function setActivity(details = 'In Menus', state = 'Ready to Play', startTime = null) {
  if (!rpc || !rpc.user) return; 

  const activity = {
    details: details,
    state: state,
    largeImageKey: 'logo', 
    largeImageText: 'LegacyLauncher',
    instance: false,
  };

  if (startTime) {
    activity.startTimestamp = startTime;
  }

  rpc.setActivity(activity).catch(() => {
    
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    resizable: true,
    frame: false, 
    icon: path.join(__dirname, '256x256.png'),
    transparent: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  win.maximize(); 
  win.loadFile('index.html');

  // Handle window controls
  ipcMain.on('window-minimize', () => win.minimize());
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  ipcMain.on('window-close', () => win.close());

 
  ipcMain.on('update-rpc', (event, data) => {
    setActivity(data.details, data.state, data.startTime);
  });

  win.on('maximize', () => win.webContents.send('window-is-maximized', true));
  win.on('unmaximize', () => win.webContents.send('window-is-maximized', false));

  
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

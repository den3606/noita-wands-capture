const { app, desktopCapturer, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (app.isPackaged) {
    mainWindow.removeMenu();
  } else {
    mainWindow.webContents.openDevTools();
  }
  return mainWindow;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();
  mainWindow.webContents.send('main-window-ready');
});

ipcMain.handle('find-noita-screen-id', async (event) => {
  return await desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    for (const source of sources) {
      if ((new RegExp('Noita - *')).test(source.name)) {
        return source.id;
      }
    }
    return null;
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

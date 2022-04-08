const { app, desktopCapturer, BrowserWindow } = require('electron');
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
  }
  return mainWindow;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();

  desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    for (const source of sources) {
      const regex = new RegExp('Noita - *');

      if (regex.test(source.name)) {
        mainWindow.webContents.send('noita-screen-id', source.id);
        return;
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

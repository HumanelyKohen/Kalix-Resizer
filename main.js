const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, ipcMain, shell } = require('electron');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;

// Main Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 1000 : 500,
    height: 600,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.setMenu(null);
   mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// When the app is ready, create the window
app.on('ready', () => {
  createMainWindow();

  // Remove variable from memory
  mainWindow.on('closed', () => (mainWindow = null));
});
// Respond to the resize image event
ipcMain.on('image:resize', (e, options) => {
  // console.log(options);
  options.dest = path.join(os.homedir(), 'imageresizer');
  resizeImage(options);
});

// Resize and save image
async function resizeImage({ imgPath, height, width, dest }) {
  try {
    // console.log(imgPath, height, width, dest);

    // Resize image
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height,
    });

    // Get filename
    const filename = path.basename(imgPath);

    // Create destination folder if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    // Write the file to the destination folder
    fs.writeFileSync(path.join(dest, filename), newPath);

    // Send success to renderer
    mainWindow.webContents.send('image:done');

    // Open the folder in the file explorer
    shell.openPath(dest);
  } catch (err) {
    console.log(err);
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

// Open a window if none are open (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});


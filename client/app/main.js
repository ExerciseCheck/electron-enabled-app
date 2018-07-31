const {app, BrowserWindow, Menu, webContents} = require('electron');

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let webViewId;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1376,
    height: 800,
    titleBarStyle: 'default',
    frame: true
  });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  mainWindow.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.on('close', function(e){
    var choice = require('electron').dialog.showMessageBox(this,
      {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to quit? Any unsaved progress will be lost.'
      });
    if(choice == 1){
      e.preventDefault();
    }
  });

  createMenu();
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// get the webview's webContents
function getWebviewWebContents() {

  return webContents.getAllWebContents()
  // TODO replace `localhost` with whatever the remote web app's URL is
    .filter(wc => wc.getURL().search(/localhost/gi) > -1)
    .pop();
}

function createMenu() {

  // First menu item is app name, skip
  const topLevelItems = [
    {},
    {
      label: 'Development',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click() {
            app.quit();
          }
        },
        {
          label: 'Show Electron Dev Tools',
          click() {
            mainWindow.openDevTools();
          }
        },
        {
          label: 'Hide Electron Dev Tools',
          click() {
            mainWindow.closeDevTools();
          }
        },
        {
          label: 'Show Anchor Dev Tools',
          click() {
            mainWindow.webContents.send('openWebviewDevTools');
          }
        },
        {
          label: 'Hide Anchor Dev Tools',
          click() {
            mainWindow.webContents.send('closeWebviewDevTools');
          }
        },
        {
          label: 'Start Kinect',
          click() {
            getWebviewWebContents().send('startKinect');
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(topLevelItems));
}

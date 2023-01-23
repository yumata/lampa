const { app, BrowserWindow } = require('electron')
const path = require('path')
let tray

app.whenReady().then(() => {
	const mainWindow = new BrowserWindow({
  	show: false,
    icon: "src/icons/app-logo.png",
  })

    mainWindow.loadFile('src/index.html')
  	mainWindow.menuBarVisible=false;
  	mainWindow.once('ready-to-show', mainWindow.show)


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


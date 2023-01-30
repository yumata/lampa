const { app, BrowserWindow, Menu } = require("electron");

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    show: false,
    icon: "src/app-logo.png",
  });

  mainWindow.loadFile("src/index.html");
  mainWindow.once("ready-to-show", mainWindow.show);
  const menu = [
    {
      label: "Назад",
      click: () => {
        mainWindow.webContents.goBack();
      },
    },
    { role: "reload", label: "Перезагрузка" },
    {
      label: "Вперёд",
      click: () => {
        mainWindow.webContents.goForward();
      },
    },
    {
      label: "Инструменты разработчика (Временно)",
      click: () => {
        mainWindow.webContents.openDevTools();
      },
    },
  ];
  const contextMenu = Menu.buildFromTemplate(menu);
  mainWindow.setMenu(null);
  mainWindow.webContents.on("context-menu", () => {
    contextMenu.popup();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

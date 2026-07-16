const { app, BrowserWindow } = require('electron');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 850,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        title: "GitTürkçe - Türkçe GitHub Kaşifi"
    });

    // Hide menu bar
    mainWindow.setMenuBarVisibility(false);

    // Load static HTML entry point
    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

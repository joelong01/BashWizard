/*jshint esversion: 6 */

import {
    app,
    ipcMain,
    BrowserWindow,
    BrowserWindowConstructorOptions,
    Menu,
    MenuItem,
    MenuItemConstructorOptions,
    dialog,
    FileFilter,
    TouchBarColorPicker
} from "electron";
import { IpcMainProxy } from "./ipcMainProxy";
import LocalFileSystem from "./localFileSystem";
import Cookies, { Cookie } from "universal-cookie"

const cookie: Cookie = new Cookies();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow;
let ipcMainProxy: IpcMainProxy;

//
//  this receives messages from the renderer to update the settings in the main app
ipcMain.on('synchronous-message', (event: any, arg: any): any => {
    console.count("ipcMain.on");
    console.log(`data: ${JSON.stringify(arg)} autoSave=${arg.autoSave}`)
    createMainMenu(mainWindow, arg.autoSave);
    event.returnValue = true;
})

function createWindow() {
    // and load the index.html of the app.

    const windowOptions: BrowserWindowConstructorOptions = {
        width: 1200,
        height: 900
    };
    // Create the browser window.

    if (process.env.ELECTRON_START_URL) {
        // Disable web security to support loading in local file system resources
        // TODO: Look into defined local security policy
        windowOptions.webPreferences = {
            webSecurity: false
        };
        mainWindow = new BrowserWindow(windowOptions);
        mainWindow.loadURL(process.env.ELECTRON_START_URL);
    } else {
        // When running in production mode or with static files use loadFile api vs. loadUrl api.
        mainWindow = new BrowserWindow(windowOptions);
        mainWindow.loadFile("build/index.html");
    }

    // Emitted when the window is closed.
    mainWindow.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow.destroy();
    });

    registerContextMenu(mainWindow);

    let autoSaveSetting = cookie.get("autosave");
    if (autoSaveSetting === undefined){
        autoSaveSetting = false;
    }
    console.log("autosave=" + autoSaveSetting);
    createMainMenu(mainWindow, autoSaveSetting);

    ipcMainProxy = new IpcMainProxy(ipcMain, mainWindow);
    ipcMainProxy.register("RELOAD_APP", onReloadApp);
    ipcMainProxy.register("TOGGLE_DEV_TOOLS", onToggleDevTools);

    const localFileSystem = new LocalFileSystem(mainWindow);
    ipcMainProxy.registerProxy("LocalFileSystem", localFileSystem);
}

function onReloadApp() {
    mainWindow.reload();
    return true;
}

function onToggleDevTools(sender: any, show: boolean) {
    if (show) {
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.webContents.closeDevTools();
    }
}

function onNew(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    const options = {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 2,
        title: 'Bash Wizard',
        message: 'Create a new Script?',
    };

    dialog.showMessageBox(mainWindow, options, (response: number) => {
        if (response === 0) {
            mainWindow.webContents.send('on-new', '');
        }
    });

}

async function onOpen(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): Promise<void> {

    const fs: LocalFileSystem = new LocalFileSystem(mainWindow);
    const filename: string = await fs.getOpenFile("Bash Wizard", [{ extensions: ["sh"], name: "Bash Script" }]);

    if (filename !== null && filename !== "") {
        const contents: string = await fs.readText(filename);
        const msg: string[] = [];
        msg.push(filename);
        msg.push(contents);
        mainWindow.webContents.send('on-open', msg);
    }
}

function onSave(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    mainWindow.webContents.send('on-save', "");
}

function onSaveAs(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    mainWindow.webContents.send('on-save-as', "");
}
function onAutoSaveChecked(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    console.log(`onAutoSaveChecked.event=${JSON.stringify(event)} menuItem=${JSON.stringify(menuItem["keys"])} checked=${menuItem.checked}`);
    mainWindow.webContents.send('on-auto-save-checked', [menuItem.checked]);
    cookie.set("autosave", menuItem.checked);
}

function createMainMenu(browserWindow: BrowserWindow, autoSave: boolean): void {
    console.log(`createMainMenu autoSave=${autoSave}`)
    let template: MenuItemConstructorOptions[];
    template = [
        {
            label: "File",
            submenu: [
                { label: "New...", accelerator: "CommandOrControl+N", click: onNew },
                { label: "Open...", accelerator: "CommandOrControl+O", click: onOpen },
                { label: "Save", accelerator: "CommandOrControl+s", click: onSave },
                { label: "Save As...", accelerator: "CommandOrControl+SHIFT+s", click: onSaveAs },
                { type: "separator" },
                { label: "Auto Save", type: "checkbox", checked: autoSave, click: onAutoSaveChecked },
                { type: "separator" },
                { role: "reload" },
                { type: "separator" },
                { role: "quit" }
            ]
        },
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "pasteandmatchstyle" },
                { role: "delete" },
                { role: "selectall" }
            ]
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forcereload" },
                { role: "toggledevtools" },
                { type: "separator" },
                { role: "resetzoom" },
                { role: "zoomin" },
                { role: "zoomout" },
                { type: "separator" },
                { role: "togglefullscreen" }
            ]
        },
        {
            role: "window",
            submenu: [{ role: "minimize" }, { role: "close" }]
        },
        {
            role: "help",
            submenu: [
                {
                    label: "Learn More",
                    click() {
                        require("electron").shell.openExternal(
                            "https://electronjs.org"
                        );
                    }
                }
            ]
        }
    ];

    if (process.platform === "darwin") {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideothers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" }
            ]
        });

        // Window menu
        template[3].submenu = [
            { role: "close" },
            { role: "minimize" },
            { role: "zoom" },
            { type: "separator" },
            { role: "front" }
        ];
    }
    console.log(`menuTemplate: ${JSON.stringify(template)}`);
    const menu = Menu.buildFromTemplate(template);

    // Menu.setApplicationMenu(menu);

    browserWindow.setMenu(null);
    browserWindow.setMenu(menu);

}

/**
 * Adds standard cut/copy/paste/etc context menu comments when right clicking input elements
 * @param browserWindow The browser window to apply the context-menu items
 */
function registerContextMenu(browserWindow: BrowserWindow): void {
    console.log("registerContextMenu");
    const selectionMenu = Menu.buildFromTemplate([
        { role: "copy", accelerator: "CmdOrCtrl+C" },
        { type: "separator" },
        { role: "selectall", accelerator: "CmdOrCtrl+A" }
    ]);

    const inputMenu = Menu.buildFromTemplate([
        { role: "undo", accelerator: "CmdOrCtrl+Z" },
        { role: "redo", accelerator: "CmdOrCtrl+Shift+Z" },
        { type: "separator" },
        { role: "cut", accelerator: "CmdOrCtrl+X" },
        { role: "copy", accelerator: "CmdOrCtrl+C" },
        { role: "paste", accelerator: "CmdOrCtrl+V" },
        { type: "separator" },
        { role: "selectall", accelerator: "CmdOrCtrl+A" }
    ]);

    browserWindow.webContents.on("context-menu", (e, props) => {
        const { selectionText, isEditable } = props;
        if (isEditable) {
            inputMenu.popup({
                window: browserWindow
            });
        } else if (selectionText && selectionText.trim() !== "") {
            selectionMenu.popup({
                window: browserWindow
            });
        }
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
    console.log("ready called");
    createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

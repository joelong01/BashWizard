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
} from "electron";
import { IpcMainProxy } from "./ipcMainProxy";
import BashWizardMainService from "./bwMainService";

import fs, { FSWatcher } from "fs";
import { IAsyncMessage } from "../Models/commonModel"
import windowStateKeeper from "electron-window-state"
import {TitleBarHelper} from "./titlebarHelper"


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
export let g_mainWindow: BrowserWindow;
let g_ipcMainProxy: IpcMainProxy;
let g_bwService:BashWizardMainService;
let g_tbHelper: TitleBarHelper;

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'false'; // we do not load remote content -- only load from localhost
//
//  this receives messages from the renderer to update the settings in the main app
ipcMain.on('synchronous-message', (event: any, arg: any): any => {
    const menu: Menu | null = Menu.getApplicationMenu();
    if (menu !== null) {
        console.log("changing autosave menu to " + Boolean(arg.autoSave));
        menu.getMenuItemById("auto-save").checked = Boolean(arg.autoSave);
        event.returnValue = true;
        return;
    }
    event.returnValue = false;
})

let lastFileNotificationTime: number = new Date().getTime();
let myFileWatcher: FSWatcher;
//
//  this receives messages from the renderer to update the settings in the main app
//
//  arg should look like {eventyType: "watch" | "unwatch", fileName: string}
ipcMain.on('asynchronous-message', (event: any, arg: any): any => {
    console.log(`asynchronous-message-data: ${JSON.stringify(arg)}`)


    if (arg.eventType === "watch") {
        console.log(`watching ${arg.fileName}`);
        myFileWatcher = fs.watch(arg.fileName, { persistent: false }, (eventType: string, name: string) => {
            const currentTime: number = new Date().getTime();
            if (currentTime - lastFileNotificationTime < 100) { // unlikely the user saves twice in 100ms...
                console.log(`rejecting notification at time ${currentTime} from ${lastFileNotificationTime} (diff: ${currentTime - lastFileNotificationTime})`)
                return;
            }
            console.log("Firing message for %s", arg.fileName);
            lastFileNotificationTime = currentTime;
            const msgObj: IAsyncMessage = { fileName: name, event: "file-changed", type: eventType };
            event.sender.send('asynchronous-reply', JSON.stringify(msgObj));

        });
    } else if (arg.eventType === "unwatch") {

        if (myFileWatcher === undefined || myFileWatcher === null) {
            console.log("myFileWatcher null || undefined");
            return;
        }
        console.log(`un-watching ${arg.fileName}`);
        fs.unwatchFile(arg.fileName, myFileWatcher.listeners[0]);
    } else {
        console.log("ERROR: BAD MESSAGE TYPE IN MAIN.TS");
    }
})




function createWindow() {
    // and load the index.html of the app.
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });

    // Create the window using the state information

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state

    const windowOptions: BrowserWindowConstructorOptions = {
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        frame: process.platform === "darwin",
        darkTheme: true
    };
    // Create the browser window.

    if (process.env.ELECTRON_START_URL) {
        // Disable web security to support loading in local file system resources
        // TODO: Look into defined local security policy
        windowOptions.webPreferences = {
            webSecurity: false
        };
        g_mainWindow = new BrowserWindow(windowOptions);
        g_mainWindow.loadURL(process.env.ELECTRON_START_URL);
        mainWindowState.manage(g_mainWindow);
    } else {
        // When running in production mode or with static files use loadFile api vs. loadUrl api.
        g_mainWindow = new BrowserWindow(windowOptions);
        g_mainWindow.loadFile("build/index.html");
    }

    // Emitted when the window is closed.
    g_mainWindow.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        g_mainWindow.destroy();
    });



    registerContextMenu(g_mainWindow);


    createMainMenu(g_mainWindow, false);


    g_ipcMainProxy = new IpcMainProxy(ipcMain, g_mainWindow);
    g_ipcMainProxy.register("RELOAD_APP", onReloadApp);
    g_ipcMainProxy.register("TOGGLE_DEV_TOOLS", onToggleDevTools);
    g_bwService = new BashWizardMainService(g_mainWindow);
    g_ipcMainProxy.registerProxy("BashWizardMainService", g_bwService);

    g_tbHelper = new TitleBarHelper(g_mainWindow);

}

function onReloadApp() {
    g_mainWindow.reload();
    return true;
}

export async function onToggleDevTools(sender: any, show: boolean) {
    if (show) {
        g_mainWindow.webContents.openDevTools();
    } else {
        g_mainWindow.webContents.closeDevTools();
    }
    console.log(`OnToggleDevTools [show=${show}`)

    await g_bwService.updateSetting({showDebugger: show});

}

function onNew(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    const options = {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 2,
        title: 'Bash Wizard',
        message: 'Create a new Script?',
    };

    dialog.showMessageBox(g_mainWindow, options, (response: number) => {
        if (response === 0) {
            g_mainWindow.webContents.send('on-new', '');
        }
    });

}

async function onOpen(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): Promise<void> {


    const fileName: string = await g_bwService.getOpenFile("Bash Wizard", [{ extensions: ["sh"], name: "Bash Script" }]);

    if (fileName !== null && fileName !== "") {
        const contents: string = await g_bwService.readText(fileName);
        const msg: string[] = [];
        msg.push(fileName);
        msg.push(contents);
        g_mainWindow.webContents.send('on-open', msg);
    }
}

function onSave(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    g_mainWindow.webContents.send('on-save', "");
}

function onSaveAs(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    g_mainWindow.webContents.send('on-save-as', "");
}
function onAutoSaveChecked(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    g_mainWindow.webContents.send('on-setting-changed', { autoSave: menuItem.checked });

}
function onAlwaysLoadChecked(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): void {
    g_mainWindow.webContents.send('on-setting-changed', { autoUpdate: menuItem.checked });

}
async function checkedShowDebugger(menuItem: MenuItem, browserWindow: BrowserWindow, event: Event): Promise<void> {
    const show:boolean = menuItem.checked;
    console.log(`OnToggleDevTools [show=${show}`)

    await g_bwService.updateSetting({showDebugger: show});
}

function createMainMenu(browserWindow: BrowserWindow, autoSave: boolean): void {

    let template: MenuItemConstructorOptions[];
    template = [
        {
            label: "File", accelerator: "Alt+F",
            submenu: [
                { label: "New...", accelerator: "CmdOrCtrl+N", click: onNew },
                { label: "Open...", accelerator: "CmdOrCtrl+O", click: onOpen },
                { label: "Save", accelerator: "CmdOrCtrl+S", click: onSave },
                { label: "Save As...", accelerator: "CmdOrCtrl+SHIFT+S", click: onSaveAs },
                { type: "separator" },
                { label: "Auto Save", type: "checkbox", checked: autoSave, click: onAutoSaveChecked, id: "auto-save" },
                { label: "Auto Load", type: "checkbox", checked: false, id: "auto-load", click: onAlwaysLoadChecked },
                { type: "separator" },
                { role: "reload" },
                { type: "separator" },
                { role: "quit" }
            ]
        },
        {
            label: "View", accelerator: "Alt+v",
            submenu: [
                { role: "reload" },
                { role: "forcereload" },
                { role: "toggledevtools", label: "Show Dev Tools", type:"checkbox", checked:false,  accelerator: "F12"  },
                { type: "separator" },
                { role: "resetzoom" },
                { role: "zoomin" },
                { role: "zoomout" },
                { type: "separator" },
                { role: "togglefullscreen" }
            ]
        },
        {
            role: "window", accelerator: "Alt+w",
            submenu: [{ role: "minimize" }, { role: "close" }]
        },
        {
            role: "help", accelerator: "Alt+a",
            submenu: [
                {
                    label: "Learn More",
                    click() {
                        require("electron").shell.openExternal(
                            "https://github.com/joelong01/bw-react/blob/master/README.md"
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
    // console.log(`menuTemplate: ${JSON.stringify(template)}`);

    const menu = Menu.buildFromTemplate(template);

    Menu.setApplicationMenu(menu);



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
    if (g_mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

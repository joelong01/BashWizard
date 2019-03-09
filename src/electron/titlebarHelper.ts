/**
 *  this class gets information from the main process and passes it back tothe the titlebar
 */
import {BrowserWindow} from "electron";

export class TitleBarHelper {
    private myBrowserWindow:BrowserWindow | undefined = undefined;
    constructor (mainWindow: BrowserWindow) {
        this.myBrowserWindow = mainWindow;
        mainWindow.on("maximize", () => this.onPositionChanged("maximized"))
        mainWindow.on("unmaximize", () => this.onPositionChanged("unmaximized"))
        mainWindow.on("minimize", () => this.onPositionChanged("minimize"))
        mainWindow.on("restore", () => this.onPositionChanged("restore"))
        mainWindow.on("enter-full-screen", () => this.onPositionChanged("enter-full-screen"))
        mainWindow.on("leave-full-screen", () => this.onPositionChanged("leave-full-screen"))
     }

     private onPositionChanged= (newPosition:string):void => {
        this.myBrowserWindow!.webContents.send("window-position-changed", newPosition);
     }
 }

 export default TitleBarHelper;

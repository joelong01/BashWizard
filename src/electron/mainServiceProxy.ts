import { IpcRendererProxy } from "../ipcRendererProxy";
import { IBashWizardMainService } from "../Models/commonModel"
import { FileFilter } from 'electron';
import { IBashWizardSettings } from "../Models/commonModel"


const PROXY_NAME = "BashWizardMainService";


/**
 * Storage Provider for Local File System. Only available in Electron application
 * Leverages the IpcRendererProxy
 */
export class BashWizardMainServiceProxy implements IBashWizardMainService {
    /**
     * Uses the FileOpen dialog to find a file to open
     * @param title - Title of the dialog
     * @param extensions - FileFilter array for the dialog
     */
    public getOpenFile(title: string, extensions: FileFilter[]): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:getOpenFile`, [
            title,
            extensions
        ]);
    }
    /**
     * Uses the FileSave dialog to find a file to save
     * @param title - Title of the dialog
     * @param extensions - FileFilter array for the dialog
     */
    public getSaveFile(title: string, extensions: FileFilter[]): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:getSaveFile`, [
            title,
            extensions
        ]);
    }

    /**
     * Read text from file
     * @param fileName - Name of file from which to read text
     */
    public readText(fileName: string): Promise<string> {
        const filePath = [fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:readText`, [filePath]);
    }


    /**
     * Write text to file
     * @param fileName Name of target file
     * @param contents Contents to be written
     */
    public writeText(fileName: string, contents: string): Promise<void> {
        const filePath = [fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:writeText`, [
            filePath,
            contents
        ]);
    }
    /**
     * reads the file "bashWizardConfig.json" from the same directory as the .EXE and returns their values
     */
    getAndApplySettings(): Promise<IBashWizardSettings> {
        return IpcRendererProxy.send(`${PROXY_NAME}:getAndApplySettings`);

    }
    /**
     * saves the file "bashWizardConfig.json" in the same directory as the .EXE and returns their values
     */
    saveAndApplySettings(settings: IBashWizardSettings): Promise<void> {
        return IpcRendererProxy.send(`${PROXY_NAME}:saveAndApplySettings`, [settings])

    }

    /**
     * saves the file "bashWizardConfig.json" in the same directory as the .EXE and returns their values
     */
    updateSetting(setting: Partial<IBashWizardSettings>): Promise<void> {
        return IpcRendererProxy.send(`${PROXY_NAME}:updateSetting`, [setting]);

    }


    /**
     * saves the file "bashWizardConfig.json" in the same directory as the .EXE and returns their values
     */
    setWindowTitle(name:string): Promise<void> {
        return IpcRendererProxy.send(`${PROXY_NAME}:setWindowTitle`, [name]);

    }


}

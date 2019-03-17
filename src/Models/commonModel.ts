import { GrowlMessage } from 'primereact/growl';
import  {IScriptModelState} from "bash-models/dist/commonModel";
import { FileFilter } from "electron";




export type NotifyScriptModelChanged = <K extends keyof IScriptModelState>(newState: Pick<IScriptModelState, K> | IScriptModelState ) => void;

export interface IBashWizardMainService {

    readText(filePath: string): Promise<string>;
    writeText(filePath: string, contents: string): Promise<void>;
    getOpenFile(title: string, extensions: FileFilter[]): Promise<string>;
    getSaveFile(title: string, extensions: FileFilter[]): Promise<string>;
    getAndApplySettings(): Promise<IBashWizardSettings>;
    saveAndApplySettings(settings: IBashWizardSettings): Promise<void>;
    updateSetting(setting: Partial<IBashWizardSettings>): Promise<void>;
    setWindowTitle(title: string): Promise<void>;
}

export enum BashWizardTheme {
    Dark = "dark",
    Light = "light"
}

export interface IBashWizardSettings {
    autoSave: boolean;
    theme: BashWizardTheme;
    autoUpdate: boolean;
    showDebugger: boolean;
}


export type IGrowlCallback = (message: GrowlMessage | GrowlMessage[]) => void;


export interface IAsyncMessage {
    fileName: string;
    event: "file-changed";
    type: string;
}


import { GrowlMessage } from 'primereact/growl';
import { ParameterModel } from "./ParameterModel";
import { FileFilter } from "electron";


//
//  the state parameters should be the same names as the properties in the scriptModel

export interface IMainPageUiState {
    JSON: string;
    bashScript: string;
    Errors: IErrorMessage[];
    scriptName: string;
    description: string;
    parameters: ParameterModel[];
    inputJson: string;
    debugConfig: string;


}

export interface IParameterUiState {
    default: string;
    description: string;
    longParameter: string;
    requiresInputString: boolean;
    requiredParameter: boolean;
    shortParameter: string;
    variableName: string;
    valueIfSet: string;
    collapsed: boolean;
    type: ParameterType;
}

export type NotifyScriptModelChanged = <K extends keyof IMainPageUiState>(newState: Pick<IMainPageUiState, K> | IMainPageUiState ) => void;

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
export interface IErrorMessage {
    severity: "warn" | "error" | "info";
    message: string;
    key: string;
    Parameter?: ParameterModel
}
export interface IBuiltInParameterName {
    Create?: string,
    Verify?: string,
    Delete?: string,
    LoggingSupport?: string,
    InputFileSupport?: string,
    VerboseSupport?: string
}

export enum ParameterType {
    Create = "Create",
    Verify = "Verify",
    Delete = "Delete",
    LoggingSupport = "Logging",
    InputFileSupport = "Input File",
    VerboseSupport = "Verbose",
    Custom = "Custom"
}

export enum ValidationOptions {
    AllowBlankValues = 1,
    // tslint:disable-next-line
    ClearErrors = 1 << 2,
    // tslint:disable-next-line
    ValidateOnly = 1 << 3,
    // tslint:disable-next-line
    Growl = 1 << 4
}

//
//  used when parsing a bash script
export interface IParseState {
    ScriptName: string;
    Description: string;
    Parameters: ParameterModel[];
    ParseErrors: IErrorMessage[];
    UserCode: string;
    builtInParameters: { [key in keyof IBuiltInParameterName]: ParameterModel }; // this isn't in the this.state object because it doesn't affect the UI
}

export interface IAsyncMessage {
    fileName: string;
    event: "file-changed";
    type: string;
}


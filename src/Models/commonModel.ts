import { GrowlMessage } from 'primereact/growl';
import { ParameterModel } from "./ParameterModel";

export type INotifyPropertyChanged = (parameter: object, property: string) => void;
export type IGrowlCallback = (message: GrowlMessage | GrowlMessage[]) => void;
export interface IErrorMessage {
    severity: "warn" | "error" | "info";
    message: string;
    key: string;
    selected?: boolean;
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

export interface IScriptModelProps {
    notify: INotifyPropertyChanged;
}

export interface IAsyncMessage {
    fileName: string;
    event: "file-changed";
    type: string;
}

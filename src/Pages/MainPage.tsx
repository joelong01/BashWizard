
import React from 'react';
import { ParameterView } from '../Components/ParameterView';
import SplitPane from 'react-split-pane';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Growl, GrowlMessage } from 'primereact/growl';
import Cookies, { Cookie } from "universal-cookie"
import AceEditor from 'react-ace';
import { YesNoDialog, IYesNoResponse, YesNo } from "../Components/askUserYesNoDlg";
import { SplitButton } from "primereact/splitbutton";
import "brace/mode/sh"
import "brace/mode/json"
import "brace/theme/xcode"
import "brace/theme/twilight"
import { BashWizardMainServiceProxy } from "../electron/mainServiceProxy"
import { IpcRenderer } from "electron";
import { IAsyncMessage, IBashWizardSettings, BashWizardTheme, IConvertMessage, IOpenMessage } from "../Models/bwCommonModels";
import { IErrorMessage, ParameterType, IScriptModelState } from "bash-models/commonModel";
import { ScriptModel } from "bash-models/scriptModel"
import { ParameterModel } from "bash-models/ParameterModel"

import { ListBox } from "primereact/listbox"
import { BWError } from "../Components/bwError"
import ReactSVG from "react-svg";
import { TitleBar } from "../Components/titleBar";
import "../Themes/dark/theme.css"
import GlobalScriptData from '../Components/globalScriptState';


//
//  represents the properties that will impact the UI
//
interface IMainPageState extends IScriptModelState {


    // this data is for UI only and doesn't impact the model
    selectedParameter?: ParameterModel;
    theme: BashWizardTheme;
    showYesNoDialog: boolean;
    dialogMessage: string;
    selectedError: IErrorMessage | undefined;
    parameterListHeight: string;
    activeTabIndex: number;
    ButtonModel: any[];
    SaveFileName: string;
    bashFocus: boolean; // used to set the AceEditor with the bashscript visible
    Loaded: boolean;
    title: string; // the titlebar title

}

class MainPage extends React.Component<{}, IMainPageState> {
    private growl = React.createRef<Growl>();
    private yesNoDlg = React.createRef<YesNoDialog>();
    private bashEditor: React.RefObject<AceEditor> = React.createRef<AceEditor>();
    private myScriptGlobalStateCtrl: React.RefObject<GlobalScriptData> = React.createRef<GlobalScriptData>();
    private cookie: Cookie = new Cookies();
    private savingFile: boolean = false;
    private mainServiceProxy: BashWizardMainServiceProxy | null;
    private scriptModel: ScriptModel;
    private currentWatchFile: string = "";
    private isElectronEnabled: boolean | undefined = undefined;
    private updateTimerSet: boolean = false; // used in the bash script onChange() event to update
    private myTitleBar: React.RefObject<TitleBar> = React.createRef<TitleBar>();
    private mySettings: IBashWizardSettings = {
        autoSave: false,
        theme: BashWizardTheme.Light,
        autoUpdate: false,
        showDebugger: false
    };

    constructor(props: {}) {
        super(props);
        console.clear();
        //
        //  send settings to the main app to update the browser UI
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer !== undefined) {
            //
            //  can't do promises in the ctor, so use the .then construct.  note that this api
            //  never rejects the promise, so we will get back default settings on any error
            this.mainServiceProxy = new BashWizardMainServiceProxy();
            this.mainServiceProxy.getAndApplySettings().then((settings: IBashWizardSettings) => {
                this.mySettings = settings;
                console.log("settings: %o", this.mySettings);
            })
        } else {
            // browser stores this in a cookie
            try {
                const cookieSettings = this.cookie.get("settings")
                Object.keys(this.mySettings).forEach(key => {
                    try {
                        this.mySettings[key] = cookieSettings[key];  // this makes sure that if we delete/add something to the settings, we pick up only what we are looking for
                    }
                    catch {
                        console.log("error saving cookie")
                    }
                })
            }
            catch (er) { // if there is an error, delete the cookie
                console.log(`error loading cookie: ${er}`);
                this.cookie.delete("settings");
            }

        }



        const params: ParameterModel[] = []
        this.state =
            {
                //
                //   all "*cache" state is stored in the mainModel
                //
                JSON: "",
                bashScript: "",
                scriptName: "",
                description: "",
                autoInstallDependencies: false,
                parameters: params,
                Errors: [],
                theme: this.mySettings.theme,
                debugConfig: "",
                inputJson: "",
                parameterListHeight: "calc(100% - 115px)",
                showYesNoDialog: false,
                dialogMessage: "",
                title: "Bash Wizard",
                selectedError: undefined,
                selectedParameter: undefined,
                activeTabIndex: 0,
                SaveFileName: "",
                Loaded: false,
                bashFocus: false,
                ButtonModel: this.getButtonModel(),
            }

        console.log("after setting state: state = %o", this.state)
    }
    public shouldComponentUpdate(nextProps: Readonly<{}>, nextState: Readonly<IMainPageState>) {
        for (let prop in nextState) {
            if (this.state[prop] !== nextState[prop]) {
                if (prop === "JSON" || prop === "bashScript") {
                    continue;
                }
                return true;
            }
        }
        return false;

    }

    private getButtonModel(): any[] {
        return [

            {
                label: 'Add All',
                icon: "pi pi-globe",
                command: () => {
                    this.scriptModel.startBatchChanges();
                    this.scriptModel.addParameter(ParameterType.Verbose);
                    this.scriptModel.addParameter(ParameterType.Logging);
                    this.scriptModel.addParameter(ParameterType.InputFile);
                    this.scriptModel.addParameter(ParameterType.Create);
                    this.scriptModel.addParameter(ParameterType.Verify);
                    this.scriptModel.addParameter(ParameterType.Delete);
                    this.scriptModel.endBatchChanges();;

                }
            },
            {
                //  target allows us to use CSS to style this item
                disabled: true, target: 'separator'
            },
            {
                label: 'Add Verbose Support',
                icon: "pi pi-camera",
                command: () => {
                    this.scriptModel.addParameter(ParameterType.Verbose);

                }
            },
            {
                label: 'Add Logging Support',
                icon: "pi pi-pencil",
                command: () => {
                    this.scriptModel.addParameter(ParameterType.Logging);

                }
            },
            {
                label: 'Add Input File Support',
                icon: "pi pi-list",
                command: () => {
                    this.scriptModel.addParameter(ParameterType.InputFile)
                }
            },
            {
                label: 'Add Create, Validate, Delete',
                icon: "pi pi-table",
                command: async () => {
                    this.scriptModel.startBatchChanges();
                    this.scriptModel.addParameter(ParameterType.Create);
                    this.scriptModel.addParameter(ParameterType.Verify);
                    this.scriptModel.addParameter(ParameterType.Delete);
                    this.scriptModel.endBatchChanges();
                }
            }
        ]
    }

    private getIpcRenderer(): IpcRenderer | undefined {
        // console.count("this.getIpcRenderer")
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf(' electron/') === -1) {
            return undefined;
        }
        if (typeof window["require"] !== "undefined") {

            return window["require"]("electron").ipcRenderer;

        }
        return undefined;
    }
    private setupCallbacks = () => {
        // console.count("setuCallbacks")
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer !== undefined) {
            ipcRenderer.on("on-new", async () => {
                // console.count("on-new")
                this.reset(); // this gets verified in the main process
            });

            ipcRenderer.on("on-open", async (event: any, msg: IOpenMessage) => {
                // console.count("on-open")

                this.setBashScript(msg.fileName, msg.contents);

            });

            ipcRenderer.on("on-save", async () => {
                // console.count("on-save")
                await this.onSave(false);
            });

            ipcRenderer.on("on-save-as", async () => {
                // console.count(`onSaveAs. this.state=${this.state}`);
                await this.onSave(true);
            });
            ipcRenderer.on("on-convert", async (event: any, message: IConvertMessage) => {
                console.log("on convert: %o", message)
                const fileName: string = message.fileName;
                const script: string = message.script;
                const fullFilePath: string = message.fullFile;

                const sm: ScriptModel = new ScriptModel();

                sm.parseBash(script);
                if (sm.parameters.length > 0) {
                    await this.mainServiceProxy!.writeText(fullFilePath, sm.bashScript);
                    this.growl.current!.show({
                        severity: "info",
                        detail: `converted file ${fileName}`,
                        closable: true,
                        life: 10000

                    });
                } else {
                    this.growl.current!.show({
                        severity: "warn",
                        detail: `attempted to convert file ${fileName}, but found no parameters`,
                        closable: true,
                        life: 10000

                    });
                }
                if (sm.ErrorModel.Errors.length > 0) {
                    this.growl.current!.show({
                        severity: "error",
                        detail: `file ${fileName} has ${sm.ErrorModel.Errors.length} errors!`,
                        closable: true,
                        life: 10000
                    });
                }
            });
            ipcRenderer.on("on-setting-changed", async (event: any, message: Partial<IBashWizardSettings>) => {
                // console.count("on-settings-changed")
                Object.keys(message).map((key) => {
                    // console.log(`new Setting [${key}=${message[key]}]`)
                    this.mySettings[key] = message[key];
                    return message;
                });
                await this.saveSettings();
            });

            ipcRenderer.on('asynchronous-reply', async (event: string, msg: string) => {
                // console.count("async-reply")
                const msgObj: IAsyncMessage = JSON.parse(msg);
                if (msgObj.event === "file-changed") {
                    if (this.state.SaveFileName.endsWith(msgObj.fileName)) {
                        await this.onFileChanged(this.state.SaveFileName);
                    } else {
                        //   console.log(`rejecting file change nofification for ${msgObj.fileName}`);
                    }

                }
            })


        }
    }
    private setTitleBarTitle(newTitle: string) {
        let t: string;
        if (newTitle === "") {
            t = "Bash Wizard";
        }
        else {
            t = "Bash Wizard - " + newTitle;
        }

        this.setState({ title: t })
    }

    private onSave = async (alwaysPrompt: boolean): Promise<void> => {
        if (this.savingFile) {
            return;
        }
        try {
            this.savingFile = true; // we don't want notifications of changes that we started
            if (this.state.SaveFileName === "" || alwaysPrompt === true) {
                const newFileName = await this.mainServiceProxy!.getSaveFile("Bash Wizard", [{ name: "Bash Scripts", extensions: ["sh"] }]);
                if (newFileName === "" || newFileName === undefined) {
                    return;
                }
                await this.setStateAsync({ SaveFileName: newFileName });
            }
            await this.mainServiceProxy!.writeText(this.state.SaveFileName, this.scriptModel.bashScript);
            this.watchFile(); // this has to be done after .writeText, otherwise the file might not exist
            this.setTitleBarTitle(this.state.SaveFileName);
        }
        catch (error) {
            this.growl.current!.show({ severity: "error", summary: "Error Message", detail: "Error saving the file.  Details: \n" + error });
        }
        finally {
            this.savingFile = false;
        }

    }

    //
    //  called when the main process opens a file, reads the contents, and sends it back to the render process
    private setBashScript = async (filename: string, contents: string) => {

        this.setState({ bashScript: contents, SaveFileName: filename }, () => {
            this.parseBashUpdateUi().then(() => {
                this.setTitleBarTitle(this.state.SaveFileName);
            })
            this.watchFile().then(() => {
                //   console.log("finished opening file " + this.state.SaveFileName)
            })
        })

        /*

            it looks like there is a subtle bug in the way await setStateAsync works as the
            below code doesn't work, but the above code does.  Only part of the parameter data
            gets updated in the UI with the below code.

        console.log("setBashScript called");
        await this.setStateAsync({ bashScript: contents, SaveFileName: filename });
        this.watchFile();
        await this.parseBashUpdateUi();
        this.setTitleBarTitle(this.state.SaveFileName);
        return true;

        */
    }

    //
    //  called when you open or save a file.  this will watch the file in
    //
    private watchFile = async () => {
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer === undefined) {
            return;
        }
        // console.count("watchFile")

        if (this.state.SaveFileName === this.currentWatchFile) {
            return; // we are already watching it.
        }
        if (this.currentWatchFile !== "") {

            ipcRenderer.send("asynchronous-message", { eventType: "unwatch", fileName: this.currentWatchFile });
        }
        this.currentWatchFile = this.state.SaveFileName;
        ipcRenderer.send("asynchronous-message", { eventType: "watch", fileName: this.currentWatchFile });


    }

    private onFileChanged = async (filename: string) => {
        if (this.savingFile) {
            return;
        }
        let response: IYesNoResponse = {
            answer: this.mySettings.autoUpdate ? YesNo.Yes : YesNo.No
        };

        if (this.mySettings.autoUpdate === false) {
            response = await this.askUserQuestion(`The file ${filename} has changed.  Would you like to re-load it?`, true);
            if (response.neverAsk === true) {
                this.mySettings.autoUpdate = true;
                await this.saveSettings();
            }
        }
        if (response.answer === YesNo.Yes) {
            const contents: string = await this.mainServiceProxy!.readText(filename);
            if (contents !== "") {
                this.setBashScript(filename, contents);
            }
        }


    }

    public componentDidMount = () => {
        window.addEventListener<"resize">('resize', this.handleResize);
        this.setupCallbacks();
        //
        //   need to stop the "react shows unstyled windows" problem
        //
        window.setTimeout(() => {
            this.setState({ Loaded: true });
            this.setState({ theme: this.mySettings.theme })
            window.resizeBy(1, 0);
        }, 250);

        this.reset(); // will create models

    }
    public componentWillUnmount = () => {
        window.removeEventListener<"resize">('resize', this.handleResize);
    }

    //
    //  when the prime react toolbar changes width, it goes to 2 row and then 3 row state
    //  this means that if we set the height of the parameter list in css, then we have to
    //  deal with 3 different calcs - instead i'll do it hear by listening to the window
    //  size event and calculating the height of the parameter list based on the height of
    //  the toolbar.  note that 64px is the size of the div we enter script name in plus
    //  various margins.
    private handleResize = () => {

        const toolbar: HTMLElement | null = window.document.getElementById("toolbar");
        const geDiv: HTMLElement | null = window.document.getElementById("div-global-entry");
        if (toolbar !== null && geDiv !== null) {
            let height = (toolbar.clientHeight + geDiv.clientHeight + 5); // where 5 is the margin between the list and the splitter
            const htStyle: string = `calc(100% - ${height}px)`
            this.setState({ parameterListHeight: htStyle });
        }

    };
    private saveSettings = async (): Promise<void> => {
        console.log("saving settings %o", this.mySettings)
        if (this.electronEnabled && this.mainServiceProxy !== null) {
            await this.mainServiceProxy.saveAndApplySettings(this.mySettings);
        }
        else {
            this.cookie.set("settings", JSON.stringify(this.mySettings));
        }

    }



    private onRefresh = async (): Promise<void> => {
        switch (this.state.activeTabIndex) {
            case 0:
                await this.parseBashUpdateUi();
                break;
            case 1:
                this.parseJSONUpdateUi();
                break;
            default:
                break;
        }


    }

    private onDeleteParameter = async (): Promise<void> => {

        if (this.state.selectedParameter !== undefined) {
            const toDelete: ParameterModel = this.state.selectedParameter;
            let index: number = this.state.parameters.indexOf(this.state.selectedParameter)
            if (index !== -1) {
                //
                //  highlight the item previous to the deleted one, unless it was the first one
                // console.log("deleting parameter: %s", this.state.selectedParameter.longParameter);
                let toSelect: ParameterModel | undefined = this.state.parameters[index === 0 ? 0 : index - 1]; // might be undefined
                this.selectParameter(toSelect); // select a new one (or nothing)
                await this.deleteParameter(toDelete) // delte the one we want
            }
        }

    }


    private reset = () => {

        if (this.scriptModel !== undefined) {
            this.scriptModel.onScriptModelChanged.unsubscribe(this.onScriptModelChanged);
            this.scriptModel.ErrorModel.onErrorsChanged.unsubscribe(this.onErrorsChanged);
            this.scriptModel.ErrorModel.showGrowl.unsubscribe(this.growlError);
        }

        this.scriptModel = this.createScriptModel();
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer !== undefined) {
            ipcRenderer.send("asynchronous-message", { eventType: "unwatch", fileName: this.currentWatchFile });
            this.currentWatchFile = "";
            if (this.mainServiceProxy !== null) {

                this.setTitleBarTitle("");
            }
        }
        this.setState({
            JSON: "",
            bashScript: "",

            debugConfig: "",
            inputJson: "",
            Errors: [],
            SaveFileName: "",

            // these do not get replaced
            scriptName: "",
            description: "",
            parameters: [],

        });

        if (this.myScriptGlobalStateCtrl.current !== null) {
            this.myScriptGlobalStateCtrl.current.Description = "";
            this.myScriptGlobalStateCtrl.current.ScriptName = "";
        }

        this.savingFile = false;

    }


    private deleteParameter = async (parameter: ParameterModel) => {

        this.scriptModel.deleteParameter(parameter);
    }


    private selectParameter = async (toSelect: ParameterModel): Promise<void> => {
        await this.setStateAsync({ selectedParameter: toSelect })

    }

    //
    //  this is called by the models
    public onScriptModelChanged = async (newState: Partial<IScriptModelState>) => {
        // console.log("MainPage::onScriptModelChanged  newState: %o]", newState);
        await this.setStateAsync(newState);

        //
        //  this is a workaround for an electron on windows problem i'm seeing where there is a huge typing lag
        //  by putting the state in a smaller component, the lag goes away
        if (newState.description !== undefined) {
            this.myScriptGlobalStateCtrl.current!.Description = newState.description;
        }

        if (newState.scriptName !== undefined) {
            this.myScriptGlobalStateCtrl.current!.ScriptName = newState.scriptName;
        }

        if (newState.autoInstallDependencies !== undefined) {
            this.myScriptGlobalStateCtrl.current!.AutoInstallDependencies = (newState.autoInstallDependencies === true);
        }

        if (this.mySettings.autoSave) {
            this.onSave(false);
        }
    }



    private setStateAsync = async (newState: Partial<IMainPageState>): Promise<void> => {

        //
        //   got the typings working all the way down to here, but SetState() doesn't like newState
        const o: object = newState as object;
        return new Promise((resolve) => {
            this.setState(o, () => {
                resolve();
            });
        });
    }

    public growlCallback = (message: GrowlMessage | GrowlMessage[]): void => {
        this.growl.current!.show(message);
    }

    //
    //  if we have parameters, ask the user if they really want to create a new file
    //  note that we have some async stuff going on.  we'll resturn from this function
    //  and the answer to the dialog comes back to this.yesNoReset
    private onNew = async () => {
        if (this.state.parameters.length > 0) {
            const response: IYesNoResponse = await this.askUserQuestion("Create a new bash file?", false);
            if (response.answer === YesNo.Yes) {
                this.reset();
            }
        }
    }

    private askUserQuestion = async (question: string, showCheckbox: boolean): Promise<IYesNoResponse> => {
        try {
            await this.setStateAsync({ showYesNoDialog: true });
            if (this.yesNoDlg !== null && this.yesNoDlg.current !== null) {
                const response = await this.yesNoDlg.current.waitForDlgAnswer(question, showCheckbox);
                return response;
            }
            throw new Error("Fatal Error: Dialog should exist");
        }
        finally {
            await this.setStateAsync({ showYesNoDialog: false });
        }
    }

    private createScriptModel = (): ScriptModel => {
        const scriptModel: ScriptModel = new ScriptModel();
        scriptModel.onScriptModelChanged.subscribe(this.onScriptModelChanged);
        scriptModel.ErrorModel.onErrorsChanged.subscribe(this.onErrorsChanged);
        scriptModel.ErrorModel.showGrowl.subscribe(this.growlError);
        return scriptModel;
    }

    private parseBashUpdateUi = async () => {
        this.scriptModel = this.createScriptModel();
        this.scriptModel.parseBash(this.state.bashScript);
    }
    private growlError = (error: IErrorMessage): void => {

        this.growl.current!.show({
            severity: error.severity,
            detail: error.message,
            closable: true,
            life: 5000

        });
    }

    private onErrorsChanged = (errors: IErrorMessage[]): void => {
        this.setState({ Errors: errors });
    }
    //
    //  parse the JSON, but preserve any user code
    //  e.g. maybe the user is adding some parameters, but doesn't want a whole new script.
    private async parseJSONUpdateUi(): Promise<void> {
        const currentUserCode: string = this.scriptModel.UserCode;
        this.scriptModel = this.createScriptModel();
        this.scriptModel.parseJSON(this.state.JSON, currentUserCode);

    }

    get electronEnabled(): boolean {
        if (this.isElectronEnabled === undefined) {
            this.isElectronEnabled = (this.getIpcRenderer() !== undefined);
        }
        return (this.isElectronEnabled === true);
    }

    public onChangedBashScript = async (value: string): Promise<void> => {
        //
        //  we are going to queue up changes for one second, and then save them all
        //
        await this.setStateAsync({ bashScript: value });
        //  console.log (`onChangedBashScript: [autoSave=${this.mySettings.autoSave}]`)
        if (!this.updateTimerSet && this.mySettings.autoSave && this.state.SaveFileName !== "" && this.mainServiceProxy !== null) {

            this.updateTimerSet = true;
            //
            //  there are a bunch of issues with auto-saving when typing that involve the cursor moving around.  onBlur reparses the file and recreates it so that the user
            //  can't change the BashWizard generated code -- but this makes the cursor "jump around" when the user is typing, which is annoying.  so instead we just save
            //  only the bash file as the user types -- and then in onBlur() we reparse and fix anything that broke.

            setTimeout(async () => {
                try {
                    this.savingFile = true;
                    await this.mainServiceProxy!.writeText(this.state.SaveFileName, this.state.bashScript);

                }
                catch (e) {
                    //  console.log("Error saving file: " + e.message);
                }
                finally {
                    this.updateTimerSet = false;
                    this.savingFile = false;
                }
            }, 1000);
        }
    }
    //
    //  when the them is updated, we need to set the state, set the settings, and save the settings, call this to make sure all happen
    private async updateTheme(newTheme: BashWizardTheme): Promise<void> {
        this.setState({ theme: newTheme });
        this.mySettings.theme = newTheme;
        await this.saveSettings();
    }

    public render = () => {
        // console.log(`MainPage::render() [ScriptName=${this.state.scriptName}] `);
        const aceTheme = (this.state.theme === BashWizardTheme.Dark) ? "twilight" : "xcode";
        console.log(`[theme=${aceTheme} [state.theme=${this.state.theme}] [settings.theme=${this.mySettings.theme}]`)
        //
        //  this does the theming
        document.body.classList.toggle('dark', this.state.theme === BashWizardTheme.Dark)
        return (
            <SplitPane className="Splitter"
                split="horizontal"
                defaultSize={"50%"}
                minSize={"8em"}
                onDragFinished={() => {
                    //
                    //  we need to send a windows resize event so that the Ace Editor will change its viewport to match its new size
                    window.dispatchEvent(new Event('resize'));

                }} >

                <div className="DIV_Top">
                    {(this.electronEnabled) &&

                        <TitleBar
                            ref={this.myTitleBar}
                            icon={<ReactSVG className="svg-file-new"
                                src={require("../Images/app-icons/bashwizard.svg")}
                            />}
                            title={this.state.title} />
                    }
                    <div className="top-non-titlebar">
                        <Growl ref={this.growl} />
                        {
                            this.state.showYesNoDialog && <YesNoDialog ref={this.yesNoDlg} />
                        }
                        <Toolbar className="toolbar" id="toolbar">
                            <div className="p-toolbar-group-left">

                                <Button className="p-button-secondary"
                                    label="New File" icon="fas fa-file-medical"
                                    onClick={this.onNew}
                                    style={{ marginRight: '.25em' }} />
                                <Button className="p-button-secondary"
                                    disabled={this.state.activeTabIndex > 1}
                                    label="Refresh" icon="pi pi-refresh"
                                    onClick={this.onRefresh}
                                    style={{ marginRight: '.25em' }} />
                                <SplitButton model={this.state.ButtonModel}
                                    menuStyle={{ width: "16.5em" }}
                                    className="p-button-secondary"
                                    label="Add Parameter" icon="pi pi-plus"
                                    onClick={() => this.scriptModel.addParameter(ParameterType.Custom)}
                                    style={{ marginRight: '.25em' }}
                                />
                                <Button className="p-button-secondary"
                                    disabled={this.state.parameters.length === 0}
                                    label="Delete Parameter"
                                    icon="pi pi-trash"
                                    onClick={async () => await this.onDeleteParameter()}
                                    style={{ marginRight: '.25em' }} />
                                <Button className="p-button-secondary"
                                    disabled={this.state.parameters.length === 0}
                                    label="Expand All"
                                    icon="pi pi-eye"
                                    onClick={() => {
                                        this.scriptModel.generateBashScript = false;
                                        this.state.parameters.map((p) => p.collapsed = false);
                                        this.scriptModel.generateBashScript = true;
                                    }}
                                    style={{ marginRight: '.25em' }} />
                                <Button className="p-button-secondary"
                                    disabled={this.state.parameters.length === 0}
                                    label="Collapse All" icon="pi pi-eye-slash"
                                    onClick={() => {
                                        this.scriptModel.generateBashScript = false;
                                        this.state.parameters.map((p) => p.collapsed = true);
                                        this.scriptModel.generateBashScript = true;
                                    }}
                                    style={{ marginRight: '.25em' }} />
                                <SplitButton model=
                                    {
                                        [
                                            {
                                                label: 'Dark Mode',
                                                icon: "pi pi-circle-on",
                                                checked: this.state.theme === BashWizardTheme.Dark,
                                                command: async () => { await this.updateTheme(BashWizardTheme.Dark) }
                                            },
                                            {
                                                label: 'Light Mode',
                                                icon: "pi pi-circle-off",
                                                checked: this.state.theme === BashWizardTheme.Light,
                                                command: async () => { await this.updateTheme(BashWizardTheme.Light) }
                                            }
                                        ]
                                    }
                                    className="p-button-secondary"
                                    onClick={async () => this.updateTheme(this.state.theme === BashWizardTheme.Dark ? BashWizardTheme.Light : BashWizardTheme.Dark)}
                                    label={this.state.theme === BashWizardTheme.Dark ? "Dark Mode" : "Light Mode"} />
                                <Button className="p-button-secondary"
                                    label="Help"
                                    icon="pi pi-question"
                                    onClick={() => window.open("https://github.com/joelong01/BashWizard/blob/master/README.md")}
                                    style={{ marginRight: '.25em' }} />
                            </div>
                        </Toolbar>
                        {/* this is the section for entering script name and description */}
                        <GlobalScriptData
                            ref={this.myScriptGlobalStateCtrl}
                            description={this.state.description}
                            scriptName={this.state.scriptName}
                            autoInstallDependencies={this.state.autoInstallDependencies}
                            onBlur={(key: "Name" | "Description", value: string) => {
                                if (key === "Name") {
                                    this.scriptModel.scriptName = value;
                                } else {
                                    this.scriptModel.description = value;
                                }
                            }}

                            onCheckedAutoInstall={(checked: boolean) => {
                                this.scriptModel.autoInstallDependencies = checked;
                            }}

                        />
                        {/* this is the section for parameter list */}

                        <ListBox className="Parameter_List"
                            style={{ height: this.state.parameterListHeight, width: "100%" }}
                            options={this.state.parameters}
                            value={this.state.selectedParameter}
                            onChange={(e: { originalEvent: Event, value: any }) => {
                                this.setState({ selectedParameter: e.value })
                            }}
                            filter={false}
                            optionLabel={"uniqueName"}
                            itemTemplate={(parameter: ParameterModel): JSX.Element | undefined => {
                                //  console.log("binding model to view: %o", parameter)
                                return (
                                    <ParameterView Model={parameter} label={parameter.uniqueName} key={parameter.uniqueName} GrowlCallback={this.growlCallback} />
                                );
                            }}

                        />
                    </div>
                </div>
                {/* this is the section for the area below the splitter */}
                <TabView id="tabControl" className="tabControl"
                    activeIndex={this.state.activeTabIndex}
                    onTabChange={((e: { originalEvent: Event, index: number }) => this.setState({ activeTabIndex: e.index }))}>
                    <TabPanel header="Bash Script">
                        <div className="divEditor">
                            <AceEditor ref={this.bashEditor}
                                mode="sh"
                                focus={this.state.bashFocus}
                                name="aceBashEditor"
                                theme={aceTheme}
                                className="aceBashEditor bw-ace"
                                showGutter={true} showPrintMargin={false}
                                value={this.state.bashScript}
                                editorProps={{ $blockScrolling: this.state.bashScript.split("\n").length + 5 }}
                                setOptions={{ autoScrollEditorIntoView: true, vScrollBarAlwaysVisible: true, highlightActiveLine: true, fontSize: 14, highlightSelectedWord: true, selectionStyle: "text" }}
                                onChange={this.onChangedBashScript}
                                onBlur={async () => {
                                    {/* on Blur we parse the bash script and update the model with the results*/ }
                                    await this.parseBashUpdateUi();
                                }}
                            />
                        </div>
                    </TabPanel >
                    <TabPanel header="JSON" >
                        <div className="divEditor">
                            <AceEditor mode="sh"
                                name="aceJSON"
                                theme={aceTheme}
                                className="aceJSONEditor bw-ace"
                                showGutter={true}
                                showPrintMargin={false}
                                value={this.state.JSON}
                                setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14 }}
                                onChange={(newVal: string) => {
                                    this.setState({ JSON: newVal });
                                }}
                                onBlur={async () => {
                                    {/* on Blur we parse the bash script and update the model with the results*/ }
                                    await this.parseJSONUpdateUi();
                                }}
                            />
                        </div>
                    </TabPanel >
                    <TabPanel header="VS Code Debug Config" >
                        <div className="divEditor">
                            <AceEditor mode="sh" name="aceJSON" theme={aceTheme} className="aceJSONEditor bw-ace" showGutter={true} showPrintMargin={false}
                                value={this.state.debugConfig}
                                readOnly={true}
                                setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14 }}
                            />
                        </div>
                    </TabPanel >
                    <TabPanel header="Input JSON" >
                        <div className="divEditor">
                            <AceEditor mode="sh" name="aceJSON"
                                theme={aceTheme}
                                className="aceJSONEditor bw-ace"
                                showGutter={true}
                                showPrintMargin={false}
                                value={this.state.inputJson}
                                readOnly={true}
                                setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14 }}
                            />
                        </div>
                    </TabPanel >
                    <TabPanel header={`Messages (${this.state.Errors.length})`}>
                        <div className="error-message-tab-panel">
                            <div className="bw-error-header">
                                <span className="bw-header-span bw-header-col1">Severity</span>
                                <span className="bw-header-span bw-header-col2">Message</span>
                            </div>

                            <ListBox className="bw-error-listbox"
                                options={this.state.Errors}
                                value={this.state.selectedError}
                                onChange={(e: { originalEvent: Event, value: any }) => {
                                    if (e !== undefined && e.value !== null && e.value !== undefined) {
                                        const error: BWError = e.value;
                                        this.setState({ selectedError: e.value, selectedParameter: error.Parameter })
                                    }

                                }}

                                filter={false}
                                optionLabel={"key"}
                                itemTemplate={(errorMessage: IErrorMessage): JSX.Element | undefined => {
                                    return (
                                        <BWError ErrorMessage={errorMessage}
                                            clicked={(error: BWError) => this.setState({ selectedParameter: error.Parameter })} />
                                    )
                                }}

                            />
                        </div>
                    </TabPanel >
                </TabView>
            </SplitPane>
        );
    }
}

export default MainPage;

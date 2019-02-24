
import React from 'react';
import svgFiles from "../Images/images"
import { ParameterView } from './ParameterView';
import { ParameterModel } from '../Models/ParameterModel';
import SplitPane from 'react-split-pane';
import { uniqueId } from 'lodash-es';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { ToggleButton } from "primereact/togglebutton"
import { InputText } from "primereact/inputtext"
import { Growl, GrowlMessage } from 'primereact/growl';
import Cookies, { Cookie } from "universal-cookie"
import AceEditor from 'react-ace';
import { YesNoDialog } from "./askUserYesNoDlg";
import { SplitButton } from "primereact/splitbutton";
import "brace/mode/sh"
import "brace/mode/json"
import "brace/theme/xcode"
import "brace/theme/cobalt"
import { LocalFileSystemProxy } from "../localFileSystemProxy"
import { IpcRenderer } from "electron";
import { IErrorMessage, ParameterType, IAsyncMessage } from "../Models/commonModel";
import { ScriptModel } from "../Models/scriptModel";

//
//  represents the properties that will impact the UI
//
interface IAppUiState {

    //
    //  if it has "cache" in the name, it means we store the UI state in this variable and then set the model in the onBlur method
    jsonCache: string;
    bashCache: string;
    errorsCache: IErrorMessage[];
    scriptNameCache: string;
    descriptionCache: string;
    parametersCache: ParameterModel[];

    // these is read only in the UI
    inputJson: string;
    debugConfig: string;

    // this data is for UI only and doesn't impact the model
    SelectedParameter?: ParameterModel;
    mode: string; // one of "light" or "dark"
    autoSave: boolean;
    showYesNoDialog: boolean;
    dialogMessage: string;
    selectedError: IErrorMessage | undefined;
    parameterListHeight: string;
    activeTabIndex: number;
    ButtonModel: any[];
    FileName: string;
    Loaded: boolean;

}

class App extends React.Component<{}, IAppUiState> {
    private growl = React.createRef<Growl>();
    private yesNoDlg = React.createRef<YesNoDialog>();
    private _settingState: boolean = false;
    private _loading: boolean = false;
    private cookie: Cookie = new Cookies();
    private savingFile: boolean = false;
    private mainFileSystemProxy: LocalFileSystemProxy = new LocalFileSystemProxy();
    private scriptModel: ScriptModel = new ScriptModel();

    constructor(props: {}) {
        super(props);
        let savedMode = this.cookie.get("mode");
        let autoSaveSetting = this.cookie.get("autosave");
        if (autoSaveSetting === undefined) {
            autoSaveSetting = false;
        }
        //
        //  send settings to the main app to update the browser UI
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer !== undefined) {
            ipcRenderer.sendSync("synchronous-message", { autoSave: autoSaveSetting });
        }

        if (savedMode === "" || savedMode === null || savedMode === undefined) {
            savedMode = "light";
        }

        const params: ParameterModel[] = []
        this.state =
            {
                //
                //  these get replaced in this.stringify
                jsonCache: "",
                bashCache: "",
                scriptNameCache: "",
                descriptionCache: "",
                parametersCache: params,
                errorsCache: [],

                mode: savedMode,
                autoSave: autoSaveSetting,
                debugConfig: "",
                inputJson: "",
                parameterListHeight: "calc(100% - 115px)",
                showYesNoDialog: false,
                dialogMessage: "",

                selectedError: undefined,
                activeTabIndex: 0,
                FileName: "",
                Loaded: false,

                ButtonModel: [

                    {
                        label: 'Add All',
                        icon: "pi pi-globe",
                        command: async () => {
                            this.scriptModel.generateBashScript = false;
                            this.scriptModel.addParameter(ParameterType.VerboseSupport, this.onPropertyChanged);
                            this.scriptModel.addParameter(ParameterType.LoggingSupport, this.onPropertyChanged);
                            this.scriptModel.addParameter(ParameterType.InputFileSupport, this.onPropertyChanged);
                            this.scriptModel.addParameter(ParameterType.Create, this.onPropertyChanged);
                            this.scriptModel.addParameter(ParameterType.Verify, this.onPropertyChanged);
                            this.scriptModel.addParameter(ParameterType.Delete, this.onPropertyChanged);
                            this.scriptModel.generateBashScript = true;
                            await this.updateAllText();
                        }
                    },
                    {
                        //  target allows us to use CSS to style this item
                        disabled: true, target: 'separator'
                    },
                    {
                        label: 'Add Verbose Support',
                        icon: "pi pi-camera",
                        command: async () => {
                            this.scriptModel.generateBashScript = false;
                            this.scriptModel.addParameter(ParameterType.VerboseSupport, this.onPropertyChanged);
                            this.scriptModel.generateBashScript = true;
                            await this.updateAllText();
                        }
                    },
                    {
                        label: 'Add Logging Support',
                        icon: "pi pi-pencil",
                        command: async () => {
                            this.scriptModel.generateBashScript = false;
                            this.scriptModel.addParameter(ParameterType.LoggingSupport, this.onPropertyChanged);
                            this.scriptModel.generateBashScript = true;
                            await this.updateAllText();
                        }
                    },
                    {
                        label: 'Add Input File Support',
                        icon: "pi pi-list",
                        command: async () => {
                            this.scriptModel.generateBashScript = false;
                            this.scriptModel.addParameter(ParameterType.InputFileSupport, this.onPropertyChanged);
                            this.scriptModel.generateBashScript = true;
                            await this.updateAllText();
                        }
                    },
                    {
                        label: 'Add Create, Validate, Delete',
                        icon: "pi pi-table",
                        command: async () => {
                            this.scriptModel.generateBashScript = false;
                            this.scriptModel.addParameter(ParameterType.Create, this.onPropertyChanged);
                            this.scriptModel.addParameter(ParameterType.Verify, this.onPropertyChanged);
                            this.scriptModel.addParameter(ParameterType.Delete, this.onPropertyChanged);
                            this.scriptModel.generateBashScript = true;
                            await this.updateAllText();
                        }
                    }


                ],


            }
    }



    private getIpcRenderer(): IpcRenderer | undefined {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf(' electron/') === -1) {
            console.log ("not running electron!")
            return undefined;
        }
        if (typeof window["require"] !== "undefined") {
            console.log ("running electron!")
            // tslint:disable-next-line:no-string-literal
            return window["require"]("electron").ipcRenderer;

        }
        console.log ("not running electron - but user agent string says you should be")
        return undefined;
    }
    private setupCallbacks = () => {
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer !== undefined) {
            ipcRenderer.on("on-new", async (event: any, message: any) => {
                this.reset(); // this gets verified in the main process
            });

            ipcRenderer.on("on-open", async (event: any, message: any[]) => {
                await this.setBashScript(message[0], message[1]);
            });

            ipcRenderer.on("on-save", async (event: any, message: any[]) => {
                await this.onSave(false);
            });

            ipcRenderer.on("on-save-as", async (event: any, message: any[]) => {
                await this.onSave(true);
            });

            ipcRenderer.on("on-auto-save-checked", async (event: any, message: any[]) => {
                await this.setStateAsync({ autoSave: message[0] });
                this.saveSettings();
            });

            ipcRenderer.on('asynchronous-reply', (event: string, msg: string) => {
                const msgObj: IAsyncMessage = JSON.parse(msg);
                if (msgObj.event === "file-changed") {
                    if (this.state.FileName.endsWith(msgObj.fileName)) {
                        this.onFileChanged(this.state.FileName);
                    } else {
                        console.log(`rejecting file change nofification for ${msgObj.fileName}`);
                    }

                }
            })


        }
    }

    private onSave = async (alwaysPrompt: boolean): Promise<void> => {
        if (this.savingFile) {
            return;
        }
        try {
            this.savingFile = true; // we don't want notifications of changes that we started
            if (this.state.FileName === "" || alwaysPrompt === true) {
                const fn = await this.mainFileSystemProxy.getSaveFile("Bash Wizard", [{ name: "Bash Scripts", extensions: ["sh"] }]);
                if (fn === "" || fn === undefined) {
                    return;
                }
                this.watchFile(fn);
            }
            await await this.parseBashUpdateUi();
            await this.mainFileSystemProxy.writeText(this.state.FileName, this.scriptModel.BashScript);
        }
        catch (error) {
            this.growl.current!.show({ severity: "error", summary: "Error Message", detail: "Error saving the file.  Details: \n" + error });
        }
        finally {
            this.savingFile = false;
        }

    }

    //
    //  this starts in the render process and then calls to the main process.
    //  setBashScript is called from the main process and then data is pushed to the render process
    private onLoadFile = async (): Promise<boolean> => {

        try {
            const fn = await this.mainFileSystemProxy.getOpenFile("Bash Wizard", [{ name: "Bash Scripts", extensions: ["sh"] }]);
            if (fn !== "" || fn !== undefined) {
                const contents: string = await this.mainFileSystemProxy.readText(fn);
                if (contents !== "") {
                    const ret: boolean = await this.setBashScript(fn, contents);
                    if (ret) {
                        this.watchFile(fn);
                    }
                    return ret;
                }
            }
        }
        catch (error) {
            this.growl.current!.show({ severity: "error", summary: "Error Message", detail: "Error loading the file.  Details: \n" + error });
        }
        return false;
    }

    //
    //  called when the main process opens a file, reads the contents, and sends it back to the render process
    private setBashScript = async (filename: string, contents: string): Promise<boolean> => {
        if (contents !== "") {
            this.watchFile(filename);
            await this.setStateAsync({ bashCache: contents, FileName: filename });
            await this.parseBashUpdateUi();
            return true;
        }
        return false;
    }

    private updateStateWithModelData = async (model: ScriptModel): Promise<void> => {
        console.log("this.state: %o", this.state);
        this.scriptModel = model;
        await this.setStateAsync({
            jsonCache: model.stringify(),
            bashCache: model.toBash(),
            scriptNameCache: model.scriptName,
            descriptionCache: model.description,
            parametersCache: model.parameters,
            errorsCache: model.Errors,
            inputJson: model.inputJSON,
            debugConfig: model.getDebugConfig("./")

        });
    }


    //
    //  called when you open or save a file
    //
    private watchFile = async (fn: string) => {

        if (this.state.FileName === fn) {
            return; // we are already watching it.
        }
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer !== undefined) {
            ipcRenderer.send("asynchronous-message", { eventType: "unwatch", filename: this.state.FileName });
            await this.setStateAsync({ FileName: fn }); // need read after write
            ipcRenderer.send("asynchronous-message", { eventType: "watch", filename: fn });
        }

    }

    private onFileChanged = async (filename: string) => {
        if (this.savingFile) {
            return;
        }
        await this.setStateAsync({ showYesNoDialog: true });
        const response = await this.askUserQuestion(`The file ${filename} has changed.  Would you like to re-load it?`);
        if (response === "yes") {

            const contents: string = await this.mainFileSystemProxy.readText(filename);
            if (contents !== "") {
                await this.setBashScript(filename, contents);
                return;
            }
            else {

                return;
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
            window.resizeBy(1, 0);
        }, 150);


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
    private saveSettings = (): void => {
        this.cookie.set("mode", this.state.mode);
        this.cookie.set("autosave", this.state.autoSave);

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

        if (this.state.SelectedParameter !== undefined) {
            const toDelete: ParameterModel = this.state.SelectedParameter;
            let index: number = this.state.parametersCache.indexOf(this.state.SelectedParameter)
            if (index !== -1) {
                //
                //  highlight the item previous to the deleted one, unless it was the first one

                let toSelect: ParameterModel | undefined = this.state.parametersCache[index === 0 ? 0 : index - 1]; // might be undefined
                this.selectParameter(toSelect); // select a new one (or nothing)
                await this.deleteParameter(toDelete) // delte the one we want
            }
            else {
                throw new Error("index of selected item is -1!");
            }
        }

    }


    private reset = () => {
        this.state.parametersCache.map((el: ParameterModel) => {
            el.removeNotify(this.onPropertyChanged);
        }
        );

        this.scriptModel = new ScriptModel(this.onPropertyChanged);
        this.setState({
            jsonCache: "",
            bashCache: "",

            debugConfig: "",
            inputJson: "",
            errorsCache: [],

            // these do not get replaced
            scriptNameCache: "",
            descriptionCache: "",
            parametersCache: [],

        });
    }

    private updateAllText = async () => {

        await this.updateStateWithModelData(this.scriptModel);
        if (this.state.autoSave) {
            await this.onSave(false);
        }

    }

    private onBlurDescription = async (e: React.FocusEvent<InputText & HTMLInputElement>) => {
        this.scriptModel.description = this.state.descriptionCache;
        await this.updateAllText();
    }
    private onBlurScriptName = async (e: React.FocusEvent<InputText & HTMLInputElement>) => {
        const end: string = e.currentTarget.value!.slice(-3);
        let name: string = e.currentTarget.value;
        if (end !== ".sh" && end !== "") {
            this.growl.current!.show({ severity: "warn", summary: "Bash Wizard", detail: "Adding .sh to the end of your script name." });
            name += ".sh";
            await this.setState({ scriptNameCache: name });
            await this.updateAllText();
        }
        this.scriptModel.scriptName = name;
        await this.updateAllText();
    }

    private deleteParameter = async (parameter: ParameterModel) => {
        try {
            await this.setStateAsync({ parametersCache: this.scriptModel.deleteParameter(parameter, this.onPropertyChanged) });
            await this.updateAllText();
        }
        catch (error) {
            this.addErrorMessage("error", "Could not delete parameter.  Exception: " + error, parameter);
        }

    }

    private addErrorMessage = (sev: "warn" | "error" | "info", message: string, parameter?: ParameterModel) => {
        let newMsg = {} as IErrorMessage;
        newMsg.severity = sev;
        newMsg.message = message;
        newMsg.selected = false;
        newMsg.Parameter = parameter;
        newMsg.key = uniqueId("error:");
        this.growl.current!.show({ severity: sev, summary: "Error Message", detail: message + "\n\rSee \"Message\" tab." });
        this.setState({ errorsCache: [...this.state.errorsCache, newMsg] });
    }


    private selectParameter = async (toSelect: ParameterModel): Promise<void> => {

        if (this.state.SelectedParameter === toSelect) {
            return;
        }
        if (this.state.SelectedParameter !== undefined) {
            this.state.SelectedParameter.selected = false; // old selected no longer selected
        }
        if (toSelect !== undefined) {
            toSelect.selected = true;
        }
        await this.setStateAsync({ SelectedParameter: toSelect })
    }

    //
    //  this is called by the model
    public onPropertyChanged = async (parameter: ParameterModel, name: string) => {

        if (this._loading === true) {
            return;
        }
        if (this._settingState === true) {
            return;
        }

        if (name === "focus") {
            return;
        }


        try {

            this._settingState = true;
            if (name === "selected") {
                await this.selectParameter(parameter);
                return;
            }


        }
        finally {
            this._settingState = false;
            if (name !== "selected" && name !== "focus" && name !== "BashScript" && name !== "JSON") {
                await this.updateAllText();
            }
        }

    }


    private addParameter = async (model: ParameterModel, select: boolean) => {
        await this.setStateAsync({ Parameters: this.scriptModel.addParameter(ParameterType.Custom, this.onPropertyChanged) });
        await this.updateAllText();
        if (select) {
            await this.selectParameter(model);
        }
    }


    private setStateAsync = (newState: object): Promise<void> => {

        console.log ("oldState: %o", this.state);
        console.log ("newState: %o", newState);
        Object.keys(newState).map((key) => {
            if (!(key in this.state)) {
                throw new Error(`setStateAsync called with bad property: ${key}`);
            }
            if (newState[key] !== this.state[key]){
                console.log(`updating state for ${key}`);
            }
        })

        return new Promise((resolve, reject) => {
            this.setState(newState, () => {
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
        if (this.state.parametersCache.length > 0) {
            const response = await this.askUserQuestion("Create a new bash file?");
            if (response === "yes") {
                this.reset();
            }
        }
    }

    private askUserQuestion = async (question: string): Promise<string> => {
        try {
            await this.setStateAsync({ showYesNoDialog: true });
            if (this.yesNoDlg !== null && this.yesNoDlg.current !== null) {
                const response = await this.yesNoDlg.current.waitForDlgAnswer(question);
                return response;
            }
            return "no";
        }
        finally {
            await this.setStateAsync({ showYesNoDialog: false });
        }
    }

    private onErrorClicked = (e: React.MouseEvent<HTMLDivElement>, item: IErrorMessage) => {
        if (this.state.selectedError !== undefined) {
            this.state.selectedError.selected = false;
        }
        item.selected = true;
        this.setState({ selectedError: item });
        if (item.Parameter !== undefined) {
            item.Parameter.focus();
        }

    }

    private parseBashUpdateUi = async () => {
        const model: ScriptModel = ScriptModel.parseBash(this.state.bashCache, this.onPropertyChanged);
        await this.updateStateWithModelData(model);
    }

    private async parseJSONUpdateUi(): Promise<void> {
        const model: ScriptModel = ScriptModel.parseJSON(this.state.jsonCache, this.onPropertyChanged);
        await this.updateStateWithModelData(model);

    }

    public render = () => {
        let electronEnabled: boolean = (this.getIpcRenderer !== undefined);
        const mode: string = this.state.mode === "dark" ? "cobalt" : "xcode";
        return (

            <div className="outer-container" id="outer-container" style={{ opacity: this.state.Loaded ? 1.0 : 0.01 }}>
                <Growl ref={this.growl} />
                {
                    (this.state.showYesNoDialog) ? <YesNoDialog ref={this.yesNoDlg} /> : ""
                }
                <div id="DIV_LayoutRoot" className="DIV_LayoutRoot">
                    <SplitPane className="Splitter" split="horizontal" defaultSize={"50%"} minSize={"125"} onDragFinished={(newSize: number) => {
                        //
                        //  we need to send a windows resize event so that the Ace Editor will change its viewport to match its new size
                        window.dispatchEvent(new Event('resize'));

                    }} >
                        <div className="DIV_Top">
                            <Toolbar className="toolbar" id="toolbar">
                                <div className="p-toolbar-group-left">
                                    <button className="bw-button p-component" onClick={this.onNew}>
                                        <img className="bw-button-icon" srcSet={svgFiles.FileNewBlack} />
                                        <span className="bw-button-span p-component">New Script</span>
                                    </button>
                                    {(electronEnabled) ?
                                        <Button className="p-button-secondary" label="Open File" icon="pi pi-upload" disabled={!electronEnabled} onClick={this.onLoadFile} style={{ marginRight: '.25em' }} />
                                        :
                                        ""
                                    }
                                    <Button className="p-button-secondary" disabled={this.state.activeTabIndex > 1} label="Refresh" icon="pi pi-refresh" onClick={this.onRefresh} style={{ marginRight: '.25em' }} />
                                    <SplitButton model={this.state.ButtonModel} menuStyle={{ width: "16.5em" }} className="p-button-secondary" label="Add Parameter" icon="pi pi-plus" onClick={() => this.addParameter(new ParameterModel(), true)} style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary" disabled={this.state.parametersCache.length === 0} label="Delete Parameter" icon="pi pi-trash" onClick={async () => await this.onDeleteParameter()} style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary" disabled={this.state.parametersCache.length === 0} label="Expand All" icon="pi pi-eye"
                                        onClick={() => {
                                            this.scriptModel.generateBashScript = false;
                                            this.state.parametersCache.map((p) => p.collapsed = false);
                                            this.scriptModel.generateBashScript = true;
                                        }}
                                        style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary" disabled={this.state.parametersCache.length === 0} label="Collapse All" icon="pi pi-eye-slash"
                                        onClick={() => {
                                            this.scriptModel.generateBashScript = false;
                                            this.state.parametersCache.map((p) => p.collapsed = true);
                                            this.scriptModel.generateBashScript = true;
                                        }}
                                        style={{ marginRight: '.25em' }} />

                                </div>
                                <div className="p-toolbar-group-right">
                                    <ToggleButton className="p-button-secondary" onIcon="pi pi-circle-on" onLabel="Dark Mode" offIcon="pi pi-circle-off" offLabel="Light Mode"
                                        checked={this.state.mode === "dark"}
                                        onChange={async (e: { originalEvent: Event, value: boolean }) => {
                                            await this.setStateAsync({ mode: e.value ? "dark" : "light" });
                                            this.saveSettings();
                                            this.growl.current!.show({ severity: "info", summary: "Bash Wizard", detail: "Only the editor has been themed so far." });
                                        }}
                                        style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary" label="" icon="pi pi-question" onClick={() => window.open("https://github.com/joelong01/Bash-Wizard")} style={{ marginRight: '.25em' }} />
                                </div>
                            </Toolbar>
                            {/* this is the section for entering script name and description */}
                            <div className="DIV_globalEntry" id="div-global-entry">
                                <div className="p-grid grid-global-entry">
                                    <div className="p-col-fixed column-global-entry">
                                        <span className="p-float-label">
                                            <InputText id="scriptName" className="param-input" spellCheck={false}
                                                value={this.state.scriptNameCache}
                                                onChange={async (e: React.FormEvent<HTMLInputElement>) => {
                                                    await this.setStateAsync({ scriptNameCache: e.currentTarget.value});
                                                }}
                                                onBlur={this.onBlurScriptName} />
                                            <label htmlFor="scriptName" className="param-label">Script Name</label>
                                        </span>
                                    </div>
                                    <div className="p-col-fixed column-global-entry">
                                        <span className="p-float-label">
                                            <InputText className="param-input" id="description_input" spellCheck={false}
                                                value={this.state.descriptionCache}
                                                onChange={ async (e: React.FormEvent<HTMLInputElement>) => {
                                                    await this.setStateAsync({ scriptNameCache: e.currentTarget.value});
                                            }}
                                                onBlur={this.onBlurDescription} />
                                            <label className="param-label" htmlFor="description_input" >Description</label>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* this is the section for parameter list */}
                            <div className="Parameter_List" style={{ height: this.state.parameterListHeight }}>
                                {this.state.parametersCache.map(parameter => (
                                    <div className={parameter.uniqueName} key={parameter.uniqueName} ref={parameter.uniqueName}>
                                        <ParameterView Model={parameter} Name={parameter.uniqueName} GrowlCallback={this.growlCallback} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* this is the section for the area below the splitter */}
                        <TabView id="tabControl" className="tabControl" activeIndex={this.state.activeTabIndex} onTabChange={((e: { originalEvent: Event, index: number }) => this.setState({ activeTabIndex: e.index }))}>
                            <TabPanel header="Bash Script">
                                <div className="divEditor">
                                    <AceEditor mode="sh" name="aceBashEditor" theme={mode} className="aceBashEditor bw-ace" showGutter={true} showPrintMargin={false}
                                        value={this.state.bashCache}
                                        setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14, }}
                                        onChange={(newVal: string) => {
                                            this.setState({ bashCache: newVal });
                                        }}
                                        onBlur={async () => {
                                            {/* on Blur we parse the bash script and update the model with the results*/ }
                                            await this.parseBashUpdateUi();
                                        }}
                                    />
                                </div>
                            </TabPanel >
                            <TabPanel header="JSON" >
                                <div className="divEditor">
                                    <AceEditor mode="sh" name="aceJSON" theme={mode} className="aceJSONEditor bw-ace" showGutter={true} showPrintMargin={false}
                                        value={this.state.jsonCache}
                                        setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14 }}
                                        onChange={(newVal: string) => {
                                            this.setState({ jsonCache: newVal });
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
                                    <AceEditor mode="sh" name="aceJSON" theme={mode} className="aceJSONEditor bw-ace" showGutter={true} showPrintMargin={false}
                                        value={this.state.debugConfig}
                                        readOnly={true}
                                        setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14 }}
                                    />
                                </div>
                            </TabPanel >
                            <TabPanel header="Input JSON" >
                                <div className="divEditor">
                                    <AceEditor mode="sh" name="aceJSON" theme={mode} className="aceJSONEditor bw-ace" showGutter={true} showPrintMargin={false}
                                        value={this.state.inputJson}
                                        readOnly={true}
                                        setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14 }}
                                    />
                                </div>
                            </TabPanel >
                            <TabPanel header={`Messages (${this.state.errorsCache.length})`}>
                                <div className="bw-error-list" >
                                    <div className="bw-error-header">
                                        <span className="bw-error-span error-col1">Severity</span>
                                        <span className="bw-error-span error-col2">Message</span>
                                    </div>
                                    {
                                        this.state.errorsCache.map((item: IErrorMessage) => {
                                            let className: string = "bw-error-item";
                                            if (this.state.selectedError === item) {
                                                className += " bw-error-item-selected";
                                            }


                                            return (
                                                <div className={className} key={item.key}
                                                    onClick={(e: React.MouseEvent<HTMLDivElement>) => { this.onErrorClicked(e, item) }}>
                                                    <span className="bw-error-span error-col1" key={item.key + ".col1"} >{item.severity}</span>
                                                    <span className="bw-error-span error-col2" key={item.key + ".col2"} >{item.message}</span>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </TabPanel >
                        </TabView>
                    </SplitPane>
                </div >
            </div >
        );
    }



}

export default App;

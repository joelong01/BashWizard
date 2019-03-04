
import React from 'react';
import svgFiles from "../Images/images"
import { ParameterView } from '../Components/ParameterView';
import { ParameterModel } from '../Models/ParameterModel';
import SplitPane from 'react-split-pane';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { ToggleButton } from "primereact/togglebutton"
import { InputText } from "primereact/inputtext"
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
import { IErrorMessage, ParameterType, IAsyncMessage, IBashWizardSettings, BashWizardTheme, IMainPageUiState } from "../Models/commonModel";
import { ScriptModel } from "../Models/scriptModel";
import { ListBox } from "primereact/listbox"
import { BWError } from "../Components/bwError"
import "../Themes/dark/theme.css"


//
//  represents the properties that will impact the UI
//
interface IMainPageState extends IMainPageUiState {


    // this data is for UI only and doesn't impact the model
    selectedParameter?: ParameterModel;
    theme: BashWizardTheme;
    autoSave: boolean;
    autoUpdate: boolean;
    showYesNoDialog: boolean;
    dialogMessage: string;
    selectedError: IErrorMessage | undefined;
    parameterListHeight: string;
    activeTabIndex: number;
    ButtonModel: any[];
    SaveFileName: string;
    bashFocus: boolean; // used to set the AceEditor with the bashscript visible
    Loaded: boolean;

}

class MainPage extends React.Component<{}, IMainPageState> {
    private growl = React.createRef<Growl>();
    private yesNoDlg = React.createRef<YesNoDialog>();
    private bashEditor: React.RefObject<AceEditor> = React.createRef<AceEditor>();
    private cookie: Cookie = new Cookies();
    private savingFile: boolean = false;
    private mainServiceProxy: BashWizardMainServiceProxy = new BashWizardMainServiceProxy();
    private scriptModel: ScriptModel;
    private currentWatchFile: string = "";
    private updateTimerSet: boolean = false; //used in the bash script onChange() event to update
    private mySettings: IBashWizardSettings = {
        autoSave: false,
        theme: BashWizardTheme.Light,
        autoUpdate: false,
        showDebugger: false
    };

    constructor(props: {}) {
        super(props);

        //
        //  send settings to the main app to update the browser UI
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer !== undefined) {
            //
            //  can't do promises in the ctor, so use the .then construct.  note that this api
            //  never rejects the promise, so we will get back default settings on any error
            this.mainServiceProxy.getAndApplySettings().then((settings: IBashWizardSettings) => {
                this.mySettings = settings;
            })
        } else {
            // browser stores this in a cookie
            let saved: string = this.cookie.get("settings")
            if (saved !== "" && saved !== null && saved !== undefined) {
                try {
                    this.mySettings = JSON.parse(saved);
                }
                catch (er) { // swollow errors and use defaults
                    console.log(`error loading cookie: ${er}`);
                }
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
                parameters: params,
                Errors: [],

                theme: this.mySettings.theme,
                autoSave: this.mySettings.autoSave,
                autoUpdate: this.mySettings.autoUpdate,
                debugConfig: "",
                inputJson: "",
                parameterListHeight: "calc(100% - 115px)",
                showYesNoDialog: false,
                dialogMessage: "",

                selectedError: undefined,
                selectedParameter: undefined,
                activeTabIndex: 0,
                SaveFileName: "",
                Loaded: false,
                bashFocus: false,
                ButtonModel: this.getButtonModel(),


            }


    }

    private getButtonModel(): any[] {
        return [

            {
                label: 'Add All',
                icon: "pi pi-globe",
                command: () => {
                    this.scriptModel.startBatchChanges();
                    this.scriptModel.addParameter(ParameterType.VerboseSupport);
                    this.scriptModel.addParameter(ParameterType.LoggingSupport);
                    this.scriptModel.addParameter(ParameterType.InputFileSupport);
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
                    this.scriptModel.addParameter(ParameterType.VerboseSupport);

                }
            },
            {
                label: 'Add Logging Support',
                icon: "pi pi-pencil",
                command: () => {
                    this.scriptModel.addParameter(ParameterType.LoggingSupport);

                }
            },
            {
                label: 'Add Input File Support',
                icon: "pi pi-list",
                command: () => {
                    this.scriptModel.addParameter(ParameterType.InputFileSupport)
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
                console.log("onSaveAs. this.state=%o", this.state);
                await this.onSave(true);
            });

            ipcRenderer.on("on-setting-changed", async (event: any, message: object) => {
                Object.keys(message).map((key) => {
                    console.log(`new Setting [${key}=${message[key]}]`)
                    this.mySettings[key] = message[key];
                });
                await this.saveSettings();
            });

            ipcRenderer.on('asynchronous-reply', async (event: string, msg: string) => {
                const msgObj: IAsyncMessage = JSON.parse(msg);
                if (msgObj.event === "file-changed") {
                    if (this.state.SaveFileName.endsWith(msgObj.fileName)) {
                        await this.onFileChanged(this.state.SaveFileName);
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
            if (this.state.SaveFileName === "" || alwaysPrompt === true) {
                const newFileName = await this.mainServiceProxy.getSaveFile("Bash Wizard", [{ name: "Bash Scripts", extensions: ["sh"] }]);
                if (newFileName === "" || newFileName === undefined) {
                    return;
                }
                await this.setStateAsync({ SaveFileName: newFileName });
            }
            await this.mainServiceProxy.writeText(this.state.SaveFileName, this.scriptModel.bashScript);
            this.watchFile(); // this has to be done after .writeText, otherwise the file might not exist
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
            const newFileName = await this.mainServiceProxy.getOpenFile("Bash Wizard", [{ name: "Bash Scripts", extensions: ["sh"] }]);
            if (newFileName !== "" || newFileName !== undefined) {
                const contents: string = await this.mainServiceProxy.readText(newFileName);
                if (contents !== "") {
                    const ret: boolean = await this.setBashScript(newFileName, contents); // calls setState on the filenmae
                    if (ret) {
                        this.watchFile();
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
        await this.setStateAsync({ bashScript: contents, SaveFileName: filename });
        this.watchFile();
        await this.parseBashUpdateUi();
        return true;
    }

    //
    //  called when you open or save a file.  this will watch the file in
    //
    private watchFile = async () => {
        const ipcRenderer: IpcRenderer | undefined = this.getIpcRenderer();
        if (ipcRenderer === undefined) {
            return;
        }

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
        console.log("onFileChanged called.")
        if (this.savingFile) {
            return;
        }
        console.log("onFileChanged:mySettings: %o", this.mySettings);
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
            const contents: string = await this.mainServiceProxy.readText(filename);
            if (contents !== "") {
                await this.setBashScript(filename, contents);
            }
        }

        this.setState({ autoUpdate: this.mySettings.autoUpdate });

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
        if (this.electronEnabled) {
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
                console.log("deleting parameter: %s", this.state.selectedParameter.longParameter);
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

        if (this.mainServiceProxy !== null) {
            this.mainServiceProxy.setWindowTitle("");
        }
        this.setState({
            JSON: "",
            bashScript: "",

            debugConfig: "",
            inputJson: "",
            Errors: [],

            // these do not get replaced
            scriptName: "",
            description: "",
            parameters: [],

        });
    }

    private onBlurDescription = async (e: React.FocusEvent<InputText & HTMLInputElement>) => {
        this.scriptModel.description = this.state.description;
    }
    private onBlurScriptName = async (e: React.FocusEvent<InputText & HTMLInputElement>) => {
        this.scriptModel.scriptName = this.state.scriptName;
    }

    private deleteParameter = async (parameter: ParameterModel) => {

        this.scriptModel.deleteParameter(parameter);
    }


    private selectParameter = async (toSelect: ParameterModel): Promise<void> => {
        await this.setStateAsync({ selectedParameter: toSelect })
    }

    //
    //  this is called by the models
    public onScriptModelChanged = async (newState: Partial<IMainPageUiState>) => {
        // console.log("MainPage::onScriptModelChanged  newState: %o]", newState);
        await this.setStateAsync(newState);
    }



    private setStateAsync = async (newState: Partial<IMainPageState>): Promise<void> => {

        //
        //   got the typings working all the way down to here, but SetState() doesn't like newState
        const o: object = newState as object;
        return new Promise((resolve, reject) => {
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
        return (this.getIpcRenderer() !== undefined);
    }

    public onChangedBashScript = async (value: string, event?: any): Promise<void> => {
        //
        //  we are going to queue up changes for one second, and then save them all
        //
        await this.setStateAsync({ bashScript: value });
        if (!this.updateTimerSet && this.mySettings.autoSave && this.state.SaveFileName !== "") {

            this.updateTimerSet = true;
            //
            //  there are a bunch of issues with auto-saving when typing that involve the cursor moving around.  onBlur reparses the file and recreates it so that the user
            //  can't change the BashWizard generated code -- but this makes the cursor "jump around" when the user is typing, which is annoying.  so instead we just save
            //  only the bash file as the user types -- and then in onBlur() we reparse and fix anything that broke.
            setTimeout(async () => {
                try {
                    this.savingFile = true;
                    await this.mainServiceProxy.writeText(this.state.SaveFileName, this.state.bashScript);
                }
                catch (e) {
                    console.log("Error saving file: " + e.message);
                }
                finally {
                    this.updateTimerSet = false;
                    this.savingFile = false;
                }
            }, 1000);
        }
    }

    public render = () => {
        // console.count("MainPage::render()");
        const aceTheme = (this.state.theme === BashWizardTheme.Dark) ? "twilight" : "xcode";
        document.body.classList.toggle('dark', this.state.theme === BashWizardTheme.Dark)
        return (
            <div className="outer-container"
                id="outer-container"
                style={{ opacity: this.state.Loaded ? 1.0 : 0.01 }}>
                <Growl ref={this.growl} />
                {
                    (this.state.showYesNoDialog) ? <YesNoDialog ref={this.yesNoDlg} /> : ""
                }
                <div id="DIV_LayoutRoot" className="DIV_LayoutRoot">
                    <SplitPane className="Splitter"
                        split="horizontal"
                        defaultSize={"50%"}
                        minSize={"8em"}
                        onDragFinished={(newSize: number) => {
                            //
                            //  we need to send a windows resize event so that the Ace Editor will change its viewport to match its new size
                            window.dispatchEvent(new Event('resize'));

                        }} >
                        <div className="DIV_Top">
                            <Toolbar className="toolbar" id="toolbar">
                                <div className="p-toolbar-group-left">
                                    <button className="bw-button p-component"
                                        onClick={this.onNew}>
                                        <img className="bw-button-icon"
                                            srcSet={this.state.theme === BashWizardTheme.Dark ? svgFiles.FileNew : svgFiles.FileNewBlack} />
                                        <span className="bw-button-span p-component">New Script</span>
                                    </button>
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

                                </div>
                                <div className="p-toolbar-group-right">
                                    <ToggleButton className="p-button-secondary"
                                        onIcon="pi pi-circle-on"
                                        onLabel="Dark Mode"
                                        offIcon="pi pi-circle-off"
                                        offLabel="Light Mode"
                                        checked={this.state.theme === BashWizardTheme.Dark}
                                        onChange={async (e: { originalEvent: Event, value: boolean }) => {
                                            this.mySettings.theme = e.value ? BashWizardTheme.Dark : BashWizardTheme.Light
                                            await this.setStateAsync({ theme: this.mySettings.theme });
                                            await this.saveSettings();
                                        }}
                                        style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary"
                                        label=""
                                        icon="pi pi-question"
                                        onClick={() => window.open("https://github.com/joelong01/Bash-Wizard")}
                                        style={{ marginRight: '.25em' }} />
                                </div>
                            </Toolbar>
                            {/* this is the section for entering script name and description */}
                            <div className="DIV_globalEntry" id="div-global-entry">
                                <div className="p-grid grid-global-entry">
                                    <div className="p-col-fixed column-global-entry">
                                        <span className="p-float-label">
                                            <InputText id="scriptName"
                                                className="param-input"
                                                spellCheck={false}
                                                value={this.state.scriptName}
                                                onChange={async (e: React.FormEvent<HTMLInputElement>) => {
                                                    await this.setStateAsync({ scriptName: e.currentTarget.value });
                                                }}
                                                onBlur={this.onBlurScriptName} />
                                            <label htmlFor="scriptName" className="param-label">Script Name</label>
                                        </span>
                                    </div>
                                    <div className="p-col-fixed column-global-entry">
                                        <span className="p-float-label">
                                            <InputText className="param-input"
                                                id="description_input"
                                                spellCheck={false}
                                                value={this.state.description}
                                                onChange={async (e: React.FormEvent<HTMLInputElement>) => {
                                                    await this.setStateAsync({ description: e.currentTarget.value });
                                                }}
                                                onBlur={this.onBlurDescription} />
                                            <label className="param-label"
                                                htmlFor="description_input" >Description</label>
                                        </span>
                                    </div>
                                </div>
                            </div>
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
                                    return (
                                        <ParameterView Model={parameter} label={parameter.uniqueName} key={parameter.uniqueName} GrowlCallback={this.growlCallback} />
                                    );
                                }}

                            />
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
                                        onFocus={() => console.log("bash ACE Editor onFocus")}
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
                </div >
            </div >
        );
    }
}

export default MainPage;

import "./index.css"
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css'
import * as React from 'react';
import svgFiles from "./images"
import { ParameterView } from './ParameterView';
import ParameterModel from './ParameterModel';
import { bashTemplates } from './bashTemplates';
import SplitPane from 'react-split-pane';
import trim from 'lodash-es/trim';
import trimEnd from 'lodash-es/trimEnd';
import trimStart from 'lodash-es/trimStart';
import { camelCase } from "lodash-es";
import { uniqueId } from 'lodash-es';
import { padEnd } from 'lodash-es'
import { TabView, TabPanel } from 'primereact/tabview';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { ToggleButton } from "primereact/togglebutton"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { Growl, GrowlMessage } from 'primereact/growl';


import Cookies, { Cookie } from "universal-cookie"
import AceEditor from 'react-ace';

import "brace/mode/sh"
import "brace/mode/json"
import "brace/theme/xcode"
import "brace/theme/cobalt"
import "./ParameterView.css"
import "./App.css"
interface IAppState {
    //
    //  these get replaced in this.stringify
    menuOpen: boolean;
    json: string;
    bash: string;
    endOfBash: string;
    input: string;
    SelectedParameter?: ParameterModel;
    debugConfig: string;
    inputJson: string;
    mode: string; // one of "light" or "dark"
    builtInParameterSelected: string | null;
    // parameters with built in support
    verboseParameter: boolean;
    loggingParameter: boolean;
    inputFileParameter: boolean;
    cvdParameters: boolean;


    //
    //  these get stringified
    //  these must match https://github.com/joelong01/Bash-Wizard/blob/master/bashGeneratorSharedModels/ConfigModel.cs
    ScriptName: string;
    Description: string;
    Parameters: ParameterModel[];


}


class App extends React.Component<{}, IAppState> {

    private growl = React.createRef<Growl>();
    private _settingState: boolean = false;
    private _loading: boolean = false;
    private cookie: Cookie = new Cookies();

    constructor(props: {}) {
        super(props);

        let savedMode = this.cookie.get("mode");
        if (savedMode === "" || savedMode === null) {
            savedMode = "dark";
        }




        const params: ParameterModel[] = []

        this.state =
            {
                //
                //  these get replaced in this.stringify
                menuOpen: true,
                json: "",
                bash: "",
                input: "",
                endOfBash: bashTemplates.endOfBash,
                mode: savedMode,
                debugConfig: "",
                inputJson: "",
                builtInParameterSelected: null,

                verboseParameter: false,
                loggingParameter: false,
                inputFileParameter: false,
                cvdParameters: false,


                // these do not get replaced
                ScriptName: "",
                Description: "",
                Parameters: params,


            }

    }

    private saveState = (): void => {
        console.log(`saving mode: ${this.state.mode}`);
        this.cookie.set("mode", this.state.mode);

    }

    private getDebugConfig = (scriptDirectory: string): string => {
        let sb: string = "";
        try {

            let scriptName: string = this.state.ScriptName
            let slashes: string = "/\\"
            let quotes: string = "\"\'"
            let scriptDir: string = trimEnd(scriptDirectory, slashes)
            scriptDir = trimStart(scriptDir, "./")
            scriptName = trimStart(scriptName, slashes);
            const nl: string = "\n";
            sb = `{${nl}`
            sb += `${this.Tabs(1)}\"type\": \"bashdb\",${nl}`
            sb += `${this.Tabs(1)}\"request\": \"launch\",${nl}`
            sb += `${this.Tabs(1)}\"name\": \"Debug ${this.state.ScriptName}\",${nl}`
            sb += `${this.Tabs(1)}\"cwd\": \"\${workspaceFolder}\",${nl}`

            sb += `${this.Tabs(1)}\"program\": \"\${workspaceFolder}/${scriptDir}/${this.state.ScriptName}\",${nl}`
            sb += `${this.Tabs(1)}\"args\": [${nl}`
            for (let param of this.state.Parameters) {
                const p: string = trimEnd(trimStart(param.default, quotes), quotes);
                sb += `${this.Tabs(2)}\"--${param.longParameter}\",${nl}${this.Tabs(2)}\"${p}\",${nl}`
            }


            sb += `${this.Tabs(1)}]${nl}`
            sb += `}`
        }
        catch (e) {
            return `Exception generating config\n\nException Info:\n===============\n${e.message}`
        }

        return sb;

    }


    private Refresh = async (): Promise<void> => {
        await this.jsonToUi(this.state.json);
    }

    private menuDeleteParameter = async (): Promise<void> => {

        if (this.state.SelectedParameter !== undefined) {
            const toDelete: ParameterModel = this.state.SelectedParameter;
            this.state.SelectedParameter.selected = false;
            let index: number = this.state.Parameters.indexOf(this.state.SelectedParameter)
            if (index !== -1) {
                await this.deleteParameter(toDelete) // after this point the state has been changed
                //
                //  highlight the item previous to the deleted one, unless it was the first one
                const newLength = this.state.Parameters.length;
                if (newLength === 0) {
                    return;
                }
                if (index === newLength) {
                    index--;
                }

                //
                //  select the first one if the first one was deleted, otherwise select the previous one
                this.state.Parameters[index].selected = true;
            }
            else {
                console.log("index of selected item is -1!")
            }
        }

    }


    private reset = () => {
        this.state.Parameters.map((el: ParameterModel) => {
            el.removeNotify(this.onPropertyChanged);
        }
        );
        this.setState({
            json: "",
            bash: "",
            input: "",
            endOfBash: bashTemplates.endOfBash,

            debugConfig: "",
            inputJson: "",
            builtInParameterSelected: null,

            verboseParameter: false,
            loggingParameter: false,
            inputFileParameter: false,
            cvdParameters: false,

            // these do not get replaced
            ScriptName: "",
            Description: "",
            Parameters: [],

        });
    }

    private updateAllText = async () => {
        await this.setStateAsync({ json: this.stringify(), bash: this.toBash(), input: this.toInput(), debugConfig: this.getDebugConfig("BashScripts"), inputJson: this.toInput() });

    }

    private changedScriptName = async (e: React.FormEvent<HTMLInputElement>) => {
        await this.setStateAsync({ ScriptName: e.currentTarget.value })
        await this.updateAllText();

    }
    private changedDescription = async (e: React.FormEvent<HTMLInputElement>) => {
        await this.setStateAsync({ Description: e.currentTarget.value })
        await this.updateAllText();
    }
    private Tabs = (n: number): string => {
        let s: string = "";
        for (let i: number = 0; i < n; i++) {
            s += "    ";
        }
        return s;
    }

    private longestParameter = (): number => {
        return Math.max(...(this.state.Parameters.map(el => el.longParameter.length)))
    }

    private toBash = (): string => {

        try {
            let sbBashScript: string = bashTemplates.bashTemplate;
            let logTemplate: string = bashTemplates.logTemplate;
            let parseInputTemplate: string = bashTemplates.parseInputTemplate;
            let requiredVariablesTemplate: string = bashTemplates.requiredVariablesTemplate;

            let nl: string = "\n"
            let usageLine: string = `${this.Tabs(1)}echo \"Usage: $0 `
            let usageInfo: string = `${this.Tabs(1)}echo \"\"\n`
            let echoInput: string = `\"${this.state.ScriptName}:\"${nl}`
            let shortOptions: string = ""
            let longOptions: string = ""
            let inputCase: string = ""
            let inputDeclarations: string = ""
            let parseInputFile: string = ""
            let requiredFilesIf: string = ""
            const toPad: number = this.longestParameter() + 5;

            for (let param of this.state.Parameters) {
                //
                // usage
                let required: string = (param.requiredParameter) ? "Required      " : "Optional     ";
                usageLine += `${param.shortParameter} | --${param.longParameter}`
                usageInfo += `${this.Tabs(1)}echo \" -${param.shortParameter} | --${padEnd(param.longParameter, toPad, " ")} ${required} ${param.description}\"${nl}`

                //
                // the  echoInput function
                echoInput += `${this.Tabs(1)}echo \"${this.Tabs(1)}${padEnd(param.longParameter, toPad, ".")} \$${param.variableName}\"${nl}`


                //
                //  OPTIONS, LONGOPTS
                let colon: string = (param.requiresInputString) ? ":" : "";
                shortOptions += `${param.shortParameter}${colon}`
                longOptions += `${param.longParameter}${colon},`

                // input Case
                inputCase += `${this.Tabs(2)}-${param.shortParameter} | --${param.longParameter})\n`
                inputCase += `${this.Tabs(3)}${param.variableName}=${param.valueIfSet}\n`
                inputCase += param.requiresInputString ? `${this.Tabs(3)}shift 2\n` : `${this.Tabs(3)}shift 1\n`
                inputCase += `${this.Tabs(3)};;\n`

                // declare variables
                inputDeclarations += `declare ${param.variableName}=${param.default}\n`
                if (this.state.inputFileParameter && param.variableName !== "inputFile") {
                    // parse input file
                    parseInputFile += `${this.Tabs(1)}${param.variableName}=$(echo \"\${configSection}\" | jq \'.[\"${param.longParameter}\"]\' --raw-output)\n`
                }

                // if statement for the required files

                if (param.requiredParameter) {
                    requiredFilesIf += `[ -z \"\${${param.variableName}}\" ] || `
                }

            }
            //
            //  phase 2 - fix up any of the string created above         

            usageLine += "\""

            //  remove last line
            longOptions = longOptions.slice(0, -1);
            inputCase = inputCase.slice(0, -1)
            usageInfo = usageInfo.slice(0, -1)

            if (requiredFilesIf.length > 0) {
                requiredFilesIf = requiredFilesIf.slice(0, -4); // removes the " || " at the end
                requiredVariablesTemplate = requiredVariablesTemplate.replace("__REQUIRED_FILES_IF__", requiredFilesIf)
            }
            else {
                requiredVariablesTemplate = "";
            }

            if (this.state.loggingParameter) {
                logTemplate = logTemplate.replace("__LOG_FILE_NAME__", this.state.ScriptName + ".log");
            }
            else {
                logTemplate = ""
            }

            //
            //  phase 3 - replace the strings in the templates
            sbBashScript = sbBashScript.replace("__USAGE_LINE__", usageLine);
            sbBashScript = sbBashScript.replace("__USAGE__", usageInfo);
            sbBashScript = sbBashScript.replace("__ECHO__", echoInput);
            sbBashScript = sbBashScript.replace("__SHORT_OPTIONS__", shortOptions);
            sbBashScript = sbBashScript.replace("__LONG_OPTIONS__", longOptions);
            sbBashScript = sbBashScript.replace("__INPUT_CASE__", inputCase);
            sbBashScript = sbBashScript.replace("__INPUT_DECLARATION__", inputDeclarations);

            let inputOverridesRequired: string = (this.state.inputFileParameter) ? "echoWarning \"Required parameters can be passed in the command line or in the input file.  The command line overrides the setting in the input file.\"" : "";
            sbBashScript = sbBashScript.replace("__USAGE_INPUT_STATEMENT__", inputOverridesRequired);

            if (parseInputFile.length > 0) {
                parseInputTemplate = parseInputTemplate.replace("__SCRIPT_NAME__", this.state.ScriptName);
                parseInputTemplate = parseInputTemplate.replace("__FILE_TO_SETTINGS__", parseInputFile);
                sbBashScript = sbBashScript.replace("__PARSE_INPUT_FILE", parseInputTemplate);
            }
            else {
                sbBashScript = sbBashScript.replace("__PARSE_INPUT_FILE", "");
            }

            sbBashScript = sbBashScript.replace("__BEGIN_TEE__", bashTemplates.beginTee);


            sbBashScript = sbBashScript.replace("__REQUIRED_PARAMETERS__", requiredVariablesTemplate);
            sbBashScript = sbBashScript.replace("__LOGGING_SUPPORT_", logTemplate);
            sbBashScript = sbBashScript.replace("__ECHO_INPUT__", "echoInput");
            return sbBashScript;
        }
        catch (e) {
            return `something went wrong.  ${e}`
        }

    }
    //
    //  this is an "opt in" replacer -- if you want something in the json you have to add it here
    private jsonReplacer = (name: string, value: any) => {

        if (name === "" || name === "ScriptName" || name === "Parameters") {
            return value;
        }
        //
        //  JSON.strinfigy passes in indexes as strings for array elements                
        if (!isNaN(Number(name))) {
            return value;
        }

        return ParameterModel.jsonReplacer(name, value);

    }
    public stringify = () => {

        const jsonDoc = JSON.stringify(this.state, this.jsonReplacer, 4);
        return jsonDoc;
    }

    private toInput = () => {
        const nl: string = "\n";
        let sb: string = `${this.Tabs(1)}\"${this.state.ScriptName}\": { ${nl}`
        let paramKeyValuePairs: string = "";
        const quotes: string = '"'
        for (let param of this.state.Parameters) {
            let defValue: string = param.default;
            defValue = trim(defValue);
            defValue = trimEnd(defValue, quotes);
            defValue = defValue.replace("\\", "\\\\");
            paramKeyValuePairs += `${this.Tabs(2)}\"${param.longParameter}\": \"${defValue}\",${nl}`
        };
        //  delete trailing "," "\n" and spaces
        paramKeyValuePairs = trimEnd(paramKeyValuePairs, ',\n');


        sb += paramKeyValuePairs;
        sb += `${nl}${this.Tabs(1)}}`
        return sb
    }

    private deleteParameter = async (parameter: ParameterModel) => {
        if (parameter === undefined) {
            console.log("App.DeleteParameter: WARNING:  ATTEMPTING TO DELETE AN UNDEFINED PARAMETER")
            return;
        }
        let array: ParameterModel[] = [...this.state.Parameters]
        const index: number = array.indexOf(parameter)
        if (index === -1) {
            console.log("App.DeleteParameter: WARNING: PARAMETER NOT FOUND IN ARRAY TO DELETE")
            return;
        }

        array.splice(index, 1);
        await this.setStateAsync({ Parameters: array })
        await this.updateAllText();

    }

    private deleteParameterByLongName = async (longName: string) => {
        let index: number = 0;
        for (index = 0; index < this.state.Parameters.length; index++) {
            if (this.state.Parameters[index].longParameter === longName) {
                await this.deleteParameter(this.state.Parameters[index]);
                return;
            }
        }
    }

    private parameterExists = (longName: string): boolean => {
        for (let parameter of this.state.Parameters) {
            if (parameter.longParameter === longName) {
                return true;
            }
        }
        return false;
    }
    private keyValueCount = (key: string, value: string): number => {
        let count: number = 0;
        for (let parameter of this.state.Parameters) {
            if (parameter[key] === value) {
                count++;
            }
        }
        return count;
    }


    private validateParameters = (): string => {
        for (let param of this.state.Parameters) {
            if (param.longParameter === "" && param.shortParameter === "" && param.selected) {
                // likely just starting...
                continue;
            }
            if (this.keyValueCount("longParameter", param.longParameter) !== 1) {
                return `you already have ${param.longParameter} as Long Parameter`
            }
            if (this.keyValueCount("shortParameter", param.shortParameter) !== 1) {
                return `you already have ${param.shortParameter} as Short Parameter`
            }
            if (this.keyValueCount("variableName", param.variableName) !== 1) {
                return `you already have ${param.variableName} as a Variable Name`
            }

            if (param.requiresInputString && param.valueIfSet !== "$2") {
                return `parameter ${param.longParameter} has Required Input String = true but hasn't set the Value if Set to $2.  this is an invalid combination`
            }
            if (!param.requiresInputString && param.valueIfSet === "$2") {
                return `parameter ${param.longParameter} has Required Input String = false but has set the Value if Set to $2.  this is an invalid combination`
            }
        }
        return "";
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

        const validateMessage: string = this.validateParameters();
        if (validateMessage !== "") {
            this.growlCallback({ severity: "error", summary: "Bash Wizard", detail: validateMessage });
            return;
        }

        try {
            this._settingState = true;
            if (name === "selected") {
                if (this.state.SelectedParameter === parameter) {
                    return;
                }
                if (this.state.SelectedParameter !== undefined) {
                    this.state.SelectedParameter.selected = false; // old selected no longer selected
                }
                await this.setStateAsync({ SelectedParameter: parameter })
                return;
            }
            let validMessage: string = this.validateParameters()
            if (validMessage !== "") {
                this.setState({ bash: validMessage })
                return;
            }
            if (name === "longParameter") {
                //
                //  attempt to autofill short name and variable name
                //  
                if (parameter.shortParameter === "" || parameter.shortParameter === "Short Parameter") {

                    // tslint:disable-next-line:prefer-for-of
                    for (let i = 0; i < parameter.longParameter.length; i++) {
                        parameter.shortParameter = parameter.longParameter.substring(i, 1)
                        if (parameter.shortParameter === "") {
                            continue;
                        }
                        if (this.validateParameters() === "") {
                            break;
                        }
                    }

                }
                validMessage = this.validateParameters()
                if (validMessage !== "") {
                    parameter.shortParameter = ""
                    this.setState({ bash: validMessage + "\npick a short name that works..." })
                    return;
                }
                if (parameter.variableName === "" || parameter.variableName === "Variable Name") {
                    parameter.variableName = camelCase(parameter.longParameter);
                }

                validMessage = this.validateParameters()
                if (validMessage !== "") {
                    this.setState({ bash: validMessage })
                }

            }


        }
        finally {
            this._settingState = false
            await this.updateAllText();

        }

    }


    private addParameter = async (model: ParameterModel, select: boolean) => {

        if (this.parameterExists(model.longParameter)) {
            const msg: string = `A parameter with the long-name ${model.longParameter} already exists.`;
            this.growl.current!.show({ severity: "error", summary: "Error Message", detail: msg });
            return;
        }

        model.uniqueName = uniqueId("PARAMETER_DIV_")
        model.registerNotify(this.onPropertyChanged)
        model.selected = select;

        const list: ParameterModel[] = this.state.Parameters.concat(model);
        await this.setStateAsync({ Parameters: list })
        await this.updateAllText();

        // const validMessage: string = this.validateParameters()
        // if (validMessage !== "") {
        //     this.setState({ bash: validMessage })
        // }
        // else {
        //     await this.setStateAsync({ json: this.stringify(), bash: this.toBash(), input: this.toInput() })
        // }

    }

    private addInputFileParameter = async () => {
        this.setState({ inputFileParameter: true })
        let p: ParameterModel = new ParameterModel();
        p.default = "";
        p.description = "the name of the input file. pay attention to $PWD when setting this";
        p.longParameter = "input-file";
        p.shortParameter = "i";
        p.requiresInputString = true;
        p.requiredParameter = false;
        p.valueIfSet = "$2";
        p.variableName = "inputFile";
        await this.addParameter(p, true);
    }
    private addVerboseParameter = async () => {
        this.setState({ verboseParameter: true });
        let p: ParameterModel = new ParameterModel();
        p.default = "";
        p.description = "echos script data";
        p.longParameter = "verbose";
        p.shortParameter = "b";
        p.requiresInputString = false;
        p.requiredParameter = false;
        p.valueIfSet = "true";
        p.variableName = "verbose"
        await this.addParameter(p, true);
    }
    private addloggingParameter = async () => {
        this.setState({ loggingParameter: true });
        let p: ParameterModel = new ParameterModel();
        p.longParameter = "log-directory";
        p.shortParameter = "l";
        p.description = "directory for the log file.  the log file name will be based on the script name";
        p.variableName = "logDirectory";
        p.default = "\"./\"";
        p.requiresInputString = true;
        p.requiredParameter = false;
        p.valueIfSet = "$2";

        await this.addParameter(p, true);
    }

    private addcvdParameters = async () => {

        this.setState({ cvdParameters: true });
        let p: ParameterModel = new ParameterModel();
        p.longParameter = "create";
        p.shortParameter = "c";
        p.description = "calls the onCreate function in the script";
        p.variableName = "create";
        p.default = "false";
        p.requiresInputString = false;
        p.requiredParameter = false;
        p.valueIfSet = "true";
        await this.addParameter(p, true);

        p = new ParameterModel();
        p.longParameter = "verify";
        p.shortParameter = "v";
        p.description = "calls the onVerify function in the script";
        p.variableName = "verify";
        p.default = "false";
        p.requiresInputString = false;
        p.requiredParameter = false;
        p.valueIfSet = "true";
        await this.addParameter(p, true);

        p = new ParameterModel();
        p.longParameter = "delete";
        p.shortParameter = "d";
        p.description = "calls the onDelete function in the script";
        p.variableName = "delete";
        p.default = "false";
        p.requiresInputString = false;
        p.requiredParameter = false;
        p.valueIfSet = "true";
        await this.addParameter(p, true);
    }
    //
    //  message handler for the toolbar button "add"
    private addBuiltIn = async () => {
        switch (this.state.builtInParameterSelected) {
            case "inputFileParameter":
                await this.addInputFileParameter();
                break;
            case "verboseParameter":
                await this.addVerboseParameter();
                break;
            case "loggingParameter":
                await this.addloggingParameter();
                break;
            case "cvdParameters":
                await this.addcvdParameters();
                break;
            case "All":
                await this.addInputFileParameter();
                await this.addVerboseParameter();
                await this.addloggingParameter();
                await this.addcvdParameters();
                break;
            default:
                console.log(`WARNING: ${this.state.builtInParameterSelected} is not supported in addBuiltIn`)
                break;

        }
    }


    private setStateAsync = (newState: object): Promise<void> => {
        return new Promise((resolve, reject) => {
            this.setState(newState, () => {
                resolve();
            });
        });
    }

    public growlCallback = (message: GrowlMessage | GrowlMessage[]): void => {
        this.growl.current!.show(message);
    }


    // this took *hours* to track down.  do not *ever* use the index as the key
    // react will use the key to render.  say you have 3 items -- with key=0, 1, 2
    // you delete the key=1 leaving 0 and 2.  but then you run render() again and you 
    // get key 0 and 1 again ...and the item you just deleted is still referenced as item 1
    // and it'll look like you deleted the wrong item.         
    //
    //  AND!!!
    //
    //
    //  another n hours of my life I won't get back:  if you always create a uniqueId, then
    //  whenever you change state, you'll get a new object.  this manifests itself by the
    //  the form looking like TAB doesn't work.  or onBlur() doesn't work.  you type a character
    //  (which causes the <App/> to update state) and the form stops taking input
    //
    //  the solution is to store the unique name and generate one when you create a new ParameterModel
    //  
    //  leasson:  the name is really a name.  treat it like one.
    //
    public renderParameters = () => {

        let parameterList: JSX.Element[] = []
        for (let parameter of this.state.Parameters) {
            parameterList.push(

                <div className={parameter.uniqueName} key={parameter.uniqueName} ref={parameter.uniqueName}>
                    <ParameterView Model={parameter} Name={parameter.uniqueName} GrowlCallback={this.growlCallback} />
                </div>

            )
        }
        return parameterList;

    }

    private onNew = () => {
        this.reset();
    }

    public render = () => {
        /*jsx requires one parent element*/
        const mode: string = this.state.mode === "dark" ? "cobalt" : "xcode";

        return (
            <div className="outer-container" id="outer-container">
                <Growl ref={this.growl} />

                <div id="DIV_LayoutRoot" className="DIV_LayoutRoot">
                    <SplitPane className="Splitter" split="horizontal" defaultSize={"50%"} /* primary={"second"} */ onDragFinished={(newSize: number) => {
                        //
                        //  we need to send a windows resize event so that the Ace Editor will change its viewport to match its new size
                        window.dispatchEvent(new Event('resize'));

                    }} >
                        <div className="DIV_Top">
                            <Toolbar className="toolbar">
                                <div className="p-toolbar-group-left">

                                    {/* need to use standard button here because Prime Icons doesn't have a good "New File" icon */}

                                    <button className="bw-button p-component" onClick={this.onNew}>
                                        <img className="bw-button-icon" srcSet={svgFiles.FileNewBlack}/>
                                        <span className="bw-button-span p-component">New Script</span>
                                    </button>

                                    <Button className="p-button-secondary" label="Refresh" icon="pi pi-refresh" onClick={this.Refresh} style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary" label="Add Parameter" icon="pi pi-plus" onClick={() => this.addParameter(new ParameterModel(), true)} style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary" label="Delete Parameter" icon="pi pi-trash" onClick={async () => await this.menuDeleteParameter()} style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary" label="Add" icon="pi pi-list" onClick={this.addBuiltIn} />
                                    <Dropdown options=
                                        {
                                            [
                                                { label: "All Built Ins", value: "All" },
                                                { label: "Verbose", value: "verboseParameter" },
                                                { label: "Input File Support", value: "inputFileParameter" },
                                                { label: "Logging Support", value: "loggingParameter" },
                                                { label: "Create, Verify, Delete", value: "cvdParameters" }
                                            ]
                                        }
                                        placeholder="Select Parameter"
                                        style={{ width: "165px", marginLeft: "5px" }}
                                        value={this.state.builtInParameterSelected}
                                        onChange={(e: { originalEvent: Event, value: any }) => this.setState({ builtInParameterSelected: e.value })}
                                    />
                                </div>
                                <div className="p-toolbar-group-right">
                                    <ToggleButton className="p-button-secondary" onIcon="pi pi-circle-on" onLabel="Dark Mode" offIcon="pi pi-circle-off" offLabel="Light Mode"
                                        checked={this.state.mode === "dark"}
                                        onChange={async (e: { originalEvent: Event, value: boolean }) => { await this.setStateAsync({ mode: e.value ? "dark" : "light" }); this.saveState(); }}
                                        style={{ marginRight: '.25em' }} />
                                    <Button className="p-button-secondary" label="" icon="pi pi-question" onClick={() => window.open("https://github.com/joelong01/Bash-Wizard")} style={{ marginRight: '.25em' }} />
                                </div>
                            </Toolbar>
                            {/* this is the section for entering script name and description */}
                            <div className="DIV_globalEntry">
                                <div className="p-grid grid-global-entry">
                                    <div className="p-col-fixed column-global-entry">
                                        <span className="p-float-label">
                                            <InputText id="scriptName" className="param-input" spellCheck={false} value={this.state.ScriptName} onChange={this.changedScriptName}
                                                onBlur={async (e: React.FocusEvent<InputText & HTMLInputElement>) => {
                                                    const end: string = e.currentTarget.value!.slice(-3);
                                                    if (end !== ".sh" && end !== "") {
                                                        this.growlCallback({ severity: "warn", summary: "Bash Wizard", detail: "Adding .sh to the end of your script name." });
                                                        await this.setStateAsync({ ScriptName: e.currentTarget.value + ".sh" });
                                                        await this.updateAllText();
                                                    }
                                                }}
                                            />
                                            <label htmlFor="scriptName" className="param-label">Script Name</label>
                                        </span>
                                    </div>
                                    <div className="p-col-fixed column-global-entry">
                                        <span className="p-float-label">
                                            <InputText className="param-input" id="description_input" spellCheck={false} value={this.state.Description} onChange={this.changedDescription} />
                                            <label className="param-label" htmlFor="description_input" >Description</label>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* this is the section for parameter list */}
                            <div className="Parameter_List">
                                {this.renderParameters()}
                            </div>
                        </div>
                        {/* this is the section for the area below the splitter */}
                        <TabView id="tabControl" className="tabControl">
                            <TabPanel header="Bash Script">
                                <div className="divEditor">
                                    <AceEditor mode="sh" name="aceBashEditor" theme={mode} className="aceBashEditor bw-ace" showGutter={true} showPrintMargin={false}
                                        value={this.state.bash}
                                        setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14, }}
                                        onChange={(newVal: string) => {
                                            this.setState({ bash: newVal });
                                        }}
                                    />
                                </div>
                            </TabPanel >
                            <TabPanel header="JSON" >
                                <div className="divEditor">
                                    <AceEditor mode="sh" name="aceJSON" theme={mode} className="aceJSONEditor bw-ace" showGutter={true} showPrintMargin={false}
                                        value={this.state.json}
                                        setOptions={{ autoScrollEditorIntoView: false, highlightActiveLine: true, fontSize: 14 }}
                                        onChange={(newVal: string) => {
                                            this.setState({ json: newVal });
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
                            <TabPanel header="Messages (0)" >
                                <label>Messages</label>
                            </TabPanel >
                        </TabView>
                    </SplitPane>
                </div >
            </div >
        );
    }

    private async jsonToUi(json: string): Promise<void> {
        try {
            //
            //  do it in this order in case the json parse throws, we don't wipe any UI
            const objs = JSON.parse(json);
            this.reset()
            this._loading = true;
            await this.setStateAsync({
                ScriptName: objs.ScriptName,
                Description: objs.Description,
            });
            //
            //  these unserialized things are only partially ParameterModels -- create the real ones
            const params: ParameterModel[] = [];
            for (let p of objs.Parameters) {
                let model: ParameterModel = new ParameterModel();
                model.default = p.Default;
                model.description = p.Description;
                model.longParameter = p.LongParameter;
                model.valueIfSet = p.ValueIfSet;
                model.oldValueIfSet = "";
                model.selected = false;
                model.requiredParameter = p.RequiredParameter;
                model.shortParameter = p.ShortParameter;
                model.variableName = p.VariableName;
                model.requiresInputString = p.RequiresInputString;
                params.push(model)
            }
            await this.setStateAsync({ Parameters: params })
            this._loading = false;
            this.state.Parameters[0].selected = true;
        }
        catch (e) {
            this.setState({ bash: "Error parsing JSON" + e.message });
        }
        finally {
            this._loading = false;
            await this.updateAllText();

        }

    }
}

export default App;

import { ParameterModel } from "./ParameterModel";
import { INotifyPropertyChanged, IBuiltInParameterName, ParameterType, IErrorMessage, ValidationOptions, IParseState, IScriptModelProps } from "./commonModel"
import { bashTemplates } from './bashTemplates';
import { padEnd, trimEnd, trimStart, trim, uniqueId, camelCase } from 'lodash-es'
import { ParseBash } from "./parseBash";



export class ScriptModel {

    constructor(app?: INotifyPropertyChanged) {
        if (app !== undefined) {
            this.registerNotify(app);
        }
    }
    //
    //  this are capitalized because JSON serlizes all data and it is easier to have them named the way we want to see them
    //  in JSON than to still to a normal naming convention for member variables..
    private ScriptName: string = "";
    private Version: string = "0.909";
    private Description: string = "";;
    private Parameters: ParameterModel[] = [];

    private propertyChangedNotify: INotifyPropertyChanged[] = [];
    private fireChangeNotifications: boolean = false;
    private _bashScript: string = "";

    private _json: string = "";;

    private _userCode: string = "";;
    private _generateBashScript: boolean = true;
    private _builtInParameters: { [key in keyof IBuiltInParameterName]: ParameterModel } = {};
    private _errors: IErrorMessage[] = [];
    private _loading: boolean = false;

    public updateAll = () => {
        this.NotifyPropertyChanged("BashScript")
        this.NotifyPropertyChanged("ScriptName")
        this.NotifyPropertyChanged("Version")
        this.NotifyPropertyChanged("Description")
        this.NotifyPropertyChanged("JSON")
        this.NotifyPropertyChanged("Parameters")
        this.NotifyPropertyChanged("Errors")
    }



    public addError = (error: IErrorMessage): IErrorMessage[] => {
        return this._errors = [...this._errors, error];
    }

    public addErrorMessage = (sev: "warn" | "error" | "info", message: string, parameter?: ParameterModel): IErrorMessage[] => {
        let newMsg = {} as IErrorMessage;
        newMsg.severity = sev;
        newMsg.message = message;
        newMsg.Parameter = parameter;
        newMsg.key = uniqueId("error:");
        return this.addError(newMsg);
    }

    //
    //  make sure we don't have any errors in the parameters.  if there are we growl them and add them to the Message list.
    //  Note that we clear all errors each time this is run so that if the user fixes anything (e.g. changes something), we
    //  rerun this
    //
    /// returns true if the parameters are valid and false if they are not (e.g. an error was generated)
    public clearErrorsAndValidateParameters = (options: ValidationOptions = ValidationOptions.ClearErrors): boolean => {

        const newErrors: IErrorMessage[] = this.getValidationErrors(options);

        //
        //  putting this here means you can't do ValidateOnly and anything else
        // tslint:disable-next-line
        if (options & ValidationOptions.ValidateOnly) {
            return newErrors.length === 0;
        }

        // tslint:disable-next-line
        if (options & ValidationOptions.ClearErrors) {
            this._errors = [];
        }

        newErrors.concat(this._errors);

        this._errors = newErrors;
        this.NotifyPropertyChanged("Errors");
        return this._errors.length === 0;
    }

    //
    //  returns an array of validation errors with no side effects
    //
    //
    private getValidationErrors = (options: ValidationOptions): IErrorMessage[] => {
        const errors: IErrorMessage[] = []
        const nameObject = Object.create(null);
        const variableObject = {}
        for (let param of this.parameters) {
            if (param.longParameter === "" || param.shortParameter === "") {
                errors.push({ severity: "error", Parameter: param, message: "All Long Names, Short Names, and Variable Names must be non-empty.", key: uniqueId("ERROR") });
            }

            if (param.longParameter in nameObject && param.longParameter !== "") {
                errors.push({ severity: "error", Parameter: param, message: `you already have \"${param.longParameter}\" as Long Parameter`, key: uniqueId("ERROR") });
            }
            else {
                nameObject[param.longParameter] = param;
            }
            if (param.shortParameter in nameObject && param.shortParameter !== "") {
                errors.push({ severity: "error", Parameter: param, message: `you already have \"${param.shortParameter}\" as Short Parameter`, key: uniqueId("ERROR") });
            }
            else {
                nameObject[param.shortParameter] = param;
            }

            if (param.variableName in variableObject && param.variableName !== "") {
                errors.push({ severity: "error", Parameter: param, message: `you already have \"${param.variableName}\" as Variable Name`, key: uniqueId("ERROR") });
            }
            else {
                variableObject[param.variableName] = param;
            }

            if (param.requiresInputString && param.valueIfSet !== "$2") {
                errors.push({ severity: "error", Parameter: param, message: `parameter \"${param.longParameter}\" has Required Input String = true but hasn't set the Value if Set to $2. This is an invalid combination`, key: uniqueId("ERROR") });
            }
            if (!param.requiresInputString && param.valueIfSet === "$2") {
                errors.push({ severity: "error", Parameter: param, message: `parameter \"${param.longParameter}\" has Required Input String = false but has set the Value if Set to $2. This is an invalid combination`, key: uniqueId("ERROR") });
            }
        }

        //
        //  I'm taking out these chars because they are "special" in JSON.  I found that the ":" messed up JQ processing
        //  and it seems a small price to pay to not take any risks with the names.  Note that we always trim() the names
        //  in the ParameterOrScriptData_PropertyChanged method
        //
        const illegalNameChars: string = ":{}[]\\\'\"";
        if (this.ScriptName !== "") {
            for (let c of illegalNameChars) {
                if (this.ScriptName.includes(c)) {
                    errors.push({ severity: "error", Parameter: undefined, message: "The following characters are illegal in the Script Name: :{}[]\\\'\"", key: uniqueId("ERROR") });
                    break;
                }
            }
        }
        if (this.description !== "") {
            for (let c of illegalNameChars) {
                if (this.description.includes(c)) {
                    errors.push({ severity: "error", Parameter: undefined, message: "The following characters are illegal in the Description::{}[]\\\'\"", key: uniqueId("ERROR") });
                    break;
                }
            }
        }

        return errors;
    }


    get BuiltInParameters(): { [key in keyof IBuiltInParameterName]: ParameterModel } {
        return this._builtInParameters;
    }
    set BuiltInParameters(value: { [key in keyof IBuiltInParameterName]: ParameterModel }) {
        if (value !== this._builtInParameters) {

            this._builtInParameters = value;

        }
    }


    public registerNotify(callback: INotifyPropertyChanged) {
        console.log("RegisterNotify");
        this.propertyChangedNotify.push(callback);

    }
    public removeNotify(callback: INotifyPropertyChanged) {
        const index: number = this.propertyChangedNotify.indexOf(callback)
        if (index === -1) {
            throw new Error("ScriptModel.tsx:removeNotify(): attempt to remove a callback that wasn't in the callback array")
        }
        console.log("removeNotify");
        this.propertyChangedNotify.splice(index, 1)

    }

    public NotifyPropertyChanged(property: string): void {
        if (this.fireChangeNotifications) {
            for (const notify of this.propertyChangedNotify) {
                notify(this, property)
            }
        }

    }
    //#region Properties
    get Errors(): IErrorMessage[] {
        return this._errors;
    }
    set Errors(value: IErrorMessage[]) {
        if (value !== this._errors) {

            this._errors = value;
            this.NotifyPropertyChanged("Errors")
        }
    }
    get Loading(): boolean {
        return this._loading;
    }

    set Loading(value: boolean) {
        if (value !== this._loading) {

            this._loading = value;

        }
    }

    get UserCode(): string {
        return this._userCode;
    }

    set UserCode(value: string) {
        if (value !== this._userCode) {

            this._userCode = value;

        }
    }
    get generateBashScript(): boolean {
        return this._generateBashScript;
    }

    set generateBashScript(value: boolean) {
        if (value !== this._generateBashScript) {

            this._generateBashScript = value;

        }
    }
    get FireChangeNotifications(): boolean {
        return this.fireChangeNotifications;
    }

    set FireChangeNotifications(value: boolean) {
        if (value !== this.fireChangeNotifications) {

            this.fireChangeNotifications = value;

        }
    }

    get BashScript(): string {
        return this._bashScript;
    }

    set BashScript(value: string) {
        if (value !== this._bashScript) {
            this._bashScript = value;
            this.NotifyPropertyChanged("BashScript");
        }
    }

    get scriptName(): string {
        return this.ScriptName;
    }

    set scriptName(value: string) {
        if (value !== this.ScriptName) {

            this.ScriptName = value;
            this.NotifyPropertyChanged("ScriptName")

        }
    }


    get version(): string {
        return this.Version;
    }

    set version(value: string) {
        if (value !== this.Version) {

            this.Version = value;

        }
    }

    get description(): string {
        return this.Description;
    }

    set description(value: string) {
        if (value !== this.Description) {

            this.Description = value;
            this.NotifyPropertyChanged("Description");
        }

    }

    get parameters(): ParameterModel[] {
        return this.Parameters;
    }

    set parameters(value: ParameterModel[]) {
        if (value !== this.Parameters) {

            this.Parameters = value;
            this.NotifyPropertyChanged("Parameters");

        }
    }

    get JSON(): string {
        return this._json;
    }

    set JSON(value: string) {
        if (value !== this._json) {

            this._json = value;
            this.NotifyPropertyChanged("JSON");
        }
    }


    //#endregion

    //#region Bash Processing
    //
    //  static method that takes a bash file and then parses it to return a ScriptModel
    //
    public static parseBash = (bash: string, notify: INotifyPropertyChanged): ScriptModel => {
        const model: ScriptModel = ParseBash.parseBashScript(bash);
        model.registerNotify(notify);
        if (model.parameters.length > 0) {
            for (let p of model.parameters) {
                p.registerNotify(model.onPropertyChanged);
                p.registerNotify(notify);
                p.FireChangeNotifications = true;
                p.collapsed = (p.type !== ParameterType.Custom)
            }
        }
        return model;
    }

    //
    //  given the state of the app, return a valid bash script
    public toBash = (): string => {

        if (!this.generateBashScript) {
            return this.BashScript;
        }

        // console.count("toBash:");
        try {

            /*  if (this.parameters.length === 0) {
                 //
                 //  if there are no parameters, just mark it as user code
                 return "# --- BEGIN USER CODE ---\n" + this.UserCode + "\n# --- END USER CODE ---";
             } */

            let sbBashScript: string = bashTemplates.bashTemplate;
            sbBashScript = sbBashScript.replace("__VERSION__", this.Version);
            let logTemplate: string = bashTemplates.logTemplate;
            let parseInputTemplate: string = bashTemplates.parseInputTemplate;
            let requiredVariablesTemplate: string = bashTemplates.requiredVariablesTemplate;
            let verifyCreateDeleteTemplate: string = bashTemplates.verifyCreateDelete;
            let endLogTemplate: string = bashTemplates.endOfBash;

            let nl: string = "\n";
            let usageLine: string = `${this.Tabs(1)}echo \"${this.description}\"\n${this.Tabs(1)}echo \"\"\n${this.Tabs(1)}echo \"Usage: $0  `;
            let usageInfo: string = `${this.Tabs(1)}echo \"\"\n`;
            let echoInput: string = `\"${this.ScriptName}:\"${nl}`;
            let shortOptions: string = "";
            let longOptions: string = "";
            let inputCase: string = "";
            let inputDeclarations: string = "";
            let parseInputFile: string = "";
            let requiredFilesIf: string = "";


            const longestLongParameter: number = Math.max(...(this.parameters.map(param => param.longParameter.length))) + 4;

            for (let param of this.parameters) {
                //
                // usage
                let required: string = (param.requiredParameter) ? "Required    " : "Optional    ";
                let shortUsageLine: string = (param.shortParameter) ? `-${param.shortParameter}|` : ``;
                usageLine += `${shortUsageLine}--${param.longParameter} `
                let shortUsageInfo: string = (param.shortParameter) ? `-${param.shortParameter} |` : `    `;
                usageInfo += `${this.Tabs(1)}echo \" ${shortUsageInfo} --${padEnd(param.longParameter, longestLongParameter, " ")} ${required} ${param.description}\"${nl}`

                //
                // the  echoInput function
                echoInput += `${this.Tabs(1)}echo -n \"${this.Tabs(1)}${padEnd(param.longParameter, longestLongParameter, '.')} \"${nl}`;
                echoInput += `${this.Tabs(1)}echoInfo \"\$${param.variableName}\"${nl}`;


                //
                //  OPTIONS, LONGOPTS
                let colon: string = (param.requiresInputString) ? ":" : "";
                if (param.shortParameter) {
                    shortOptions += `${param.shortParameter}${colon}`
                }
                longOptions += `${param.longParameter}${colon},`

                // input Case
                inputCase += `${this.Tabs(2)}-${param.shortParameter} | --${param.longParameter})${nl}`
                inputCase += `${this.Tabs(3)}${param.variableName}=${param.valueIfSet}${nl}`
                inputCase += param.requiresInputString ? `${this.Tabs(3)}shift 2\n` : `${this.Tabs(3)}shift 1${nl}`
                inputCase += `${this.Tabs(3)};;\n`

                // declare variables
                inputDeclarations += `declare ${param.variableName}=${param.default}${nl}`
                if (this._builtInParameters.InputFileSupport !== undefined && param.variableName !== "inputFile") {
                    // parse input file
                    parseInputFile += `${this.Tabs(1)}${param.variableName}=$(echo \"\${configSection}\" | jq \'.[\"${param.longParameter}\"]\' --raw-output)${nl}`
                }

                // if statement for the required files

                if (param.requiredParameter) {
                    requiredFilesIf += `[ -z \"\${${param.variableName}}\" ] || `
                }

            }
            //
            //  phase 2 - fix up any of the string created above

            usageLine += "\""

            //  remove last line / character
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

            if (this._builtInParameters.LoggingSupport !== undefined) {
                logTemplate = logTemplate.replace("__LOG_FILE_NAME__", this.ScriptName + ".log");
            }
            else {
                logTemplate = "";
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

            let inputOverridesRequired: string = (this._builtInParameters.InputFileSupport !== undefined) ? "echoWarning \"Parameters can be passed in the command line or in the input file. The command line overrides the setting in the input file.\"" : "";
            sbBashScript = sbBashScript.replace("__USAGE_INPUT_STATEMENT__", inputOverridesRequired);

            if (this._builtInParameters.InputFileSupport !== undefined) {
                parseInputTemplate = parseInputTemplate.replace(/__SCRIPT_NAME__/g, this.ScriptName);
                parseInputTemplate = parseInputTemplate.replace("__FILE_TO_SETTINGS__", parseInputFile);
                sbBashScript = sbBashScript.replace("___PARSE_INPUT_FILE___", parseInputTemplate);
                sbBashScript = sbBashScript.replace("__JQ_DEPENDENCY__", bashTemplates.jqDependency);

            }
            else {
                sbBashScript = sbBashScript.replace("___PARSE_INPUT_FILE___", "");
                sbBashScript = sbBashScript.replace("__JQ_DEPENDENCY__", "");
            }

            sbBashScript = sbBashScript.replace("__REQUIRED_PARAMETERS__", requiredVariablesTemplate);
            sbBashScript = sbBashScript.replace("__LOGGING_SUPPORT_", logTemplate);
            sbBashScript = sbBashScript.replace("__END_LOGGING_SUPPORT__", this._builtInParameters.LoggingSupport !== undefined ? endLogTemplate : "");

            if (this._builtInParameters.Create !== undefined && this._builtInParameters.Verify !== undefined && this._builtInParameters.Delete !== undefined) {
                if (!this.functionExists(this.UserCode, "onVerify") && !this.functionExists(this.UserCode, "onDelete") && !this.functionExists(this.UserCode, "onCreate")) {
                    //
                    //  if they don't have the functions, add the template code
                    sbBashScript = sbBashScript.replace("__USER_CODE_1__", verifyCreateDeleteTemplate);
                }
            }

            if (this._builtInParameters.VerboseSupport !== undefined) {
                sbBashScript = sbBashScript.replace("__VERBOSE_ECHO__", bashTemplates.verboseEcho);
            }
            else {
                sbBashScript = sbBashScript.replace("__VERBOSE_ECHO__", "");
            }
            /*
              replace anyplace we have 3 new lines with 2 new lines.  this will get rid of double black lines...
              e.g.
                        function onCreate() { (\n)
                            (\n)
                            (\n)
                        }
            becomes
                        function onCreate() {(\n)
                            (\n)
                        }
            */
            sbBashScript = sbBashScript.replace(/\n\n\n/g, "\n\n");
            //
            // put the user code where it belongs -- it might contain the functions already

            sbBashScript = sbBashScript.replace("__USER_CODE_1__", this.UserCode);
            this.BashScript = sbBashScript;

            return sbBashScript;
        }
        catch (e) {
            return `something went wrong.  ${e}`
        }

    }
    private Tabs = (n: number): string => {
        let s: string = "";
        for (let i: number = 0; i < n; i++) {
            s += "    ";
        }
        return s;
    }

    private functionExists = (bashScript: string, name: string): boolean => {
        if (bashScript === "") {
            return false;
        }

        if (bashScript.indexOf(`function ${name}()`) !== -1) {
            return true;
        }


        return false;
    }

    //#endregion
    // #region JSON
    //
    //  this is an "opt in" replacer -- if you want something in the json you have to add it here
    private jsonReplacer = (name: string, value: any) => {

        if (name === "") {
            return value;
        }

        if (name === "ScriptName" || name === "Parameters" || name === "Description" || name === "Version") {
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
        const jsonDoc = JSON.stringify(this, this.jsonReplacer, 4);
        return jsonDoc;
    }
    //#endregion
    //#region Parameter functions
    public addParameter = (type: ParameterType, notify: INotifyPropertyChanged): ParameterModel[] => {
        const parameterModel: ParameterModel = new ParameterModel();
        try {
            switch (type) {
                case ParameterType.Create:
                    if (this.BuiltInParameters.Create !== undefined) {
                        this.deleteParameter(this.BuiltInParameters.Create, notify);
                    }
                    parameterModel.longParameter = "create";
                    parameterModel.shortParameter = "c";
                    parameterModel.description = "calls the onCreate function in the script";
                    parameterModel.variableName = "create";
                    parameterModel.default = "false";
                    parameterModel.requiresInputString = false;
                    parameterModel.requiredParameter = false;
                    parameterModel.valueIfSet = "true";

                    this.BuiltInParameters.Create = parameterModel;
                    parameterModel.type = ParameterType.Create;
                    parameterModel.collapsed = true;
                    break;
                case ParameterType.Verify:
                    if (this.BuiltInParameters.Verify !== undefined) {
                        this.deleteParameter(this.BuiltInParameters.Verify, notify);
                    }
                    parameterModel.longParameter = "verify";
                    parameterModel.shortParameter = "v";
                    parameterModel.description = "calls the onVerify function in the script";
                    parameterModel.variableName = "verify";
                    parameterModel.default = "false";
                    parameterModel.requiresInputString = false;
                    parameterModel.requiredParameter = false;
                    parameterModel.valueIfSet = "true";
                    parameterModel.collapsed = true;
                    this.BuiltInParameters.Verify = parameterModel;
                    parameterModel.type = ParameterType.Verify;
                    break;
                case ParameterType.Delete:
                    if (this.BuiltInParameters.Delete !== undefined) {
                        this.deleteParameter(this.BuiltInParameters.Delete, notify);
                    }
                    parameterModel.longParameter = "delete";
                    parameterModel.shortParameter = "d";
                    parameterModel.description = "calls the onDelete function in the script";
                    parameterModel.variableName = "delete";
                    parameterModel.default = "false";
                    parameterModel.requiresInputString = false;
                    parameterModel.requiredParameter = false;
                    parameterModel.valueIfSet = "true";
                    this.BuiltInParameters.Delete = parameterModel;
                    parameterModel.collapsed = true;
                    parameterModel.type = ParameterType.Delete;
                    break;
                case ParameterType.InputFileSupport:
                    if (this.BuiltInParameters.InputFileSupport !== undefined) {
                        this.deleteParameter(this.BuiltInParameters.InputFileSupport, notify);
                    }

                    parameterModel.default = "";
                    parameterModel.description = "the name of the input file. pay attention to $PWD when setting this";
                    parameterModel.longParameter = "input-file";
                    parameterModel.shortParameter = "i";
                    parameterModel.requiresInputString = true;
                    parameterModel.requiredParameter = false;
                    parameterModel.valueIfSet = "$2";
                    parameterModel.variableName = "inputFile";
                    parameterModel.collapsed = true;
                    parameterModel.type = ParameterType.InputFileSupport;
                    this.BuiltInParameters.InputFileSupport = parameterModel;
                    break;
                case ParameterType.LoggingSupport:
                    if (this.BuiltInParameters.LoggingSupport !== undefined) {
                        this.deleteParameter(this.BuiltInParameters.LoggingSupport, notify);
                    }

                    parameterModel.longParameter = "log-directory";
                    parameterModel.shortParameter = "l";
                    parameterModel.description = "Directory for the log file. The log file name will be based on the script name.";
                    parameterModel.variableName = "logDirectory";
                    parameterModel.default = "\"./\"";
                    parameterModel.type = ParameterType.LoggingSupport;
                    parameterModel.requiresInputString = true;
                    parameterModel.requiredParameter = false;
                    parameterModel.valueIfSet = "$2";
                    parameterModel.collapsed = true;
                    parameterModel.type = ParameterType.LoggingSupport;
                    this.BuiltInParameters.LoggingSupport = parameterModel;
                    break;
                case ParameterType.VerboseSupport:
                    if (this.BuiltInParameters.VerboseSupport !== undefined) {
                        this.deleteParameter(this.BuiltInParameters.VerboseSupport, notify);
                    }
                    parameterModel.default = "";
                    parameterModel.description = "echos the parsed input variables and creates a $verbose variable to be used in user code";
                    parameterModel.longParameter = "verbose";
                    parameterModel.shortParameter = "v";
                    parameterModel.requiresInputString = false;
                    parameterModel.requiredParameter = false;
                    parameterModel.valueIfSet = "true";
                    parameterModel.variableName = "verbose";
                    parameterModel.collapsed = true;
                    parameterModel.type = ParameterType.VerboseSupport;
                    this.BuiltInParameters.VerboseSupport = parameterModel;
                    break;
                default:
                    break;


            }
        }
        finally {
            this.parameters = [...this.parameters, parameterModel];
            this.FireChangeNotifications = true;
            parameterModel.FireChangeNotifications = true;
            parameterModel.registerNotify(notify);  // main page updates the bash script when a parameter changes
            parameterModel.registerNotify(this.onPropertyChanged);  // the model validates the data when it is entered
            this.clearErrorsAndValidateParameters(ValidationOptions.ClearErrors | ValidationOptions.AllowBlankValues);
            this.NotifyPropertyChanged("Parameters");

        }

        return this.parameters;
    }
    public deleteParameter = (parameter: ParameterModel, notify: INotifyPropertyChanged): ParameterModel[] => {
        if (parameter === undefined) {
            return this.parameters;

        }
        let array: ParameterModel[] = [...this.parameters]
        const index: number = array.indexOf(parameter)
        if (index === -1) {
            return this.parameters;
        }

        for (let builtInName in this.BuiltInParameters) {
            if (this.BuiltInParameters[builtInName] === parameter) {
                this.BuiltInParameters[builtInName] = undefined;
                break;
            }
        }
        parameter.removeNotify(notify);
        parameter.removeNotify(this.onPropertyChanged);
        this.parameters.splice(index, 1);
        array.splice(index, 1);
        this.parameters = array; // keeping array immutable
        this.clearErrorsAndValidateParameters(ValidationOptions.ClearErrors | ValidationOptions.AllowBlankValues);

        return this.parameters;
    }
    //#endregion

    public getDebugConfig = (scriptDirectory: string): string => {
        let sb: string = "";
        try {

            let scriptName: string = this.ScriptName
            let slashes: string = "/\\"
            let quotes: string = "\"\'"
            let scriptDir: string = trimEnd(scriptDirectory, slashes)
            scriptDir = trimStart(scriptDir, "./")
            scriptName = trimStart(scriptName, slashes);
            const nl: string = "\n";
            sb = `{${nl}`
            sb += `${this.Tabs(1)}\"type\": \"bashdb\",${nl}`
            sb += `${this.Tabs(1)}\"request\": \"launch\",${nl}`
            sb += `${this.Tabs(1)}\"name\": \"Debug ${this.ScriptName}\",${nl}`
            sb += `${this.Tabs(1)}\"cwd\": \"\${workspaceFolder}\",${nl}`

            sb += `${this.Tabs(1)}\"program\": \"\${workspaceFolder}/${scriptDir}/${this.ScriptName}\",${nl}`
            sb += `${this.Tabs(1)}\"args\": [${nl}`
            for (let param of this.parameters) {
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

    get inputJSON(): string {
        const obj: object = { [this.scriptName]: {} };
        for (let param of this.parameters) {
            obj[this.scriptName][param.longParameter] = param.default;
        };

        return JSON.stringify(obj, null, 4);
    }

    public static parseJSON(json: string, notify: INotifyPropertyChanged): ScriptModel {
        const scriptModel = new ScriptModel(notify);
        scriptModel.FireChangeNotifications = false;
        try {
            //
            //  do it in this order in case the json parse throws, we don't wipe any UI
            const objs = JSON.parse(json);
            scriptModel.JSON = json;
            scriptModel.generateBashScript = false;
            // older version of Bash Wizard don't have a description field
            // react doesn't like it when the state moves from "undefined" to a regular value
            scriptModel.Description = (objs.Description === undefined) ? "" : objs.Description;
            scriptModel.ScriptName = (objs.ScriptName === undefined) ? "" : objs.ScriptName;
            scriptModel.Version = (objs.Version === undefined) ? "" : objs.Version;


            //
            //  these unserialized things are only partially ParameterModels -- create the real ones

            for (let p of objs.Parameters) {
                let model: ParameterModel = new ParameterModel();
                model.FireChangeNotifications = false;
                model.default = p.Default;
                model.description = p.Description;
                model.longParameter = p.LongParameter;
                model.valueIfSet = p.ValueIfSet;
                model.oldValueIfSet = "";
                model.requiredParameter = p.RequiredParameter;
                model.shortParameter = p.ShortParameter;
                model.variableName = p.VariableName;
                model.collapsed = p.collapsed;
                model.requiresInputString = p.RequiresInputString;
                model.uniqueName = uniqueId("JSON_PARAMETER");
                scriptModel.Parameters.push(model);
                model.FireChangeNotifications = true;
                model.registerNotify(scriptModel.onPropertyChanged);
                model.registerNotify(notify);
            }

        }
        catch (e) {
            scriptModel.Errors.push({ severity: "error", message: `Error parsing JSON: ${e}`, key: uniqueId("ERROR") });
        }

        scriptModel.generateBashScript = true;
        scriptModel.fireChangeNotifications = true;

        return scriptModel;
    }

    private _settingState: boolean = false;
    public onPropertyChanged = async (parameter: ParameterModel, name: string) => {
        // console.log("model::onPropertyChanged  [name=%s] [loading=%s] [setting state=%s]", name, this._loading, this._settingState);
        if (this._loading === true) {
            return;
        }
        if (this._settingState === true) {
            return;
        }


        try {

            this._settingState = true;
            if (name === "longParameter") {
                //
                //  attempt to autofill short name and variable name
                //

                if (parameter.shortParameter === "") {
                    for (const c of parameter.longParameter) {

                        if (c === "") {
                            continue;
                        }
                        if (!this.shortParameterExists(c)) {
                            parameter.shortParameter = c;

                            break;
                        }
                    }
                }
                if (parameter.shortParameter === "") {
                    this.addError({ severity: "warn", message: "Unable to auto generate a Short Parameter", Parameter: parameter, key: uniqueId("ERROR") });
                    return;
                }

                if (parameter.variableName === "") {
                    parameter.variableName = camelCase(parameter.longParameter);
                }

            }


        }
        finally {
            this._settingState = false;
            this.clearErrorsAndValidateParameters(ValidationOptions.ClearErrors | ValidationOptions.Growl); // this will append Errors and leave Warnings
        }

    }
    private shortParameterExists = (shortParam: string): boolean => {
        for (let parameter of this.parameters) {
            if (parameter.shortParameter === shortParam) {
                return true;
            }
        }
        return false;
    }
}

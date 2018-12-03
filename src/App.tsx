import * as React from 'react';
import './App.css';
import "./menu.css";
import { slide as Menu } from "react-burger-menu";
import Parameter from './Parameter';
import ParameterModel from './ParameterModel';
import { bashTemplates } from './bashTemplates';

interface IAppState {
  //
  //  these get replaced in this.stringify
  menuOpen: boolean;
  json: string;
  bash: string;
  endOfBash: string;
  input: string;

  //
  //  these get stringified
  //  these must match https://github.com/joelong01/Bash-Wizard/blob/master/bashGeneratorSharedModels/ConfigModel.cs
  ScriptName: string;
  EchoInput: boolean;
  CreateLogFile: boolean;
  TeeToLogFile: boolean;
  AcceptsInputFile: boolean;
  Parameters: ParameterModel[];


}


class App extends React.Component<{}, IAppState> {
  constructor(props: {}) {
    super(props);
    const params: ParameterModel[] = []

    this.state =
      {
        //
        //  these get replaced in this.stringify
        menuOpen: false,
        json: bashTemplates.beginTee,
        bash: bashTemplates.bashTemplate,
        input: bashTemplates.logTemplate,
        endOfBash: bashTemplates.parseInputTemplate,
        // these do not get replaced
        ScriptName: "",
        EchoInput: false,
        CreateLogFile: false,
        TeeToLogFile: false,
        AcceptsInputFile: false,
        Parameters: params

      }

    this.onChange = this.onChange.bind(this)

  }

  private changedScriptName = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await this.setStateAsync({ScriptName: e.currentTarget.value})
    await this.setStateAsync({ json: this.stringify(), bash: this.toBash() })
    this.forceUpdate()
  }
  private Tabs = (n: number): string => {
    let s: string = "";
    for (let i: number = 0; i < n; i++) {
      s += "    ";
    }
    return s;
  }
  private toBash = (): string => {


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
    

    for (let param of this.state.Parameters) {
      //
      // usage
      let required: string = (param.requiredParameter) ? "Required" : "Optional";
      usageLine += `${param.shortParameter} | --${param.longParameter}`
      usageInfo += `${this.Tabs(1)}echo \" -${param.shortParameter} | --${param.longParameter} ${required} ${param.descriptionValue}\"${nl}`
      
      //
      // the  echoInput function
      echoInput += `${this.Tabs(1)}echo \"${this.Tabs(1)}${param.longParameter} \$${param.variableName}\"${nl}`


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
      inputDeclarations += `declare ${param.variableName}=${param.defaultValue}\n`
      if (this.state.AcceptsInputFile && param.variableName !== "inputFile") {
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

    if (this.state.CreateLogFile) {
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

    let inputOverridesRequired: string = (this.state.AcceptsInputFile) ? "echoWarning \"Required parameters can be passed in the command line or in the input file.  The command line overrides the setting in the input file.\"" : "";
    sbBashScript = sbBashScript.replace("__USAGE_INPUT_STATEMENT__", inputOverridesRequired);

    if (parseInputFile.length > 0) {
      parseInputTemplate = parseInputTemplate.replace("__SCRIPT_NAME__", this.state.ScriptName);
      parseInputTemplate = parseInputTemplate.replace("__FILE_TO_SETTINGS__", parseInputFile);
      sbBashScript = sbBashScript.replace("__PARSE_INPUT_FILE", parseInputTemplate);
    }
    else {
      sbBashScript = sbBashScript.replace("__PARSE_INPUT_FILE", "");
    }

    sbBashScript = sbBashScript.replace("__BEGIN_TEE__", this.state.TeeToLogFile ? bashTemplates.beginTee : "");


    sbBashScript = sbBashScript.replace("__REQUIRED_PARAMETERS__", requiredVariablesTemplate);
    sbBashScript = sbBashScript.replace("__LOGGING_SUPPORT_", logTemplate);
    sbBashScript = sbBashScript.replace("__ECHO_INPUT__", this.state.EchoInput ? "echoInput" : "");
    return sbBashScript;

  }

  //
  //  a call back from the Parameter component whenever a value changes
  public onChange = (index: number, key: string, value: any): void => {

    this.setState({ json: this.stringify() })
    console.log(`OnChange [number=${index}] [name=${key}] [value=${value}]`)
  }

  private onAddParameter = () => {
    this.setState({ Parameters: [...this.state.Parameters, new ParameterModel()] })
  }
  private jsonReplacer = (name: string, value: any) => {
    if (name === "json" || name === "menuOpen" || name === "endOfBash" || name === "bash" || name === "input") {
      return undefined;
    }

    return value;
  }
  public stringify = () => {

    const jsonDoc = JSON.stringify(this.state, this.jsonReplacer, 4);
    return jsonDoc;
  }

  private onChecked = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const key = e.currentTarget.id as string
    let val = e.currentTarget.checked as boolean
    console.log(`[${key} = "${val}]`)
    if (val === undefined) {
      val = false;
    }

    switch (key) {
      case "AcceptsInputFile":
        {
          let p: ParameterModel = new ParameterModel()
          p.defaultValue = "";
          p.descriptionValue = "the name of the input file. pay attention to $PWD when setting this"
          p.longParameter = "input-file"
          p.shortParameter = "i"
          p.requiresInputString = true;
          p.requiredParameter = false;
          p.valueIfSet = "$2"
          p.variableName = "inputFile"
          await this.setStateAsync({ CreateLogFile: val, Parameters: [...this.state.Parameters, p] });
        }
        break;
      case "EchoInput":
        await this.setStateAsync({ EchoInput: val });
        break;
      case "CreateLogFile":
        {
          
          let p: ParameterModel = new ParameterModel()
          p.longParameter = "log-directory",
          p.shortParameter = "l",
          p.descriptionValue = "directory for the log file.  the log file name will be based on the script name",
          p.variableName = "logDirectory",
          p.defaultValue = "\"./\"",
          p.requiresInputString = true,
          p.requiredParameter = false,
          p.valueIfSet = "$2"
          await this.setStateAsync({ CreateLogFile: val, Parameters: [...this.state.Parameters, p] });
          
        }
        break;
      case "TeeToLogFile":
        await this.setStateAsync({ TeeToLogFile: val });
        break;
      default:
        break;
    }

    await this.setStateAsync({ json: this.stringify(), bash: this.toBash() })
    this.forceUpdate()
  }


  private setStateAsync = (newState: object) => {
    // const key = Object.keys(newState)[0];
    // util.log("setStateAsync: key= %s oldVal = %o newVal = %o]", key, this.state[key], newState[key]);
    return new Promise((resolve, reject) => {
      this.setState(newState, () => {
        resolve();
        // console.log("setStateAsync: key= %s state = %o", key, this.state[key]);

      });

    });
  }
  private renderMenu = () => {
    /* css for this is in ./menu.css */

    return (
      <Menu id="burgerMenu" isOpen={this.state.menuOpen}
        pageWrapId={"page-wrap"} outerContainerId={"outer-container"}>
        <div className="Menu_LayoutRoot">

          <div className="menuItemDiv">
            <div className="menuItemGlyph">
              +
                        </div>
            <button className="burgerItemButton" onClick={this.onAddParameter}>Add Parameter</button>
          </div>

        </div>
      </Menu >
    );
  }

  private renderOneParameter = (parameter: ParameterModel, index: number): JSX.Element => {

    let divName = "PARAMETER_DIV_" + index.toString();

    return (

      <div className={divName} key={divName} ref={divName}>
        <Parameter Model={parameter} onChange={this.onChange} index={index} />
      </div>


    );
  }

  public renderParameters = () => {

    let i: number = 0;
    let parameterList: JSX.Element[] = []
    for (let p of this.state.Parameters) {
      parameterList.push(this.renderOneParameter(p, i++))
    }
    return parameterList;

  }


  public render = () => {
    /*jsx requires one parent element*/
    return (
      <div className="outer-container">
        <div className="DIV_Menu">
          {this.renderMenu()}
        </div>
        <form className="Global_Input_Form">
          <label style={{ marginLeft: "10px" }}>
            Script Name:  <input id="scriptName" className="scriptName" type="text" defaultValue={this.state.ScriptName} onChange={this.changedScriptName} />
          </label>
          <label style={{ marginLeft: "10px" }}>
            Echo Input:  <input id="EchoInput" className="EchoInput" type="checkbox" defaultChecked={this.state.EchoInput} onChange={this.onChecked} />
          </label>
          <label style={{ marginLeft: "10px" }}>
            Create Log File:  <input id="CreateLogFile" className="CreateLogFile" type="checkbox" defaultChecked={this.state.CreateLogFile} onChange={this.onChecked} />
          </label>
          <label style={{ marginLeft: "10px" }}>
            Tee to Log file:  <input id="TeeToLogFile" className="TeeToLogFile" type="checkbox" defaultChecked={this.state.TeeToLogFile} onChange={this.onChecked} />
          </label>
          <label style={{ marginLeft: "10px" }}>
            Accepts Input File:  <input id="AcceptsInputFile" className="AcceptsInputFile" type="checkbox" defaultChecked={this.state.AcceptsInputFile} onChange={this.onChecked} />
          </label>
        </form>
        <div className="Parameter_List">
          {this.renderParameters()}
        </div>
        <div className="DIV_Bash">
          <textarea className="input_Bash" id="bashDoc" value={this.state.bash} readOnly={true} />
        </div>
        <div className="DIV_Json">
          <textarea className="input_jsonDoc" id="jsonDoc" value={this.state.json} readOnly={true} />
        </div>
        <div className="DIV_EndOfBash">
          <textarea className="input_end_of_bash" id="input_end_of_bash" value={this.state.endOfBash} readOnly={true} />
        </div>
        <div className="DIV_InputSettings">
          <textarea className="input_settings" id="input_settings" value={this.state.input} readOnly={true} />
        </div>
      </div>



    );
  }
}

export default App;

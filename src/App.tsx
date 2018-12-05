import "./react-bootstrap.css"
import "./App.css"
import "./index.css"
import "./menu.css"
import "./parameter.css"
import * as React from 'react';
import { slide as Menu } from "react-burger-menu";
import Parameter from './Parameter';
import ParameterModel from './ParameterModel';
import { bashTemplates } from './bashTemplates';
import Splitter from 'm-react-splitters';
import trim from 'lodash-es/trim';
import trimEnd from 'lodash-es/trimEnd';
import { camelCase } from "lodash";
// import {Button, Glyphicon, ButtonGroup} from "react-bootstrap";


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
        json: "",
        bash: "",
        input: "",
        endOfBash: bashTemplates.endOfBash,
        // these do not get replaced
        ScriptName: "",
        EchoInput: false,
        CreateLogFile: false,
        TeeToLogFile: false,
        AcceptsInputFile: false,
        Parameters: params

      }

  }

  private changedScriptName = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await this.setStateAsync({ ScriptName: e.currentTarget.value })
    await this.setStateAsync({ json: this.stringify(), bash: this.toBash(), input: this.toInput() })
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
      usageInfo += `${this.Tabs(1)}echo \" -${param.shortParameter} | --${param.longParameter} ${required} ${param.description}\"${nl}`

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
      inputDeclarations += `declare ${param.variableName}=${param.default}\n`
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

  private onAddParameter = (): void => {
    this.addParameter(new ParameterModel());
  }
  private jsonReplacer = (name: string, value: any) => {
    if (name === "json" || name === "menuOpen" || name === "endOfBash" || name === "bash" || name === "input" || name === "propertyChangedNotify") {
      return undefined;
    }

    return value;
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

  private deleteParameter = async (index: number) => {
    if (index === -1) {
      return;
    }

    let array: ParameterModel[] = [...this.state.Parameters]
    array.splice(index, 1);
    await this.setStateAsync({ Parameters: array })
  }

  private deleteParameterByLongName = async (longName: string) => {
    let index: number = 0;
    for (index = 0; index < this.state.Parameters.length; index++) {
      if (this.state.Parameters[index].longParameter === longName) {
        await this.deleteParameter(index);
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

  public onPropertyChanged = async (parameter: ParameterModel, name: string) => {
    if (name === "longParameter") {
      if (parameter.shortParameter === "") {
        parameter.shortParameter = parameter.longParameter.substring(0, 1) // TODO: need to make sure this is ok
      }
      if (parameter.variableName === "") {
        parameter.variableName = camelCase(parameter.longParameter);
      }
    }


    await this.setStateAsync({ json: this.stringify(), bash: this.toBash(), input: this.toInput() })

  }


  private addParameter = async (p: ParameterModel) => {
    await this.setStateAsync({ Parameters: [...this.state.Parameters, p] });
    p.registerNotify(this.onPropertyChanged)
    await this.setStateAsync({ json: this.stringify(), bash: this.toBash(), input: this.toInput() })
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
          await this.setStateAsync({ AcceptsInputFile: val })
          if (val === true) {
            let p: ParameterModel = new ParameterModel()
            p.default = "";
            p.description = "the name of the input file. pay attention to $PWD when setting this"
            p.longParameter = "input-file"
            p.shortParameter = "i"
            p.requiresInputString = true;
            p.requiredParameter = false;
            p.valueIfSet = "$2"
            p.variableName = "inputFile"
            await this.addParameter(p);
          }
          else {
            await this.deleteParameterByLongName("input-file")
          }
        }
        break;
      case "EchoInput":
        await this.setStateAsync({ EchoInput: val });
        break;
      case "CreateLogFile":
        {
          await this.setStateAsync({ CreateLogFile: val }); // update the state of the checkbox
          if (val === true) { // adding it
            if (!this.parameterExists("log-directory")) {
              let p: ParameterModel = new ParameterModel()
              p.longParameter = "log-directory",
                p.shortParameter = "l",
                p.description = "directory for the log file.  the log file name will be based on the script name",
                p.variableName = "logDirectory",
                p.default = "\"./\"",
                p.requiresInputString = true,
                p.requiredParameter = false,
                p.valueIfSet = "$2"
              await this.addParameter(p);
            }
          } else { // removing it
            await this.deleteParameterByLongName("log-directory")
          }
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
      <Menu id="burgerMenu" isOpen={this.state.menuOpen} noOverlay={true}
        pageWrapId={"page-wrap"} outerContainerId={"outer-container"}>
        <div className="Menu_LayoutRoot">
          <div className="menuItemDiv">
            <div className="menuItemGlyph">
              +
                        </div>
            <button className="burgerItemButton" onClick={this.onAddParameter}>Add Parameter</button>
          </div>
          
          <div className="DIVMENU_Button">
            <button className="MENU_Button">
              <label className="fa fa-home" /> 
              <span className="MENU_Span">Home</span>
            </button>
          </div>
        </div>
      </Menu >
    );
  }

  private renderOneParameter = (parameter: ParameterModel, index: number): JSX.Element => {

    let divName = "PARAMETER_DIV_" + index.toString();

    return (

      <div className={divName} key={divName} ref={divName}>
        <Parameter Model={parameter} index={index} />
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
    /* outer-container required for the Menu */
    return (
      <div className="outer-container" id="outer-container">
        <div className="DIV_Menu" >
          {this.renderMenu()}
        </div>
        <div id="page-wrap" className="page-wrap">
          <Splitter className="SPLITTER-TopBottom"
            position="horizontal"
            primaryPaneMaxHeight="100%"
            primaryPaneMinHeight="10%"
            primaryPaneHeight="400px"
            dispatchResize={true}
            postPoned={false}>
            <div className="DIV_Top">
              <div className="Global_Input_Form">
                <label className="LABEL_ScriptName">
                  Script Name:  <input id="scriptName" className="INPUT_scriptName" spellCheck={false} type="text" defaultValue={this.state.ScriptName} onBlur={this.changedScriptName} />
                </label>
                <label className="LABEL_EchoInput">
                  Echo Input:  <input id="EchoInput" className="INPUT_EchoInput" type="checkbox" defaultChecked={this.state.EchoInput} onChange={this.onChecked} />
                </label>
                <label className="LABEL_CreateLogFile">
                  Create Log File:  <input id="CreateLogFile" className="INPUT_CreateLogFile" type="checkbox" defaultChecked={this.state.CreateLogFile} onChange={this.onChecked} />
                </label>
                <label className="LABEL_TeeToLogFile">
                  Tee to Log file:  <input id="TeeToLogFile" className="INPUT_TeeToLogFile" type="checkbox" defaultChecked={this.state.TeeToLogFile} onChange={this.onChecked} />
                </label>
                <label className="LABEL_AcceptsInputFile">
                  Accepts Input File:  <input id="AcceptsInputFile" className="INPUT_AcceptsInputFile" type="checkbox" defaultChecked={this.state.AcceptsInputFile} onChange={this.onChecked} />
                </label>
              </div>
              <div className="Parameter_List">
                {this.renderParameters()}
              </div>
            </div>
            <div className="DIV_Bottom">
              <Splitter className="SPLITTER_BottomLeftRight" position="vertical"
                primaryPaneMaxWidth="100%"
                primaryPaneMinWidth="100px"
                primaryPaneWidth="50%"
                postPoned={false}>

                <div className="DIV_BottomLeft">
                  <textarea className="TEXTAREA_Bash" id="bashDoc" value={this.state.bash} spellCheck={false} readOnly={true} onFocus={(e) => {e.currentTarget.select();}}/>
                  <textarea className="TEXTAREA_EndOfBash" id="TEXTAREA_EndOfBash" spellCheck={false} value={this.state.endOfBash} readOnly={true} onFocus={(e) => {e.currentTarget.select();}} />
                </div>
                <div className="DIV_BottomRight">
                  <Splitter className="SPLITTER_JsonInput" position="horizontal"
                    postPoned={false}
                    primaryPaneHeight="80%"
                    primaryPaneMinHeight="10%"
                    primaryPaneMaxHeight="95%"
                  >
                    <textarea className="TEXTAREA_jsonDoc" id="jsonDoc" value={this.state.json} spellCheck={false} readOnly={false} onFocus={(e) => {e.currentTarget.select();}} onChange= { (e: React.ChangeEvent<HTMLTextAreaElement>) => this.setState({json: e.currentTarget.value})}  />
                    <textarea className="TEXTAREA_settings" id="input_settings"  value={this.state.input} spellCheck={false} readOnly={true} onFocus={(e) => {e.currentTarget.select();}}/>
                  </Splitter>

                </div>
              </Splitter>
            </div>
          </Splitter>
        </div>
      </div>
    );
  }
}

export default App;


import {ParameterModel} from './ParameterModel';
import { bashTemplates } from './bashTemplates';
import {ParameterType, IErrorMessage, IParseState } from "../Models/commonModel"

import { uniqueId, fromPairs } from 'lodash-es';
import { ScriptModel } from './scriptModel';



//
//  this class knows how to parse bash Files
export class ParseBash {

    private addParseError = (errors: IErrorMessage[], msg: string, sev: "error" | "warn" | "info" = "error") => {
        errors.push({ severity: sev, key: uniqueId("PARSEERROR"), message: msg });
    }
    private splitByTwoStrings = (from: string, string1: string, string2: string): string[] => {

        let answer: string[] = [];
        if (from.indexOf(string1) !== -1) { // if we have the first string
            answer = from.split(string1);
            for (let i = answer.length - 1; i >= 0; i--) { // now look for the second string in each section
                let a: string = answer[i];
                if (a.indexOf(string2) !== -1) { // if it has the second string...
                    answer.splice(i, 1); // take this string out of the asnwer array
                    answer = answer.concat(a.split(string2)); //
                }
            }
        }

        return answer.filter((e) => e); // remove empty entries
    }

    private getStringBetween = (str: string, begin: string, end: string): string | null => {

        const beginIdx: number = str.indexOf(begin);
        const endIdx: number = str.indexOf(end, beginIdx);
        if (beginIdx !== -1 && endIdx !== -1) {
            const answer: string = str.substring(beginIdx + begin.length, endIdx);
            return answer;
        }

        return null;
    }

    private findParameterByLongName = (params: ParameterModel[], longParam: string): ParameterModel | undefined => {

        for (let p of params) {
            if (p.longParameter === longParam) {
                return p;
            }
        }

        return undefined;
    }
    private findParameterByVarName = (params: ParameterModel[], name: string): ParameterModel | undefined => {

        for (let p of params) {
            if (p.variableName === name) {
                return p;
            }
        }
        return undefined;
    }
    //
    //  the built in parameter "LogDirectory" is in the script iff   we have the
    //  "endOfBash" in the script file and we have a long-parameter name "log-directory"
    public logDirectorySupported = (endOfScript: string, parameters: ParameterModel[]): ParameterModel | undefined => {

        //
        //  compare to the template
        const actual: string = endOfScript.replace(/\s/g, "");
        const desired: string = bashTemplates.endOfBash.replace(/\s/g, "");
        if (actual === desired) {

            return this.findParameterByLongName(parameters, "log-directory");
        }
        return undefined;
    }
    //
    //  the built in parameter "Verbose" is in the script iff  we have the
    //  "endOfBash" in the script file and we have a long-parameter name "log-directory"
    public verboseSupported = (script: string, parameters: ParameterModel[]): ParameterModel | undefined => {

        const idx: number = script.indexOf("if [[ $\"verbose\" == true ]];then");
        if (idx !== -1) {

            return this.findParameterByLongName(parameters, "verbose");
        }
        return undefined;
    }

    //
    //  finds create, verify, or delete by looking into the user code to see if the function is declared (e.g. "function onCreate()") and if it "if" statement
    //  is there e.g. "if [[ $delete == "true" ]]"
    private findCVD = (script: string, parameters: ParameterModel[], functionLine: string, ifLine: string, longParam: string): ParameterModel | undefined => {
        const idxFunc: number = script.indexOf(functionLine);
        const idxIf: number = script.indexOf(ifLine)
        if (idxFunc !== -1 && idxIf && -1) {

            return this.findParameterByLongName(parameters, longParam);
        }
        return undefined;
    }
    //
    //  the built in paramater "InputFileSupported" is true iff the "input-file" long parameter exists and
    //  the script has the text "if [ \"\${inputFile}\" != "" ]; then"
    public inputFileSupported = (script: string, parameters: ParameterModel[]): ParameterModel | undefined => {

        const idx: number = script.indexOf("if [ \"\${inputFile}\" != \"\" ]; then");

        if (idx !== -1) {

            return this.findParameterByLongName(parameters, "input-file");
        }
        return undefined;
    }

    public static parseBashScript = (input: string): ScriptModel => {
        const parser: ParseBash = new ParseBash();
        return parser.fromBash(input);
    }

    public fromBash = (input: string): ScriptModel => {
        //
        //  Error Messages constants used when parsing the Bash file
        const unMergedGitFile: string = "Bash Script has \"<<<<<<< HEAD\" string in it, indicating an un-merged GIT file.  fix merge before opening.";
        const noNewLines: string = "There are no new lines in this file -- please fix this and try again.";
        const missingComments: string = "Missing the comments around the user's code.  User Code starts after \"# --- BEGIN USER CODE ---\" and ends before \"# --- END USER CODE ---\" ";
        const addingComments: string = "Adding comments and treating the whole file as user code";
        const missingOneUserComment: string = "Missing one of the comments around the user's code.  User Code starts after \"# --- BEGIN USER CODE ---\" and ends before \"# --- END USER CODE ---\" ";
        const pleaseFix: string = "Please fix and retry.";
        const tooManyUserComments: string = "There is more than one \"# --- BEGIN USER CODE ---\" or more than one \"# --- END USER CODE ---\" comments in this file.  Please fix and try again.";
        const missingVersionInfo: string = "couldn't find script version information";
        const noUsage: string = "There is no usage() function in this bash script";
        const noParseInput: string = "Could not locate the parseInput() function in the bashScript";
        const scriptModel:ScriptModel = new ScriptModel();


        //
        //  make sure that we deal with the case of getting a file with EOL == \n\r.  we only want \n
        //  I've also had scenarios where I get only \r...fix those too.
        /*  if (input.indexOf("\n") !== -1) {
             //
             //  we have some new lines, just kill the \r
             if (input.indexOf("\r") !== -1) {
                 input = input.replace(new RegExp(/\r/, "g"), "");

             }
         }
         else if (input.indexOf("\r") !== -1) {
             // no \n, but we have \r
             input = input.replace(new RegExp(/\r/,"g"), "\n");
         }
         else {
             // no \r and no \n
             this.addParseError(parseState.Errors, noNewLines);
             return parseState;
         }
  */

        //
        // make sure the file doesn't have GIT merge conflicts
        if (input.indexOf("<<<<<<< HEAD") !== -1) {
            this.addParseError(scriptModel.Errors, unMergedGitFile);
            return scriptModel;
        }

        /*
                The general layout of the file is

                #!/bin/bash
                # bashWizard version <version>
                <BashWizard Functions>
                # --- BEGIN USER CODE ---

                # --- END USER CODE ---
                <optional BashWizard code>

                the general parse strategy is to separate the user code and then to parse the Bash Wizard Functions to find all the parameter information
                we *never* want to touch the user code

         */
        const userComments: string[] = ["# --- BEGIN USER CODE ---", "# --- END USER CODE ---"];
        const sections: string[] = this.splitByTwoStrings(input, userComments[0], userComments[1]);
        let bashWizardCode: string = "";
        switch (sections.length) {
            case 0:

                //
                //  this means we couldn't find any of the comments -- treat this as a non-BW file
                scriptModel.UserCode = input.trim(); // make it all user code
                this.addParseError(scriptModel.Errors, missingComments);
                this.addParseError(scriptModel.Errors, addingComments);
                return scriptModel;
            case 1:
                this.addParseError(scriptModel.Errors, missingOneUserComment);
                this.addParseError(scriptModel.Errors, pleaseFix);
                return scriptModel;
            case 2:
            case 3:
                bashWizardCode = sections[0];
                scriptModel.UserCode = sections[1].trim();
                // ignore section[2], it is code after the "# --- END USER CODE ---" that will be regenerated
                break;
            default:
                this.addParseError(scriptModel.Errors, tooManyUserComments);
                return scriptModel;
        }

        //
        //  first look for the bash version
        const versionLine: string = "# bashWizard version ";
        let index: number = bashWizardCode.indexOf(versionLine);
        let userBashVersion: number = 0.1;
        let lines: string[];
        let startPos: number = 0;
        let foundDescription: boolean = false;
        if (index > 0) {
            startPos = index + versionLine.length;
            userBashVersion = parseFloat(bashWizardCode.substring(startPos, startPos + 5));
            if (Number.isNaN(userBashVersion)) {
                userBashVersion = parseFloat(bashWizardCode.substring(startPos, startPos + 3)); // 0.9 is a version i have out there...
                if (Number.isNaN(userBashVersion)) {
                    this.addParseError(scriptModel.Errors, missingVersionInfo);
                }
            }
        }


        //
        //  find the usage() function and parse it out - this gives us the 4 properties in the ParameterModel below
        let bashFragment: string | null = this.getStringBetween(bashWizardCode, "usage() {", "}");
        if (bashFragment === null) {
            this.addParseError(scriptModel.Errors, noUsage);
        }
        else {
            bashFragment = bashFragment.replace(/echoWarning/g, "echo");
            bashFragment = bashFragment.replace(new RegExp(/"/, "g"), "");
            lines = bashFragment.split("echo ");
            for (let line of lines) {
                line = line.trim();
                if (line === "") {
                    continue;
                }
                if (line === "exit 1") {
                    break;
                }


                if (!foundDescription) {
                    /*
                      it look like:

                     function usage() {
                     *  echoWarning
                     *  echo "<description>"
                     *  ...
                     *
                     * }
                     *
                     * but the echoWarning isn't always there -- only if the --input-file option was specified.
                     *
                     */
                    if (line.indexOf("Parameters can be passed in the command line or in the input file.") !== -1) {
                        continue;
                    }
                    //
                    //  if the description is black, the next line echo's the usage -- so if we do NOT find the Usage statement
                    //  we have found the description.  and in any case, if the Description isn't there by now, it isn't there
                    //  so always set the flag saying we found it.

                    if (!line.startsWith("Usage: $0")) {
                        scriptModel.description = line.trimRight();
                    }

                    foundDescription = true;
                    continue;
                }

                if (line.substring(0, 1) === "-") // we have a parameter!
                {
                    const paramTokens: string[] = this.splitByTwoStrings(line, " ", "|");
                    console.log(line.indexOf("|"));
                    if (line.indexOf("|")<0) 
                    { 
                        paramTokens.unshift("-"); // there is no short parameter, so add token 
                    }
                    let description: string = "";
                    for (let i = 3; i < paramTokens.length; i++) {
                        description += paramTokens[i] + " ";
                    }

                    description = description.trim();
                    const parameterItem: ParameterModel = new ParameterModel();

                    parameterItem.shortParameter = paramTokens[0].trim();
                    parameterItem.longParameter = paramTokens[1].trim();
                    parameterItem.requiredParameter = (paramTokens[2].trim() === "Required") ? true : false;
                    parameterItem.description = description;
                    scriptModel.parameters.push(parameterItem);
                }
            }

        }


        //
        //  parse the echoInput() function to get script name - don't fail parsing on this one
        bashFragment = this.getStringBetween(bashWizardCode, "echoInput() {", "parseInput()");
        if (bashFragment !== null) {
            lines = bashFragment.split(/\n/g);
            for (let line of lines) {
                line = line.trim();
                if (line === "") {
                    continue;
                }
                //
                //  the line is in the form of: "echo "<scriptName>:"
                const name: string | null = this.getStringBetween(line, "echo \"", ":");
                if (name !== null) {
                    scriptModel.scriptName = name;
                }
                break;
            };
        }


        //
        //  next parse out the "parseInput" function to get "valueWhenSet" and the "VariableName"

        bashFragment = this.getStringBetween(bashWizardCode, "eval set -- \"$PARSED\"", "--)");
        if (bashFragment === null) {
            this.addParseError(scriptModel.Errors, noParseInput);
        }
        else {
            lines = bashFragment.split("\n");
            for (index = 0; index < lines.length; index++) {
                let line: string = lines[index].trim();
                if (line === "") {
                    continue;
                }
                if (line === "- |") {

                    continue; // this is an empty parameter
                }
                if (line.substring(0, 1) === "-" && lines[index+1] !== undefined) // we have a parameter!
                {
                    const paramTokens: string[] = lines[index + 1].trim().split("=");
                    if (paramTokens.length !== 2) {
                        this.addParseError(scriptModel.Errors,
                            `When parsing the parseInput() function to get the variable names, encountered the line ${lines[index + 1].trim()} which doesn't parse.  It should look like varName=$2 or the like.`);
                    }
                    const nameTokens: string[] = line.split("|");
                    if (nameTokens.length !== 2) // the first is the short param, second long param, and third is empty
                    {
                        this.addParseError(scriptModel.Errors,
                            `When parsing the parseInput() function to get the variable names, encountered the line ${lines[index].trim()} which doesn't parse.  It should look like \"-l | --long-name)\" or the like.`,
                            "warn");
                    }
                    // nameTokens[1] looks like "--long-param)

                    let longParam: string = nameTokens[1].substring(3, nameTokens[1].length - 1);

                    const param: ParameterModel | undefined = this.findParameterByLongName(scriptModel.parameters, longParam);
                    if (param === undefined) {
                        this.addParseError(scriptModel.Errors, `When parsing the parseInput() function to get the variable names, found a long parameter named ${longParam} which was not found in the usage() function`,
                            "warn");
                    }
                    else {
                        param.variableName = paramTokens[0].trim();
                        param.valueIfSet = paramTokens[1].trim();
                        if (lines[index + 2].trim() === "shift 1") {
                            param.requiresInputString = false;
                        }
                        else if (lines[index + 2].trim() === "shift 2") {
                            param.requiresInputString = true;
                        }
                        else {
                            this.addParseError(scriptModel.Errors, `When parsing the parseInput() function to see if ${param.variableName} requires input, found this line: ${lines[index + 1]} which does not parse.  it should either be \"shift 1\" or \"shift 2\"`,
                                "warn");
                        }
                    }
                    index += 2;
                }
            }
        }
        // the last bit of info to figure out is the default value -- find these with a comment
        bashFragment = this.getStringBetween(bashWizardCode, "# input variables", "parseInput");
        if (bashFragment === null) {
            this.addParseError(scriptModel.Errors, noParseInput);
        }
        else {
            // throw away the "declare "
            bashFragment = bashFragment.replace(/declare/g, "");
            lines = bashFragment.split('\n');
            for (let line of lines) {
                line = line.trim();
                if (line === "") {
                    continue;
                }
                if (line.startsWith("#")) {
                    continue;
                }

                const varTokens: string[] = line.split("=");
                if (varTokens.length === 0 || varTokens.length > 2) {
                    this.addParseError(scriptModel.Errors,
                        `When parsing the variable declarations between the \"# input variables\" comment and the \"parseInput\" calls, the line \"${line}\" was encountered that didn't parse.  it should be in the form of varName=Default`,
                        "warn");

                }
                const varName: string = varTokens[0].trim();
                const param: ParameterModel | undefined = this.findParameterByVarName(scriptModel.parameters, varName);
                if (param === undefined) {
                    this.addParseError(scriptModel.Errors, `When parsing the variable declarations between the \"# input variables\" comment and the \"parseInput\" calls, found a variable named ${varName} which was not found in the usage() function`,
                        "warn");
                    this.addParseError(scriptModel.Errors, `\"{line}\" will be removed from the script.  If you want to declare it, put the declaration inside the user code comments`, "info");

                }
                else {
                    param.default = varTokens.length === 2 ? varTokens[1].trim() : "";  // in bash "varName=" is a valid declaration
                }

            }
        }

        scriptModel.BuiltInParameters.LoggingSupport = this.logDirectorySupported(sections[2], scriptModel.parameters);
        if (scriptModel.BuiltInParameters.LoggingSupport !== undefined) {
            scriptModel.BuiltInParameters.LoggingSupport.type = ParameterType.LoggingSupport;
        }
        scriptModel.BuiltInParameters.InputFileSupport = this.inputFileSupported(sections[0], scriptModel.parameters);
        if (scriptModel.BuiltInParameters.InputFileSupport !== undefined) {
            scriptModel.BuiltInParameters.InputFileSupport.type = ParameterType.InputFileSupport;
        }
        scriptModel.BuiltInParameters.VerboseSupport = this.verboseSupported(sections[0], scriptModel.parameters);
        if (scriptModel.BuiltInParameters.VerboseSupport !== undefined) {
            scriptModel.BuiltInParameters.VerboseSupport.type = ParameterType.VerboseSupport;
        }
        scriptModel.BuiltInParameters.Create = this.findCVD(scriptModel.UserCode, scriptModel.parameters, "function onCreate()", "if [[ $create == \"true\" ]]", "create");
        if (scriptModel.BuiltInParameters.Create !== undefined) {
            scriptModel.BuiltInParameters.Create.type = ParameterType.Create;
        }

        scriptModel.BuiltInParameters.Verify = this.findCVD(scriptModel.UserCode, scriptModel.parameters, "function onVerify()", "if [[ $verify == \"true\" ]]", "verify");
        if (scriptModel.BuiltInParameters.Verify !== undefined) {
            scriptModel.BuiltInParameters.Verify.type = ParameterType.Verify;
        }
        scriptModel.BuiltInParameters.Delete = this.findCVD(scriptModel.UserCode, scriptModel.parameters, "function onDelete()", "if [[ $delete == \"true\" ]]", "delete");
        if (scriptModel.BuiltInParameters.Delete !== undefined) {
            scriptModel.BuiltInParameters.Delete.type = ParameterType.Delete;
        }

        return scriptModel;




    }
}
export default ParseBash;

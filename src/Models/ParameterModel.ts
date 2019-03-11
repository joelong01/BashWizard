import { uniqueId } from 'lodash-es';
import { ParameterType, IParameterUiState } from "./commonModel"
import { ErrorModel } from './errorModel';

import { EventDispatcher, IEvent } from 'ste-events';




//
//  these need to JSON.stringify the same as https://github.com/joelong01/Bash-Wizard/blob/master/bashGeneratorSharedModels/ParameterItem.cs
export class ParameterModel {

    constructor(errorModel: ErrorModel) {
        this.ErrorModel = errorModel; // publish here, no subscribe
    }
    private Default: string = "";
    private Description: string = "";
    private LongParameter: string = "";
    private RequiresInputString: boolean = false;
    private RequiredParameter: boolean = false;
    private ShortParameter: string = "";
    private VariableName: string = "";
    private ValueIfSet: string = "";
    private Type: ParameterType = ParameterType.Custom;
    private fireChangeNotifications: boolean = false;
    private Collapsed: boolean = false;
    private ErrorModel: ErrorModel;
    private propertyChangedEvent = new EventDispatcher<ParameterModel, keyof IParameterUiState>();
    private modelUpdate: boolean = false; // an update that is initiated inside the model


    public get onPropertyChanged(): IEvent<ParameterModel, keyof IParameterUiState> {
        return this.propertyChangedEvent.asEvent();
    }
    public signal(changedProperty: keyof IParameterUiState) {
        this.propertyChangedEvent.dispatch(this, changedProperty);
    }


    public updateAll = () => {
        this.NotifyPropertyChanged("default")
        this.NotifyPropertyChanged("description")
        this.NotifyPropertyChanged("longParameter")
        this.NotifyPropertyChanged("shortParameter")
        this.NotifyPropertyChanged("variableName")
        this.NotifyPropertyChanged("valueIfSet")

    }

    //
    // not stringified
    private _selected: boolean = false;
    private _uniqueName: string = uniqueId("PARAMETER-MODEL");
    get FireChangeNotifications(): boolean {
        return this.fireChangeNotifications;
    }

    set FireChangeNotifications(value: boolean) {
        if (value !== this.fireChangeNotifications) {

            this.fireChangeNotifications = value;

        }
    }

    get collapsed(): boolean {
        return this.Collapsed;
    }

    set collapsed(value: boolean) {
        if (value !== this.Collapsed) {

            this.Collapsed = value;
            this.NotifyPropertyChanged("collapsed");
        }
    }

    // we set valueIfSet to $2 when requiresInputString is set.  we save the old value in case the user de-selects the option
    private _oldValueIfSet: string = "";
    get oldValueIfSet(): string {
        return this._oldValueIfSet;
    }

    set oldValueIfSet(value: string) {
        if (value !== this._oldValueIfSet) {
            this._oldValueIfSet = value;
        }
    }

    get type(): ParameterType {
        return this.Type;
    }

    set type(value: ParameterType) {
        if (value !== this.Type) {
            this.Type = value;
            this.NotifyPropertyChanged("type")
        }
    }


    // we set oldDefault to "" when they select "requires input string"
    private _oldDefault: string = "";
    get oldDefault(): string {
        return this._oldDefault;
    }

    set oldDefault(value: string) {
        if (value !== this._oldValueIfSet) {
            this._oldDefault = value;
        }
    }

    //
    //  this is an "opt in" replacer -- if you want something in the json you have to add it here
    public static jsonReplacer(name: string, value: any) {
        if (name === "Default" || name === "Description" || name === "LongParameter" || name === "RequiresInputString" || name === "RequiredParameter" ||
            name === "ShortParameter" || name === "VariableName" || name === "ValueIfSet" || name === "Type") {
            return value;
        }
        return undefined;
    }


    public NotifyPropertyChanged(property: keyof IParameterUiState): void {
        if (this.fireChangeNotifications) {
            this.signal(property);
        }

    }



    get default(): string {
        return this.Default;
    }

    set default(value: string) {
        if (value !== this.Default) {

            this.Default = value;
            if (this.requiredParameter && !this.modelUpdate) {
                this.modelUpdate = true;
                this.sendErrorMessage("You cannot have a \"Required Property\" and a \"Default\" at the same time.  Unchecking \"Required Parameter\".");
                this.requiredParameter = false;
                this.modelUpdate = false;
            }

            //
            //  we weant to turn something like "./logDir" into "./logDir/" or ./logDir into ./logDir/
            if (this.Type === ParameterType.LoggingSupport) {
                let temp: string = this.Default;
                let quotes: boolean = false;
                if (temp.startsWith("\"")) {
                    quotes = true;
                    temp = temp.slice(1);
                }
                if (temp.endsWith("\"") && quotes) {
                    temp = temp.slice(0, -1);
                }

                if (!temp.endsWith("/")) {
                    temp += "/";
                }
                if (quotes) {
                    temp = "\""  + temp + "\"";
                }

                this.Default = temp;
            }

            this.NotifyPropertyChanged("default")
        }
    }

    get uniqueName(): string {
        return this._uniqueName;
    }

    set uniqueName(value: string) {
        if (value !== this._uniqueName) {

            this._uniqueName = value;
            // uniqueName does not need to be propagated
        }
    }

    public get description(): string {
        return this.Description;
    }
    public set description(value: string) {
        if (value !== this.Description) {
            this.Description = value;
            this.NotifyPropertyChanged("description")
        }
    }
    public get longParameter(): string {
        return this.LongParameter;
    }
    public set longParameter(value: string) {
        if (value !== this.LongParameter) {
            this.LongParameter = value.replace(new RegExp(/^-{2}/, "i"), ""); // get rid of starting --
            this.LongParameter = this.LongParameter.replace(new RegExp(/\s/, "g"), "-"); // no whitespace in variable names
            this.NotifyPropertyChanged("longParameter")
        }
    }

    public get shortParameter(): string {
        return this.ShortParameter;
    }
    public set shortParameter(value: string) {
        if (value !== this.ShortParameter) {
            this.ShortParameter = value.substr(-1); // short parameter can only be one char long -- always put in the last one typed
            this.ShortParameter = this.ShortParameter.replace(new RegExp(/^-{1}/, "i"), "");// no whitespace - variable names
            this.ShortParameter = this.ShortParameter.replace(new RegExp(/\s/, "g"), ""); // no whitespace in variable names
            this.NotifyPropertyChanged("shortParameter")
        }
    }

    private sendErrorMessage = (message: string): void => {
        if (this.FireChangeNotifications) {
            this.ErrorModel.addErrorMessage("info", message);
        }
    }

    public get requiresInputString(): boolean {
        return this.RequiresInputString;
    }
    public set requiresInputString(value: boolean) {
        if (value !== this.RequiresInputString) {
            this.RequiresInputString = value;
            if (!this.modelUpdate) {
                this.modelUpdate = true;
                if (this.RequiresInputString) {
                    this.oldValueIfSet = this.valueIfSet;
                    if (this.valueIfSet !== "$2") {
                        this.sendErrorMessage(`If the parameter requires input, then \"Value if Set\" must be set to $2 instead of ${this.valueIfSet}  Unclick to reset to previous value.`);
                        this.valueIfSet = "$2"
                    }
                }
                else { // not checked
                    if (this.valueIfSet === "$2") {
                        this.sendErrorMessage("If the parameter does not use input, then the \"Value if Set\" cannot be \"$2\". Resetting \"Value if Set\".  Unclick to reset to previous value.");
                        if (this.oldValueIfSet === "$2") {
                            this.oldValueIfSet = "";
                        }
                        this.valueIfSet = this.oldValueIfSet;
                    }
                }

                this.modelUpdate = false;
            }

            this.NotifyPropertyChanged("requiresInputString")
        }
    }

    public get requiredParameter(): boolean {
        return this.RequiredParameter;
    }
    public set requiredParameter(value: boolean) {
        if (value !== this.RequiredParameter) {
            this.RequiredParameter = value;
            if (!this.modelUpdate) {
                this.modelUpdate = true;
                if (this.RequiredParameter) { // if you require a parameter, you must have an empty initialization for the scripts to work
                    if (this.default !== "") {
                        this.oldDefault = this.default;
                        this.default = "";
                        this.sendErrorMessage("You cannot have a \"Required Parameter\" and a \"Default\" at the same time.  Reseting \"Default\".  Unselect to restore.");
                    }
                }
                else { // it is not required, so we can have a default

                    if (this.default === "") { // if we emptied it, put it back to what it was before
                        this.default = this.oldDefault;
                    }
                }
                this.modelUpdate = false;
            }
            this.NotifyPropertyChanged("requiredParameter")
        }
    }

    get variableName(): string {
        return this.VariableName;
    }

    set variableName(value: string) {
        if (value !== this.VariableName) {
            this.VariableName = value.replace(new RegExp(/\s/, "g"), ""); // no whitespace in variable names
            this.NotifyPropertyChanged("variableName")
        }
    }
    get valueIfSet(): string {
        return this.ValueIfSet;
    }

    set valueIfSet(value: string) {
        if (value !== this.ValueIfSet) {
            this.ValueIfSet = value;
            if (!this.modelUpdate) {
                this.modelUpdate = true;
                if (value === "$2" && this.requiresInputString === false) {
                    this.sendErrorMessage("If the \"Value if set\" is \"$2\", then \"Requires Input String\" must be true.  Checking \"Requires Input String\".");
                    this.requiresInputString = true;
                }
                if (value !== "$2" && this.requiresInputString === true) {
                    this.sendErrorMessage("If the \"Value if set\" is not \"$2\", then \"Requires Input String\" must be false.  Unchecking \"Requires Input String\".");
                    this.requiresInputString = false;
                }
                this.modelUpdate = false;
            }

            this.NotifyPropertyChanged("valueIfSet")
        }
    }

}

export default ParameterModel;

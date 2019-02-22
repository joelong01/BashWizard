import React from 'react';
import { ParameterModel, ParameterTypes, IGrowlCallback } from './ParameterModel';

import { InputText } from "primereact/inputtext"
import { Checkbox } from "primereact/checkbox"
import { Button } from "primereact/button"
import { uniqueId, stubFalse } from 'lodash-es';




export interface IParameterProperties {
    Model: ParameterModel;
    Name: string;
    GrowlCallback: IGrowlCallback;
}



interface IParameterState {
    default: string;
    description: string;
    longParameter: string;
    requiresInputString: boolean;
    requiredParameter: boolean;
    shortParameter: string;
    variableName: string;
    valueIfSet: string;
    Model: ParameterModel;
    selected: boolean;
    GrowlCallback: IGrowlCallback;
    type: ParameterTypes;
    collapsed: boolean;
    uniqueId: string;
}

export class ParameterView extends React.PureComponent<IParameterProperties, IParameterState> {
    private _updatingModel: boolean;
    private refParameterForm = React.createRef<HTMLDivElement>();
    private refLongName = React.createRef<HTMLInputElement>();
    constructor(props: IParameterProperties) {
        super(props);
        const id: string = uniqueId("ParameterView");
      //  console.log("creating ParameterView: " + id);
        this.state = {
            uniqueId: id,
            default: this.props.Model.default,
            description: this.props.Model.description,
            longParameter: this.props.Model.longParameter,
            requiresInputString: this.props.Model.requiresInputString,
            requiredParameter: this.props.Model.requiredParameter,
            shortParameter: this.props.Model.shortParameter,
            variableName: this.props.Model.variableName,
            valueIfSet: this.props.Model.valueIfSet,
            selected: false,
            Model: this.props.Model,
            GrowlCallback: this.props.GrowlCallback,
            type: this.props.Model.type,
            collapsed: this.props.Model.collapsed
        };

        this._updatingModel = false;

    }

    public componentWillMount() {
        if (this.props.Model.registerNotify !== undefined) {
            this.props.Model.registerNotify(this.onPropertyChanged)
        }

    }

    public componentWillUnmount() {
        if (this.props.Model.registerNotify !== undefined) {
            this.props.Model.removeNotify(this.onPropertyChanged)
        }
    }

    get Model(): ParameterModel {
        return this.state.Model;
    }
    private setStateAsync = (newState: object) => {
        return new Promise((resolve, reject) => {
            this.setState(newState, () => {
                resolve();
            });

        });
    }

    public focus = () => {

        /* const longParamInputClassName: string = "param-input " + this.state.uniqueId;
        console.log("setting focus to " + longParamInputClassName)
        const input:any = window.document.getElementsByClassName(longParamInputClassName)[0];
        input.focus(); */
        this.setState({ collapsed: false }, () => {
            if (this.refLongName.current !== null) {
                // console.log("setting focus to " + this.state.uniqueId);
                const reactTypeScriptWorkAround: any = this.refLongName.current;
                reactTypeScriptWorkAround.element.focus();
            }
        });
    }

    private setFocus = () => {
        if (this.refLongName.current !== null) {
         //   console.log("setting focus to " + this.state.uniqueId);
            const reactTypeScriptWorkAround: any = this.refLongName.current;
            reactTypeScriptWorkAround.element.focus();
        }
    }

    //
    //  this is the callback from the model...if the App changes the data
    //  (e.g. picks a short name), then the model calls here.  You might think
    //  that you should protect callbacks -- e.g. since focus() is called in this fuction, it modifies
    //  the .selected property on the model, which notifies this function == stack fault.
    //  this is *wrong* because the Model doesn't notify when the property's value doesn't change *and*
    //  the App has to modify the parameters -- e.g. this flow has to work:
    //  1. user types in long-paramter and hits TAB => onBlur is called
    //  2. this updates the model (model.longParameter) => change notifications sent out
    //  3. the app tries to find a reasonable shortParameter and variable name
    //  4. ...which results in this onPropertyChanged callback being called, and the UI needs to update
    public onPropertyChanged = async (model: ParameterModel, key: string) => {

        // console.log(`ParameterView.onPropertyChanged: [${key}=${model[key]}.  Item:${model.longParameter} updating:${this._updatingModel}]`)

        if (key === "focus" && this.refLongName.current !== null) {
            this.focus();
            return;
        }

        if (!(key in this.state)) {
            console.log(`ERRROR: ${key} was passed to onPropertyChanged in error.  View: ${this}`);
            throw new Error(`ERRROR: ${key} was passed to onPropertyChanged in error.  View: ${this}`);
        }

        /*  commenting out because Type is now read only
             if (key === "type") {
             this.changeType(model);
             this.setState({ type: model.type });
         } */
        const obj: object = {}
        obj[key] = model[key];
        await this.setStateAsync(obj);

        if (key === "collapsed") {
            console.log(`setting collapsed=${model[key]} for ${model.longParameter}`)
        }

        if (key === "selected" && model.selected === true && this.refParameterForm.current !== null) {
          //  console.log(`${this.Model.uniqueName} is getting focus`);
            this.refParameterForm.current.focus();
        }


    }
    //
    //  right now .Type is read only -- but if we wanted to allow a parameter to change, this is the function we would cuse
    //
    private changeType = (model: ParameterModel): void => {
        try {
            model.FireChangeNotifications = false;
            switch (model.type) {
                case ParameterTypes.Create:
                    break;
                case ParameterTypes.Verify:
                    break;
                case ParameterTypes.Delete:
                    break;
                case ParameterTypes.LoggingSupport:
                    model.longParameter = "log-directory";
                    model.shortParameter = "l";
                    model.description = "Directory for the log file. The log file name will be based on the script name.";
                    model.variableName = "logDirectory";
                    model.default = "\"./\"";
                    model.type = ParameterTypes.LoggingSupport;
                    model.requiresInputString = true;
                    model.requiredParameter = false;
                    model.valueIfSet = "$2";
                    model.type = ParameterTypes.LoggingSupport;
                    break;
                case ParameterTypes.InputFileSupport:
                    model.default = "";
                    model.description = "the name of the input file. pay attention to $PWD when setting this";
                    model.longParameter = "input-file";
                    model.shortParameter = "i";
                    model.requiresInputString = true;
                    model.requiredParameter = false;
                    model.valueIfSet = "$2";
                    model.variableName = "inputFile";
                    break;
                case ParameterTypes.VerboseSupport:
                    model.default = "false";
                    model.description = "echos script data";
                    model.longParameter = "verbose";
                    model.type = ParameterTypes.VerboseSupport;
                    model.shortParameter = "b";
                    model.requiresInputString = false;
                    model.requiredParameter = false;
                    model.valueIfSet = "true";
                    model.variableName = "verbose"
                    break;
                case ParameterTypes.Custom:
                    break;
            }
        }
        finally {
            model.FireChangeNotifications = true;
            model.updateAll();
        }
    }

    //
    //  when we blur we update the model with whatever the user typed
    private onBlur = async (e: React.FocusEvent<InputText & HTMLInputElement>) => {
        e.bubbles = true;
        if (this._updatingModel) {
            return;
        }
        try {

            this._updatingModel = true;
            const key = e.currentTarget.id;
            // console.log(`onBlur [${key}=${e.currentTarget.value}]`)
            if (key !== undefined) {
                this.state.Model[key] = e.currentTarget.value;
            }
        }
        finally {
            this._updatingModel = false;

        }
    }
    //
    //  for the checkboxes we update both the the model, which then gets a callback
    //  where we update the internal state, which will then call render()
    private requiresInputStringChanged = (e: { originalEvent: Event, value: any, checked: boolean }): void => {

        //
        //  if they check "requiresInputString", set valueIfSet to $2
        //  but remember what they had before and put it back if they uncheck it.
        if (e.checked) {
            this.state.Model.oldValueIfSet = this.state.Model.valueIfSet;
            if (this.state.Model.valueIfSet !== "$2") {
                this.state.GrowlCallback({ life: 5000, severity: "warn", summary: "Bash Wizard", detail: "If the parameter requires input, then \"Value if Set\" must be set to $2.  Unclick to reset to previous value." });
                this.state.Model.valueIfSet = "$2"

            }

        }
        else { // not checked
            if (this.state.Model.valueIfSet === "$2") {
                this.state.GrowlCallback({ life: 5000, severity: "warn", summary: "Bash Wizard", detail: "If the parameter does not use input, then the \"Value if Set\" cannot be \"$2\". Resetting \"Value if Set\".  Unclick to reset to previous value." });
                if (this.state.Model.oldValueIfSet === "$2") {
                    this.state.Model.oldValueIfSet = "";
                }
                this.state.Model.valueIfSet = this.state.Model.oldValueIfSet;
            }
        }






        this.state.Model.requiresInputString = e.checked;
        //
        //  do not call this.setState -- this will happen in the notification

    }

    private requiredParameterChanged = async (e: { originalEvent: Event, value: any, checked: boolean }): Promise<void> => {

        if (e.checked) { // if you require a parameter, you must have an empty initialization for the scripts to work
            if (this.state.Model.default !== "") {
                this.state.Model.oldDefault = this.state.Model.default;
                this.state.Model.default = "";
                this.state.GrowlCallback({ life: 5000, severity: "warn", summary: "Bash Wizard", detail: "You cannot have a \"Required Parameter\" and a \"Default\" at the same time.  Reseting \"Default\".  Unselect to restore." });
            }

        }
        else { // it is not required, so we can have a default

            if (this.state.Model.default === "") { // if we emptied it, put it back to what it was before
                this.state.Model.default = this.state.Model.oldDefault;
            }
        }

        this.state.Model.requiredParameter = e.checked;
     //   console.log("required Parameter: " + this.state.Model.requiredParameter);

        //
        //  do not call this.setState -- this will happen in the notification

    }
    //
    //  this is for the input fields in the grid - we store the changes
    //  in this component so that we follow the react "immutable state" rules
    //
    //  we can also enforce some rules that are internal to the one parameter
    //
    //  in onBlur, we update the model which will notify that the state has changed
    //
    private updateInputText = (e: React.FormEvent<HTMLInputElement>) => {
        const key: string = e.currentTarget.id;
        const value: string = e.currentTarget.value;
        const obj: object = {}
        obj[key] = value;


        if (key === "shortParameter") {
            if (value.length > 1) {
                this.setState({ shortParameter: e.currentTarget.value.substr(-1) }); // short parameter can only be one char long -- always put in the last one typed
                return;
            }
        }

        this.setState(obj);

        if (key === "default" && value !== "" && this.state.Model.requiredParameter === true) {
            this.state.GrowlCallback({ life: 5000, severity: "warn", summary: "Bash Wizard", detail: "You cannot have a \"Required Property\" and a \"Default\" at the same time.  Unchecking \"Required Parameter\"." });
            this.state.Model.requiredParameter = false; // internal statue updated via callback
        }
        if (key === "valueIfSet" && value === "$2" && this.state.Model.requiresInputString === false) {
            this.state.GrowlCallback({ life: 5000, severity: "warn", summary: "Bash Wizard", detail: "If the \"Value if set\" is \"$2\", then \"Requires Input String\" must be true.  Checking \"Requires Input String\"." });
            this.state.Model.requiresInputString = true; // internal statue updated via callback
        }

        if (key === "valueIfSet" && value !== "$2" && this.state.Model.requiresInputString === true) {
            this.state.GrowlCallback({ life: 5000, severity: "warn", summary: "Bash Wizard", detail: "If the \"Value if set\" is not \"$2\", then \"Requires Input String\" must be false.  Unchecking \"Requires Input String\"." });
            this.state.Model.requiresInputString = false; // internal statue updated via callback
        }
    }


    //
    //  The state management might look a bit different here than normal at first glance.
    //  instead of setting the state directly (e.g. onFocus={() => this.setState(selected: true)}), we updat this.state.Model.selected = true
    //  we are not violating the "state is ummutable" rule in react because the model will callback to the parameterItem in this.onPropertyChanged
    //  which will then call this.setState()
    //
    public render = () => {
        let fieldSetName:string = this.state.collapsed ? "parameter-fieldset parameter-fieldset-collapsed" : "parameter-fieldset";
        if (this.state.Model.selected) {
            fieldSetName += " parameter-fieldset-selected";
        }
     //   console.log (`${this.state.Model.uniqueName}=${fieldSetName}`);
        return (
            <div className="parameter-layout-root" key={this.state.uniqueId}
                 onClick={() => {this.state.Model.selected = true;}}
              /*  onFocus={() => { this.state.Model.selected = true; this.focus(); }} */

                onBlur = { () => this.state.Model.selected = false}

                >

                <Button className="collapse-button p-button-secondary"
                    icon={this.state.collapsed ? "pi pi-angle-down" : "pi pi-angle-up"}
                    onClick={() => {this.setState({ collapsed: !this.state.collapsed}); this.state.Model.selected = true;}} />
                <fieldset className={fieldSetName}

                /* onFocus={() => { this.state.Model.selected = true; this.focus(); }}*/
                onClick={() => {this.state.Model.selected = true; }}
                >
                    <legend>{this.state.type === ParameterTypes.Custom ? (this.state.Model.longParameter === "" ? "Custom" : this.state.Model.longParameter) : this.state.type}</legend>
                    <div className="TheWholeThing">
                    <div className={this.state.collapsed ? "p-grid parameter-item-grid parameter-item-grid-collapsed" : "p-grid parameter-item-grid"} ref={this.refParameterForm}
                    /* onClick={() => { this.state.Model.selected = true; this.focus(); }} */
                    >
                        <div className="p-col-fixed param-column">
                            <span className="p-float-label" >
                                <InputText autoFocus={true} ref={this.refLongName as any} id="longParameter" spellCheck={false} value={this.state.longParameter}
                                    className={"param-input " + this.state.uniqueId} onBlur={this.onBlur} onChange={this.updateInputText} disabled={this.state.type !== ParameterTypes.Custom} />
                                <label htmlFor="longParameter" className="param-label">Long Name</label>
                            </span>
                        </div>
                        <div className="p-col-fixed param-column">
                            <span className="p-float-label">
                                <InputText id="shortParameter" spellCheck={false} value={this.state.shortParameter} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} />
                                <label htmlFor="shortParameter" className="param-label">Short Name</label>
                            </span>
                        </div>
                        <div className="p-col-fixed param-column">
                            <span className="p-float-label">
                                <InputText id="variableName" spellCheck={false} value={this.state.variableName} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} disabled={this.state.type !== ParameterTypes.Custom}/>
                                <label htmlFor="variableName" className="param-label">Variable Name</label>
                            </span>
                        </div>
                    </div>
                    <div className="p-grid parameter-item-grid">
                        <div className="p-col-fixed param-column">
                            <span className="p-float-label">
                                <InputText id="default" spellCheck={false} value={this.state.default} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} disabled={this.state.type !== ParameterTypes.Custom}/>
                                <label htmlFor="default" className="param-label">Default</label>
                            </span>
                        </div>
                        <div className="p-col-fixed param-column">
                            <span className="p-float-label">
                                <InputText id="description" spellCheck={false} value={this.state.description} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} />
                                <label htmlFor="description" className="param-label">Description</label>
                            </span>
                        </div>

                        <div className="p-col-fixed param-column">
                            <span className="p-float-label">
                                <InputText id="valueIfSet" spellCheck={false} value={this.state.valueIfSet} className="param-input " onBlur={this.onBlur} onChange={this.updateInputText} disabled={this.state.type !== ParameterTypes.Custom}/>
                                <label htmlFor="valueIfSet" className="param-label">Value if Set</label>
                            </span>
                        </div>
                    </div>
                    <div className="p-grid checkbox-grid" >
                        <div className="p-col-fixed param-column">
                            <label htmlFor="cb2" className="p-checkbox-label">Requires Input String: </label>
                            <Checkbox id="requiresInputString" checked={this.state.requiresInputString} onChange={this.requiresInputStringChanged} disabled={this.state.type !== ParameterTypes.Custom}  />
                        </div>
                        <div className="p-col-fixed param-column">
                            <label htmlFor="cb2" className="p-checkbox-label">Required Parameter: </label>
                            <Checkbox id="requiredParameter" checked={this.state.requiredParameter} onChange={this.requiredParameterChanged} disabled={this.state.type !== ParameterTypes.Custom} />
                        </div>
                        <div className="p-col-fixed param-column" />

                    </div>
                    </div>
                </fieldset>
            </div>



        )

    }

}

export default ParameterView;

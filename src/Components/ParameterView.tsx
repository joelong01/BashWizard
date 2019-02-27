import React from 'react';
import { ParameterModel } from '../Models/ParameterModel';
import { ParameterType, IGrowlCallback } from "../Models/commonModel"

import { InputText } from "primereact/inputtext"
import { Checkbox } from "primereact/checkbox"
import { Button } from "primereact/button"
import { uniqueId } from 'lodash-es';




export interface IParameterProperties {
    Model: ParameterModel;
    key: string;
    label: string;
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
    GrowlCallback: IGrowlCallback;
    type: ParameterType;
    collapsed: boolean;
    key: string;
    label: string;
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
            key: id,
            label: id,
            default: this.props.Model.default,
            description: this.props.Model.description,
            longParameter: this.props.Model.longParameter,
            requiresInputString: this.props.Model.requiresInputString,
            requiredParameter: this.props.Model.requiredParameter,
            shortParameter: this.props.Model.shortParameter,
            variableName: this.props.Model.variableName,
            valueIfSet: this.props.Model.valueIfSet,
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

    //
    //  this is the callback from the model...if the App changes the data
    //  (e.g. picks a short name), then the model calls here.
    //   e.g. this flow has to work:
    //  1. user types in long-paramter and hits TAB => onBlur is called
    //  2. this updates the model (model.longParameter) => change notifications sent out
    //  3. the app tries to find a reasonable shortParameter and variable name
    //  4. ...which results in this onPropertyChanged callback being called, and the UI needs to update
    public onPropertyChanged = async (model: ParameterModel, name: string) => {


        if (!(name in this.state)) {
            console.log(`ERRROR: ${name} was passed to onPropertyChanged in error.  View: ${this}`);
            throw new Error(`ERRROR: ${name} was passed to onPropertyChanged in error.  View: ${this}`);
        }

        const obj: object = {}
        obj[name] = model[name];
        await this.setStateAsync(obj);

        if (name === "collapsed") {
            console.log(`setting collapsed=${model[name]} for ${model.longParameter}`)
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


    public render = () => {
        let fieldSetName: string = this.state.collapsed ? "parameter-fieldset parameter-fieldset-collapsed" : "parameter-fieldset";

        return (
            <div className="parameter-layout-root" key={this.state.key}>

                <Button className="collapse-button p-button-secondary"
                    icon={this.state.collapsed ? "pi pi-angle-down" : "pi pi-angle-up"}
                    onClick={() => { this.setState({ collapsed: !this.state.collapsed })}} />
                <fieldset className={fieldSetName}>
                    <legend>{this.state.type === ParameterType.Custom ? (this.state.Model.longParameter === "" ? "Custom" : this.state.Model.longParameter) : this.state.type}</legend>
                    <div className="TheWholeThing">
                        <div className={this.state.collapsed ? "p-grid parameter-item-grid parameter-item-grid-collapsed" : "p-grid parameter-item-grid"} ref={this.refParameterForm}
                        >
                            <div className="p-col-fixed param-column">
                                <span className="p-float-label" >
                                    <InputText autoFocus={true} ref={this.refLongName as any} id="longParameter" spellCheck={false} value={this.state.longParameter}
                                        className={"param-input " + this.state.key} onBlur={this.onBlur} onChange={this.updateInputText} disabled={this.state.type !== ParameterType.Custom} />
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
                                    <InputText id="variableName" spellCheck={false} value={this.state.variableName} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} disabled={this.state.type !== ParameterType.Custom} />
                                    <label htmlFor="variableName" className="param-label">Variable Name</label>
                                </span>
                            </div>
                        </div>
                        <div className="p-grid parameter-item-grid">
                            <div className="p-col-fixed param-column">
                                <span className="p-float-label">
                                    <InputText id="default" spellCheck={false} value={this.state.default} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} disabled={this.state.type !== ParameterType.Custom} />
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
                                    <InputText id="valueIfSet" spellCheck={false} value={this.state.valueIfSet} className="param-input " onBlur={this.onBlur} onChange={this.updateInputText} disabled={this.state.type !== ParameterType.Custom} />
                                    <label htmlFor="valueIfSet" className="param-label">Value if Set</label>
                                </span>
                            </div>
                        </div>
                        <div className="p-grid checkbox-grid" >
                            <div className="p-col-fixed param-column">
                                <label htmlFor="requiresInputString" className="p-checkbox-label">Requires Input String: </label>
                                <Checkbox id="requiresInputString" checked={this.state.requiresInputString} onChange={this.requiresInputStringChanged} disabled={this.state.type !== ParameterType.Custom} />
                            </div>
                            <div className="p-col-fixed param-column">
                                <label htmlFor="requiredParameter" className="p-checkbox-label">Required Parameter: </label>
                                <Checkbox id="requiredParameter" checked={this.state.requiredParameter} onChange={this.requiredParameterChanged} disabled={this.state.type !== ParameterType.Custom} />
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

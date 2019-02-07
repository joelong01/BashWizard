import React from 'react';
import ParameterModel from './ParameterModel';
import "./App.css"
import "./index.css"
import "./menu.css"

import "primereact/resources/themes/nova-light/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css"
import "./ParameterView.css"
import { InputText } from "primereact/inputtext"
import { Checkbox } from "primereact/checkbox"


export type selectedCallback = (focusedParameter?: ParameterView) => void; // "binding" to the focused parameter

export interface IParameterProperties {
    Model: ParameterModel;
    Name: string;
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
}

export class ParameterView extends React.PureComponent<IParameterProperties, IParameterState> {
    private _updatingModel: boolean;


    constructor(props: IParameterProperties) {
        super(props);

        this.state = {
            default: this.props.Model.default,
            description: this.props.Model.description,
            longParameter: this.props.Model.longParameter,
            requiresInputString: this.props.Model.requiresInputString,
            requiredParameter: this.props.Model.requiredParameter,
            shortParameter: this.props.Model.shortParameter,
            variableName: this.props.Model.variableName,
            valueIfSet: this.props.Model.valueIfSet,
            selected: false,
            Model: this.props.Model
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

    // private setStateAsync = (newState: object) => {
    //     return new Promise((resolve, reject) => {
    //         this.setState(newState, () => {
    //             resolve();
    //         });

    //     });
    // }

    //
    //  this is the callback from the model...if the App changes the data
    //  (e.g. picks a short name), then the model calls here
    public onPropertyChanged = async (model: ParameterModel, key: string) => {

        console.log(`ParameterView.onPropertyChanged: [${key}=${model[key]}]`)
        const obj: object = {}
        obj[key] = model[key];
        this.setState(obj);
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
            console.log(`onBlur [${key}=${e.currentTarget.value}]`)
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

        if (e.checked === undefined) {
            console.log(`undefined checked ${e}`)
        }
        //
        //  if they check "requiresInputString", set valueIfSet to $2
        //  but remember what they had before and put it back if they uncheck it.
        if (e.checked) {
            this.state.Model.oldValueIfSet = this.state.Model.valueIfSet;
            this.state.Model.valueIfSet = "$2"

        }
        else if(this.state.Model.oldValueIfSet !== "$2") {
            this.state.Model.valueIfSet = this.state.Model.oldValueIfSet;
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
            }

        }
        else { // it is not required, so we can have a default

            if (this.state.Model.default === "") { // if we emptied it, put it back to what it was before
                this.state.Model.default = this.state.Model.oldDefault;
            }
        }

        this.state.Model.requiredParameter = e.checked;

        //
        //  do not call this.setState -- this will happen in the notification

    }
    private updateInputText = (e: React.FormEvent<HTMLInputElement>) => {
        const key: string = e.currentTarget.id;
        const value: string = e.currentTarget.value;
        const obj: object = {}
        obj[key] = value;
        this.setState(obj);
        // this.state.Model[key] = value;
        if (key === "default" && value !== "") {
            this.state.Model.requiredParameter = false; // internal statue updated via callback            
        }
        if (key === "valueIfSet" && value === "$2") {
            this.state.Model.requiresInputString = true; // internal statue updated via callback            
        }
        else {
            this.state.Model.requiresInputString = false; // internal statue updated via callback            
        }
    }
    //
    //  selection works like this
    //  1. the HTML notification for focus comes here
    //  2. the view notifies the model that it has been selected
    //  3. the model notifies the controller ("App" acts like the controller) *and* this view
    //      a) "App" keeps track of who is selected, and if a new view is selected, the old view's model is set to .selected=false
    //      b) the ParameterView.onPropertyChanged notification will call setState() to update the selected property and get it drawn
    //         correctly
    //  4. "App" can also set the focus by calling the Model (e.g. when the first one is created or one is deleted)
    //
    /*    private formFocus = (e: React.FocusEvent<FormControl & HTMLInputElement>) => {
   
           // let the model know it is selected so the event sinks can notify
           console.log(`ParameterView.formFocus: focus: ${e.target.value} [name=${e.target.name}] [longParam = ${this.state.Model.longParameter}`)
           this.state.Model.selected = true;        
       } */


    // }

    public render = () => {

        let formClassName: string = (this.state.Model.selected) ? "parameterItem ParameterForm_Selected" : "parameterItem ParameterForm_NotSelected";

        return (
            <div className={formClassName}>
                <div className="p-grid">
                    <div className="p-col-fixed param-column">
                        <span className="p-float-label">
                            <InputText id="longParameter" spellCheck={false} value={this.state.longParameter} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} />
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
                            <InputText id="variableName" spellCheck={false} value={this.state.variableName} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} />
                            <label htmlFor="variableName" className="param-label">Variable Name</label>
                        </span>
                    </div>
                </div>
                <div className="p-grid">
                    <div className="p-col-fixed param-column">
                        <span className="p-float-label">
                            <InputText id="default" spellCheck={false} value={this.state.default} className="param-input" onBlur={this.onBlur} onChange={this.updateInputText} />
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
                            <InputText id="valueIfSet" spellCheck={false} value={this.state.valueIfSet} className="param-input " onBlur={this.onBlur} onChange={this.updateInputText} />
                            <label htmlFor="valueIfSet" className="param-label">Value if Set</label>
                        </span>
                    </div>
                </div>
                <div className="p-grid checkbox-grid">
                    <div className="p-col-fixed param-column">
                        <label htmlFor="cb2" className="p-checkbox-label">Requires Input String: </label>
                        <Checkbox id="requiresInputString" checked={this.state.requiresInputString} onChange={this.requiresInputStringChanged} />
                    </div>
                    <div className="p-col-fixed param-column">
                        <label htmlFor="cb2" className="p-checkbox-label">Required Parameter: </label>
                        <Checkbox id="requiredParameter" checked={this.state.requiredParameter} onChange={this.requiredParameterChanged} />
                    </div>
                    <div className="p-col-fixed param-column" />
                </div>
            </div >


        )

    }

}

export default ParameterView;

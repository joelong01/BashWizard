import React from 'react';
import { ParameterModel } from '../Models/ParameterModel';
import { ParameterType, IGrowlCallback, IParameterUiState } from "../Models/commonModel"

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

interface IParameterState extends IParameterUiState {

    Model: ParameterModel;
    GrowlCallback: IGrowlCallback;
    type: ParameterType;
    collapsed: boolean;
    key: string;
    label: string;
}

export class ParameterView extends React.PureComponent<IParameterProperties, IParameterState> {
    private refParameterForm = React.createRef<HTMLDivElement>();
    private refLongName = React.createRef<InputText>();
    constructor(props: IParameterProperties) {
        super(props);
        const id: string = uniqueId("ParameterView");
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



    }

    public componentWillMount() {
        this.state.Model.onPropertyChanged.subscribe(this.onPropertyChanged);

    }

    public componentWillUnmount() {
        this.props.Model.onPropertyChanged.unsubscribe(this.onPropertyChanged);
    }

    get Model(): ParameterModel {
        return this.state.Model;
    }


    private setStateAsync = (name: keyof IParameterUiState, value: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            const o: object = {}
            o[name] = value;
            this.setState(o, () => {
                resolve();
            });

        });
    }

    //
    //  this is the callback from the model...if the App changes the data
    //  (e.g. picks a short name), then the model calls here.
    //   e.g. this flow has to work:
    //  1. user types in long-paramter and hits TAB => onBlur is called
    //  2. this updates the model (model.longParameter) => event fired to all subscribers
    //  3. the model tries to find a reasonable shortParameter and variable name
    //  4. ...which results in this onPropertyChanged callback being called, and the UI needs to update
    public onPropertyChanged = async (model: ParameterModel, name: keyof IParameterUiState) => {
       await this.setStateAsync(name, model[name]);
    }

    //
    //  when we blur we update the model with whatever the user typed
    private onBlur = async (e: React.FocusEvent<InputText & HTMLInputElement>) => {
        const key = e.currentTarget.id;
        if (key !== undefined) {
            this.state.Model[key] = e.currentTarget.value;
        }
    }
    //
    //  for the checkboxes we update both the the model, which then gets a callback
    //  where we update the internal state, which will then call render()
    private requiresInputStringChanged = (e: { originalEvent: Event, value: any, checked: boolean }): void => {
        this.state.Model.requiresInputString = e.checked;
    }

    private requiredParameterChanged = async (e: { originalEvent: Event, value: any, checked: boolean }): Promise<void> => {
        this.state.Model.requiredParameter = e.checked;
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
        this.setState(obj);
    }

    //
    //  sets the focus when the user clicks inside the ParameterView
    //  if it is a DIV or a FIELDSET, put the focus on longParameter
    public focusFirst = (e: any) => {

        if ((e.target.tagName === "DIV" || e.target.tagName === "FIELDSET") && !e.target.className.includes("p-checkbox")) {

            const el: any = e.currentTarget.querySelector("#longParameter");
            if (el !== null) {
                el.focus();
            }
        }
    }

    public render = () => {
        let fieldSetName: string = this.state.collapsed ? "parameter-fieldset parameter-fieldset-collapsed" : "parameter-fieldset";

        return (
            <div className="parameter-layout-root" key={this.state.key} onClick={this.focusFirst}>

                <Button className="collapse-button p-button-secondary"
                    icon={this.state.collapsed ? "pi pi-angle-down" : "pi pi-angle-up"}
                    onClick={() => { this.setState({ collapsed: !this.state.collapsed }) }} />
                <fieldset className={fieldSetName} onClick={this.focusFirst}>

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
                            <div className="p-col-fixed param-column" >
                                <label className="p-checkbox-label" style={{visibility: "collapse"}}>{`id: ${this.state.Model.uniqueName.toString()}`}</label>
                            </div>

                        </div>
                    </div>
                </fieldset>
            </div>



        )

    }

}

export default ParameterView;

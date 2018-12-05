import * as React from "react";
import ParameterModel from './ParameterModel';
import "./App.css"
import "./index.css"
import "./menu.css"
import "./parameter.css"

export type selectedCallback = (focusedParameter?: Parameter) => void; // "binding" to the focused parameter

export interface IParameterProperties {
    Model: ParameterModel;
    index: number;
    SelectedCallback: selectedCallback;
}

export enum SelectedState {
    Selected = 1,
    NotSelected,
};

interface IParameterState {
    Model: ParameterModel;
    SelectedState: SelectedState;
    SelectedCallback: selectedCallback;

}

export class Parameter extends React.PureComponent<IParameterProperties, IParameterState> {
    constructor(props: IParameterProperties) {
        super(props);
        this.props.Model.registerNotify(this.onPropertyChanged)
        this.state = {
            Model: this.props.Model,
            SelectedState: SelectedState.NotSelected,
            SelectedCallback: this.props.SelectedCallback,
        };

        this.onBlur = this.onBlur.bind(this);
        this.onChecked = this.onChecked.bind(this);

    }

    public Select = async (state: SelectedState) => {
        await this.setStateAsync({ SelectedState: state });
    }

    get Model(): ParameterModel {
        return this.state.Model;
    }

    // private setStateAsync = (newState: object) => {
    //     // const key = Object.keys(newState)[0];
    //     // util.log("setStateAsync: key= %s oldVal = %o newVal = %o]", key, this.state[key], newState[key]);
    //     return new Promise((resolve, reject) => {
    //         this.setState(newState, () => {
    //             resolve();
    //             // console.log("setStateAsync: key= %s state = %o", key, this.state[key]);

    //         });

    //     });
    // }

    public onPropertyChanged = (parameter: ParameterModel, name: string): void => {
        this.forceUpdate(); // the state is already set in the ParameterModel
    }
    private onBlur = async (e: React.FormEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id as string
        const val = e.currentTarget.value as string
        const parameterModel: ParameterModel = this.state.Model;
        parameterModel[key] = val;
        this.state.Model.NotifyPropertyChanged(key);
    }
    // private dumpObject = (msg: string, obj: object) => {
    //     console.log("%s: %o", msg, obj);
    // }
    private onChecked = (e: React.FormEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id as string // we have very carefully arranged this so that the id === key
        const val = e.currentTarget.checked as boolean
        const data: ParameterModel = this.state.Model;
        data[key] = val;
        this.state.Model.NotifyPropertyChanged(key);
    }

    private formFocus = async () => {
        await this.setStateAsync({ SelectedState: SelectedState.Selected })
        this.props.SelectedCallback(this);
    }
    private formBlur = async (e: React.FocusEvent<HTMLFormElement>) => {
        // await this.setStateAsync({ SelectedState: SelectedState.NotSelected })
        // this.props.SelectedCallback(undefined);
        console.log("lost focus")
    }
    // private wait = async (ms: number) => {
    //     //   util.log ("waiting for %s ms", ms);
    //     return new Promise((resolve, reject) => {
    //         setTimeout(() => {
    //             resolve();
    //         }, ms);
    //     });
    // }

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
    public render = () => {

        let formClassName: string = "";
        console.log(`[focusState=${this.state.SelectedState}]`)
        switch (this.state.SelectedState) {
            case SelectedState.NotSelected:
                formClassName = "ParameterForm_NotSelected"
                break;
            case SelectedState.Selected:
                formClassName = "ParameterForm_Selected";
                break;

        }
        console.log(`[formClassName=${formClassName}]`)
        return (


            <div className="DIV_OUTER">
                <form className={formClassName} onFocus={this.formFocus} onBlur={this.formBlur}>
                    <div className="DIV_BORDER" />
                    <div className="DIV_ROW1">
                        <label style={{ marginLeft: "10px" }}>
                            Long Name:  <input id="longParameter" className="longName" type="text" defaultValue={this.state.Model.longParameter} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "14px" }}>
                            Short Name:  <input id="shortParameter" type="text" defaultValue={this.state.Model.shortParameter} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "10px" }}>
                            Variable Name:  <input id="variableName" type="text" defaultValue={this.state.Model.variableName} onBlur={this.onBlur} />
                        </label>
                    </div>
                    <div className="DIV_ROW2">
                        <label style={{ marginLeft: "29px" }}>
                            Default:  <input id="default" type="text" defaultValue={this.state.Model.default} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "5px" }}>
                            Description:  <input id="description" type="text" defaultValue={this.state.Model.description} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "19px" }}>
                            Value if Set:  <input id="valueIfSet" type="text" defaultValue={this.state.Model.valueIfSet} onBlur={this.onBlur} />
                        </label>
                    </div>
                    <div className="DIV_ROW3" style={{ marginLeft: "337px" }}>
                        <label>
                            Requires Input String:  <input id="requiresInputString" type="checkbox" defaultChecked={this.state.Model.requiresInputString} onChange={this.onChecked} />
                        </label>
                        <label style={{ marginLeft: "10px" }}>
                            Required Parameter:  <input id="requiredParameter" type="checkbox" defaultChecked={this.state.Model.requiredParameter} onChange={this.onChecked} />
                        </label>
                    </div>

                </form>
            </div>
        );
    }

}

export default Parameter;

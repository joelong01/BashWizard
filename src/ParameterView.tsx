import * as React from "react";
import ParameterModel from './ParameterModel';
import "./App.css"
import "./index.css"
import "./menu.css"
import "./parameter.css"

export type selectedCallback = (focusedParameter?: ParameterView) => void; // "binding" to the focused parameter

export interface IParameterProperties {
    Model: ParameterModel;
    Name: string;
}



interface IParameterState {
    Model: ParameterModel;
}

export class ParameterView extends React.PureComponent<IParameterProperties, IParameterState> {
    private _updatingModel: boolean;
    constructor(props: IParameterProperties) {
        super(props);
       
        this.state = {
            Model: this.props.Model    
        };

        this.onBlur = this.onBlur.bind(this);
        this.onChecked = this.onChecked.bind(this);
        this._updatingModel = false;
    }

    public componentWillMount() {
        this.props.Model.registerNotify(this.onPropertyChanged)
    }

    public componentWillUnmount(){
        this.props.Model.removeNotify(this.onPropertyChanged)
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

    public onPropertyChanged = async (model: ParameterModel, name: string) => {
        console.log(`ParameterView.onPropertyChanged: [${name}=${model}]`)
        if (name === "selected") {
            console.log(`selected property changed. longname: ${this.Model.longParameter}. Selected: ${model.selected}`)
            this.setStateAsync({ SelectedState: model.selected })
        }
        this.forceUpdate(); // the state is already set in the ParameterModel
    }
    private onBlur = async (e: React.FormEvent<HTMLInputElement>) => {
        if (this._updatingModel) {
            return;
        }
        try {
            
            this._updatingModel = true;
            const key = e.currentTarget.id as string
            const val = e.currentTarget.value as string
            const parameterModel: ParameterModel = this.state.Model;
            parameterModel[key] = val;
            console.log(`updating model [${key}=${val}]`)
            this.state.Model.NotifyPropertyChanged(key);

        }
        finally {
            this._updatingModel = false;
        }
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
    private formFocus = () => {

        // let the model know it is selected so the event sinks can notify
        this.state.Model.selected = true;

    }

    // private wait = async (ms: number) => {
    //     //   util.log ("waiting for %s ms", ms);
    //     return new Promise((resolve, reject) => {
    //         setTimeout(() => {
    //             resolve();
    //         }, ms);
    //     });
    // }


    public render = () => {

        let formClassName: string = (this.state.Model.selected) ? "ParameterForm_Selected" : "ParameterForm_NotSelected";

        return (


            <div className="DIV_OUTER">
                <form className={formClassName} onFocus={this.formFocus} >
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

export default ParameterView;

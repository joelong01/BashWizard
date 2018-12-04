import * as React from "react";
import ParameterModel from './ParameterModel';
import "./parameter.css"



export interface IParameterProperties {
    Model: ParameterModel;
    index: number;
}


interface IParameterState {
    data: ParameterModel;

}

class Parameter extends React.PureComponent<IParameterProperties, IParameterState> {
    constructor(props: IParameterProperties) {
        super(props);
        this.props.Model.registerNotify(this.onPropertyChanged)
        this.state = {
            data: this.props.Model
        };

        this.onBlur = this.onBlur.bind(this);
        this.onChecked = this.onChecked.bind(this);

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

    public onPropertyChanged = (parameter:ParameterModel, name: string): void => {
        this.forceUpdate(); // the state is already set in the ParameterModel
    }
    private onBlur = async (e: React.FormEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id as string
        const val = e.currentTarget.value as string
        const parameterModel: ParameterModel = this.state.data;        
        parameterModel[key] = val; 
        this.state.data.NotifyPropertyChanged(key);
    }
    // private dumpObject = (msg: string, obj: object) => {
    //     console.log("%s: %o", msg, obj);
    // }
    private onChecked = (e: React.FormEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id as string // we have very carefully arranged this so that the id === key
        const val = e.currentTarget.checked as boolean
        const data: ParameterModel = this.state.data;
        data[key] = val;
        this.state.data.NotifyPropertyChanged(key);
    }

    public render = () => {

        return (


            <div className="DIV_OUTER">
                <form className="ParameterForm">
                    <div className="DIV_BORDER" />
                    <div className="DIV_ROW1">
                        <label style={{ marginLeft: "10px" }}>
                            Long Name:  <input id="longParameter" className="longName" type="text" defaultValue={this.state.data.longParameter} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "14px" }}>
                            Short Name:  <input id="shortParameter" type="text" defaultValue={this.state.data.shortParameter} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "10px" }}>
                            Variable Name:  <input id="variableName" type="text" defaultValue={this.state.data.variableName} onBlur={this.onBlur} />
                        </label>
                    </div>
                    <div className="DIV_ROW2">
                        <label style={{ marginLeft: "29px" }}>
                            Default:  <input id="default" type="text" defaultValue={this.state.data.default} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "5px" }}>
                            Description:  <input id="description" type="text" defaultValue={this.state.data.description} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "19px" }}>
                            Value if Set:  <input id="valueIfSet" type="text" defaultValue={this.state.data.valueIfSet} onBlur={this.onBlur} />
                        </label>
                    </div>
                    <div className="DIV_ROW3" style={{ marginLeft: "337px" }}>
                        <label>
                            Requires Input String:  <input id="requiresInputString" type="checkbox" defaultChecked={this.state.data.requiresInputString} onChange={this.onChecked} />
                        </label>
                        <label style={{ marginLeft: "10px" }}>
                            Required Parameter:  <input id="requiredParameter" type="checkbox" defaultChecked={this.state.data.requiredParameter} onChange={this.onChecked} />
                        </label>
                    </div>

                </form>
            </div>
        );
    }

}

export default Parameter;

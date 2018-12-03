import * as React from "react";
import ParameterModel from './ParameterModel';
import "./parameter.css"


export interface IParameterProperties {
    Model: ParameterModel;
    index: number;
    onChange(index: number, name: string, newVal: any): void;
}


interface IParameterState {
   data: ParameterModel;

}

class Parameter extends React.PureComponent<IParameterProperties, IParameterState> {
    constructor(props: IParameterProperties) {
        super(props);
        this.state = {
           data: this.props.Model
        };

        this.onBlur = this.onBlur.bind(this);
        this.onChecked = this.onChecked.bind(this);

    }

   
   /*  public shouldComponentUpdate = (nextProps: Readonly<IParameterProperties>, nextState: Readonly<IParameterState>): boolean => {

        return true;

    } */

    public static defaultProps = {Model: new ParameterModel()}
   
  
    private onBlur = (e: React.FormEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id as string
        const val = e.currentTarget.value as string
        const data: ParameterModel = this.state.data;
        data[key] = val;        
        this.props.onChange(this.props.index, key, val)
        

    }
    // private dumpObject = (msg: string, obj: object) => {
    //     console.log("%s: %o", msg, obj);
    // }
    private onChecked = (e: React.FormEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id as string
        const val = e.currentTarget.checked as boolean
        const data: ParameterModel = this.state.data;
        data[key] = val;
        this.props.onChange(this.props.index, key, val)      
    }

    public render = () => {

        return (


            <div className="DIV_OUTER">
                <form className="ParameterForm">
                    <div className="DIV_BORDER"/>
                    <div className="DIV_ROW1">
                        <label style={{ marginLeft: "10px" }}>
                            Long Name:  <input id="longName" className="longName" type="text" defaultValue={this.state.data.longParameter} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "14px" }}>
                            Short Name:  <input id="shortName" type="text" defaultValue={this.state.data.shortParameter} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "10px" }}>
                            Variable Name:  <input id="variableName" type="text" defaultValue={this.state.data.variableName} onBlur={this.onBlur} />
                        </label>
                    </div>
                    <div className="DIV_ROW2">
                        <label style={{ marginLeft: "29px" }}>
                            Default:  <input id="defaultValue" type="text" defaultValue={this.state.data.defaultValue} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "5px" }}>
                            Description:  <input id="descriptionValue" type="text" defaultValue={this.state.data.descriptionValue} onBlur={this.onBlur} />
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

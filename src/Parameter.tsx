import * as React from "react";
import ParameterModel from './ParameterModel';


export interface IParameterProperties {
    Model: ParameterModel;
}


interface IParameterState {
    defaultValue?: string;
    descriptionValue?: string;
    longName?: string;
    requiresInputString?: boolean;
    requiredParameter?: boolean;
    shortName?: string;
    variableName?: string;
    valueIfSet?: string;

}

class Parameter extends React.PureComponent<IParameterProperties, IParameterState> {
    constructor(props: IParameterProperties) {
        super(props);
        this.state = {
            defaultValue: props.Model!.defaultValue, descriptionValue: props.Model!.descriptionValue, longName: props.Model!.longName,
            requiresInputString: props.Model!.requiresInputString, requiredParameter: props.Model!.requiredParameter, shortName: props.Model!.shortName,
            variableName: props.Model!.variableName, valueIfSet: props.Model!.valueIfSet
        };

        this.onBlur = this.onBlur.bind(this);
        this.onChecked = this.onChecked.bind(this);

    }

   
    public shouldComponentUpdate = (nextProps: Readonly<IParameterProperties>, nextState: Readonly<IParameterState>): boolean => {

        return true;

    }

    public static defaultProps = {Model: new ParameterModel()}
   
  
    private onBlur = (e: React.FormEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id as string
        const val = e.currentTarget.value as string
        console.log("changing key: %s to value %s", key, val)
        this.setState({ [key]: val })
        this.dumpObject("state", this.state)

    }
    private dumpObject = (msg: string, obj: object) => {
        console.log("%s: %o", msg, obj);
    }
    private onChecked = (e: React.FormEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id as string
        const val = e.currentTarget.checked as boolean
        this.setState({ [key]: val })
        this.dumpObject("state", this.state)
    }

    public render = () => {

        return (


            <div>
                <form className="ParameterForm">
                    <div>
                        <label style={{ marginLeft: "10px" }}>
                            Long Name:  <input id="longName" className="longName" type="text" defaultValue={this.state.longName} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "14px" }}>
                            Short Name:  <input id="shortName" type="text" defaultValue={this.state.shortName} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "10px" }}>
                            Variable Name:  <input id="variableName" type="text" defaultValue={this.state.variableName} onBlur={this.onBlur} />
                        </label>
                    </div>
                    <div>
                        <label style={{ marginLeft: "29px" }}>
                            Default:  <input id="defaultValue" type="text" defaultValue={this.state.defaultValue} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "5px" }}>
                            Description:  <input id="descriptionValue" type="text" defaultValue={this.state.descriptionValue} onBlur={this.onBlur} />
                        </label>
                        <label style={{ marginLeft: "19px" }}>
                            Value if Set:  <input id="valueIfSet" type="text" defaultValue={this.state.valueIfSet} onBlur={this.onBlur} />
                        </label>
                    </div>
                    <div style={{ marginLeft: "337px" }}>
                        <label>
                            Requires Input String:  <input id="requiresInputString" type="checkbox" defaultChecked={this.state.requiresInputString} onChange={this.onChecked} />
                        </label>
                        <label style={{ marginLeft: "10px" }}>
                            Required Parameter:  <input id="requiredParameter" type="checkbox" defaultChecked={this.state.requiredParameter} onChange={this.onChecked} />
                        </label>
                    </div>
                   
                </form>
            </div>
        );
    }

}

export default Parameter;

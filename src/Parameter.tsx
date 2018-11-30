import * as React from "react";


export interface IProps {
    defaultValue?: string;
    descriptionValue?: string;
    longName?: string;
    requiresInputString?: boolean;
    requiredParameter?: boolean;
    shortName?: string;
    variableName?: string;
    valueIfSet?: string;
}   


interface IPropertyState {
    defaultValue?: string;
    descriptionValue?: string;
    longName?: string;
    requiresInputString?: boolean;
    requiredParameter?: boolean; 
    shortName?: string;
    variableName?: string;    
    valueIfSet?: string;    
}


class Parameter extends React.Component<IProps, IPropertyState> {
    constructor(props: IProps) {
        super(props);
        this.state = {defaultValue: "default", descriptionValue: "description", longName: "long", requiresInputString: false, requiredParameter: false, shortName: "short", variableName: "var", valueIfSet: "$2"   };
        this.onBlur = this.onBlur.bind(this);
        this.onChecked = this.onChecked.bind(this);
    }

   
    private onBlur(e: React.FormEvent<HTMLInputElement>) {
        const key = e.currentTarget.id as string
        const val = e.currentTarget.value as string
        const obj = {} as object
        obj[key] = val
        this.setState(obj)
        console.log(obj)
    }

    private onChecked(e: React.FormEvent<HTMLInputElement>) {
        const key = e.currentTarget.id as string
        const val = e.currentTarget.checked as boolean
        const obj = {} as object
        obj[key] = val
        this.setState(obj)
        console.log(obj)
    }


    public render() {
               return (
            <div className="hello">
                <form>
                    <div>
                        <label>
                                   Long Name:  <input id="longName" type="text" defaultValue={this.state.longName} onBlur={this.onBlur} />
                        </label>
                        <label>
                                   Short Name:  <input id="shortName" type="text" defaultValue={this.state.shortName} onBlur={this.onBlur} />
                        </label>
                        <label>
                                   Variable Name:  <input id="variableName" type="text" defaultValue={this.state.variableName} onBlur={this.onBlur}/>
                        </label>
                    </div>
                    <div>
                        <label>
                                   Default:  <input id="defaultValue" type="text" defaultValue={this.state.defaultValue} onBlur={this.onBlur} />
                        </label>
                        <label>
                                   Description:  <input id="descriptionValue" type="text" defaultValue={this.state.descriptionValue} onBlur={this.onBlur} />
                        </label>
                        <label>
                                   Value if Set:  <input id="valueIfSet" type="text" defaultValue={this.state.valueIfSet} onBlur={this.onBlur}/>
                        </label>
                    </div>
                    <div>
                        <label>
                                   Requires Input String:  <input id="requiresInputString" type="checkbox" defaultChecked={this.state.requiresInputString} onChange={this.onChecked}/>
                        </label>
                        <label>
                                   Required Parameter:  <input id="requiredParameter" type="checkbox" defaultChecked={this.state.requiredParameter} onChange={this.onChecked}/>
                        </label>
                    </div>                    
                </form>                
            </div>
        );
    }
  
}

export default Parameter;

import React from 'react';
import { InputText } from "primereact/inputtext"


interface IDescriptionName {
    description: string;
    scriptName: string;
    onBlur?: (key: "Name" | "Description", value: string) => void;
}


interface IGlobalStateProperties extends IDescriptionName {

}

interface IGlobalState extends IDescriptionName {

}

export class ScriptNameDescription extends React.PureComponent<IGlobalStateProperties, IGlobalState> {
    constructor(props: IGlobalStateProperties) {
        super(props);
        this.state = {
            description: this.props.description,
            scriptName: this.props.scriptName,
            onBlur: this.props.onBlur
        }
        console.log(`ctor: [scriptName=${this.state.scriptName}]`)
    }


    get Description(): string {
        return this.state.description;
    }

    set Description(value: string) {
        if (value !== this.state.description) {

            this.setState({ description: value })

        }
    }

    get ScriptName(): string {
        return this.state.scriptName;
    }

    set ScriptName(value: string) {
        if (value !== this.state.scriptName) {

            this.setState({ scriptName: value })

        }
    }


    public render = () => {
        console.log(`ScriptNameDescription::render: [scriptName=${this.state.scriptName}]`)
        return (
            <div className="DIV_globalEntry" id="div-global-entry">
                <div className="p-grid grid-global-entry">
                    <div className="p-col-fixed column-global-entry">
                        <span className="p-float-label">
                            <InputText id="scriptName"
                                className="param-input"
                                spellCheck={false}
                                value={this.state.scriptName}
                                onChange={(e: React.FormEvent<HTMLInputElement>) => {
                                    this.setState({ scriptName: e.currentTarget.value });
                                }}
                                onBlur={() => {
                                    if (this.state.onBlur !== undefined) {
                                        this.state.onBlur("Name", this.state.scriptName);
                                    }
                                }} />
                            <label htmlFor="scriptName" className="param-label">Script Name</label>
                        </span>
                    </div>
                    <div className="p-col-fixed column-global-entry">
                        <span className="p-float-label">
                            <InputText className="param-input"
                                id="description"
                                spellCheck={false}
                                value={this.state.description}
                                onChange={(e: React.FormEvent<HTMLInputElement>) => {
                                    this.setState({ description: e.currentTarget.value });
                                }}
                                onBlur={() => {
                                    if (this.state.onBlur !== undefined) {
                                        this.state.onBlur("Description", this.state.description);
                                    }
                                }} />
                            <label className="param-label"
                                htmlFor="description_input" >Description</label>
                        </span>
                    </div>
                </div>
            </div>

        );
    }
}

export default ScriptNameDescription;

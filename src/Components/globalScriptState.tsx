import React from 'react';
import { InputText } from "primereact/inputtext"
import { Checkbox } from "primereact/checkbox"


interface IGlobalScriptState {
    autoInstallDependencies:boolean;
    description: string;
    scriptName: string;
    onBlur?: (key: "Name" | "Description", value: string) => void;
    onCheckedAutoInstall?: (checked:boolean) => void;
}




export class GlobalScriptData extends React.PureComponent<IGlobalScriptState, IGlobalScriptState> {
    constructor(props: IGlobalScriptState) {
        super(props);
        this.state = {
            autoInstallDependencies: this.props.autoInstallDependencies,
            description: this.props.description,
            scriptName: this.props.scriptName,
            onBlur: this.props.onBlur,
            onCheckedAutoInstall: this.props.onCheckedAutoInstall
        }
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

    get AutoInstallDependencies(): boolean {
        return this.state.autoInstallDependencies;
    }

    set AutoInstallDependencies(value: boolean) {
        if (value !== this.state.autoInstallDependencies) {

            this.setState({ autoInstallDependencies: value })

        }
    }


    public render = () => {
        return (
            <div className="DIV_globalEntry" id="div-global-entry">
                <div className="p-grid grid-global-entry">
                    <div className="p-col-3 column-global-entry">
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
                    <div className="p-col-3 column-global-entry">
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
                                htmlFor="description" >Description</label>
                        </span>
                    </div>

                    <div className="p-col-3 column-global-entry">
                        <span className="p-float-label">
                            <Checkbox className="param-input"
                                tooltip="script will automatically install all dependencies without user interaction"
                                id="autoInstallDependencies"

                                checked={this.state.autoInstallDependencies}
                                value="Auto Install Dependencies"
                                onChange={(e: { originalEvent: Event; value: any; checked: boolean; }) => {
                                    this.setState({ autoInstallDependencies: e.checked });
                                    if (this.state.onCheckedAutoInstall !== undefined) {
                                            this.state.onCheckedAutoInstall(e.checked)
                                    }
                                }}
                               />
                            <label className="p-checkbox-label autoinstallLabel" htmlFor="autoInstallDependencies" >
                                Auto Install Dependencies
                            </label>
                        </span>
                    </div>
                </div>
            </div>

        );
    }
}

export default GlobalScriptData;

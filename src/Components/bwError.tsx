import React from "react";
import { IErrorMessage } from 'bash-models/dist/commonModel';
import { ParameterModel } from "bash-models/dist/ParameterModel"

interface IErrorProps {
    ErrorMessage: IErrorMessage;
    clicked?(error: BWError): void;

}

interface IErrorState {
    severity: "warn" | "error" | "info";
    message: string;
    Parameter?: ParameterModel
}

export class BWError extends React.PureComponent<IErrorProps, IErrorState> {
    constructor(props: IErrorProps) {
        super(props);
        this.state = {
            severity: props.ErrorMessage.severity,
            message: props.ErrorMessage.message,
            Parameter: props.ErrorMessage.Parameter
        }
    }
    private onErrorClicked = (e: React.MouseEvent<HTMLDivElement>) => {
        e.bubbles = false;
        if (this.props.clicked !== undefined) {
            this.props.clicked(this);
        }
    }

    get Parameter(): ParameterModel | undefined {
        return this.state.Parameter;
    }

    public render() {
        return (
            <div className="bw-error-item" onClick={(e: React.MouseEvent<HTMLDivElement>) => { this.onErrorClicked(e) }}>
                <span className="bw-error-span error-col1">{this.state.severity}</span>
                <span className="bw-error-span error-col2">{this.state.message}</span>
            </div>
        );
    }
}

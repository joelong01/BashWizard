import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

export enum YesNo {
    Yes,
    No
}

export interface IYesNoResponse{
    answer:YesNo;
    neverAsk?:boolean;
}

export type YesNoResponse = (response: IYesNoResponse) => void;

interface IYesNoDialogProps {
    message?: string;
    visible?: boolean;
    Notify?: YesNoResponse;

}

interface IYesNoDialogState {
    message?: string;
    Notify?: YesNoResponse;
    dialogAnswer: "yes" | "no";
    visible: boolean;
    neverAsk?: boolean;
    showYesAlways: boolean;
}

export class YesNoDialog extends React.PureComponent<IYesNoDialogProps, IYesNoDialogState> {

    constructor(props: IYesNoDialogProps) {
        super(props);
        console.log("created YesNoDialog");
        this.state = {
            message: this.props.message,
            Notify: this.props.Notify,
            visible: false,
            dialogAnswer: "no",
            showYesAlways: false,
            neverAsk: undefined,
        };
    }
    public waitForDlgAnswer = async (msg: string, showCB: boolean): Promise<IYesNoResponse> => {
        return new Promise<IYesNoResponse>((resolve, reject) => {
            this.setState({ visible: true, message: msg, showYesAlways: showCB }, () => {
                this.setState({
                    Notify: (response: IYesNoResponse) => {
                        this.setState({ visible: false }, () => {
                            resolve(response);
                        });
                    }
                });
            });
        });
    }
    private dlgOnYes = async () => {
        if (this.state.Notify !== undefined) {
            this.state.Notify({answer: YesNo.Yes, neverAsk: false});
        }
    }
    private dlgOnYesAlways = async () => {
        if (this.state.Notify !== undefined) {
            this.state.Notify({answer: YesNo.Yes, neverAsk: true});
        }
    }
    private dlgOnNo = async () => {
        if (this.state.Notify !== undefined) {
            this.state.Notify({answer: YesNo.No, neverAsk: false});
        }
    }

    private dlgClosed = async () => {
        return this.dlgOnNo();
    }
    public render = () => {
        const dialogFooter = (
            <div>

                <Button label="Yes" icon="pi pi-check" onClick={this.dlgOnYes} />
                {(this.state.showYesAlways === true) ?
                    <Button label="Yes Always" icon="pi pi-check" onClick={this.dlgOnYesAlways} />
                    :
                    null
                }
                <Button label="No" icon="pi pi-times" onClick={this.dlgOnNo} />

            </div>);

        return (
            <div className="content-section implementation" >
                <Dialog header="Bash Wizard" visible={this.state.visible} style={{ width: '50vw', zIndex: 5, position: "absolute", display: "grid" }} footer={dialogFooter} onHide={this.dlgClosed}>
                    {this.state.message === "" ? "<empty message>" : this.state.message}
                </Dialog>
            </div>
        );
    }

}

export default YesNoDialog;

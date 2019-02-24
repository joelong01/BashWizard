import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export type YesNoResponse = (response: "yes" | "no") => void;

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
        };
    }
    public waitForDlgAnswer = async (msg: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            this.setState({ visible: true, message: msg }, () => {
                this.setState({Notify: (response: string) => {
                    this.setState({ visible: false }, () => {;
                            resolve(response);
                        });
                    }
                });
            });
        });
    }
    private dlgOnYes = async () => {
        if (this.state.Notify !== undefined) {
            this.state.Notify("yes");
        }
    }
    private dlgOnNo = async () => {
        if (this.state.Notify !== undefined) {
            this.state.Notify("no");
        }
    }

    private dlgClosed = async () => {
        return this.dlgOnNo();
    }
    public render = () => {
        const dialogFooter = (
            <div>
                <Button label="Yes" icon="pi pi-check" onClick={this.dlgOnYes} />
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

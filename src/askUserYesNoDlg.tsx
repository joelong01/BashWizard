import React from 'react';

import "./index.css"
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css'
import "./ParameterView.css"
import "./App.css"

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export type YesNoResponse = (response: "yes" | "no") => void;

interface IYesNoDialogProps {
    message: string;
    visible: boolean;
    Notify: YesNoResponse;
}

interface IYesNoDialogState {
    message: string;
    Notify: YesNoResponse;
    dialogAnswer: "yes" | "no";
    visible: boolean;

}

export class YesNoDialog extends React.PureComponent<IYesNoDialogProps, IYesNoDialogState> {
    private _updatingModel: boolean;
    constructor(props: IYesNoDialogProps) {        
        super(props);
        console.log("dlg props: %o", this.props);
        this.state = {
            message: this.props.message,
            Notify: this.props.Notify,
            visible: false,            
            dialogAnswer: "no",
        };
    }
    private dlgOnYes = async () => {
        console.log("user said yes");
        this.state.Notify("yes");

    }
    private dlgOnNo = async () => {
        console.log("user said no");
        this.state.Notify("no");
    }

    private dlgClosed = async () => {
        console.log(`dlgClosed`);
        this.state.Notify("no");

    }
    public render = () => {
        const dialogFooter = (
            <div>
                <Button label="Yes" icon="pi pi-check" onClick={this.dlgOnYes} />
                <Button label="No" icon="pi pi-times" onClick={this.dlgOnNo} />
            </div>);
        
        return (
            <div className="content-section implementation">
                <Dialog header="Bash Wizard" visible={this.props.visible} style={{ width: '50vw' }} footer={dialogFooter} onHide={this.dlgClosed}>
                    {this.state.message === "" ? "<empty message>" : this.state.message}
                </Dialog>
            </div>
        );
    }

}

export default YesNoDialog;
import { IErrorMessage } from "./commonModel"
import { uniqueId } from 'lodash';
import ParameterModel from './ParameterModel';
import { SimpleEventDispatcher, ISimpleEvent } from "strongly-typed-events"

export interface IErrorsChanged {
    errorsUpdated: (ers: IErrorMessage[]) => void;
    clearErrors: () => void;
}


//
//  contains the BashWizard errors that are displayed in the Error listbox on the main page.
//  we add to the error collection, but we never remove an error -- instead we reset to zero
//  and add again we keep the underlying errors array immutable so that it can be added to
//  React state
export class ErrorModel {
    private errors: IErrorMessage[] = [];
    private updateCollectionEvent = new SimpleEventDispatcher<IErrorMessage[]>();
    private growlEvent = new SimpleEventDispatcher<IErrorMessage>();

    public get showGrowl() : ISimpleEvent<IErrorMessage> {
        return this.growlEvent.asEvent();
    }
    public get onErrorsChanged(): ISimpleEvent<IErrorMessage[]> {
        return this.updateCollectionEvent.asEvent();
    }
    public signal() {
        this.updateCollectionEvent.dispatch(this.errors);
    }
    public addError = (error: IErrorMessage): void => {
        this.errors = [...this.errors, error];
        this.signal();
    }
    public addErrors = (errors: IErrorMessage[]): void => {
        this.errors = [...this.errors, ...errors];
        this.signal();
    }

    public addErrorMessage = (sev: "warn" | "error" | "info", message: string, parameter?: ParameterModel): void => {
        let newMsg = {} as IErrorMessage;
        newMsg.severity = sev;
        newMsg.message = message;
        newMsg.Parameter = parameter;
        newMsg.key = uniqueId(sev);
        if (sev == "error"){
            this.addError(newMsg);
        }
        else {
            this.growlEvent.dispatch(newMsg);
        }
    }

    public clearErrors = () => {
        this.errors = [];
        this.signal();
    }
    //
    //  this is here so we only fire one event after we get all the script errors
    public replaceErrors = (newErrors: IErrorMessage[]) => {
        this.errors = [...[], ...newErrors];
        this.signal();
    }

    public get Errors(): IErrorMessage[] {
        return this.errors;
    }


}

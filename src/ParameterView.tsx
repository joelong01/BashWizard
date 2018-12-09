import React from 'react';
import ParameterModel from './ParameterModel';
import "./App.css"
import "./index.css"
import "./menu.css"
import "./parameter.css"
import "./react-bootstrap.css"
import { Form, ControlLabel, FormControl, Row, Col, Checkbox } from "react-bootstrap"


export type selectedCallback = (focusedParameter?: ParameterView) => void; // "binding" to the focused parameter

export interface IParameterProperties {
    Model: ParameterModel;
    Name: string;
}



interface IParameterState {
    Model: ParameterModel;
}

export class ParameterView extends React.PureComponent<IParameterProperties, IParameterState> {
    private _updatingModel: boolean;
    private firstInputBox = React.createRef<FormControl & HTMLInputElement>()
    // private LongParameterRef = React.createRef<FormControl>()
    constructor(props: IParameterProperties) {
        super(props);

        this.state = {
            Model: this.props.Model
        };

        this._updatingModel = false;

    }

    public componentWillMount() {
        if (this.props.Model.registerNotify !== undefined) {
            this.props.Model.registerNotify(this.onPropertyChanged)
        }

    }

    public componentWillUnmount() {
        if (this.props.Model.registerNotify !== undefined) {
            this.props.Model.removeNotify(this.onPropertyChanged)
        }
    }

    get Model(): ParameterModel {
        return this.state.Model;
    }

    // private setStateAsync = (newState: object) => {
    //     return new Promise((resolve, reject) => {
    //         this.setState(newState, () => {
    //             resolve();
    //         });

    //     });
    // }

    public onPropertyChanged = async (model: ParameterModel, name: string) => {

        console.log(`ParameterView.onPropertyChanged: [${name}=${model[name]}]`)
        if (name === "selected") {
            this.forceUpdate();
        }
    }
    private onTextChanged = (e: React.ChangeEvent<FormControl & HTMLInputElement>) => {
        const key = e.currentTarget.id;
        const val = e.currentTarget.value as string
        const parameterModel: ParameterModel = this.state.Model;
        parameterModel[key] = val;
        this.forceUpdate();
    }
    //
    //  see https://github.com/react-bootstrap/react-bootstrap/issues/2781 for why we have to have
    //  the union in the type
    private onBlur = async (e: React.FocusEvent<FormControl & HTMLInputElement>) => {
        e.bubbles = true;
        if (this._updatingModel) {
            return;
        }
        try {

            this._updatingModel = true;
            const key = e.currentTarget.id;
            if (key !== undefined) {
                const val = e.currentTarget.value as string
                const parameterModel: ParameterModel = this.state.Model;
                parameterModel[key] = val;
            }
        }
        finally {
            this._updatingModel = false;
            this.forceUpdate()
        }
    }

    //
    //  see https://github.com/react-bootstrap/react-bootstrap/issues/2781 for why we have to have
    //  the union in the type
    private onChecked = (e: React.ChangeEvent<FormControl & HTMLInputElement>) => {
        const key = e.currentTarget.id as string // we have very carefully arranged this so that the id === key
        const checked = e.currentTarget.checked as boolean
        const data: ParameterModel = this.state.Model;
        data[key] = checked;
        if (key === "requiresInputString") {
            //
            //  if they check "requiresInputString", set valueIfSet to $2
            //  but remember what they had before and put it back if they uncheck it.
            if (checked) {
                this.state.Model.oldValueIfSet = this.state.Model.valueIfSet;
                this.state.Model.valueIfSet = "$2"
            }
            else {
                this.state.Model.valueIfSet = this.state.Model.oldValueIfSet;
            }
            this.forceUpdate();
        }
    }

    //
    //  selection works like this
    //  1. the HTML notification for focus comes here
    //  2. the view notifies the model that it has been selected
    //  3. the model notifies the controller ("App" acts like the controller) *and* this view
    //      a) "App" keeps track of who is selected, and if a new view is selected, the old view's model is set to .selected=false
    //      b) the ParameterView.onPropertyChanged notification will call setState() to update the selected property and get it drawn
    //         correctly
    //  4. "App" can also set the focus by calling the Model (e.g. when the first one is created or one is deleted)
    //
    private formFocus = (e: React.FocusEvent<FormControl & HTMLInputElement>) => {

        // let the model know it is selected so the event sinks can notify
        console.log(`ParameterView.formFocus: focus: ${e.target.value} [name=${e.target.name}] [longParam = ${this.state.Model.longParameter}`)
        this.state.Model.selected = true;        
    }


    // }

    // private wait = async (ms: number) => {
    //     //   util.log ("waiting for %s ms", ms);
    //     return new Promise((resolve, reject) => {
    //         setTimeout(() => {
    //             resolve();
    //         }, ms);
    //     });
    // }


    public render = () => {

        let formClassName: string = (this.state.Model.selected) ? "ParameterForm_Selected" : "ParameterForm_NotSelected";
        console.log("Parameter.render. ParameterModel: %o", this.state.Model)
        return (

            <Form className={formClassName} onFocus={this.formFocus} >

                <Row className="ROW_ONE">
                    <Col>
                        <ControlLabel>Long Parameter </ControlLabel>
                        <FormControl id="longParameter" type="text" spellCheck={false} placeholder={"Long Parameter"} ref={this.firstInputBox} defaultValue={this.state.Model.longParameter} /* onChange={this.onTextChanged} */ onBlur={this.onBlur} autoFocus={true} />
                    </Col>
                    <Col>
                        <ControlLabel >Short Parameter</ControlLabel>
                        <FormControl id="shortParameter" type="text" spellCheck={false} placeholder={"Short Parameter"} defaultValue={this.state.Model.shortParameter} /* onChange={this.onTextChanged} */ onBlur={this.onBlur} />
                    </Col>
                    <Col>
                        <ControlLabel>Variable Name</ControlLabel>
                        <FormControl id="variableName" type="text" spellCheck={false} placeholder={"Variable Name"} defaultValue={this.state.Model.variableName} /* onChange={this.onTextChanged} */ onBlur={this.onBlur} />
                    </Col>
                </Row>
                <Row className="ROW_TWO">
                    <Col>
                        <ControlLabel>Default</ControlLabel>
                        <FormControl id="default" type="text" spellCheck={false} placeholder={"Default"} defaultValue={this.state.Model.default} /* onChange={this.onTextChanged} */ onBlur={this.onBlur} />
                    </Col>
                    <Col>
                        <ControlLabel>Description</ControlLabel>
                        <FormControl id="description" type="text" spellCheck={false} placeholder={"Description"} defaultValue={this.state.Model.description} /* onChange={this.onTextChanged} */ onBlur={this.onBlur} />
                    </Col>
                    <Col>
                        <ControlLabel>Value if Set</ControlLabel>
                        <FormControl id="valueIfSet" type="text" spellCheck={false} placeholder={"Value if set (e.g. $2"} value={this.state.Model.valueIfSet} onChange={this.onTextChanged} onBlur={this.onBlur} />
                    </Col>
                </Row>
                <Row className="ROW_THREE">
                    <Col>
                        <Checkbox inline={true} id="requiresInputString" type="checkbox" checked={this.state.Model.requiresInputString} onChange={this.onChecked}>Requires Input String</Checkbox>
                    </Col>
                    <Col>
                        <Checkbox inline={true} id="requiredParameter" type="checkbox" checked={this.state.Model.requiredParameter} onChange={this.onChecked}>Required Parameter</Checkbox>
                    </Col>
                </Row>

            </Form >
        )

    }

}

export default ParameterView;

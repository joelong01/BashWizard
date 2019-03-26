import React from "react";
import AceEditor from 'react-ace';
import "brace/mode/sh"
import "brace/mode/json"
import "brace/theme/xcode"
import "brace/theme/twilight"
import "../Themes/dark/theme.css"
import { BashWizardTheme } from '../Models/bwCommonModels';


interface IAceState {
    readonly: boolean;
    theme: BashWizardTheme;
    value: string;
    focus?: boolean;
    mode: string;
    name: string;
    onChange?: (value: string, event?: any) => void;
    onBlur?: (event: any) => void;


}

export class AceWrapper extends React.PureComponent<IAceState, IAceState> {
    constructor(props: IAceState) {
        super(props);
        this.state = {
            readonly: this.props.readonly,
            theme: this.props.theme,
            value: this.props.value,
            mode: this.props.mode,
            focus: this.props.focus,
            onChange: this.props.onChange,
            onBlur: this.props.onBlur,
            name: this.props.name

        }
    }

    public render() {
        const aceTheme = (this.state.theme === BashWizardTheme.Dark) ? "twilight" : "xcode";
        return (
            <AceEditor
                mode={this.state.mode}
                focus={this.state.focus}
                name="aceBashEditor"
                theme={aceTheme}
                className="aceBashEditor bw-ace"
                showGutter={true} showPrintMargin={false}
                value={this.state.value}
                editorProps={{ $blockScrolling: this.state.value.split("\n").length + 5 }}
                setOptions={{ autoScrollEditorIntoView: true, vScrollBarAlwaysVisible: true, highlightActiveLine: true, fontSize: 14, highlightSelectedWord: true, selectionStyle: "text" }}
                onChange={(newValue: string, event?: any) => {
                    this.setState({ value: newValue })
                    if (this.state.onChange !== undefined) {
                        this.state.onChange(newValue, event);
                    }
                }}
                onBlur={this.state.onBlur}
            />
        )
    }

}
export default AceWrapper;

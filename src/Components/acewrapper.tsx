import React from "react";
import AceEditor from 'react-ace';
import "brace/mode/sh"
import "brace/mode/json"
import "brace/theme/xcode"
import "brace/theme/twilight"
import "../Themes/dark/theme.css"
import { BashWizardTheme } from '../Models/bwCommonModels';


interface IAceWrapperProps {
    readonly: boolean;
    theme: BashWizardTheme;
    value: string;
    focus?: boolean;
    mode: string;
    name: string;
    onChange?: (value: string, event?: any) => void;
    onBlur?: (event: any) => void;


}

export class AceWrapper extends React.PureComponent<IAceWrapperProps, {}> {
    constructor(props: IAceWrapperProps) {
        super(props);
    }

    public render() {
        const aceTheme = (this.props.theme === BashWizardTheme.Dark) ? "twilight" : "xcode";
        return (
            <AceEditor
                mode={this.props.mode}
                focus={this.props.focus}
                name="aceBashEditor"
                theme={aceTheme}
                className="aceBashEditor bw-ace"
                showGutter={true} showPrintMargin={false}
                value={this.props.value}
                editorProps={{ $blockScrolling: this.props.value.split("\n").length + 5 }}
                setOptions={{ autoScrollEditorIntoView: true, vScrollBarAlwaysVisible: true, highlightActiveLine: true, fontSize: 14, highlightSelectedWord: true, selectionStyle: "text" }}
                onChange={(newValue: string, event?: any) => {
                    this.setState({ value: newValue })
                    if (this.props.onChange !== undefined) {
                        this.props.onChange(newValue, event);
                    }
                }}
                onBlur={this.props.onBlur}
            />
        )
    }

}
export default AceWrapper;

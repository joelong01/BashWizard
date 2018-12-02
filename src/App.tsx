import * as React from 'react';
import './App.css';
import "./menu.css";
import { slide as Menu } from "react-burger-menu";
import Parameter from './Parameter';
import ParameterModel from './ParameterModel';



interface IAppState {
  menuOpen: boolean;
  Parameters: ParameterModel[];
  scriptName: string;
  acceptsInput: boolean;
  echoOutput: boolean;
}


class App extends React.Component<{}, IAppState> {
  constructor(props: {}) {
    super(props);
    const params: ParameterModel[] = []
    params.push(new ParameterModel())
    params.push(new ParameterModel())
    params.push(new ParameterModel())
    params.push(new ParameterModel())
    params.push(new ParameterModel())
    params.push(new ParameterModel())
    params.push(new ParameterModel())
    params.push(new ParameterModel())
    params.push(new ParameterModel())
    params.push(new ParameterModel())


    this.state =
      {
        menuOpen: false,
        scriptName: "",
        Parameters: params,
        acceptsInput: false,
        echoOutput: false
      }

  }


  private onAddParameter = () => {
    this.setState({ Parameters: [...this.state.Parameters, new ParameterModel()] })
  }


  private renderMenu = () => {
    /* css for this is in ./menu.css */

    return (
      <Menu id="burgerMenu" isOpen={this.state.menuOpen}
        pageWrapId={"page-wrap"} outerContainerId={"outer-container"}>
        <div className="Menu_LayoutRoot">

          <div className="menuItemDiv">
            <div className="menuItemGlyph">
              +
                        </div>
            <button className="burgerItemButton" onClick={this.onAddParameter}>Add Parameter</button>
          </div>

        </div>
      </Menu >
    );
  }

  private renderOneParameter = (parameter: ParameterModel, index: number): JSX.Element => {

    let divName = "PARAMETER_DIV_" + index.toString();

    return (

      <div className={divName} key={divName} ref={divName}>
        <Parameter Model={parameter} />
      </div>


    );
  }

  public renderParameters = () => {

    let i: number = 0;
    let parameterList: JSX.Element[] = []
    for (let p of this.state.Parameters) {
      parameterList.push(this.renderOneParameter(p, i++))
    }
    return parameterList;

  }

  public stringify = () => {

    const jsonDoc = JSON.stringify(this.state.Parameters, null, 4);
    return jsonDoc;
  }

  public render = () => {
    return (
      <div className="outer-container">
        {this.renderMenu()}
        <div className="LayoutRoot">
          <div className="TopHalf">
            <form className="Global_Input_Form">
              <label style={{ marginLeft: "10px" }}>
                Script Name:  <input id="scriptName" className="scriptName" type="text" defaultValue={this.state.scriptName} />
              </label>
              <label style={{ marginLeft: "10px" }}>
                Accepts Input:  <input id="acceptsInput" className="acceptsInput" type="checkbox" defaultChecked={this.state.acceptsInput} />
              </label>
            </form>
          </div>
          <div className="Parameter_List">        
            {this.renderParameters()}        
          </div>
          <div>
            <div className="BottomHalf">
              <textarea className="input_jsonDoc" id="jsonDoc" value={this.stringify()} readOnly={true} />
            </div>
          </div>
        </div>
      </div>

    );
  }
}

export default App;

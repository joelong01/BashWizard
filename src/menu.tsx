import * as React from 'react';
import "./menu.css";
import {MenuModel} from "./menuModel"
import svgFiles from "./images"
// import { Button, ButtonGroup, Glyphicon, ButtonToolbar } from 'react-bootstrap';

interface IMenuProperties {
    isOpen: boolean,
    Items: MenuModel[];

}

interface IMenuState {
    isOpen: boolean,

}



export class BurgerMenu extends React.PureComponent<IMenuProperties, IMenuState> {
    constructor(props: IMenuProperties) {
        super(props);

        this.state = {
            isOpen: props.isOpen,

        };



    }

    public get isOpen(): boolean {
        return this.state.isOpen;
    }
    public set isOpen(val: boolean) {
        this.setState({ isOpen: val })
    }

    private menuOpenClose = () => {
        let open: boolean = this.state.isOpen
        this.setState({ isOpen: !open })
    }
    private renderOneMenuItem = (menuData: MenuModel, index:number): JSX.Element => {
        let key:string=`Menu_key_${index}`
        if (menuData.isSeperator !== true) {
            return (
                <div className="DIV_MenuItems" key={key}>
                    <button className="MENU_Button" onClick={menuData.onClicked}>
                        <img className="IMG_Icon"
                            srcSet={menuData.Icon}
                            width={30}
                            height={30}
                        />
                        <span className="MENU_Span">{menuData.Text}</span>
                    </button>
                </div>

            );
        }
        else
        {
            return (<div className="DIV_Spacer" key={key} />)
        }
    }
    private renderMenuItems = (): JSX.Element[] => {
        let menuList: JSX.Element[] = []
        let index:number = 0;
        for (let item of this.props.Items) {
            menuList.unshift(this.renderOneMenuItem(item, index++))
        }
        return (menuList)
    }
    public render() {

        let name: string = this.state.isOpen ? "MENU_LayoutRootOpen" : "MENU_LayoutRootClosed"
        return (
            <div className={name}>
                <div className="DIV_OpenButtonSpace">
                    <button className="MENU_ButtonNoText" onClick={this.menuOpenClose}>
                        <img className="IMG_IconBurger"
                            srcSet={svgFiles.HamburgerMenu}
                            width={30}
                            height={30}
                        />
                    </button>
                </div>
                <div className="MENU_ItemsDiv">
                    {this.renderMenuItems()}
                </div>
            </div>
        );
    }
}
export default BurgerMenu;
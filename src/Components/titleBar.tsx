import React from "react";
import Menu, { MenuItem, SubMenu, Divider } from "rc-menu";
import "./titleBar.scss";

export interface ITitleBarProps extends React.Props<TitleBar> {
    icon?: string | JSX.Element;
    title?: string;
}

export interface ITitleBarState {
    isElectron: boolean;
    maximized: boolean;
    minimized: boolean;
    menu: any;
    fullScreen: boolean;
}

export class TitleBar extends React.Component<ITitleBarProps, ITitleBarState> {
    public state: ITitleBarState = {
        isElectron: false,
        maximized: false,
        minimized: false,
        menu: undefined,
        fullScreen: false
    };

    private menu: Menu = React.createRef();
    private remote: Electron.Remote;
    private currentWindow: Electron.BrowserWindow;

    public componentDidMount() {
        const isElectron: boolean = !!window["require"];

        if (isElectron) {
            this.remote = (window as any).require("electron").remote as Electron.Remote;
            this.currentWindow = this.remote.getCurrentWindow();

            this.setState({
                isElectron: true,
                minimized: this.currentWindow.isMinimized(),
                maximized: this.currentWindow.isMaximized(),
                menu: this.remote.Menu.getApplicationMenu(),
            });
            const ipcRenderer: Electron.IpcRenderer = (window as any).require("electron").ipcRenderer as Electron.IpcRenderer;
            if (ipcRenderer !== null) {
                ipcRenderer.on("window-position-changed", this.onWindowsPosChanged);
            }

        }

    }

    private onWindowsPosChanged = (event: any, message: string): void => {
        console.log(`onWindowsPosChanged: ${message}`)
        if (this.state.fullScreen && message === "maximized") {
            // when you are maximized and go into full screen, you get another maximized event.
            return;
        }
        this.setState({ maximized: message === "maximized", minimized: message === "minimized", fullScreen: message === "enter-full-screen" })
    }

    public componentDidUpdate(prevProps: Readonly<ITitleBarProps>) {
        if (this.props.title !== prevProps.title) {
            this.syncTitle();
        }
    }

    private get onMacOrBrowser(): boolean {
        if (this.remote) {
            if (this.remote.process.platform === "darwin") {
                return true;
            }

            return false;
        }
        return true;
    }

    public render(): JSX.Element | null {
        if (this.onMacOrBrowser) {
            return null;
        }

        //
        //  if the screen is maximized or we are running on a mac, make the titlebar have 0px height
        let tbHeight: string = "34px";
        if (this.state.fullScreen) {
            tbHeight = "0px";
        }
        return (
            <div className="title-bar bg-lighter-3" style={{ visibility: this.state.fullScreen ? "collapse" : "visible", height: tbHeight, minHeight: tbHeight }}>
                <div className="title-bar-icon">
                    {typeof (this.props.icon) === "string" && <i className={`${this.props.icon}`}></i>}
                    {typeof (this.props.icon) !== "string" && this.props.icon}
                </div>
                <div className="title-bar-menu">
                    {this.state.isElectron &&
                        <Menu ref={this.menu}
                            mode="horizontal"
                            selectable={false}
                            triggerSubMenuAction="click"
                            onClick={this.onMenuItemSelected}>
                            {this.renderMenu(this.state.menu)}
                        </Menu>
                    }
                </div>
                <div className="title-bar-main">{this.props.title || "Welcome"}</div>
                <div className="title-bar-controls">
                    {this.props.children}
                    {this.state.isElectron &&
                        <ul className="ml-3">
                            <li title="Minimize" className="btn-window-minimize" onClick={this.minimizeWindow}>
                                <i className="far fa-window-minimize" />
                            </li>
                            {!this.state.maximized &&
                                <li title="Maximize" className="btn-window-maximize" onClick={this.maximizeWindow}>
                                    <i className="far fa-window-maximize" />
                                </li>
                            }
                            {this.state.maximized &&
                                <li title="Restore" className="btn-window-restore" onClick={this.restoreWindow}>
                                    <i className="far fa-window-restore" />
                                </li>
                            }
                            <li title="Close" className="btn-window-close" onClick={this.closeWindow}>
                                <i className="fas fa-times" />
                            </li>
                        </ul>
                    }
                </div>
            </div>
        );
    }


    private renderMenu = (menu: Electron.Menu) => {
        if (!menu) {
            return null;
        }

        return menu.items.map(this.renderMenuItem);
    }

    private renderMenuItem = (menuItem: Electron.MenuItem, index: number) => {
        if (!menuItem.visible) {
            return null;
        }

        const itemType: string = menuItem["type"];

        switch (itemType) {
            case "submenu":
                return (
                    <SubMenu title={menuItem.label} key={menuItem.label} popupOffset={[0, 0]} triggerSubMenuAction={"hover"}>
                        {this.renderMenu(menuItem["submenu"])}
                    </SubMenu>
                );
            case "separator":
                return (<Divider key={index} />);
            case "checkbox":
                return (
                    <MenuItem key={menuItem.label}
                        disabled={!menuItem.enabled}
                        onClick={(e) => this.onMenuItemClick(e, menuItem)}>
                        <div className="menu-item-container">
                            {Boolean(menuItem.checked) &&
                                <div className="menu-item-checkbox">
                                    <i className="fas fa-check" />
                                </div>
                            }
                            <div className="menu-item-label">{menuItem.label}{menuItem["sublabel"]}</div>
                            <div className="menu-item-accelerator">{this.getAcceleratorString(menuItem)}</div>
                        </div>
                    </MenuItem>);
            case "normal":
                return (
                    <MenuItem key={menuItem.label}
                        disabled={!menuItem.enabled}
                        onClick={(e) => this.onMenuItemClick(e, menuItem)}>
                        <div className="menu-item-container">
                            <div className="menu-item-label">{menuItem.label}{menuItem["sublabel"]}</div>
                            <div className="menu-item-accelerator">{this.getAcceleratorString(menuItem)}</div>
                        </div>
                    </MenuItem>
                );
        }

        return null;
    }

    private onMenuItemClick(e: any, menuItem: Electron.MenuItem) {
        if (menuItem.click) {
            menuItem.click.call(menuItem, menuItem, this.currentWindow);
        }

        this.setState({ menu: { ...this.state.menu } as Electron.Menu });
    }

    private syncTitle = (): void => {
        if (this.state.isElectron) {
            this.currentWindow.setTitle(`${this.props.title} - VoTT`);
        }
    }

    private minimizeWindow = () => {
        this.currentWindow.minimize();
        this.setState({ minimized: true });
    }

    private maximizeWindow = () => {
        this.currentWindow.maximize();
        this.setState({ maximized: true, minimized: false });
    }

    private restoreWindow = () => {
        this.currentWindow.restore();
        this.setState({ maximized: false, minimized: false });
    }

    private closeWindow = () => {
        this.remote.getCurrentWindow().close();
    }

    private onMenuItemSelected = (key: string, item: React.Component) => {
        this.menu.current.store.setState({
            openKeys: [],
            selectedKeys: [],
        });
    }

    private getAcceleratorString(menuItem: Electron.MenuItem) {
        const accelerator = menuItem["accelerator"] || this.getAcceleratorFromRole(menuItem["role"]);
        if (accelerator) {
            return accelerator.replace("CmdOrCtrl", "Ctrl");
        }

        return null;
    }

    private getAcceleratorFromRole(role: string) {
        switch (role) {
            case "undo":
                return "CmdOrCtrl+Z";
            case "redo":
                return "CmdOrCtrl+Y";
            case "cut":
                return "CmdOrCtrl+X";
            case "copy":
                return "CmdOrCtrl+C";
            case "paste":
                return "CmdOrCtrl+V";
            case "selectall":
                return "CmdOrCtrl+A";
            case "minimize":
                return "CmdOrCtrl+M";
            case "close":
                return "CmdOrCtrl+W";
            case "quit":
                return "CmdOrCtrl+Q";
            case "reload":
                return "CmdOrCtrl+R";
            case "togglefullscreen":
                return "F11";
            case "toggledevtools":
                return "CmdOrCtrl+Shift+I";
            case "resetzoom":
                return "CmdOrCtrl+0";
            case "zoomin":
                return "CmdOrCtrl+Shift+=";
            case "zoomout":
                return "CmdOrCtrl+-";
        }
        return null;
    }
}

type IMenuClicked = () => void;

export class MenuModel {
    public Icon: any; // the "require(<svg>) file result"
    public Text: string;
    public onClicked: IMenuClicked;
    public isSeperator?: boolean;

}

export default MenuModel;
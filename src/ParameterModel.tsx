
type INotifyPropertyChanged = (parameter:ParameterModel, property: string) => void;


//
//  these need to JSON.stringify the same as https://github.com/joelong01/Bash-Wizard/blob/master/bashGeneratorSharedModels/ParameterItem.cs
class ParameterModel {

    
    private Default: string = "";
    private Description: string = "";
    private LongParameter: string = "";
    private RequiresInputString: boolean = false;
    private RequiredParameter: boolean = false;
    private ShortParameter: string = "";
    private VariableName: string = "";
    private ValueIfSet: string = "";
    private propertyChangedNotify: INotifyPropertyChanged[] = []
    //
    // not stringified
    private _selected: boolean;
    private _uniqueName: string;

    //
    //  this is an "opt in" replacer -- if you want something in the json you have to add it here
    public static jsonReplacer (name: string, value: any) {
        if (name === "Default" || name === "Description"|| name === "LongParameter"|| name === "RequiresInputString"|| name === "RequiredParameter"|| name === "ShortParameter"|| name === "VariableName"|| name === "ValueIfSet")
        {            
            return value;            
        }        
        return undefined;
    }

    public registerNotify(callback: INotifyPropertyChanged) {
      this.propertyChangedNotify.push(callback);
      console.log("ParameterModel.registryNotify")
    }
    public removeNotify(callback: INotifyPropertyChanged){
        const index:number = this.propertyChangedNotify.indexOf(callback)
        if (index === -1)
        {
            throw new Error("attempt to remove a callback that wasn't in the callback array")
        }
        this.propertyChangedNotify.splice(index, 1)
        console.log(`there are now  ${this.propertyChangedNotify.length} items to notify`)
    }
    public NotifyPropertyChanged(property: string): void {
        console.log(`Model changed: [${property}=${this[property]}]`)

        for (const notify of this.propertyChangedNotify) {            
            notify(this, property)
        }

    }
    get default(): string {
        return this.Default;
    }

    set default(value: string) {
        if (value !== this.Default) {

            this.Default = value;
            this.NotifyPropertyChanged("default")
        }
    }

    get uniqueName(): string {
        return this._uniqueName;
    }

    set uniqueName(value: string) {
        if (value !== this._uniqueName) {

            this._uniqueName = value;
            // uniqueName does not need to be propagated
            // this.NotifyPropertyChanged("uniqueName")
        }
    }

    get selected(): boolean {
        return this._selected;
    }

    set selected(value: boolean) {
        if (value !== this._selected) {

            this._selected = value;
            this.NotifyPropertyChanged("selected")
        }
    }

    public get description(): string {
        return this.Description;
    }
    public set description(value: string) {
        if (value !== this.Description) {
            this.Description = value;
            this.NotifyPropertyChanged("description")
        }
    }
    public get longParameter(): string {
        return this.LongParameter;
    }
    public set longParameter(value: string) {
        if (value !== this.LongParameter) {
            this.LongParameter = value;
            this.NotifyPropertyChanged("longParameter")
        }
    }

    public get shortParameter(): string {
        return this.ShortParameter;
    }
    public set shortParameter(value: string) {
        if (value !== this.ShortParameter) {
            this.ShortParameter = value;
            this.NotifyPropertyChanged("shortParameter")
        }
    }

    public get requiresInputString(): boolean {
        return this.RequiresInputString;
    }
    public set requiresInputString(value: boolean) {
        if (value !== this.RequiresInputString) {
            this.RequiresInputString = value;
            this.NotifyPropertyChanged("requiresInputString")
        }
    }

    public get requiredParameter(): boolean {
        return this.RequiredParameter;
    }
    public set requiredParameter(value: boolean) {
        if (value !== this.RequiredParameter) {
            this.RequiredParameter = value;
            this.NotifyPropertyChanged("requiredParameter")
        }
    }

    get variableName(): string {
        return this.VariableName;
    }

    set variableName(value: string) {
        if (value !== this.VariableName) {
            this.VariableName = value;
            this.NotifyPropertyChanged("variableName")
        }
    }
    get valueIfSet(): string {
        return this.ValueIfSet;
    }

    set valueIfSet(value: string) {
        if (value !== this.ValueIfSet) {
            this.ValueIfSet = value;
            this.NotifyPropertyChanged("valueIfSet")
        }
    }

}

export default ParameterModel;
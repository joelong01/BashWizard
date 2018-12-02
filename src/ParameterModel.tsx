


class ParameterModel {

    // public ChangeNotify: (propName:string, oldVal: any, newVal: any) => void;
    private _defaultValue: string = "";
    private _descriptionValue: string = "";
    private _longName: string = "";
    private _requiresInputString: boolean = false;
    private _requiredParameter: boolean = false;
    private _shortName: string = "";
    private _variableName: string = "";
    private _valueIfSet: string = "";

    get defaultValue(): string {
        return this._defaultValue;
    }

    set defaultValue(val: string) {
        if (val !== this._defaultValue) {
          //  const oldVal:string = this._defaultValue;
            this._defaultValue = val;
           // if (this.ChangeNotify !== null) this.ChangeNotify("defaultValue", oldVal, val);
        }
    }

    public get descriptionValue(): string {
        return this._descriptionValue;
    }
    public set descriptionValue(value: string) {
        if (value !== this._descriptionValue){
           // const oldVal:string = this._defaultValue;
            this._descriptionValue = value;
          //  if (this.ChangeNotify !== null)this.ChangeNotify("descriptionValue", oldVal, value);
        }
    }
    public get longName(): string {
        return this._longName;
    }
    public set longName(value: string) {
        if (value !== this._longName){
          //  const oldVal:string = this._longName;
            this._longName = value;
          //  if (this.ChangeNotify !== null) this.ChangeNotify("longName", oldVal, value);
        }
    }

    public get shortName(): string {
        return this._shortName;
    }
    public set shortName(value: string) {
        if (value !== this._shortName){
          //  const oldVal:string = this._shortName;
            this._shortName = value;
         //   if (this.ChangeNotify !== null) this.ChangeNotify("shortName", oldVal, value);
        }
    }

    public get requiresInputString(): boolean {
        return this._requiresInputString;
    }
    public set requiresInputString(value: boolean) {
        if (value !== this._requiresInputString){
         //   const oldVal:boolean = this._requiresInputString;
            this._requiresInputString = value;
           // if (this.ChangeNotify !== null) this.ChangeNotify("requiresInputString", oldVal, value);
        }
    }

    public get requiredParameter(): boolean {
        return this._requiredParameter;
    }
    public set requiredParameter(value: boolean) {
        if (value !== this._requiredParameter){
          //  const oldVal:boolean = this._requiredParameter;
            this._requiredParameter = value;
           // if (this.ChangeNotify !== null) this.ChangeNotify("requiredParameter", oldVal, value);
        }
    }

    get variableName():string {
        return this._variableName;
    }

    set variableName(val: string) {
        if (val !== this._variableName) {
          //  const oldVal:string = this._variableName;
            this._variableName = val;
         //   if (this.ChangeNotify !== null) this.ChangeNotify("variableName", oldVal, val);
        }
    }
    get valueIfSet():string {
        return this._valueIfSet;
    }

    set valueIfSet(val: string) {
        if (val !== this._valueIfSet) {
         //   const oldVal:string = this._valueIfSet;
            this._valueIfSet = val;
         //   if (this.ChangeNotify !== null) this.ChangeNotify("valueIfSet", oldVal, val);
        }
    }
   
}

export default ParameterModel;
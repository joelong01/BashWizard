

//
//  these need to JSON.stringify the same as https://github.com/joelong01/Bash-Wizard/blob/master/bashGeneratorSharedModels/ParameterItem.cs
class ParameterModel {

    // public ChangeNotify: (propName:string, oldVal: any, newVal: any) => void;
    private Default: string = "";
    private Description: string = "";
    private LongParameter: string = "";
    private RequiresInputString: boolean = false;
    private RequiredParameter: boolean = false;
    private ShortParameter: string = "";
    private VariableName: string = "";
    private ValueIfSet: string = "";

    get defaultValue(): string {
        return this.Default;
    }

    set defaultValue(val: string) {
        if (val !== this.Default) {
          //  const oldVal:string = this._defaultValue;
            this.Default = val;
           // if (this.ChangeNotify !== null) this.ChangeNotify("defaultValue", oldVal, val);
        }
    }

    public get descriptionValue(): string {
        return this.Description;
    }
    public set descriptionValue(value: string) {
        if (value !== this.Description){
           // const oldVal:string = this._defaultValue;
            this.Description = value;
          //  if (this.ChangeNotify !== null)this.ChangeNotify("descriptionValue", oldVal, value);
        }
    }
    public get longParameter(): string {
        return this.LongParameter;
    }
    public set longParameter(value: string) {
        if (value !== this.LongParameter){
          //  const oldVal:string = this._longName;
            this.LongParameter = value;
          //  if (this.ChangeNotify !== null) this.ChangeNotify("longName", oldVal, value);
        }
    }

    public get shortParameter(): string {
        return this.ShortParameter;
    }
    public set shortParameter(value: string) {
        if (value !== this.ShortParameter){
          //  const oldVal:string = this._shortName;
            this.ShortParameter = value;
         //   if (this.ChangeNotify !== null) this.ChangeNotify("shortName", oldVal, value);
        }
    }

    public get requiresInputString(): boolean {
        return this.RequiresInputString;
    }
    public set requiresInputString(value: boolean) {
        if (value !== this.RequiresInputString){
         //   const oldVal:boolean = this._requiresInputString;
            this.RequiresInputString = value;
           // if (this.ChangeNotify !== null) this.ChangeNotify("requiresInputString", oldVal, value);
        }
    }

    public get requiredParameter(): boolean {
        return this.RequiredParameter;
    }
    public set requiredParameter(value: boolean) {
        if (value !== this.RequiredParameter){
          //  const oldVal:boolean = this._requiredParameter;
            this.RequiredParameter = value;
           // if (this.ChangeNotify !== null) this.ChangeNotify("requiredParameter", oldVal, value);
        }
    }

    get variableName():string {
        return this.VariableName;
    }

    set variableName(val: string) {
        if (val !== this.VariableName) {
          //  const oldVal:string = this._variableName;
            this.VariableName = val;
         //   if (this.ChangeNotify !== null) this.ChangeNotify("variableName", oldVal, val);
        }
    }
    get valueIfSet():string {
        return this.ValueIfSet;
    }

    set valueIfSet(val: string) {
        if (val !== this.ValueIfSet) {
         //   const oldVal:string = this._valueIfSet;
            this.ValueIfSet = val;
         //   if (this.ChangeNotify !== null) this.ChangeNotify("valueIfSet", oldVal, val);
        }
    }
   
}

export default ParameterModel;
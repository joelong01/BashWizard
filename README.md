# Bash Wizard
JavaScript.  TypeScript. Node.  C#.  Visual Basic. PowerShell.

All Great.

But sometimes you just need a simple bash script. And when you do, it can be difficult to bootstrap a robust and well written script that meets some minimum expectations level.

This is where Bash Wizard comes in handy. Bash Wizard is a Windows Application that generates Bash scripts based upon "parameters" that are entered into the tool. The features supported by Bash Wizard are:

1. Add, Modify, and Delete Parameters
2. For each parameter a default can be specified and the variable is declared in the script
2. creates EchoInfo, EchoWarning, EchoError functions to enable colorizing output
3. Creates an Usage() function that tells the user how to use the script
4. Creates an EchoInput() function that will be called by the script to show the user what parameters were passed in
5. Parses the command line and sets the appropriate variable based on what was passed in
7. Verifies that all required parameters have been passed in and errors out if not.
8. Has built in support to load input from a JSON input file.


   => the tool will also generate the JSON file for you

9. Has built in support to create a tee so that all output is captured in a log file.
10. Generates the JSON file for the Bash Debug Extension in Visual Studio Code

# Dependencies

Bash Wizard has two dependencies

1. JQ is used to parse JSON.  see https://stedolan.github.io/jq/download/.
2. GETOPT is used to parse the command line.  Bash Wizard needs the GNU version and the Mac version is not compatible. There is built in support to automatically install the correct GETOPT using brew.   On FreeBSD, install misc/getopt.



# Using Bash Wizard

There are 3 main scenarios for using Bash Wizard

1. Starting Fresh
2. Opening an existing Bash File
3. Starting with JSON

## Starting Fresh

The easiest way to use Bash Wizard is to simply click on

![Add Parameter](readme/add%20param.png).  If you just click on the button you'll get a "Custom" parameter like this one:

![Blank Parameter](readme/blank%20parameter.png)



The corner button on the parameter item will collapse or expand the parameter so you can show more parameters on the screen.  The name following the button ("Custom") in the above example is the type of Parameter - "Custom" being one you have entered and anything else being a special "Built In" Parameter.

Each Parameter has the following fields

- Long Name: the name of the parameter that is passed to the script with "--". This typically means something to the human using the script, like "long-parameter".  Do not put the "--" in this field.
- Short Name: the name of the parameter that is passed to the script with "-". This is typically one letter, like "l"
- Variable Name: the name the script will use as its variable.  As such it must follow the Bash variable naming convention.
- Default: the value the variable is set to when it is declared.  NOTE:  if a default is set, it cannot be a Required Parameter (because it's value is never empty)
- Description: used in the Usage() function to tell the user what this parameter is for
- Value If Set: used when parsing the input. If the value is passed in from the command line, this should be set to $2.
- Requires Input String:  if Checked, then Value If Set must be $2. If not checked, then Value if set **cannot** be $2.  Bash Wizard enforces this rule.
- Required Parameter: if Checked, the generated script will call the Usage() function and exit if the parameter's value is empty (e.g if [[ -z $myVar ]]

Bash Wizard has some functionality for catching errors when entering parameters.

1.  Long Names and Short Names can never overlap.  So if you enter a parameter with the same Long Name or Short Name as another parameter you'll get the following in the "Messages" tab:

![Same Name](readme/same%20names.PNG)

You can click on the error to select the parameter that has the problem.

2. You will get the second error if Variable Names are reused.  You must fix these Validation Errors before running your Bash Script, as the script will not run correctly otherwise.
3. all parameter items are trimmed of whitespace before being used

Another typical pattern is for optional flag parameters.  The recommended way to do this is to set the default to false (which makes it non Required) and then set the "Value if Set" to true.
See the "Create, Verify, Delete Pattern" in the Optional Features section below for an example of how to do this, both in the tool and in the Bash Script.

If you click on the down arrow, you'll get a menu of options for adding built in parameters:
    ![Blank Parameter](readme/add-built-in-param.png)

## Opening an Existing Bash File

Bash Wizard can open a Bash file and parse it looking for the Bash Wizard code to generate the Parameter List. Opening a script that started "Starting Fresh" scenario is the normal case.
It is very important

  1. do not manually modify Bash Wizard code.  Not only might it break parsing, but it will be replaced every time Bash Wizard runs. And
  2. **All** code that you write should be between these two comments:

        ```bash
        # --- BEGIN USER CODE ---

        # --- END USER CODE ---
        ```

As long as you stick to these rules, you will be able to load, modify, and save your Bash scripts.

If there is an error parsing the Bash Script, there will be an entry on the message list.  For example, if you manually declare a variable in the Bash Wizard section, you'll get an error similar to:

![Parse Error](parse%20error.png)

If you have an error message from parsing the Bash Script, fix it and then hit Refresh again to make the error go away.

You can also copy and paste a script into the Bash Script text box and then hit this button

![Refresh](refresh.png)

which will parse the script and then regenerate it back into the Bash Script text box.  This is useful when upgrading the Bash Wizard version.


## Starting with JSON

If you select the JSON tab

![Tabs](Tabs.png)

you can copy or paste in the JSON format of the parameters.  If you edit the JSON in Bash Wizard, you can click on the Refresh button while the JSON tab is visible and Bash Wizard will

1. Parse the Bash Script in case you have changed it by typing in the Bash Script text box
2. Parse the JSON, creating the Parameters, File Name, and Description
2. Generate the Bash Scripts

This feature is useful if you'd rather use a text editor to create your Parameters and the UI or if you have a default set of parameters that you typically use, you can save the JSON for them
(File Open, Save, Save As are all context sensitive) and use it as a starting position.

## Optional Features
 ![Optional Features](readme/optional%20features.png)

#### Add Logging Support
This will add the a parameter to your script (Long Name:  log-directory) and then generate a log file name based on your Script File Name and the passed in log directory.
Then it will surround your user code with a tee so that all echo lines are captured in the log file.

#### Accepts Input File
This will add a parameter to your script (Long Name: input-file) and generate code to parse a JSON file using jq to pull out the variable values. this option

![Input JSON](readme/input%20json.png)

will show this dialog

![Input JSON Dialog](readme/input%20json%20dialog.png)

Copy this JSON and save into a file that you pass in as the --input-file parameter.  You can then edit the JSON to specify the values you want to pass in to the script.
**Note**: when you do this, the input parameters are parsed twice:
first to find the --input-file parameter and second to override anything in the input file with whatever is passed in on the command line.  This way you can set the values to whatever you normally use inside the file, but override as needed
on the command line.

#### Create, Validate, Delete Pattern

This will add three optional parameters to your script (long names: create, validate, delete) and then the following code to the user code section of the script:

```bash
   # --- BEGIN USER CODE ---
    function onVerify() {

    }
    function onDelete() {

    }
    function onCreate() {

    }

    #
    #   the order matters - delete, then create, then verify
    #

    if [[ $delete == "true" ]]; then
        onDelete
    fi

    if [[ $create == "true" ]]; then
        onCreate
    fi

    if [[ $verify == "true" ]]; then
        onVerify
    fi
    # --- END USER CODE ---
```

This is a useful pattern to use when your script is creating a resource somewhere. For example, if your script is creating an Azure Resource Group, then you might have code that looks something like:

```bash
    # --- BEGIN USER CODE ---
	function onVerify() {
        exists=$(az group exists --name "$resourceGroup" | jq .)
        if [[ "$exists" == false ]]; then
            echo "$resourceGroup does not exist!"
        else
            echo "$resourceGroup does exist!"
            echo "PASS"
            exit
        fi

    }
    function onDelete() {
        echo "deleting resource group $resourceGroup"
        az group delete -n "$resourceGroup" --yes

    }
    function onCreate() {
        exists=$(az group exists --name "$resourceGroup" | jq .)
        if [[ "$exists" == false ]]; then
            echo "group does not exist, creating $resourceGroup in $dataCenterLocation"
            rgInfo=$(az group create --location "$dataCenterLocation" --name "$resourceGroup")
            echo "finished creating resource group"
            echo "id: $rgInfo | jq .id"
        else
            echo "resource group already exists.  no action taken."
        fi

    }

    #
    #   the order matters - delete, then create, then verify
    #

    if [[ $delete == "true" ]]; then
        onDelete
    fi

    if [[ $create == "true" ]]; then
        onCreate
    fi

    if [[ $verify == "true" ]]; then
        onVerify
    fi
    # --- END USER CODE ---
```
Doing it this way allows you got call a "createAzureResourceGroup.sh" script with something like:

```bash
	./createAzureResourceGroup.sh -cvd
```
(other parameters left off for brevity) which will first delete the Resource Group if it exists, then create it, then verify it.  You can also call it with just
```bash
	./createAzureResourceGroup.sh -cv
```
which will create it and then verify it exists.  Or simply "test mode" which would be
```bash
	./createAzureResourceGroup.sh -v
```

which only calls the verify function.

#### Bash Debugging

Visual Studio Code has an extension for debugging Bash Scripts: https://marketplace.visualstudio.com/items?itemName=rogalmic.bash-debug

This has proven to be incredibly useful and it is highly recommended.  To use the extension in VS Code, you have to create a debug configuration.  I found the easiest way to do this is to have a configuration per file where I pass the input.
To make this easier, Bash Wizard has this feature:

![Debug Config](readme/debug%20config.png)

when you click on this, you'll get a dialog where you can copy the JSON and paste it into your debug config in VS Code.  It will look something like:

```json
{
    "type": "bashdb",
    "request": "launch",
    "name": "Debug ",
    "cwd": "${workspaceFolder}",
    "program": "${workspaceFolder}/BashScripts/",
    "args": [
        "--log-directory",
        "./",
        "--input-file",
        "",
        "--create",
        "false",
        "--verify",
        "false",
        "--delete",
        "false",
    ]
}

```

Edit the JSON to remove parameters you don't care about.  If you support input-file, then that is typically the only one you need to set in the debug config.


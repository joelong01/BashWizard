#!/bin/bash
#---------- see https://github.com/joelong01/Bash-Wizard----------------
# bashWizard version 0.909
# this will make the error text stand out in red - if you are looking at these errors/warnings in the log file
# you can use cat <logFile> to see the text in color.
function echoError() {
    RED=$(tput setaf 1)
    NORMAL=$(tput sgr0)
    echo "${RED}${1}${NORMAL}"
}
function echoWarning() {
    YELLOW=$(tput setaf 3)
    NORMAL=$(tput sgr0)
    echo "${YELLOW}${1}${NORMAL}"
}
function echoInfo {
    GREEN=$(tput setaf 2)
    NORMAL=$(tput sgr0)
    echo "${GREEN}${1}${NORMAL}"
}
# make sure this version of *nix supports the right getopt
! getopt --test 2>/dev/null
if [[ ${PIPESTATUS[0]} -ne 4 ]]; then
    echoError "'getopt --test' failed in this environment. please install getopt."
    read -r -p "install getopt using brew? [y,n]" response
    if [[ $response == 'y' ]] || [[ $response == 'Y' ]]; then
        ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" < /dev/null 2> /dev/null
        brew install gnu-getopt
        #shellcheck disable=SC2016
        echo 'export PATH="/usr/local/opt/gnu-getopt/bin:$PATH"' >> ~/.bash_profile
        echoWarning "you'll need to restart the shell instance to load the new path"
    fi
   exit 1
fi
# we have a dependency on jq
    if [[ ! -x "$(command -v jq)" ]]; then
        echoError "'jq is needed to run this script. Please install jq - see https://stedolan.github.io/jq/download/"
        exit 1
    fi
function usage() {
    echoWarning "Parameters can be passed in the command line or in the input file. The command line overrides the setting in the input file."
    echo "creates an Azure Key Vault"
    echo ""
    echo "Usage: $0  -u|--sku -e|--enabled-for-disk-encryption -p|--enable-for-deployment -k|--keyvault-name -l|--datacenter-location -r|--resource-group -v|--verify-script -c|--create -d|--delete -i|--input-file -o|--log-directory " 1>&2
    echo ""
    echo " -u | --sku                             Optional     SKU details. ccepted values: premium, standard"
    echo " -e | --enabled-for-disk-encryption     Optional     Allow Disk Encryption to retrieve secrets from the vault and unwrap keys."
    echo " -p | --enable-for-deployment           Optional     Allow Virtual Machines to retrieve certificates stored as secrets from the vault."
    echo " -k | --keyvault-name                   Optional     the name of the keyvault"
    echo " -l | --datacenter-location             Required     the location of the VMs"
    echo " -r | --resource-group                  Required     Azure Resource Group"
    echo " -v | --verify-script                   Optional     "
    echo " -c | --create                          Optional     create the key vault. idempotent."
    echo " -d | --delete                          Optional     delete key Vault if it already exists"
    echo " -i | --input-file                      Optional     filename that contains the JSON values to drive the script. command line overrides file"
    echo " -o | --log-directory                   Optional     directory for the log file. the log file name will be based on the script name"
    echo ""
    exit 1
}
function echoInput() {
    echo "createKeyVault.sh:"
    echo -n "    sku............................ "
    echoInfo "$sku"
    echo -n "    enabled-for-disk-encryption.... "
    echoInfo "$enableForDiskEncryption"
    echo -n "    enable-for-deployment.......... "
    echoInfo "$enableForDeployment"
    echo -n "    keyvault-name.................. "
    echoInfo "$keyvaultName"
    echo -n "    datacenter-location............ "
    echoInfo "$datacenterLocation"
    echo -n "    resource-group................. "
    echoInfo "$resourceGroup"
    echo -n "    verify-script.................. "
    echoInfo "$verifyScript"
    echo -n "    create......................... "
    echoInfo "$createKeyVault"
    echo -n "    delete......................... "
    echoInfo "$deleteKeyVault"
    echo -n "    input-file..................... "
    echoInfo "$inputFile"
    echo -n "    log-directory.................. "
    echoInfo "$logDirectory"

}

function parseInput() {
    
    local OPTIONS=u:e:p:k:l:r:vcdi:o:
    local LONGOPTS=sku:,enabled-for-disk-encryption:,enable-for-deployment:,keyvault-name:,datacenter-location:,resource-group:,verify-script,create,delete,input-file:,log-directory:

    # -use ! and PIPESTATUS to get exit code with errexit set
    # -temporarily store output to be able to check for errors
    # -activate quoting/enhanced mode (e.g. by writing out "--options")
    # -pass arguments only via -- "$@" to separate them correctly
    ! PARSED=$(getopt --options=$OPTIONS --longoptions=$LONGOPTS --name "$0" -- "$@")
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        # e.g. return value is 1
        # then getopt has complained about wrong arguments to stdout
        usage
        exit 2
    fi
    # read getopt's output this way to handle the quoting right:
    eval set -- "$PARSED"
    while true; do
        case "$1" in
        -u | --sku)
            sku=$2
            shift 2
            ;;
        -e | --enabled-for-disk-encryption)
            enableForDiskEncryption=$2
            shift 2
            ;;
        -p | --enable-for-deployment)
            enableForDeployment=$2
            shift 2
            ;;
        -k | --keyvault-name)
            keyvaultName=$2
            shift 2
            ;;
        -l | --datacenter-location)
            datacenterLocation=$2
            shift 2
            ;;
        -r | --resource-group)
            resourceGroup=$2
            shift 2
            ;;
        -v | --verify-script)
            verifyScript=true
            shift 1
            ;;
        -c | --create)
            createKeyVault=true
            shift 1
            ;;
        -d | --delete)
            deleteKeyVault=true
            shift 1
            ;;
        -i | --input-file)
            inputFile=$2
            shift 2
            ;;
        -o | --log-directory)
            logDirectory=$2
            shift 2
            ;;
        --)
            shift
            break
            ;;
        *)
            echoError "Invalid option $1 $2"
            exit 3
            ;;
        esac
    done
}
# input variables 
declare sku="standard"
declare enableForDiskEncryption=true
declare enableForDeployment=true
declare keyvaultName=""
declare datacenterLocation=
declare resourceGroup=
declare verifyScript=false
declare createKeyVault=false
declare deleteKeyVault=false
declare inputFile="../Data/cseAzureAutomationConfig.json"
declare logDirectory=./logs/

parseInput "$@"

# if command line tells us to parse an input file
if [ "${inputFile}" != "" ]; then
    # load parameters from the file
    configSection=$(jq . <"${inputFile}" | jq '."createKeyVault.sh"')
    if [[ -z $configSection ]]; then
        echoError "$inputFile or createKeyVault.sh section not found "
        exit 3
    fi
    sku=$(echo "${configSection}" | jq '.["sku"]' --raw-output)
    enableForDiskEncryption=$(echo "${configSection}" | jq '.["enabled-for-disk-encryption"]' --raw-output)
    enableForDeployment=$(echo "${configSection}" | jq '.["enable-for-deployment"]' --raw-output)
    keyvaultName=$(echo "${configSection}" | jq '.["keyvault-name"]' --raw-output)
    datacenterLocation=$(echo "${configSection}" | jq '.["datacenter-location"]' --raw-output)
    resourceGroup=$(echo "${configSection}" | jq '.["resource-group"]' --raw-output)
    verifyScript=$(echo "${configSection}" | jq '.["verify-script"]' --raw-output)
    createKeyVault=$(echo "${configSection}" | jq '.["create"]' --raw-output)
    deleteKeyVault=$(echo "${configSection}" | jq '.["delete"]' --raw-output)
    logDirectory=$(echo "${configSection}" | jq '.["log-directory"]' --raw-output)

    # we need to parse the again to see if there are any overrides to what is in the config file
    parseInput "$@"
fi
#verify required parameters are set
if [ -z "${datacenterLocation}" ] || [ -z "${resourceGroup}" ]; then
    echo ""
    echoError "Required parameter missing! "
    echoInput #make it easy to see what is missing
    echo ""
    usage
    exit 2
fi
#logging support
declare LOG_FILE="${logDirectory}createKeyVault.sh.log"
{
    mkdir -p "${logDirectory}" 
    rm -f "${LOG_FILE}"
} 2>>/dev/null
#creating a tee so that we capture all the output to the log file
{
    time=$(date +"%m/%d/%y @ %r")
    echo "started: $time"

    # --- BEGIN USER CODE ---
    function verifyKeyVault() {
        kvInfo=$(az keyvault list -g "$resourceGroup" --output json --query "[].{Name:name, ID:id}[?Name=='${keyvaultName}']")
        id=$(echo "$kvInfo" | jq '.[].ID' --raw-output)
        if [[ "$id" == "" ]]; then
            echo "false"
        else
            echo "true"
        fi
    }
    if [ "$verifyScript" == "true" ]; then
        echo "verifying that a keyvault named ${keyvaultName} is in $resourceGroup "
        exists=$(verifyKeyVault)
        if [ "$exists" == true ]; then
            echo "PASS"
        else
            echo "FAIL"
        fi
        #comment
        exit
    fi
    if [ "$deleteKeyVault" == true ]; then #NOTE:  this will delete *and* purge!
        exists=$(verifyKeyVault)
        if [ "$exists" == true ]; then # don't delete if doesn't exist
            echo "deleting $keyvaultName..."
            az keyvault delete --name "$keyvaultName" --resource-group "$resourceGroup"
            az keyvault purge --name "$keyvaultName" --location "$datacenterLocation"
        else
            echo "$keyvaultName does not exist -- not deleting it."
        fi
    fi
    if [ "$createKeyVault" == true ]; then
        echo "registering the Key Vault Resource Provider"
        az provider register -n Microsoft.KeyVault
        echo "creating $keyvaultName..."
        kvInfo=$(az keyvault create --name "$keyvaultName" --resource-group "$resourceGroup" --location "$datacenterLocation" --enable-soft-delete true --enabled-for-deployment "$enableForDeployment" --enabled-for-disk-encryption "$enableForDiskEncryption" --sku "$sku")
        echo "Key Vault ID: $(echo "$kvInfo" | jq .id)"
        echo "Key Vault name: $(echo "$kvInfo" | jq .name)"
        echo ""
    fi
    # test 132455asdfasdef12
    # --- END USER CODE ---

    time=$(date +"%m/%d/%y @ %r")
    echo "ended: $time"
} | tee -a "${LOG_FILE}"

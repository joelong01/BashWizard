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
    echo ""
    echo ""
    echo "Usage: $0  -v|--verbose -l|--log-directory -i|--input-file -c|--create -v|--verify -d|--delete " 1>&2
    echo ""
    echo " -v | --verbose           Optional     echos the parsed input variables and creates a $verbose variable to be used in user code"
    echo " -l | --log-directory     Optional     Directory for the log file. The log file name will be based on the script name."
    echo " -i | --input-file        Optional     the name of the input file. pay attention to $PWD when setting this"
    echo " -c | --create            Optional     calls the onCreate function in the script"
    echo " -v | --verify            Optional     calls the onVerify function in the script"
    echo " -d | --delete            Optional     calls the onDelete function in the script"
    echo ""
    exit 1
}
function echoInput() {
    echo ":"
    echo -n "    verbose.......... "
    echoInfo "$verbose"
    echo -n "    log-directory.... "
    echoInfo "$logDirectory"
    echo -n "    input-file....... "
    echoInfo "$inputFile"
    echo -n "    create........... "
    echoInfo "$create"
    echo -n "    verify........... "
    echoInfo "$verify"
    echo -n "    delete........... "
    echoInfo "$delete"

}

function parseInput() {
    
    local OPTIONS=vl:i:cvd
    local LONGOPTS=verbose,log-directory:,input-file:,create,verify,delete

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
        -v | --verbose)
            verbose=true
            shift 1
            ;;
        -l | --log-directory)
            logDirectory=$2
            shift 2
            ;;
        -i | --input-file)
            inputFile=$2
            shift 2
            ;;
        -c | --create)
            create=true
            shift 1
            ;;
        -v | --verify)
            verify=true
            shift 1
            ;;
        -d | --delete)
            delete=true
            shift 1
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
declare verbose=
declare logDirectory="./"
declare inputFile=
declare create=false
declare verify=false
declare delete=false

parseInput "$@"

# if command line tells us to parse an input file
if [ "${inputFile}" != "" ]; then
    # load parameters from the file
    configSection=$(jq . <"${inputFile}" | jq '.""')
    if [[ -z $configSection ]]; then
        echoError "$inputFile or  section not found "
        exit 3
    fi
    verbose=$(echo "${configSection}" | jq '.["verbose"]' --raw-output)
    logDirectory=$(echo "${configSection}" | jq '.["log-directory"]' --raw-output)
    create=$(echo "${configSection}" | jq '.["create"]' --raw-output)
    verify=$(echo "${configSection}" | jq '.["verify"]' --raw-output)
    delete=$(echo "${configSection}" | jq '.["delete"]' --raw-output)

    # we need to parse the again to see if there are any overrides to what is in the config file
    parseInput "$@"
fi

#logging support
declare LOG_FILE="${logDirectory}.log"
{
    mkdir -p "${logDirectory}" 
    rm -f "${LOG_FILE}"
} 2>>/dev/null
#creating a tee so that we capture all the output to the log file
{
    time=$(date +"%m/%d/%y @ %r")
    echo "started: $time"
   if [[ $"verbose" == true ]];then
        echoInput
    fi

    # --- BEGIN USER CODE ---
    function onVerify() {
        echo "onVerify"
    }
    function onDelete() {
        echo "onDelete"
    }
    function onCreate() {
        echo "onCreate"
    }

    

    #
    #  this order makes it so that passing in /cvd will result in a verified resource being created
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
    thisigs a change of
    # --- END USER CODE ---

    time=$(date +"%m/%d/%y @ %r")
    echo "ended: $time"
} | tee -a "${LOG_FILE}"

#!/bin/bash
#---------- see https://github.com/joelong01/Bash-Wizard----------------
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
	echoError "'getopt --test' failed in this environment.  please install getopt.  If on a mac see http://macappstore.org/gnu-getopt/"
	exit 1
fi
# we have a dependency on jq
if [[ ! -x "$(command -v jq)" ]]; then
	echoError "'jq is needed to run this script.  please install jq - see https://stedolan.github.io/jq/download/"
	exit 1
fi
usage() {

    __USAGE_INPUT_STATEMENT__

__USAGE_LINE__ 1>&2
__USAGE__  
    echo ""
    exit 1
}
echoInput() {     
    echo __ECHO__
}

function parseInput() {
    
    local OPTIONS=__SHORT_OPTIONS__
    local LONGOPTS=__LONG_OPTIONS__

    # -use ! and PIPESTATUS to get exit code with errexit set
    # -temporarily store output to be able to check for errors
    # -activate quoting/enhanced mode (e.g. by writing out "--options")
    # -pass arguments only via   -- "$@"   to separate them correctly
    ! PARSED=$(getopt --options=$OPTIONS --longoptions=$LONGOPTS --name "$0" -- "$@")
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        # e.g. return value is 1
        # then getopt has complained about wrong arguments to stdout
        echoError "you might be running bash on a Mac.  if so, run 'brew install gnu-getopt' to make the command line processing work."
        usage
        exit 2
    fi
    # read getopt’s output this way to handle the quoting right:
    eval set -- "$PARSED"
    # now enjoy the options in order and nicely split until we see --
    while true; do
        case "$1" in
__INPUT_CASE__
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
__INPUT_DECLARATION__
# now parse input to see if any of the parameters have been overridden
parseInput "$@"
__PARSE_INPUT_FILE
__REQUIRED_PARAMETERS__
__LOGGING_SUPPORT_
__BEGIN_TEE__
__ECHO_INPUT__
# --- END OF BASH WIZARD GENERATED CODE ---

# if command line tells us to parse an input file
if [ "${inputFile}" != "" ]; then
	# load parameters from the file
	configSection=$(jq . <"${inputFile}" | jq '."__SCRIPT_NAME__"')
	if [[ -z $configSection ]]; then
		echoError "$inputFile or __SCRIPT_NAME__ section not found "
		exit 3
	fi
__FILE_TO_SETTINGS__
	# we need to parse the again to see if there are any overrides to what is in the config file
	parseInput "$@"
fi

#verify required parameters are set
if __REQUIRED_FILES_IF__; then
	echo ""
	echoError "Required parameter missing! "
	echoInput #make it easy to see what is missing
	echo ""
	usage
	exit 2
fi

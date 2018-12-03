#logging support
declare LOG_FILE="${logDirectory}__LOG_FILE_NAME__"
{
    mkdir "${logDirectory}" 
    rm -f "${LOG_FILE}"  
} 2>>/dev/null

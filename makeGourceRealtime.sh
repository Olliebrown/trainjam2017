function join_by {
    local IFS="$1";
    shift;
    echo "$*";
}

# Generate a fresh log
rm -f gourcelog.txt gourcelog2.txt
gource --start-date '2017-02-22 00:00:00' \
       --stop-date '2017-02-26 14:00:00' \
       --output-custom-log gourcelog.txt

# Adjust timestamps to be relative to Central Time
while read -r line || [[ -n "$line" ]]; do
    IFS='|' read -ra fields <<< "$line"
    fields[0]=`expr ${fields[0]} - 21600`
    adjustedLine=$(join_by "|" "${fields[@]}")
    echo "$adjustedLine" >> gourcelog2.txt
    
done < "gourcelog.txt"
mv gourcelog2.txt gourcelog.txt

# Delete last four lines of log
sed -i '' -e '$ d' gourcelog.txt
sed -i '' -e '$ d' gourcelog.txt
sed -i '' -e '$ d' gourcelog.txt
sed -i '' -e '$ d' gourcelog.txt

# View code in real time
gource	--1280x720 \
	--file-idle-time 0 \
	--max-files 0  \
	--bloom-intensity 1.5 \
	--title "Sewer-vogue" \
	--font-size 24 \
	--hide filenames,dirnames,mouse,progress \
	--date-format "%A, %B %d, %Y" \
	--multi-sampling \
	--caption-file gourceCaptions.txt \
	--caption-size 36 \
	--caption-duration 5 \
	gourcelog.txt

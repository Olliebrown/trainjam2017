#!/opt/local/bin/bash
soundPath=`pwd`
rm -rf soundsprite.*

files=""
for f in *.wav; do
  files=`echo $files ${soundPath}/$f`
done

cd /usr/local/lib/node_modules/audiosprite/
node cli --output ${soundPath}/soundsprite $files

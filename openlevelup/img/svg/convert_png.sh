#!/bin/sh
ICON_SIZE=24

for i in `ls *.svg`; do
	inkscape -z -e ../"${i%.*}".png -w $ICON_SIZE -h $ICON_SIZE $i
done
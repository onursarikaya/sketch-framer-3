#!/usr/bin/env python

import os
import sys
import shutil
import subprocess

tempPathPrefix = "TEMP_DIR:"


if len(sys.argv) < 3:
	sys.exit("Usage run.py <path> <identifier>")

outPath = os.path.normpath(sys.argv[1])
appIdentifier = os.path.normpath(sys.argv[2])

path = os.path.dirname(__file__)

print "Writing project to '%s'" % outPath

os.chdir(path)

def run(command):
	return subprocess.check_output(command, shell=True)


def getTempPathFromOutput(output):
	for line in output.splitlines():
		if line.startswith(tempPathPrefix):
			return line.lstrip(tempPathPrefix).strip()

def applescript(input):
	run("osascript<<END\n%s\nEND" % input)

def sendToTrash(path):
	applescript('tell application "Finder" to delete POSIX file "%s"' % path)

output = run("./coscript run.js %s" % appIdentifier)
tempPath = getTempPathFromOutput(output)

print output

# run("open %s" % tempPath)

if os.path.exists(outPath):
	# sendToTrash(outPath)
	shutil.rmtree(outPath)

shutil.copytree(tempPath, outPath)




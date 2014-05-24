#!/usr/bin/env ruby
system("bin/coscript -e '[[[COScript app:\"Sketch Beta\"] delegate] runPluginAtURL:[NSURL fileURLWithPath:\"#{__dir__}/Export to Framer.sketchplugin\"]]'")

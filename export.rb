#!/usr/bin/env ruby
require 'tempfile'

# filename = ARGV[0] # not used, we'll just export the frontmost document

tmp_file = Tempfile.new('framer-generator')
tmp_file.write "[[[COScript app:'Sketch Beta'] delegate] runPluginAtURL:[NSURL fileURLWithPath:'Export to Framer.sketchplugin']]"
tmp_file.rewind

cmd = "bin/coscript #{tmp_file.path} 2>/dev/null"

system(cmd)

tmp_file.close
tmp_file.unlink

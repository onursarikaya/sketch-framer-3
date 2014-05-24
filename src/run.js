scriptData = [NSString stringWithContentsOfFile:"Export to Framer.sketchplugin" encoding:NSUTF8StringEncoding error:nil];

sketchApp = [COScript app:"Sketch Beta"];
sketchApp = sketchApp || [COScript app:"Sketch"];

[[sketchApp delegate] runPluginScript:scriptData];
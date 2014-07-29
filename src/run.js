var sketchApp;

function runningApp(identifier) {
	return [[NSRunningApplication runningApplicationsWithBundleIdentifier:identifier] firstObject];
}

if (runningApp("com.bohemiancoding.sketch3")) {
	sketchApp = [COScript app:"Sketch"];
} else if (runningApp("com.bohemiancoding.sketch3.beta")) {
	sketchApp = [COScript app:"Sketch Beta"]
}

var sketchVersion = 0;
var bundles = [NSBundle allBundles]
for (var i = 0; i < [bundles count]; i++) {
  var bundle = [bundles objectAtIndex:i]
  if([bundle resourcePath].indexOf("Sketch") != -1) {
    sketchVersion = 0 + parseInt([bundle infoDictionary]["CFBundleVersion"]);
  }
}

if (sketchVersion >= 8053) {
  log("Using the native Framer Exporter")
  scriptData = "var path = [doc exportFramer];log('TEMP_DIR:'+path);";
} else {
  log("Using the CocoaScript Framer Exporter")
  scriptData = [NSString stringWithContentsOfFile:"Export to Framer.sketchplugin" encoding:NSUTF8StringEncoding error:nil];
}

[[sketchApp delegate] runPluginScript:scriptData];


function runningApp(appIdentifier) {
  return [[NSRunningApplication runningApplicationsWithBundleIdentifier:appIdentifier] firstObject];
}

function getSketchAppBundlePath(appIdentifier) {
  return [[NSWorkspace sharedWorkspace] absolutePathForAppBundleWithIdentifier:appIdentifier];
}

function getSketchAppBundleInfo(appIdentifier) {
  
  var path = getSketchAppBundlePath(appIdentifier);

  if (!path) {
    return;
  }

  return [[NSBundle bundleWithPath:path] infoDictionary];
}

function getSketchApp(appIdentifier) {
  
  if (appIdentifier == "com.bohemiancoding.sketch3.beta") {
    sketchApp = [COScript app:"Sketch Beta"];
  } else {
    sketchApp = [COScript app:"Sketch"];
  }

  return sketchApp;
}

  
var args = [[NSProcessInfo processInfo] arguments];
var appIdentifier;

if (args.length < 3) {
  appIdentifier = "com.bohemiancoding.sketch3";
} else {
  appIdentifier = args[2];
}

log("framersketch: running with " + appIdentifier);

var sketchAppBundleInfo = getSketchAppBundleInfo(appIdentifier);

if (!sketchAppBundleInfo) {
  log("framersketch: Can't get bundle info for, is Sketch installed?")
}

var sketchAppPath = getSketchAppBundlePath(appIdentifier)
var sketchAppVersion = sketchAppBundleInfo["CFBundleVersion"]
var sketchAppVersionString = sketchAppBundleInfo["CFBundleShortVersionString"]

log("framersketch: version:" + sketchAppVersionString + " / " + sketchAppVersion + " path:" + sketchAppPath);

var sketchApp = getSketchApp(appIdentifier);
var scriptData = "var path = [doc exportFramer];log('TEMP_DIR:'+path);";

// The script only works if yoy run this "naked" outside a function
[[sketchApp delegate] runPluginScript:scriptData]
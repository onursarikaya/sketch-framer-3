// Steps
function make_export_folder(){
  var path = image_folder()
  make_folder(path)
}
function make_folder(path){
  log("make_folder("+path+")")
  if (DRY_RUN) {
    log("DRY_RUN, won't make folder " + path)
    return
  }
  [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:true attributes:null error:null]
}
function export_assets_for_view(view){
  log("export_assets_for_view("+view+")")
  if (DRY_RUN) {
    log("DRY_RUN, won't export assets")
    return
  }

  make_folder(folder_path_for_view(view))

  if (document_has_artboards()) {
    var current_artboard = [view parentArtboard],
        current_artboard_name = [current_artboard name],
        did_disable_background = false

    if([current_artboard includeBackgroundColorInExport]){
      // print("Artboard has a background color set to export")
      if(!is_artboard(view)){
        // disable the background color if we're not exporting the actual artboard
        // print(" so we'll momentarily disable it")
        [current_artboard setIncludeBackgroundColorInExport:false]
        did_disable_background = true
      }
    }
  }

  // Hide mask
  disable_mask_for(view)

  // Get frame dimensions before hiding children
  var rect = [view rectByAccountingForStyleSize:[[view absoluteRect] rect]]
  log(rect)

  // Hide children if they will be exported individually
  if(has_subviews(view)){
    var sublayers = subviews_for_view(view),
        hidden_children = []

    for (var s = 0; s < sublayers.length; s++) {
      var sublayer = sublayers[s]
      export_assets_for_view(sublayer)
      if ([sublayer isVisible]) {
        print("We should hide " + [sublayer name] + ", as it will be exported individually")
        [sublayer setIsVisible:false]
        hidden_children.push(sublayer)
      }
    }
  }

  // Actual writing of asset
  var filename = asset_path_for_view(view)
  var slice = [[MSSliceMaker slicesFromExportableLayer:view inRect:rect] firstObject]
  slice.page = [[doc currentPage] copyLightweight]
  slice.format = "png"

  log("— writing asset " + slice + " to disk: " + filename)
  var imageData = [MSSliceExporter dataForRequest:slice]
  [imageData writeToFile:filename atomically:true]

  // Restore background color for layer
  if(current_artboard != null && did_disable_background){
    [current_artboard setIncludeBackgroundColorInExport:true]
  }

  // Make sublayers visible again
  if (has_subviews(view)) {
    for(var s=0; s < hidden_children.length; s++){
      var show_me = hidden_children[s]
      [show_me setIsVisible:true]
    }
  }

  enable_mask_for(view)

}
function disable_mask_for(view){
  log("Disabling mask for " + [view name])
  var masklayers = [view layers],
      effective_mask = null

  for (var i = 0; i < [masklayers count]; i++) {
    var current = [masklayers objectAtIndex:i]
    if(current && [current hasClippingMask]) {
      // If a native mask is detected, rename it and disable it (for now) so we can export its contents
      log("Mask found")
      var _name = [current name] + "@@mask"
      [current setName:_name]
      [current setHasClippingMask:false]
      [current setIsVisible:false]

      log("Disabling mask " + [current name])

      if (!effective_mask) {
        // Only the bottom-most one will be effective
        log("Effective mask " + _name)
        effective_mask = current
      }
    }
  }
  // Force redraw, again
  [view resizeRoot]
}
function enable_mask_for(view){
  log("Shall we re-enable the mask for " + [view name] + "?")
  var masklayers = [view layers]
  for (var i = 0; i < [masklayers count]; i++) {
    var current = [masklayers objectAtIndex:i]
    if ([current name].indexOf("@@mask") != -1) {
      var _name = [current name].replace("@@mask", "")
      log("Re-enabling mask " + _name)
      [current setHasClippingMask:true]
      [current setName:_name]
      [current setIsVisible:true]
    }
  }
}
function save_structure_to_json(data){
  print("save_structure_to_json()")
  save_file_from_string(export_folder() + "layers.json", data.getJSON())
}
function save_structure_to_json_js(data){
  print("save_structure_to_json_js()")
  doc_name = [doc displayName].replace(".sketch","")
  js_json_data  = "window.__imported__ = window.__imported__ || {};\n"
  js_json_data += "window.__imported__[\"" + doc_name + "/layers.json.js\"] = " + data.getJSON()
  save_file_from_string(export_folder() + "layers.json.js", js_json_data)
}

// Utils
function alert(msg){
  [[NSApplication sharedApplication] displayDialog:msg withTitle:"Sketch Framer found some errors"]
  // alternatively, we could do:
  // [doc showMessage:msg]
  // but maybe that's too subtle for an alert :)
}
function asset_path_for_view(view){
  var r = folder_path_for_view(view) + [view name] + ".png"
  return r
}
function image_path_for_view(view){
  var r = ""
  if(document_has_artboards()) {
    r = "images/" + [[view parentArtboard] name] + "/" + [view name] + ".png"
  } else {
    r = "images/" + [view name] + ".png"
  }
  return r
}
function folder_path_for_view(view){
  var r = ""
  if(document_has_artboards()) {
    r = image_folder() + [[view parentArtboard] name] + "/"
  } else {
    r = image_folder()
  }
  return r
}
function check_for_errors(){
  var errors = []
  if (!document_is_saved()) {
    errors.push("— Please save your document to export it.")
  }

  if ([[doc pages] count] > 1) {
    errors.push("— Multiple pages are not yet supported.")
  }

  return errors.join("\n")
}
function document_is_saved(){
  return [doc fileURL] != null
}
function document_has_artboards(){
  log("document_has_artboards() — " + ([[[doc currentPage] artboards] count] > 0) )
  return [[[doc currentPage] artboards] count] > 0
}

function temp_folder(){

  globallyUniqueString = [[NSProcessInfo processInfo] globallyUniqueString];
  tempDirectoryPath = NSTemporaryDirectory()
  tempDirectoryPath = [tempDirectoryPath stringByAppendingPathComponent:globallyUniqueString];
  tempDirectoryPath = [tempDirectoryPath stringByAppendingPathComponent:[doc displayName]];
  tempDirectoryURL = [NSURL fileURLWithPath:tempDirectoryPath isDirectory:true];
  [[NSFileManager defaultManager] createDirectoryAtURL:tempDirectoryURL withIntermediateDirectories:true attributes:nil error:nil];

  return tempDirectoryPath;
}

_temp_path = null;
function export_folder(){
  if(sketch.scriptPath.indexOf("Remote.sketchplugin") != -1){
    log("We're running from Framer Generator")
    if (!_temp_path){
      _temp_path = temp_folder();

      // We need this so we can pick up the generated path in the script above
      print("TEMP_DIR:" + _temp_path);
    }
    return _temp_path + "/";
  } else {
    var doc_folder = [[doc fileURL] path].replace([doc displayName], ''),
        doc_name = [doc displayName].replace(".sketch","")
    return doc_folder + doc_name + "/"
  }
}
function image_folder(){
  return export_folder() + "images/"
}
function has_subviews(view){
  var sublayers = [view layers]
  for(var v=0; v < [sublayers count]; v++){
    var sublayer = [sublayers objectAtIndex:v]
    if(view_should_be_extracted(sublayer)){
      return true
    }
  }
  return false
}
function subviews_for_view(view){
  log("subviews_for_view()")
  var sublayers = [view layers],
      subviews = []

  log("subviews: " + JSON.stringify(subviews))
  for(var v=0; v < [sublayers count]; v++){
    var sublayer = [sublayers objectAtIndex:v]
    log("sublayer" + JSON.stringify(sublayer))
    if(view_should_be_extracted(sublayer)){
      subviews.push(sublayer)
    }
  }
  if (subviews.length > 0) {
    return subviews
  } else {
    return null
  }
}
function is_artboard(layer){
  return ([layer className] == "MSArtboardGroup")
}
function mask_bounds(layer){
  log("mask_bounds()")
  var sublayers = [layer layers],
      effective_mask = null

  for (var i = 0; i < [sublayers count]; i++) {
    var current = [sublayers objectAtIndex:i]
    if(current && [current hasClippingMask]) {
      // If a native mask is detected, rename it and disable it (for now) so we can export its contents
      log("Mask found")
      var _name = [current name] + "@@mask";
      [current setName:_name];
      [current setHasClippingMask:false];
      log("Disabling mask " + [current name]);

      if (!effective_mask) {
        // Only the bottom-most one will be effective
        log("Effective mask " + _name)
        effective_mask = current
      }
    }
  }

  if (effective_mask) {
    return coordinates_for(effective_mask);
  } else {
    return null;
  }
}
function coordinates_for(layer){
  print("coordinates_for("+[layer name]+")")
  var frame = [layer frame],
      gkrect = [GKRect rectWithRect:[layer rectByAccountingForStyleSize:[[layer absoluteRect] rect]]],
      rect2 = [layer rectByAccountingForStyleSize:[[layer absoluteRect] rect]],
      absrect = [layer absoluteRect]

  var rulerDeltaX = [absrect rulerX] - [absrect x],
      rulerDeltaY = [absrect rulerY] - [absrect y],
      GKRectRulerX = [gkrect x] + rulerDeltaX,
      GKRectRulerY = [gkrect y] + rulerDeltaY,
      x = Math.round(GKRectRulerX),
      y = Math.round(GKRectRulerY)

  var slice = [[MSSliceMaker slicesFromExportableLayer:layer inRect:rect2] firstObject],
      rect = [slice rect],
      size = rect.size

  var r = {
    x: x,
    y: y,
    width: 0 + size.width,
    height: 0 + size.height
  }

  // TODO: fix this so that Artboards are positioned at {0,0}
  // if (is_artboard(layer)) {
  //   r.x = 0
  //   r.y = 0
  // }
  return r
}
function msg(msg){
  [doc showMessage:msg]
}
function save_file_from_string(filename,the_string) {
  // log("save_file_from_string()")
  if (DRY_RUN) {
    log("DRY_RUN, won't save file " + filename)
    return
  }

  var path = [@"" stringByAppendingString:filename],
      str = [@"" stringByAppendingString:the_string]

  [str writeToFile:path atomically:false encoding:NSUTF8StringEncoding error:null];
}
function view_should_be_extracted(view){
  // log("view_should_be_extracted("+view+")")
  r = [view className] == "MSLayerGroup" || is_artboard(view)
  return r
  // return ( [view isMemberOfClass:[MSLayerGroup class]] || is_artboard(view) || [view name].match(/\+/) )
}

// Classes
function MetadataExtractor(document){
  this.doc = document
  this.data = []
  this.views = this.extract_views_from_document()
  this.hideArtboards = false
  this.parse()
}
MetadataExtractor.prototype.getViews = function(){
  return this.views
}
MetadataExtractor.prototype.getJSON = function(){
  return JSON.stringify(this.data, null, '\t')
}
MetadataExtractor.prototype.extract_metadata_from_view = function(view){
  log("extract_metadata_from_view("+view+")")

  var layerFrame = coordinates_for(view)

  var metadata = {
    id: "" + [view objectID],
    name: "" + [view name],
    maskFrame: mask_bounds(view),
    layerFrame: layerFrame,
    image: {
      path: image_path_for_view(view),
      frame: layerFrame
    },
    imageType: "png",
    modification: null
  }

  // Does view have subviews?
  if(has_subviews(view)){
    log("extract_metadata_from_view() — View has subviews")
    var subviews = subviews_for_view(view),
        children_metadata = []

    // Traverse views in reverse order (see #7)
    for (var i = subviews.length - 1; i >= 0; i--) {
      var child = subviews[i]
      children_metadata.push(this.extract_metadata_from_view(child))
    }
    metadata.children = children_metadata
  } else {
    metadata.children = []
  }

  // Reset position for artboards:
  // if (is_artboard(view)) {
  //   if(this.hideArtboards == false){
  //     metadata.visible = true
  //     this.hideArtboards = true
  //   } else {
  //     metadata.visible = false
  //   }
  //   var frame = [view frame]
  //   metadata.layerFrame.x = metadata.image.frame.x = 0
  //   metadata.layerFrame.y = metadata.image.frame.y = 0
  //   metadata.layerFrame.width = metadata.image.frame.width = [frame width]
  //   metadata.layerFrame.height = metadata.image.frame.height = [frame height]
  // } else {
  //   metadata.visible = [view isVisible] ? true : false
  //   metadata.layerFrame = metadata.image.frame = coordinates_for(view)
  // }

  // Set visibility
  if (is_artboard(view)) {
    if(this.hideArtboards == false){
      metadata.visible = true
      this.hideArtboards = true
    } else {
      metadata.visible = false
    }
  } else {
    metadata.visible = [view isVisible] ? true : false
  }

  enable_mask_for(view)

  return metadata
}
MetadataExtractor.prototype.extract_views_from_document = function(){
  var document = this.doc,
      views = [],
      everything

  // TODO: traverse multiple pages
  if (document_has_artboards()) {
    everything = [[document currentPage] artboards]
  } else {
    everything = [[document currentPage] layers]
  }

  // Traverse views in reverse order (see #7)
  for (var i = [everything count] - 1; i >= 0; i--) {
    var obj = [everything objectAtIndex:i]
    if (view_should_be_extracted(obj)) {
      views.push(obj)
    }
  }

  return views
}
MetadataExtractor.prototype.parse = function(){
  // Traverse views in reverse order (see #7)
  for (var i = this.views.length - 1; i >= 0; i--) {
    var v = this.views[i]
    var metadata = this.extract_metadata_from_view(v)
    this.data.push(metadata)
  }
}

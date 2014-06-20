// Steps
function make_export_folder(){
  var path = image_folder()
  make_folder(path)
}
function make_folder(path){
  // log("make_folder("+path+")")
  if (DRY_RUN) {
    log("DRY_RUN, won't make folder " + path)
    return
  }
  [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:true attributes:null error:null]
}
function save_structure_to_json(data){
  // print("save_structure_to_json()")
  save_file_from_string(export_folder() + "layers.json", data.getJSON())
}
function save_structure_to_json_js(data){
  // print("save_structure_to_json_js()")
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
  // log("export_folder()")
  if(sketch.scriptPath.indexOf("Remote.sketchplugin") != -1){
    // log("We're running from Framer Generator")
    if (!_temp_path){
      _temp_path = temp_folder();

      // We need this so we can pick up the generated path in the script above
      print("TEMP_DIR:" + _temp_path);
    }
    return _temp_path + "/";
  } else {
    var doc_folder = [[[doc fileURL] URLByDeletingLastPathComponent] path],
        doc_name = [[[[doc fileURL] path] lastPathComponent] stringByDeletingPathExtension]
    return doc_folder + "/" +  doc_name + "/"
  }
}
function image_folder(){
  return export_folder() + "images/"
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

// Classes
function MetadataExtractor(document){
  log("MetadataExtractor")
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
  log("....MetadataExtractor.extract_metadata_from_view(" + view.name + ")")

  // TODO: see #11. This fixes the frame size, but not the exported image padding issue
  // var layerFrame = view.ui_coordinates()
  var layerFrame = view.coordinates()

  var metadata = {
    id: view.id,
    name: view.name_without_keywords(),
    maskFrame: view.mask_bounds(),
    layerFrame: layerFrame,
    image: {
      path: view.image_path(),
      frame: layerFrame
    },
    imageType: "png",
    modification: null
  }

  // Does view have subviews?
  if(view.has_subviews){
    log("......View has subviews")
    var subviews = view.subviews(),
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
  if (view.is_artboard()) {
    if(this.hideArtboards == false){
      metadata.visible = true
      this.hideArtboards = true
    } else {
      metadata.visible = false
    }
  } else {
    metadata.visible = view.visible
  }

  view.enable_mask()

  return metadata
}
MetadataExtractor.prototype.extract_views_from_document = function(){
  log("..MetadataExtractor.extract_views_from_document()")
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
    var view = new View([everything objectAtIndex:i])
    if (view.should_be_extracted()) {
      views.push(view)
    }
  }

  return views
}
MetadataExtractor.prototype.parse = function(){
  log("..MetadataExtractor.parse()")
  // Traverse views in reverse order (see #7)
  for (var i = this.views.length - 1; i >= 0; i--) {
    var v = this.views[i]
    var metadata = this.extract_metadata_from_view(v)
    this.data.push(metadata)
  }
}

// View Class
ViewCache = {
  views: [],
  get: function(id){
    var v = this.views[id]
    if(v != null) {
      log("....Cache Hit :)")
    }
    return v
  },
  add: function(view){
    var id = view.layer.objectID()
    this.views[id] = view
  }
}

function View(sketchLayer, parent){
  var id = sketchLayer.objectID(),
      cached_view = ViewCache.get(id)

  if (cached_view != null) {
    return cached_view
  }

  log("....new View("+sketchLayer+")")
  this.layer = sketchLayer
  this.parent = parent || null
  this.id = "" + [sketchLayer objectID]
  this.name = "" + [sketchLayer name].replace("/","-")
  this.visible = new Boolean([sketchLayer isVisible])
  this.exported_assets = 0
  this.do_not_traverse = this.do_not_traverse()
  this.has_subviews = this.has_subviews()
  if (this.has_subviews) {
    this.subviews = this.subviews()
  }
  this.should_be_extracted = this.should_be_extracted()
  this.mask_bounds = this.mask_bounds()
  this.rect = this.rect_for_export()
  this.clean_name = this.clean_name()

  make_folder(this.folder_path())
  // Store reference in cache
  ViewCache.add(this)
}

// Paths
View.prototype.image_path = function(){
  // Relative path
  var view = this.layer,
      r = ""
  if(document_has_artboards()) {
    r = "images/" + [[view parentArtboard] name] + "/" + this.clean_name + ".png"
  } else {
    r = "images/" + this.clean_name + ".png"
  }
  return r
}
View.prototype.folder_path = function(){
  var view = this.layer,
      r = ""
  if(document_has_artboards()) {
    r = image_folder() + [[view parentArtboard] name] + "/"
  } else {
    r = image_folder()
  }
  return r
}
View.prototype.asset_path = function(){
  var r = this.folder_path() + this.clean_name + ".png"
  return r
}

// Attributes
View.prototype.is_artboard = function(){
  return this.layer.className() == "MSArtboardGroup"
}
View.prototype.should_be_ignored = function() {
  return this.name_ends_with("-")
}
View.prototype.should_be_extracted = function(){
  log("View.should_be_extracted("+this.layer.name()+")")
  if (this.should_be_ignored()) {
    log("..nope, this view should be ignored")
    return false
  }
  if (this.is_artboard()){
    log("..yes, view is an artboard so it will be extracted")
    return true
  }
  if (this.layer.className() == "MSLayerGroup") {
    log("..yes, this view will be extracted")
    return true
  }
  if ( this.name_ends_with("+") && this.has_subviews ) {
    log("..yes, this view will be extracted because it ends with +")
    return true
  }
  log("..nope, apparently this view shouldn't be extracted")
  return false
}
View.prototype.do_not_traverse = function(){
  log("..do_not_traverse() — " + this.name + " <" + this.layer.className() + ">" )

  // Check for explicit "Do not traverse" character in layer
  if ( this.name_ends_with("*") ) {
    log("....Found * — Do not traverse")
    return true
  }
  // Check for some layer types we can't traverse, as they have no sublayers
  if (this.layer.className() == "MSShapeGroup" || this.layer.className() == "MSTextLayer" || this.layer.className() == "MSBitmapLayer" ){
    log("....Found layer with no sublayers — Do not traverse")
    return true
  }
  // Do not traverse Symbols, as they seem to break Sketch
  if( this.layer.sharedObjectID() != null ){
    log("....Found Symbol — do not traverse")
    return true
  }
  // Check: if this is a deeply nested layer, do not traverse it, as it will crash Sketch
  // if (this.nest_level() >= 2){
  //   return true
  // }

  if (this.layer.className() == "MSLayerGroup") {
    log("....LayerGroup — Traversing")
    return false
  }
  if (this.is_artboard()){
    log("....Found Artboard — Traversing")
    return false
  }
  return false
}

View.prototype.name_ends_with = function(str){
  return this.name.slice(-1) === str
}
View.prototype.has_subviews = function(){
  log("......has_subviews() — " + this.layer.className())

  log(this.do_not_traverse)
  if (this.do_not_traverse) {
    log("........do_not_traverse is TRUE")
    return false
  }

  var sublayers = this.layer.layers()

  for(var v=0; v < [sublayers count]; v++){
    var sublayer = new View([sublayers objectAtIndex:v])
    if(sublayer.should_be_extracted){
      return true
    }
  }
  return false
}
View.prototype.subviews = function(){
  // log("subviews_for_view()")
  var view = this.layer,
      sublayers = [view layers],
      subviews = []

  // log("subviews: " + JSON.stringify(subviews))
  for(var v=0; v < [sublayers count]; v++){
    var sublayer = new View([sublayers objectAtIndex:v])
    // log("sublayer" + JSON.stringify(sublayer))
    if(sublayer.should_be_extracted){
      subviews.push(sublayer)
    }
  }
  if (subviews.length > 0) {
    return subviews
  } else {
    return null
  }
}
View.prototype.name_without_keywords = function(){
  return this.layer.name().replace(/[*\-+]$/g,"")
}
View.prototype.clean_name = function(){
  return this.id
}

// Actions
View.prototype.coordinates = function(){
  // print("coordinates_for("+[layer name]+")")
  var layer = this.layer,
      frame = [layer frame],
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
  if (this.is_artboard()) {
    r = this.ui_coordinates()
    r.x = 0
    r.y = 0
  }
  return r
}
View.prototype.ui_coordinates = function(){
  // This returns the *exact* coordinates you see on Sketch's inspector
  var layer = this.layer,
      f = [layer frame],
      x = [[layer absoluteRect] rulerX],
      y = [[layer absoluteRect] rulerY]

  ui = {
    x: x,
    y:y,
    width: f.width(),
    height: f.height()
  }
  return ui
}
View.prototype.mask_bounds = function(){
  log("mask_bounds("+this.layer+")")

  if (this.layer.className() == "MSBitmapLayer" || !this.has_subviews) {
    log("MSBitmapLayers have no masks")
    return null
  }

  var layer = this.layer,
      sublayers = [layer layers],
      effective_mask = null

  for (var i = 0; i < [sublayers count]; i++) {
    var current = [sublayers objectAtIndex:i]
    if(current && [current hasClippingMask]) {
      // If a native mask is detected, rename it and disable it (for now) so we can export its contents
      // log("Mask found")
      var _name = [current name] + "@@mask";
      [current setName:_name];
      [current setHasClippingMask:false];
      // log("Disabling mask " + [current name]);

      if (!effective_mask) {
        // Only the bottom-most one will be effective
        // log("Effective mask " + _name)
        effective_mask = new View(current)
      }
    }
  }
  if (effective_mask) {
    return effective_mask.coordinates()
  } else {
    return null
  }
}
View.prototype.disable_mask = function(){
  if (this.layer.className() == "MSBitmapLayer" || !this.has_subviews) {
    return
  }

  var view = this.layer,
      masklayers = [view layers],
      effective_mask = null

  for (var i = 0; i < [masklayers count]; i++) {
    var current = [masklayers objectAtIndex:i]
    if(current && [current hasClippingMask]) {
      // If a native mask is detected, rename it and disable it (for now) so we can export its contents
      // log("Mask found")
      var _name = [current name] + "@@mask"
      [current setName:_name]
      [current setHasClippingMask:false]
      [current setIsVisible:false]

      // log("Disabling mask " + [current name])

      // TODO: remove this, as it is apparently useless?
      if (!effective_mask) {
        // Only the bottom-most one will be effective
        // log("Effective mask " + _name)
        effective_mask = current
      }
    }
  }
  // Force redraw, again
  [view resizeRoot]
}
View.prototype.enable_mask = function(){
  if (this.layer.className() == "MSBitmapLayer" || !this.has_subviews) {
    return
  }
  var view = this.layer,
      masklayers = [view layers]

  for (var i = 0; i < [masklayers count]; i++) {
    var current = [masklayers objectAtIndex:i]
    if ([current name].indexOf("@@mask") != -1) {
      var _name = [current name].replace("@@mask", "")
      // log("Re-enabling mask " + _name)
      [current setHasClippingMask:true]
      [current setName:_name]
      [current setIsVisible:true]
    }
  }
}
View.prototype.hide = function(){
  var v = this.layer
  [v setIsVisible:false]
  this.visible = false
}
View.prototype.show = function(){
  var v = this.layer
  [v setIsVisible:true]
  this.visible = true
}
View.prototype.export_assets = function(){
  log("..View.export_assets() — " + this.name)

  if (DRY_RUN) {
    log("....DRY_RUN is true — Don't export")
    return
  }
  if (this.should_be_ignored()) {
    log("....should_be_ignored is TRUE — Don't export")
    return
  }

  var view = this.layer

  if (document_has_artboards()) {
    var current_artboard = [view parentArtboard],
        current_artboard_name = [current_artboard name],
        did_disable_background = false

    if([current_artboard includeBackgroundColorInExport] && !this.is_artboard()){
      // disable the background color if we're not exporting the actual artboard
      log("....disabling artboard background color for export")
      [current_artboard setIncludeBackgroundColorInExport:false]
      did_disable_background = true
    }
  }

  // Hide mask
  this.disable_mask()

  // Get frame dimensions before hiding children
  var rect = this.rect

  // Hide children if they will be exported individually
  if(this.has_subviews && !this.do_not_traverse){
    log("....hiding subviews")
    var sublayers = this.subviews,
        hidden_children = []
    for (var s = 0; s < sublayers.length; s++) {
      var sublayer = sublayers[s]
      // TODO: REENABLE THIS: sublayer.export_assets()
      if (sublayer.layer.isVisible) {
        log("......We should hide " + sublayer.name + ", as it will be exported individually")
        sublayer.hide()
        hidden_children.push(sublayer)
      }
    }
  }

  // Actual writing of asset
  // TODO: maybe use Exportable Layers?
  var filename = this.asset_path(),
      slice = [[MSSliceMaker slicesFromExportableLayer:view inRect:rect] firstObject]
  slice.page = [[doc currentPage] copyLightweight]
  slice.format = "png"

  log("....writing asset " + slice + " to disk: " + filename)
  var imageData = [MSSliceExporter dataForRequest:slice]
  [imageData writeToFile:filename atomically:true]

  if(current_artboard != null && did_disable_background){
    log("....reenabling background color for artboard")
    [current_artboard setIncludeBackgroundColorInExport:true]
  }

  if (this.has_subviews) {
    log("....Making sublayers visible again")
    for(var s=0; s < hidden_children.length; s++){
      var show_me = hidden_children[s]
      show_me.show()
    }
  }

  this.enable_mask()

  // GC
  imageData = null
  slice = null
  rect = null
}

View.prototype.rect_for_export = function(){
  // TODO: Fix issue #11.
  log("View.rect_for_export()")
  var layer = this.layer
  if (this.is_artboard()) {
    return [[layer absoluteRect] rect]
  } else {
    return [layer rectByAccountingForStyleSize:[[layer absoluteRect] rect]]
  }
}

View.prototype.nest_level = function(){
  return this.layer.currentPage().ancestorsOfLayer(this.layer).length()
}

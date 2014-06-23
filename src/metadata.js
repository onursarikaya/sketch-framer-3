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
    maskFrame: view.mask_bounds,
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
    var subviews = view.subviews,
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
    if (view.should_be_extracted) {
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

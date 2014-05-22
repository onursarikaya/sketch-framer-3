# Sketch Framer 3

**BEWARE: This plugin is not yet ready for human consumption.**

3.0 is the new black. This is the home of v3 of the Sketch Framer plugin, for Sketch 3, to export to Framer 3.

## How-to

Run this on the project folder to concatenate the multiple parts of the plugin into a single .sketchplugin file:

    rake

This will generate an `Export to Framer.sketchplugin` file. This file won't be stored in the repo until we get all the issues fixed :)

If you'll be working on the plugin's code, you'll probably want to get the build system working. For that, you need to run this once, after cloning the repo:

    $ sudo gem install bundler
    $ bundle install --path vendor/bundle

and then, when you want to work on the code, run this:

    $ bundle exec guard -i

This will watch the repo folder, and compile & install the plugin everytime a .js file on the 'src' folder is updated. It'll also announce the fact with a nice voice message :P

## TODO

- [x] hidden layers should remain hidden after export
- [x] hidden layers should have metadata visibility set to none
- [x] hide artboards others than the first
- [x] fix position for nested layers
- [x] fix position for layers with shadows
- [x] fix random crashes
- [ ] backport Cemre's mask support
- [x] Optimization: export all assets in the same sandbox operation?
- [ ] Export in a tmp folder, and pass it to Framer Generator so it moves the files to the right place
- [ ] Close issues :)

## Template Format:

    {
    	"id": 3,
    	"name": "Background",
    	"layerFrame": {
    		"x": 0,
    		"y": 0,
    		"width": 320,
    		"height": 568
    	},
    	"maskFrame": null,
    	"image": {
    		"path": "images/Background.png",
    		"frame": {
    			"x": 0,
    			"y": 0,
    			"width": 320,
    			"height": 568
    		}
    	},
    	"imageType": "png",
    	"children": [

    	],
    	"modification": "1834086366"
    }

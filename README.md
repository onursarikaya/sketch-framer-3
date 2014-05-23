# Sketch Framer 3

**BEWARE: The plugin is not yet ready for human consumption. Also: it requires a Sketch version equal to or greater than 7882.**

This is the home of version 3 of the Sketch Framer plugin, for Sketch 3, to export to Framer 3. Yes, 3.0 is the new black.

## How-to

Run this on the project folder to concatenate the multiple parts of the plugin into a single .sketchplugin file:

    rake

This will generate an `Export to Framer.sketchplugin` file. This file won't be stored in the repo until we get all the issues fixed :)

Double click the .sketchplugin file to install it. You don't need any other file.

If you want to run the plugin from the command line, either do:

    rake run

or

    ./export.rb

Both will try to export the frontmost document in Sketch. The second option is there for Koen, basically :)


## Development

If you'll be working on the plugin's code, you'll probably want to get the build system working. For that, you need to run this once, after cloning the repo:

    $ sudo gem install bundler
    $ bundle install --path vendor/bundle

and then, when you want to work on the code, run this:

    $ bundle exec guard -i

This will watch the repo folder, and compile, install the plugin, and run it everytime a .js file on the 'src' folder is updated. It'll also announce the fact with a nice voice message. It's a good idea to have a sample document open in Sketch for testing, otherwise the plugin will give out an error.

When you're done, just hit `Ctrl + C` on the Terminal window to stop guard.


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

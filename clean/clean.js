var DomFs = require('../node_modules/fabrica-editor/node_modules/dom-fs');

// new DomFs(__dirname + '../');

// Remove all the contents of the resources folder
var fs = require('fs');

var deleteFolderRecursive = function(path) {
	if(fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;

			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});

		fs.rmdirSync(path);
	}
};

// Deletes the resources folder
deleteFolderRecursive(__dirname + '/../resources/');

// Now create the resources folder again
fs.mkdirSync(__dirname + '/../resources/');

var domFs = new DomFs(__dirname + '/../client/sub-applications/canvas/www/');
var file = domFs.getFile('index.html');

// parentElement will be the element at the data.xPath
var parentElementPromise = file.getElementAtXPath('/html/body/ion-pane/ion-content');

parentElementPromise
	.then(function(parent) {
		// Now that we got the element, we'll remove its entire children
		// array.
		parent.removeChildren();

		// Since the parent had its children array cleaned up,
		// let's write the file so the canvas can have the changes
		file.write();
	});
// native
var childProcess = require('child_process');
var path = require('path');

// the editor server
var fabricaEditor = require('fabrica-editor');

// start the visual editor
var gulpProcess = childProcess.spawn('gulp');

var host = 'http://ec2-52-7-200-59.compute-1.amazonaws.com';

// start the code editor
fabricaEditor({
	projectsDir: 'client/sub-applications',
    socketHost: host,
	injectScripts: [
		 host + ':3000/client/assets/components/canvas-palette/directives.js'
	],
	resourcesDirectory: path.join(__dirname, 'resources')
});
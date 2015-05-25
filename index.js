// native
var childProcess = require('child_process');
var path = require('path');

// the editor server
var fabricaEditor = require('fabrica-editor');

// internal
var aux = require('./lib/auxiliary');

// start the visual editor
var gulpProcess = childProcess.spawn('gulp');

// the ip address
var machineIPAddress = aux.getMachineIPAddress();

// start the code editor
fabricaEditor({
	projectsDir: 'client/sub-applications/canvas',

	socketHost: 'http://' + machineIPAddress,

	injectScripts: [
		'http://' + machineIPAddress + ':3000/client/assets/components/canvas-palette/directives.js'
	],
	resourcesDirectory: path.join(__dirname, 'resources')
});

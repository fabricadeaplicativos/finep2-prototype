// native
var childProcess = require('child_process');
var path = require('path');

// the editor server
var fabricaEditor = require('fabrica-editor');

// internal
var aux = require('./lib/auxiliary');

// start the visual editor
var gulpProcess = childProcess.spawn('gulp');

// IP Address of the machine running the server
var machineIPAddress;

console.log("Environment: " + process.env.NODE_ENV);
if (process.env.NODE_ENV === 'production') {
	machineIPAddress = 'finep.fabapp.com';
} else {
	 var machineIPAddress = aux.getMachineIPAddress();
//	machineIPAddress = "localhost";
}

// start the code editor
fabricaEditor({
	projectsDir: 'client/sub-applications/canvas',

	socketHost: 'http://' + machineIPAddress,

	injectScripts: [
		'http://' + machineIPAddress + ':3000/client/assets/components/canvas-palette/directives.js'
	],
	resourcesDirectory: path.join(__dirname, 'resources')
});

// some info
console.log('your ip address is ' + machineIPAddress);

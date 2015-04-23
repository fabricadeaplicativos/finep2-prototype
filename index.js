// native
var childProcess = require('child_process');

// the editor server
var fabricaEditor = require('fabrica-editor');

// start the visual editor
var gulpProcess = childProcess.spawn('gulp');

// start the code editor
fabricaEditor({
	projectsDir: 'client/sub-applications/canvas',
	injectScripts: [
		'http://localhost:3000/client/assets/components/canvas-palette/directives.js'
	]
});
var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var less = require('gulp-less');
var path = require('path');


// get auxiliary libs
var url = require('url');
var proxy = require('proxy-middleware');
var aux = require('./lib/auxiliary');


// compile less task
gulp.task('less', function () {
  gulp.src('./client/less/**/*.less')
    .pipe(less({
      paths: path.join(__dirname, 'less')
    }))
    // prevent less compilation errors from breaking stuff
    .on('error', function (error) {

      console.log(error.toString());

      this.emit('end');
    })
    .pipe(gulp.dest('./client/assets/css'));
});

// serve and watch files for automatic reload
gulp.task('serve', function() {
  /**
   * Middleware for allowing cross origin requests
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  function allowCORS(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }
  
  // IP Address of the machine running the server
  var machineIPAddress;

  if (process.env.NODE_ENV === 'production') {
      machineIPAddress = 'ec2-52-7-200-59.compute-1.amazonaws.com';
  } else {
      // machineIPAddress = aux.getMachineIPAddress();
      machineIPAddress = "localhost";
  }
    
  // proxy for sub-applications
  var subApplicationsProxyOptions = url.parse('http://' + machineIPAddress + ':3100');
  subApplicationsProxyOptions.route = '/sub-applications';

  // proxy for canvas socket
  var canvasSocketProxyOptions = url.parse('http://' + machineIPAddress + ':3102/canvas');
  canvasSocketProxyOptions.route = '/canvas'
  
  var setConfiguration = function (req, res, next) {

    if (req.url === '/config.js') {

      var CANVAS_CONFIG = {
        socketHost: 'http://' + machineIPAddress,
      };

      res.end('window.CANVAS_CONFIG = ' + JSON.stringify(CANVAS_CONFIG));

    } else {
      next();
    }
  }
    
  browserSync({
    port: 3000,
    server: {
      baseDir: './',
      middleware: [
        allowCORS,
        setConfiguration,
        proxy(subApplicationsProxyOptions),
        proxy(canvasSocketProxyOptions),
      ]
    },
    startPath: '/client',
    open: false
  });


  // canvas
  var canvasFiles = [
    'client/sub-applications/canvas/www/**/*.html', 
    'client/sub-applications/canvas/www/**/*.js'
  ];

  // palette
  var paletteFiles = [
    'client/sub-applications/palette/www/**/*.html', 
    'client/sub-applications/palette/www/**/*.js'
  ];

  // editor
  var editorFiles = [
    'client/index.html',
    'client/assets/**/*.html',
    'client/assets/**/*.js',
    'client/assets/**/*.css'
  ];

  // watch for reload changes
  gulp.watch(paletteFiles.concat(editorFiles), {cwd: './'}, reload);
});


// let the watch task be saparate from the serve task
// in order not to break the development server down
// when the compilations break.
gulp.task('watch', function () {
  // watch for less changes
  gulp.watch('./client/less/**/*.less', ['less']);
})


gulp.task('default', ['watch', 'serve']);
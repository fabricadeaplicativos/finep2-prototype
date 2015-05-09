var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var less = require('gulp-less');
var path = require('path');


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
  browserSync({
    port: 3000,
    server: {
      baseDir: './'
    },
    startPath: '/client',
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
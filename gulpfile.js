var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var less = require('gulp-less');
var path = require('path');


// compile less task
gulp.task('less', function () {
  gulp.src('./less/**/*.less')
    .pipe(less({
      paths: path.join(__dirname, 'less')
    }))
    // prevent less compilation errors from breaking stuff
    .on('error', function (error) {

      console.log(error.toString());

      this.emit('end');
    })
    .pipe(gulp.dest('./assets/css'));
});

// serve and watch files for automatic reload
gulp.task('serve', function() {
  browserSync({
    server: {
      baseDir: './'
    }
  });

  // html files to be watched
  var htmlFiles = ['index.html', 'components/**/*.html'];

  // js files to be watched
  var jsFiles = ['assets/**/*.js'];

  // css files to be watched
  var cssFiles = ['assets/**/*.css'];

  // watch for reload changes
  gulp.watch(htmlFiles.concat(jsFiles).concat(cssFiles), {cwd: './'}, reload);
});


// let the watch task be saparate from the serve task
// in order not to break the development server down
// when the compilations break.
gulp.task('watch', function () {
  // watch for less changes
  gulp.watch('./less/**/*.less', ['less']);
})


gulp.task('default', ['watch', 'serve']);
const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass')(require('sass'));
const inlineCss = require('gulp-inline-css');

function server() {
  browserSync.init({
    server: { baseDir: 'build/' },
    notify: false,
    online: true,
  })
}

function html() {
  return gulp.src(['src/**/*.html'])
    .pipe(gulp.dest('build/'))
    .pipe(inlineCss({
      applyStyleTags: true,
      applyLinkTags: true,
      preserveMediaQueries: true,
      applyWidthAttributes: false,
      applyTableAttributes: false,
      removeHtmlSelectors: true,
    }))
    .pipe(gulp.dest('build/'))
}

function styles() {
  return gulp.src(['src/**/styles/**/*.scss', '!src/sass/**'], { base: 'src' })
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('build/'))
}

function images() {
  return gulp.src(['src/**/img/**/*.*'], { base: 'src' })
    .pipe(gulp.dest('build/'));
}

function watch() {
  gulp.watch(['src/**/*.(html|scss)'], gulp.series(styles, html));
  gulp.watch(['src/**/img/**/*'], images);

  gulp.watch(['build/**/*.html']).on('change', browserSync.reload);
  gulp.watch(['build/**/img/**/*']).on('change', browserSync.reload);
}

function clean() {
  return del('build', { force: true });
}

function cleanup() {
  return del('build/**/styles', { force: true });
}

const build = gulp.series(clean, styles, html, images);

exports.clean = clean;
exports.build = gulp.series(build, cleanup);
exports.default = gulp.series(build, gulp.parallel(server, watch));

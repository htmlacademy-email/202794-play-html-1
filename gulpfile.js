const stream = require('stream');
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass')(require('sass'));
const inlineCss = require('gulp-inline-css');
const groupCssMediaQueries = require('gulp-group-css-media-queries');

const IS_PRODUCTION = (process.env.NODE_ENV || 'production') === 'production';
const TEMP_DIR = 'tmp';
const DEST_DIR = IS_PRODUCTION ? './' : 'tmp/';

function server() {
  browserSync.init({
    server: { baseDir: DEST_DIR },
    notify: false,
    online: true,
  })
}

function replace(pattern, replacer) {
  return new stream.Transform({
    objectMode: true,
    transform(file, enc, cb) {
      if (file.isNull()) {
        return cb(null, file);
      }
      if (file.isBuffer() && pattern) {
        file.contents = Buffer.from(
          String(file.contents).replace(pattern, (...args) => {
            return replacer(file, ...args);
          }),
        );
        return cb(null, file);
      }
      return cb(null, file);
    },
  });
}

function replaceImgSrc() {
  const PATTERN = /\ssrc="(img\/.+?)"\s/gi;
  const CDN_PATH = 'https://raw.githubusercontent.com/bini1988/202794-play-html-1/master/';

  /**
   * @param {import("vinyl")} file
   */
  function replacer(file, _match, imgPath) {
    const srcPath = path.join(path.dirname(file.relative), imgPath);

    return ` src="${CDN_PATH}${srcPath}" `
  }

  return replace(IS_PRODUCTION && PATTERN, replacer);
}

function injectCss() {
  const PATTERN = /<link\shref="(styles\/.+?)"\s.*\/>/gi;

  /**
   * @param {import("vinyl")} file
   */
  function replacer(file, _match, cssPath) {
    const srcPath = path.join(DEST_DIR, path.dirname(file.relative), cssPath);

    return `<style type="text/css">${fs.readFileSync(srcPath, 'utf-8')}</style>`
  }

  return replace(PATTERN, replacer);
}

function html() {
  return gulp.src(['src/**/*.html'])
    .pipe(gulp.dest(DEST_DIR))
    .pipe(replaceImgSrc())
    .pipe(injectCss())
    .pipe(inlineCss({
      applyStyleTags: true,
      applyLinkTags: true,
      removeStyleTags: true,
      removeLinkTags: true,
      preserveMediaQueries: true,
      applyWidthAttributes: false,
      applyTableAttributes: false,
      removeHtmlSelectors: false,
    }))
    .pipe(gulp.dest(DEST_DIR))
}

function styles() {
  return gulp.src(['src/**/styles/**/*.scss', '!src/sass/**'], { base: 'src' })
    .pipe(sass({ includePaths: ['src/styles'] }).on('error', sass.logError))
    .pipe(groupCssMediaQueries())
    .pipe(gulp.dest(DEST_DIR))
}

function images() {
  return gulp.src(['src/**/img/**/*.*'], { base: 'src' })
    .pipe(gulp.dest(DEST_DIR));
}

function watch() {
  gulp.watch(['src/**/*.(html|scss)'], gulp.series(styles, html));
  gulp.watch(['src/**/img/**/*'], images);

  gulp.watch([`${DEST_DIR}**/*.html`]).on('change', browserSync.reload);
  gulp.watch([`${DEST_DIR}**/img/**/*`]).on('change', browserSync.reload);
}

function clean() {
  return del(TEMP_DIR, { force: true });
}

function cleanup() {
  return del(['./**/styles', '!src/**'], { force: true });
}

const build = gulp.series(clean, styles, html, images);

exports.clean = clean;
exports.build = gulp.series(build, cleanup);
exports.default = gulp.series(build, gulp.parallel(server, watch));

const gulp = require('gulp')
const blok = require('gulp-blok')
const watch = require('gulp-watch')
const sass = require('gulp-sass')
const sassGlob = require('gulp-sass-glob')
const browserSync = require('browser-sync')
const source = require('vinyl-source-stream')
const webpack = require('webpack')
const gulpWebpack = require('gulp-webpack')
const reload = browserSync.reload
const config = require('./config.js')
const fs = require('fs')
const rename = require('gulp-rename')

if (config.blok.domain == 'INSERT_YOUR_DOMAIN') {
  config.blok.domain = 'ac0e600a.me.storyblok.com'
}

if (config.blok.themeId == 'INSERT_SPACE_ID') {
  config.blok.themeId = '40288'
}

gulp.task('deploy:dev', function () {
  return gulp.src('./views/**/*')
    .pipe(blok(config.blok))
})

gulp.task('deploy:live', function () {
  config.blok.environment = 'live'

  return gulp.src('./views/**/*')
    .pipe(blok(config.blok))
})

gulp.task('styles:below', function () {
  return gulp.src('source/scss/below.scss')
    .pipe(sassGlob())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./views/assets/css/'))
    .pipe(browserSync.stream())
})

gulp.task('styles:above', function () {
  return gulp.src('source/scss/above.scss')
    .pipe(sassGlob())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./views/assets/css/'))
    .pipe(browserSync.stream())
    .pipe(rename('_above_fold_css.liquid'))
    .pipe(gulp.dest('./views/components/'))
})

gulp.task('styles:color', function () {
  return gulp.src('source/scss/colors/*')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./views/assets/css/colors/'))
    .pipe(browserSync.stream())
})

gulp.task('icons', function () {
  return gulp.src('source/icons/icons.svg')
    .pipe(rename('_icons.liquid'))
    .pipe(gulp.dest('./views/components/'))
    .pipe(browserSync.stream())
})

gulp.task('scripts', function () {
  return gulp.src('source/js/scripts.js')
    .pipe(gulpWebpack({
      output: {
        filename: 'scripts.js',
      },
      module: {
        loaders: [{
          test: /\.js$/,
          loader: 'babel-loader'
        }]
      },
      plugins: [
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false,
          },
          output: {
            comments: false,
          }
        })
      ]
    }, webpack))
    .pipe(gulp.dest('views/assets/js'))
    .pipe(browserSync.stream())
})

gulp.task('browsersync', function () {
  browserSync({
    port: 4440,
    serveStatic: ['./views'],
    proxy: {
      target: 'http://' + config.blok.domain + '/_quickstart?quickstart=' + config.blok.quickstartToken,
      reqHeaders: function () {
        return {
          'accept-encoding': 'identity',
          'agent': false,
          'browsersyncblok': true,
          'storyblokenv': config.blok.environment
        }
      }
    },
    reloadDelay: 500,
    notify: true,
    open: true,
    logLevel: 'silent'
  })

  gulp.watch(['source/scss/_variables.scss'], ['styles:above', 'styles:below', 'styles:color'])
  gulp.watch(['source/scss/above.scss', 'source/scss/components/above/**/*.scss', 'source/scss/components/elements/**/*.scss'], ['styles:above'])
  gulp.watch(['source/scss/below.scss', 'source/scss/components/below/**/*.scss'], ['styles:below'])
  gulp.watch('source/scss/colors/*.scss')
  gulp.watch('source/js/**/*.js', ['scripts'])
})

gulp.task('build', ['styles:above', 'styles:below', 'styles:color', 'scripts']) 

gulp.task('default', ['build', 'browsersync'], function () {
  return watch('./views/**/*')
    .pipe(blok(config.blok))
})

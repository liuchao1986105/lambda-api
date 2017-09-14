'use strict';

var gulp = require('gulp');
var path = require('path');
var nodemon = require('gulp-nodemon');
//var jshint = require('gulp-jshint')
require('shelljs/global');


//gulp.task('lint', function () {
 // gulp.src('./**/*.js')
  //  .pipe(jshint())
//})*/

gulp.task('clean', function() {
    rm('-rf', '../dist/');
});

gulp.task('build_server', function() {
    exec('npm run build');
});

gulp.task('watch_build',function () {
  gulp.watch(['../'], ['build']);
});

//development模式
gulp.task('nodemon',function () {
  nodemon({
    //script: path.join(__dirname, '../dist/app.js'), 
    script: path.join('dist','/app.js'), 
    ext: 'js',
    watch: [
      //path.join(__dirname, '../src')
      path.join('src', '/')
    ],
    tasks: ['build_server'],
    env: { 'NODE_ENV': 'development' }
  })
});

//test模式
//test环境下不需要发邮件，不发送验证码，制造一些假数据等
gulp.task('nodemon:test',function () {
  nodemon({
    script: path.join('dist','/app.js'), 
    ext: 'js json',
    watch: [
      path.join('src', '/')
    ],
    env: { 'NODE_ENV': 'test' }
  })
});

//production模式
gulp.task('nodemon:production',function () {
  nodemon({
    script: path.join('dist','/app.js'),
    ext: 'js json',
    watch: [
      path.join('src', '/')
    ],
    tasks: ['build_server'],
    env: { 'NODE_ENV': 'production' }
  })
});


gulp.task('serve',['nodemon']);
gulp.task('serve:test',['nodemon:test']);
gulp.task('serve:production',['nodemon:production']);


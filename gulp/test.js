'use strict';

var path = require('path');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var env = require('gulp-env');
var gulpSequence = require('gulp-sequence');
var coveralls = require('gulp-coveralls');

//设置环境变量,mocha,istanbul测试必须在test mode
gulp.task('set-env', function () {
  env({
    vars: {
      'NODE_ENV':'test'
    }
  });
});

//istanbul
gulp.task('pre-test', function () {
  return gulp.src([
    path.join('dist','/**/*.js'),
    path.join('!' + 'dist','/config/**/*.js'),
    path.join('!' + 'dist','/auth/**/*.js'),
    path.join('!' + 'dist','/{app}.js'),
    path.join('!' + 'dist','/routes/**/*.js'),
    path.join('!' + 'dist','/models/**/*.js')
  ])
  .pipe(istanbul()) // Covering files
  .pipe(istanbul.hookRequire()) 
});

// "./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha -- -r should -r test/env --timeout 100000 -R spec  --recursive test/ ",
gulp.task('test:istanbul',['set-env','pre-test'], function () {
  gulp.src(path.join('test','/**/*.test.js'),{read: false})
    .pipe(mocha({
      require: ['should'],
      timeout: 5000
    }))
    .pipe(istanbul.writeReports({
      dir: path.join('test_coverage','/')
    }))
    .once('error', function () {
        process.exit(1);
    })
    .once('end', function () {
        process.exit();
    });
});

//mocha test
gulp.task('test:mocha',['set-env'],function () {
  gulp.src(path.join('test','/**/*.js'),{read: false})
      .pipe(mocha({
        reporter: 'list',   //list,nyan,spec(default),progress
        require: ['should'],  //require:["test/env","should"]
        timeout: 10000
      }))
      .once('error', function (err) {
          console.log(JSON.stringify(err));
          process.exit(1);
      })
      .once('end', function () {
          process.exit();
      });
});

// coveralls
// "./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -r should -r test/env --timeout 100000  -R spec 
// && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage"
gulp.task('coveralls',function () {
  gulp.src(path.join('test_coverage', '/lcov.info'))
    .pipe(coveralls());
});

gulp.task('test',gulpSequence('test:istanbul'));
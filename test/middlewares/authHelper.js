"use strict";

var should = require("should");
var User =  require('../../dist/models/user').User;
var Topic =  require('../../dist/models/topic').Topic;
var Promise = require('bluebird');
var ready = require('ready');

exports.createUser = function (role,name) {
  return User.createAsync({
    name: name || '测试' + new Date().getTime(),
    email:'test' + new Date().getTime() + '@test.com',
    password:'test',
    role: role || 'admin',
  });
}

exports.createTopic = function (title) {
  return Topic.createAsync({
    title: title || '测试主题' + new Date().getTime(),
    description:'test内容',
  });
}

exports.getToken = function (agent, name) {
  return new Promise(function (resolve, reject) {
    agent
    .post('/auth/local/signin')
    .set("Content-Type", "application/json")
    .send({ name: name, password:'test' })
    .redirects(0)
    .expect(200)
    .end(function(err, res) {
      if (err) { reject(err); }
      should.exist(res.body);
      should.exist(res.body.token);
      resolve(res.body.token);
    });
  });
}

/*ready(exports);
exports.ready(true);*/
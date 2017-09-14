var app = require('../../dist/app');
var request = require('supertest')(app);
var should = require("should"); 
var User =  require('../../dist/models/user').User;

describe('test/auth/local.test.js',function () {
  var mockUserEmails = [
    'test01' + new Date().getTime() + '@tets.com',
    'test02' + new Date().getTime() + '@tets.com',
    'test03' + new Date().getTime() + '@tets.com',
    'liuchao2',
  ];

  var mockUserNames = [
    '测试1' + new Date().getTime(),
    '测试2' + new Date().getTime(),
    '测试3' + new Date().getTime(),
    'liuchao2',
  ];

  before(function (done) {
    User.createAsync({
      name:mockUserNames[0],
      email:mockUserEmails[0],
      password:'test',
      role:'user',
    },{
      name:mockUserNames[1],
      email:mockUserEmails[1],
      password:'test',
      role:'user',
    },{
      name:mockUserNames[2],
      email:mockUserEmails[2],
      password:'test',
      role:'user',
    }).then(function () {
      done();
    }).catch(function (err) {
      done(err);
    })
  });

  after(function (done) {
    // User.removeAsync({name:{$in:mockUserNames}}).then(function () {
    User.removeAsync().then(function () {
      done();
    });
  });


  describe('post /auth/local/signin',function () {
    it('should when password error return err',function (done) {
      request.post('/auth/local/signin')
      .send({
        name:mockUserNames[0],
        password:'test888'
      })
      .expect(403,done);
    });
    it('should when email error return err',function (done) {
      request.post('/auth/local/signin')
      .send({
        name:'ttttt',
        password:'test'
      })
      .expect(403,done);
    });

    it('should login success return token',function (done) {
      request.post('/auth/local/signin')
      .send({
        name:mockUserNames[0],
        password:'test'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.token.should.be.String();
        done();
      });
    });
  });

});
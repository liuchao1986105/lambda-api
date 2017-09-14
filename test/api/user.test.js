var app = require('../../dist/app');
var request = require('supertest')(app);
var should = require("should"); 
var User =  require('../../dist/models/user').User;
var authHelper = require('../middlewares/authHelper');

describe('test/api/user.test.js',function () {
  var token,mockUserId,mockAdminId,mockName,mockUpdateName,mockAdminName;
  before(function (done) {
    authHelper.createUser('admin', 'liuchao').then(function (user) {
      mockAdminId = user._id;
     // mockUserId = user.user_id;
      mockAdminName = user.name;
      return user;
    }).then(function (user) {
      authHelper.getToken(request, user.name).then(function (result) {
        token = result;
        done();
      });
    }).catch(function (err) {
      console.log(err);
    });
  });

  after(function (done) {
    User.removeAsync().then(function () {
      done();
    });
  });

  describe('post /auth/local/signup',function () {
    mockName = "test_signup";
    it('should when not name return error', function(done) {
      request.post('/auth/local/signup')
      // .set('Authorization','Bearer ' + token)
      .send({
        name:"",
        email:'test@test.com' + new Date().getTime(),
        password:'test'
      })
      .expect(422,done);
    });

    it('should when not email return error', function(done) {
      request.post('/auth/local/signup')
      // .set('Authorization','Bearer ' + token)
      .send({
        email:"",
        name: mockName,
        password:'test'
      })
      .expect(422,done);
    });

    it('should return new user', function(done) {
      request.post('/auth/local/signup')
      // .set('Authorization','Bearer ' + token)
      .send({
        name: mockName,
        password: 'test',
        email:'test' + new Date().getTime() + '@test.com',
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) { return done(err); }
        mockUserId = res.body.user_id;
        res.body.token.should.be.String();
        res.body.success.should.be.true();
        done();
      })
    });

    it('should same name return error', function(done) {
      request.post('/auth/local/signup')
      // .set('Authorization','Bearer ' + token)
      .send({
        name: mockName,
        email:'test'+ new Date().getTime()+'@test.com',
        password:'test'
      })
      .expect(500,done);
    });
  });

  describe('put /users/:user_id', function() {
    mockUpdateName = '呢称' + new Date().getTime();
    it('should when not name return error', function(done) {
      request.put('/users/' + mockUserId)
      .set('Authorization','Bearer ' + token)
      .send({
        name:'',
        email:'test'+ new Date().getTime()+'@test.com' ,
      })
      .expect(422,done);
    });

    it('should when not email return error', function(done) {
      request.put('/users/' + mockUserId)
      .set('Authorization','Bearer ' + token)
      .send({
        name:mockUpdateName,
        email:''
      })
      .expect(422,done);
    });

    it('should return update user', function(done) {
      request.put('/users/' + mockUserId)
      .set('Authorization','Bearer ' + token)
      .send({
        name:mockUpdateName,
        email:'test'+ new Date().getTime()+'@test.com' ,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.user_id.should.be.String();
        res.body.success.should.be.true();
        done();
      })
    });

    it('should update password return success', function(done) {
      request.put('/users/' + mockUserId)
      .set('Authorization','Bearer ' + token)
      .send({
        name:mockUpdateName,
        email:'test'+ new Date().getTime()+'@test.com',
        password:'testpwd'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.user_id.should.be.String();
        res.body.success.should.be.true();
        done();
      })
    });

    it('should update user same name return error', function(done) {
      request.put('/users/' + mockUserId)
      .set('Authorization','Bearer ' + token)
      .send({
        name:mockAdminName,
        email:'test'+ new Date().getTime()+'@test.com' ,
      })
      .expect(500,done);
    });
  });

  describe('get /users/getCaptcha', function() {
    it('should return captcha image', function(done) {
      request.get('/users/getCaptcha')
      .expect(200,done);
    });
  });

  describe('del /users/:id', function() {
    it('should if userid === req.user._id return error', function(done) {
      request.del('/users/' + mockAdminId)
      .set('Authorization','Bearer ' + token)
      .expect(403,done);
    });

    it('should if userId error return error', function(done) {
      request.del('/users/576ec15b645b14b50faa2234')
      .set('Authorization','Bearer ' + token)
      .expect(500);
      done();
    });

    it('should return delete success', function(done) {
      request.del('/users/' + mockUserId)
      .set('Authorization','Bearer ' + token)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.success.should.be.true();
        done();
      })
    });
  });

});
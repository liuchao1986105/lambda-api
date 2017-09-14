var app = require('../../dist/app');
var request = require('supertest')(app);
var should = require("should"); 
var User =  require('../../dist/models/user').User;
var Tag =  require('../../dist/models/tag').Tag;
var authHelper = require('../middlewares/authHelper');

describe('test/api/tag.test.js',function () {
  var token, mockUserId, mockTagId;
  before(function (done) {
    authHelper.createUser('admin').then(function (user) {
      mockUserId = user._id;
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
    User.findByIdAndRemoveAsync(mockUserId).then(function () {
      done();
    });
  });

  describe('post /tags', function() {
    var tagName = '标签名称' + new Date().getTime();
    it('should when not name return error', function(done) {
      request.post('/tags')
      .set('Authorization','Bearer ' + token)
      .send({
        name: "",
      })
      .expect(422,done);
    });

    it('should return new tag', function(done) {
      request.post('/tags')
      .set('Authorization','Bearer ' + token)
      .send({
        name:tagName,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        mockTagId = res.body.tag_id;
        res.body.tag_id.should.be.String();
        res.body.success.should.be.true();
        done();
      })
    });

    it('should when second add tagName return error', function(done) {
      request.post('/tags')
      .set('Authorization','Bearer ' + token)
      .send({
        name:tagName,
      })
      .expect(403,done);
    });
  });

  describe('put /tags/:tag_id', function() {
    it('should return update tag',function (done) {
      request.put('/tags/' + mockTagId)
            .set('Authorization','Bearer ' + token)
            .send({
              name:'新标签名称' + new Date().getTime()
            })
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err,res) {
              if(err) return done(err);
              res.body.tag_id.should.be.String();
              res.body.success.should.be.true();
              done();
            });
    })
  });

  describe('get /tags',function () {
    it('should return all tag list',function (done) {
      request.get('/tags')
      .set('Authorization','Bearer ' + token)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.tags.length.should.be.above(0);
        done();
      });

    });
  });


  describe('delete /tags/:tag_id',function () {
    it('should return error',function (done) {
      request.del('/tags/dddddd')
      .set('Authorization','Bearer ' + token)
      .expect(500);
      done();
    });

    it('should return success',function (done) {
      request.del('/tags/' + mockTagId)
      .set('Authorization','Bearer ' + token)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.success.should.be.true();
        done();
      });
    });
  });

});
var app = require('../../dist/app');
var request = require('supertest')(app);
var config = require('../../dist/config/env');
var qiniuHelper = require('../../dist/utils/qiniu');
var authHelper = require('../middlewares/authHelper');
var User =  require('../../dist/models/user').User;
var sinon = require('sinon');

describe('test/api/image.test.js',function () {
  var token;
  before(function (done) {
    global.redis.flushdb();
    authHelper.createUser('admin').then(function (user) {
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

  describe('upload image',function () {
    it('should not file parmas return error',function (done) {
      request.post('/uploadImage')
      .set('Authorization','Bearer ' + token)
      .expect(422,done)
    });

    it('should resturn success',function (done) {
      var stubQiniu = sinon.stub(qiniuHelper,'upload');
      stubQiniu.returns(Promise.resolve({
        url: "http://upload.jackhu.top/article/article/test.png"
      }));
      request.post('/uploadImage')
      .set('Authorization','Bearer ' + token)
      .attach('file', __dirname + '/upload.test.png')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.success.should.be.true();
        res.body.img_url.should.be.equal("http://upload.jackhu.top/article/article/test.png");
        stubQiniu.calledOnce.should.be.true();
        stubQiniu.restore();
        done();
      })
    });
  });

  describe('fetch image',function () {
    it('should resturn success',function (done) {
      var stubQiniu = sinon.stub(qiniuHelper,'fetch');
      stubQiniu.returns(Promise.resolve({
        url: "http://upload.jackhu.top/article/article/test.png"
      }));
      request.post('/fetchImage')
      .set('Authorization','Bearer ' + token)
      .send({
        url:'http://www.test.com/test.png'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.success.should.be.true();
        res.body.img_url.should.be.equal("http://upload.jackhu.top/article/article/test.png");
        stubQiniu.calledOnce.should.be.true();
        stubQiniu.restore();
        done();
      })
    });

    it('should not url parmas return error',function (done) {
      request.post('/fetchImage')
      .set('Authorization','Bearer ' + token)
      .expect(422,done);
    });
  });

/*describe('get /article/getIndexImage',function () {
  var stubQiniu;
  beforeEach(function () {
    stubQiniu = sinon.stub(qiniuHelper,'list');
  });
  afterEach(function () {
    qiniuHelper.list.restore();
  });

  it('should return index image',function (done) {
    stubQiniu.returns(Promise.resolve({items:[1, 2, 3, 4, 5].map(i=>({key:i}))}));
    request.get('/getIndexImage')
    .expect(200)
    .end(function (err,res) {
      if (err) return done(err);
      res.body.success.should.be.true();
      res.body.img.should.startWith('http://upload.jackhu.top');
      stubQiniu.calledOnce.should.be.true();
      done();
    });
  });
  
  it('should return redis image',function (done) {
    request.get('/article/getIndexImage')
    .expect(200)
    .end(function (err,res) {
      if (err) return done(err);
      res.body.success.should.be.true();
      res.body.img.should.be.String;
      done();
    });
  });

});*/
});


var app = require('../../dist/app');
var request = require('supertest')(app);
var should = require("should"); 
var User =  require('../../dist/models/user').User;
var Article =  require('../../dist/models/tag').Article;
var Topic =  require('../../dist/models/topic').Topic;
var authHelper = require('../middlewares/authHelper');
var Promise = require('bluebird');


describe('test/api/article.test.js',function () {
  //测试需要一篇文章
  var token, mockArticleId, mockAdminId, mockTopicId;
  var mockTagIds = ['55e127401cfddd2c4be93f6b'];
  before(function (done) {
    global.redis.flushdb();
    // authHelper.ready(done);

    authHelper.createUser('admin').then(function (user) {
      mockAdminId = user._id;
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
    User.findByIdAndRemoveAsync(mockAdminId).then(function () {
      // global.redis.del('indexImages');
      done();
    }).catch(function (err) {
      done(err);
    });
  });

  describe('post /topics/:topic_id/articles',function () {
    before(function (done) {
      authHelper.createTopic().then(function (topic) {
        mockTopicId = topic._id;
        done()
      }).catch(function (err) {
        console.log(err);
      });
    });

    after(function (done) {
      Topic.findByIdAndRemoveAsync(mockTopicId).then(function () {
        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should not title return error',function (done) {
      request.post('/topics/' + mockTopicId + '/articles')
      .set('Authorization','Bearer ' + token)
      .send({
        title: '',
        description:'测试文章内容![enter image description here](http://upload.jackhu.top/test/111.png "enter image title here")',
      })
      .expect(422,done);
    });

    it('should not description return error',function (done) {
      request.post('/topics/' + mockTopicId + '/articles')
      .set('Authorization','Bearer ' + token)
      .send({
        title:'测试文章标题' + new Date().getTime(),
        description: ''
      })
      .expect(422,done);
    });

    it('should create a new article',function (done) {
      console.log("mockTopicId:"+mockTopicId);
      request.post('/topics/' + mockTopicId + '/articles')
      .set('Authorization','Bearer ' + token)
      .send({
        title:'测试文章标题' + new Date().getTime(),
        description:'测试文章内容![enter image description here](http://upload.jackhu.top/test/111.png "enter image title here")',
        tags:mockTagIds,
        type:'video'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        mockArticleId = res.body.article_id;
        res.body.success.should.be.true();
        done();
      });
    });
  });

  describe('put /articles/:article_id',function () {
    it('should not title return error',function (done) {
      request.put('/articles/' + mockArticleId)
      .set('Authorization','Bearer ' + token)
      .send({
        title: '',
        description:'新的文章内容![enter image description here](http://upload.jackhu.top/test/111.png "enter image title here")',
      })
      .expect(422,done);

    });

    it('should not content return error',function (done) {
      request.put('/articles/' + mockArticleId)
      .set('Authorization','Bearer ' + token)
      .send({
        title:'新的标题' + new Date().getTime(),
        description: ''
      })
      .expect(422,done);
    });

    it('should return update a article',function (done) {
      request.put('/articles/' + mockArticleId )
      .set('Authorization','Bearer ' + token)
      .send({
        title:'更新的标题' + new Date().getTime(),
        description:'更新的文章内容![enter image description here](http://upload.jackhu.top/test/111.png "enter image title here")',
        tags:mockTagIds
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err,res) {
        if(err) return done(err);
        res.body.success.should.be.true();
        res.body.article_id.should.be.String;
        done();
      });
    });
  });

  describe('get /topics/:topic_id/articles',function () {
    it('should return list',function (done) {
      request.get('/topics/' + mockTopicId + '/articles')
      .set('Authorization','Bearer ' + token)
      .expect(200)
      .expect('Content-Type', /json/)
/*      .query({
        sortOrder:'false',
      })*/
      .end(function (err,res) {
        if(err) return done(err);
        res.body.data.articles.length.should.be.above(0);
        res.body.data.pageCount.should.be.Number;
        res.body.data.pageCount.should.be.above(0);
        done();
      });

    });
  });

  describe('delete /articles/:article_id', function() {
    it('should when id error return error',function (done) {
      request.del('/articles/ddddddd')
      .set('Authorization', 'Bearer ' + token)
      .expect(500);
      done();
    });

    it('should return success',function (done) {
      request.del('/articles/' + mockArticleId)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .end(function (err,res) {
        if (err) return done(err);
        res.body.success.should.be.true();
        done();
      })
    })
  });

});
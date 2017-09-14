var request = require("supertest");
var app = require('../dist/app');
var config = require('../dist/config/env');
// global.redis.flushdb(); // 清空 redis里面的所有内容

describe('test/app.test.js', function () {
  it('request /cfliu should return status 404', function (done) {
    request(app).get('/cfliu').end(function (err, res) {
      res.status.should.equal(404);
      //res.text.should.containEql(config.description);
      done();
    });
  });
});

// res.status.should.equal(302);
//       res.body.img.should.startWith('http://upload.jackhu.top');
//   res.body.data.should.be.Object();
// res.body.data.length.should.be.above(0);
// res.body.count.should.be.Number;
// res.body.success.should.be.true();
// res.body.should.eql({"status": "success"});
// res.body.data._id.should.equal(mockArticleId.toString());
//res.body.img_url.should.be.equal("http://upload.jackhu.top/article/article/test.png");

/*      it('should sort false return users list',function (done) {
        request.get('/users/getUserList')
        .set('Authorization','Bearer ' + token)
        .query({
          itemsPerPage:1,
          sortName:'',
          sortOrder:'false'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err,res) {
          if(err) return done(err);
          res.body.data.length.should.be.above(0);
          res.body.count.should.be.above(0);
          done();
        })
      });*/
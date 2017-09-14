import config from '../../config/env';
import Promise from 'bluebird';
import qiniu from 'qiniu';
import qn from 'qn';

qiniu.conf.ACCESS_KEY = config.qnConfig.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.qnConfig.SECRET_KEY;

const client = new qiniu.rs.Client();

const easyClient = qn.create({
  accessKey: config.qnConfig.ACCESS_KEY,
  secretKey: config.qnConfig.SECRET_KEY,
  bucket: config.qnConfig.BUCKET_NAME,
  domain: config.qnConfig.DOMAIN,
});

// 对一般操作进行promise封装
const uploadFile = Promise.promisify(qiniu.io.putFile, qiniu.io);
const moveFile = Promise.promisify(client.move, client);
const copyFile = Promise.promisify(client.copy, client);
const removeFile = Promise.promisify(client.remove, client);
const statFile = Promise.promisify(client.stat, client);
const fetchFile = Promise.promisify(client.fetch, client);
const allList = Promise.promisify(qiniu.rsf.listPrefix, qiniu.rsf);

// 不同空间可以相互操作,在这里只在一个空间下操作
const bucket = config.qnConfig.BUCKET_NAME;
exports.bucket = bucket;

exports.uploadFile = uploadFile;
exports.moveFile = moveFile;
exports.copyFile = copyFile;
exports.removeFile = removeFile;
exports.statFile = statFile;
exports.fetchFile = fetchFile;
exports.allList = allList;

// 获取上传凭证
function getUptoken(bucketname) {
  const putPolicy = new qiniu.rs.PutPolicy(bucketname);
  return putPolicy.token();
}

// 将网络图片上传到七牛服务器
exports.fetch = function fetch(url, key) {
  // const randomKey = Math.random().toString(36).substr(2, 15); // 生成一个随机字符串来给图片命名
  return this.fetchFile(url, bucket, key).then(function(result) {
    result.url = config.qnConfig.DOMAIN + result.key;
    // const picUrl = qiniu.rs.makeBaseUrl(qiniu.conf.DOMAIN, randomKey); // 生成图片的可访问url
    return result;
  });
};

// 上传文件
exports.upload = function upload(path, key) {
  const extra = new qiniu.io.PutExtra();
  const uptoken = getUptoken(bucket);
  return this.uploadFile(uptoken, key, path, extra).then(function(result) {
    result.url = config.qnConfig.DOMAIN + result.key;
    return result;
  });
};

exports.uploadFileAsync = function uploadFileAsync(filePath, fileName = null) {
  return new Promise((resolve, reject) => {
    easyClient.uploadFile(filePath, fileName, (err, result) => {
      if (err) {
        return reject(err);
      }

      global.logger.debug(result, 'uploadFileAsync: ' + filePath);
      resolve(result.url);
    });
  });
};

// 将源空间的指定资源移动到目标空间，或在同一空间内对资源重命名。
exports.move = function move(keySrc, keyDest) {
  const bucketSrc = bucket;
  const bucketDest = bucket;
  return this.moveFile(bucketSrc, keySrc, bucketDest, keyDest).then(function(result) {
    return result;
  });
};


// 复制文件
exports.copy = function copy(keySrc, keyDest) {
  const bucketSrc = bucket;
  const bucketDest = bucket;
  return this.copyFile(bucketSrc, keySrc, bucketDest, keyDest).then(function(result) {
    return result;
  });
};

// 删除文件
exports.remove = function remove(key) {
  return this.removeFile(bucket, key).then(function(result) {
    return result;
  });
};

/*
列出所有资源, prefix想要查询的资源前缀缺省值为空字符串,limit 限制条数缺省值为1000
marker上一次列举返回的位置标记，作为本次列举的起点信息。缺省值为空字符串
 */
exports.list = function list(prefix, marker, limit) {
/*  return this.allList(bucket, prefix, marker, limit).then(function(result) {
    return result;
  });*/
 
 /* return this.allList(bucket, prefix, marker, limit).then(function(rerr, result, res) {
    console.log("resutl:"+JSON.stringify(result))
    return Promise.resolve(result);
  });*/
  return new Promise((resolve, reject) => {
    try {
      qiniu.rsf.listPrefix(bucket, prefix, marker, limit,'',function(rerr, result, res){
        return resolve(result);
      })
    } catch (err) {
      return reject(err);
    }
  }) 
};

// 测试环境配置
// ===========================
module.exports = {
  mongo: {
    uri: 'mongodb://127.0.0.1/server-test',
    options: {
      db: {
        safe: true,
      },
    },
  },

  // redis 配置
  redis: {
    host: '127.0.0.1',
    port: 6379,
    db: 2,
  },

  port: process.env.PORT || 8080,
  seedDB: true,
};

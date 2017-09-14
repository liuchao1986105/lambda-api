var User =  require('../../dist/models/user').User;
var Article = require('../../dist/models/article').Article;
var Promise = require('bluebird');

/*if(process.env.NODE_ENV === 'test'){
  User.countAsync().then(function (count) {
     if(count === 0){
      User.removeAsync().then(function () {
        User.createAsync({
          name:'admin',
          email:'admin@admin.com',
          role:'admin',
          password:'admin',
        },{
          name:'test001',
          email:'test001@test.com',
          role:'user',
          password:'test',
        },{
          name:'test002',
          email:'test002@test.com',
          role:'user',
          password:'test',
        },{
          name:'test003',
          email:'test003@test.com',
          role:'user',
          password:'test',
        });
      });
    }
  });
}*/
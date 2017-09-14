// RESTful API Design
// http://www.ruanyifeng.com/blog/2014/05/restful_api.html
// http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api
import auth from '../auth/auth.service';
import limit from '../middlewares/limit';
import config from '../config/env';
import { User } from '../models/user';

import UserController from '../api/user.controller';
import TopicController from '../api/topic.controller';
import ArticleController from '../api/article.controller';
import CommentController from '../api/comment.controller';
import MessageController from '../api/message.controller';
import TagController from '../api/tag.controller';
import ImageController from '../api/image.controller';
import TemplateController from '../api/template.controller';
import FeedController from '../api/feed.controller';
import PostController from '../api/post.controller';
import WechatController from '../api/wechat.controller';
import OrderController from '../api/order.controller';

import express from 'express';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

// Passport Configuration
require('../auth/local/passport').setup(User, config);
require('../auth/github/passport').setup(User, config);
require('../auth/weibo/passport').setup(User, config);
require('../auth/qq/passport').setup(User, config);

const router = express.Router();

// app.use('/crawler', require('../api/crawler'));
/*  app.use('/auth', require('../auth'));*/
// app.use('/article',require('./api/article'));
// router.post('/topics', middleware.auth, limit.peruserperday('create_topic', config.create_post_per_day), topicController.create);

// 基本功能
router.use('/auth/local', require('../auth/local'));  // 本地的注册和登录(/auth/local/signin)
router.use('/auth/github', require('../auth/github'));
// router.use('/auth/weibo', require('../auth/weibo'));
router.use('/auth/qq', require('../auth/qq'));

//feed
router.post('/feeds', auth.isAuthenticated(), FeedController.addFeed);
router.get('/feeds/my', auth.isAuthenticated(), FeedController.getMyFeeds)
router.put('/feeds/:feed_id', auth.isAuthenticated(), FeedController.subscribe);
router.get('/feeds/:feed_id', auth.isAuthenticated(), FeedController.getFeed);
router.get('/feeds', auth.isAuthenticated(), FeedController.getFeeds);
router.delete('/feeds/:feed_id', auth.isAuthenticated(), FeedController.unsubscribe);

//post
router.get('/posts/recent', auth.isAuthenticated(), PostController.main);
router.get('/posts/:post_id', auth.isAuthenticated(), PostController.getPost);
router.put('/posts/:post_id', auth.isAuthenticated(), PostController.updatePost);
router.get('/posts', auth.isAuthenticated(), PostController.getPosts);
router.put('/posts', auth.isAuthenticated(), PostController.updatePosts);


//wechat
router.post('/wechat/token', WechatController.getToken); //微信小程序获取token
router.post('/wechat/verifyToken', WechatController.verifyToken);

// user
router.get('/users', UserController.getUsers);
router.get('/users/me', auth.isAuthenticated(), UserController.getMe);
router.get('/users/getCaptcha', UserController.getCaptcha);
router.get('/users/snsLogins', UserController.getSnsLogins);
router.post('/users/signUp', UserController.signUp);   
router.get('/users/:user_id', UserController.getUser);
router.put('/users/mdUser', auth.isAuthenticated(), UserController.setUser);
router.put('/users/:user_id', auth.isAuthenticated(), UserController.updateUser);
router.delete('/users/:user_id', auth.hasRole('admin'), UserController.deleteUser);
router.put('/users/:user_id/changePayedStatus', auth.isAuthenticated(), UserController.changePayedStatus);
router.post('/users/sendResetMail', UserController.sendResetMail);
router.post('/users/sendResetPassword', UserController.sendResetPassword);

/* 
router.delete('/users/:user_id/courses/:course_id', auth.hasRole('admin'), controller.deleteUserCourse);
router.get('/getUserProvider',auth.isAuthenticated(), controller.getUserProvider);*/

// message
router.get('/messages', MessageController.getUserMessges);  //auth.isSelf(),
router.get('/messages/unMsgsCount', auth.isAuthenticated(), MessageController.getMessgesCount);
router.post('/messages/sendinfo', auth.isAuthenticated(), MessageController.sendInfo);

// order
router.post('/orders', auth.isAuthenticated(), OrderController.addOrder);
router.get('/orders', auth.isAuthenticated(), OrderController.getOrders);
router.get('/orders/notify', OrderController.notifyOrder);
router.get('/orders/return', OrderController.returnOrder);
router.get('/orders/:order_id', auth.isAuthenticated(), OrderController.getOrder);
router.put('/orders/:order_id', auth.isAuthenticated(), OrderController.updateOrder);
router.delete('/orders/:order_id', auth.isAuthenticated(), OrderController.deleteOrder);



// topic
router.post('/topics', auth.hasRole('admin'), TopicController.addTopic);
router.get('/topics', TopicController.getTopics);
router.get('/topics/getIndexImage',TopicController.getIndexImage);
router.get('/topics/:topic_id', TopicController.getTopic);
router.put('/topics/:topic_id', auth.hasRole('admin'), TopicController.updateTopic);
router.delete('/topics/:topic_id', auth.hasRole('admin'), TopicController.deleteTopic);
router.put('/topics/:topic_id/collect', auth.isAuthenticated(), TopicController.putCollect);  // 关注
router.put('/topics/:topic_id/decollect', auth.isAuthenticated(), TopicController.deCollect);  // 关注


//template
router.get('/templates/getTemplateList', auth.isAuthenticated(),  TemplateController.getTemplateList);
router.put('/templates/putTemplates', TemplateController.putTemplates);
router.post('/templates', TemplateController.addTemplate);

// article
router.get('/articles', ArticleController.getArticles);
router.get('/articles/:article_id', ArticleController.getArticle); // ?user_id
router.delete('/articles/:article_id', auth.hasRole('admin'), ArticleController.deleteArticle);
router.put('/articles/:article_id', auth.isAuthenticated(), ArticleController.updateArticle);
router.post('/articles', auth.isAuthenticated(), ArticleController.postArticles);
router.get('/articles/:topic_id', ArticleController.getTopicArticles);
router.put('/articles/:article_id/collect', auth.isAuthenticated(), ArticleController.putCollect);  // 关注
router.put('/articles/:article_id/decollect', auth.isAuthenticated(), ArticleController.deCollect);  
router.put('/articles/:article_id/top', auth.hasRole('admin'), ArticleController.putTop);  

// comment
router.post('/comments/:article_id/addNewComment', auth.isAuthenticated(), CommentController.postComments);
//router.get('/articles/:article_id/comments', auth.isAuthenticated(), CommentController.getArticleComments);
router.get('/comments/:comment_id', CommentController.getComment); // ?user_id
router.delete('/comments/:comment_id/delComment/:article_id', auth.isAuthenticated(), CommentController.deleteComment);
router.put('/comments/:comment_id', auth.isAuthenticated(), CommentController.updateComment);
router.post('/comments/:comment_id/addNewReply', auth.isAuthenticated(), CommentController.postReply);
router.delete('/comments/:comment_id/delReply/:reply_id', auth.hasRole('admin'), CommentController.delReply);
router.get('/comments',  CommentController.getComments);


// tag
router.get('/tags', TagController.getTags);
router.post('/tags', auth.isAuthenticated(), TagController.addTag);
router.delete('/tags/:tag_id', auth.hasRole('admin'), TagController.deleteTag);
router.get('/tags/:tag_id', TagController.getTag);
router.put('/tags/:tag_id', auth.isAuthenticated(), TagController.updateTag);


// image
router.get('/getImage', ImageController.getImage); //获取首页图片
router.post('/uploadImage', upload.single('file'), ImageController.uploadImage);
router.post('/fetchImage', auth.isAuthenticated(), ImageController.fetchImage);
router.get('/images/skillmap', ImageController.getSkillmaps); //获取首页图片

router.use('/*', function(req, res, next) {
  return res.status(404).json({success: 'false', data: 'cfliu is handsome.'});
});

module.exports = router;
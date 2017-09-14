import Promise from 'bluebird';
import { Comment } from '../models/comment';
import { Article, Scores } from '../models/article';
import { User, Values } from '../models/user';
import { swallow } from '../utils/decorators';
import message from '../utils/message';
import validator from 'validator';


export default class CommentController {
  @swallow
  static async getComment(req, res, next) {
    const comment = await Comment.findByIdAsync(req.params.comment_id);
    res.json({success: true, data: comment});
  }

  @swallow
  static async postComments(req, res, next) {
    let content = validator.escape(validator.trim(req.body.content));

    let error;
    if (!content) {
      error = '内容不能为空';
    }
    if (error) {
      return res.status(422).send({success: false, error_msg: error});
    }

    const newComment = new Comment();
    let result = content.match(/^@(\w+)\s/)
    let mentionUser;
    if(result){
      mentionUser = await User.findOneAsync({name: result[1]});
      content = content.replace(/(^@\w+\s)/, "<a target='_blank' style='color:#32c5d2' href='/users/"+mentionUser._id+"'>$1</a>");
    }
    
    newComment.content = content;
    newComment.authorId = req.user._id;
    newComment.articleId = req.params.article_id;
    const comment = await newComment.saveAsync();

    // 要往article里的comments插数据
    const article = await Article.findById(req.params.article_id).populate('authorId').exec();
    article.comments.addToSet(comment);
    article.score += Scores.comment;
    article.weekScore += Scores.comment;
    article.monthScore += Scores.comment;
    article.updated_at = new Date();

    await article.saveAsync();

    const returnComment = await Comment.findById(comment._id).populate('authorId').exec();
    
    await User.findByIdAndUpdateAsync(req.user._id, {$inc: {score: Values.comment}});

    // 推送消息
    //global.logger.debug(req.user._id.toString());
    if ( article.authorId._id.toString() !== req.user._id.toString()) {
      message.sendMessage(article.authorId._id, req.user._id, article._id, 'article', 'comment', returnComment._id);
    }
    if(result){
       //req.user._id 回复了mentionUser
      message.sendMessage(mentionUser._id, req.user._id, article._id, 'article', 'reply', returnComment._id);
    }

    return res.status(200).json({success: true, data: returnComment, article: article});
  }

  @swallow
  static async getArticleComments(req, res, next) {
    const comments = await Comment.findAsync({
      articleId: req.params.article_id,
      active: true,
    }, null, {
      // skip: 0, // Starting Row
      // limit: 10, // Ending Row
      // select: 'type created_at',
      sort: {
        created_at: -1,
      },
    }).populate([
      {path: 'authorId', model: 'User', select: '_id name description headimgurl'},
    ]).exec();
    return res.status(200).json({success: true, data: comments});
  }

  @swallow
  static async getComments(req, res, next) {
    const query = {active: true};
    let sort = {};
    if(req.query.articleId){
      query.articleId = req.query.articleId
    }

    if(req.query.author_id){
      query.authorId = req.query.author_id
    }

    if(req.query.search){
      let search  = validator.trim(req.query.search)
      query.content = new RegExp(search, 'i');
    }

    if(req.query.from){
      sort = {created_at: -1}
    }

    const result = await Comment.paginate(query, {
      populate: [
        {path: 'articleId', model: 'Article', select: '_id title'},
        {path: 'authorId', model: 'User', select: '_id name headimgurl'},
      ],
      page: parseInt(req.query.page, 10) || 1,
      limit: Number(req.query.limit) || 10000,
      sort: sort
    })

    res.json({
      data: result.docs,
      count: result.pages,
      total: result.total
    });
  }

  @swallow
  static async updateComment(req, res, next) {
    const content = validator.escape(validator.trim(req.body.content));
    let error;
    if (!content) {
      error = '评论内容不能为空';
    }
    if (error) {
      return res.status(422).send({success: false, error: error});
    }

    const comment = await Comment.findByIdAsync(req.params.comment_id);
    comment.content = content;
    await comment.saveAsync();
    return res.status(200).send({success: true, comment_id: comment._id});
  }

  @swallow
  static async deleteComment(req, res, next) {
    let article_id;
    if(req.params.article_id){
      article_id = req.params.article_id;
    }

    Article.findOneAndUpdate({_id: article_id}, {$pull: {comments: req.params.comment_id}})
    .exec().then((article) => {
      return Comment.findByIdAndUpdate(req.params.comment_id, {active: false}).exec();
    }).then((comment) => {
      res.status(200).send({success: true, data: comment});
    }).catch(next);
  }

  @swallow
  static async postReply(req, res, next) {
    const commentId = req.params.comment_id;
    const content = validator.escape(validator.trim(req.body.content));
    if (!content) {
      return res.status(422).send({success: false, data: '回复内容不能为空'});
    }

    await User.findByIdAndUpdateAsync(req.user._id, {$inc: {score: Values.comment}});
    
    const reply = {
      content: content,
      user_info: {
        id: req.user._id,
        name: req.user.name,
        headimgurl: req.user.headimgurl,
      },
      created: new Date(),
    };

    const comment = await Comment.findByIdAndUpdate(commentId, {$push: {replys: reply}}, {new: true}).populate('authorId').exec();
    message.sendMessage(comment.authorId, req.user._id, article._id, comment._id, 'article', 'reply');


    // @
    const newContent = content.replace(/^@\w+\s/, '');
    global.logger.debug(`newContent:$newContent`);
    message.sendMessageToMentionUsers(newContent, req.user._id, article._id, comment._id, 'article', 'reply');
    return res.status(200).json({success: true, data: comment.replys});
  }

  static delReply(req, res, next) {
    const commentId = req.params.comment_id;
    const replyId = req.params.reply_id;

    Comment.findByIdAndUpdateAsync(commentId, {$pull: {replys: { _id: replyId}}}, {new:true}).then(function(result) {
      return res.status(200).json({success: true, data: result});
    }).catch(function (err) {
      return res.status(500).json({success: false, data: err});
    });
  }

}

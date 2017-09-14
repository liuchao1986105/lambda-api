import Promise from 'bluebird';
import { Template } from '../models/template';
import { swallow } from '../utils/decorators';
import validator from 'validator';
import templates from '../../test/mock/template';

export default class TemplateController {
  @swallow
  static async getTemplateList(req, res, next){
    const page = parseInt(req.query.page, 10) || 1;
    let query = {active: true};
    //sortName = "-" + sortName;

    const result = await Template.paginate(query,
    {
      page: page,
      limit: Number(req.query.limit) || 10,
      sort: { created_at: -1} // sort:'-created_at'
    });

    res.json({
      data: result.docs,
      count: result.pages
    });
  }

  @swallow
  static async putTemplates(req, res, next){
    const promises = templates.map((template) => {
      global.logger.info(template);
      let tem = new Template(template);
      return tem.saveAsync();
    });
    await Promise.all(promises).catch(next);
    return res.status(200).send({success: true, data: 'put templates success'});
  }

  @swallow
  static async addTemplate(req, res, next){
    const title = validator.escape(validator.trim(req.body.title));
    let error;
    if(title === '') {
      error = '模板名不能为空';
    }
    if(error){
      return res.status(422).send({error_msg: error});
    }

    const template = await Template.findOneAsync({title:title});
    if (template) {
      return res.status(403).send({error_msg:'该模板已经存在.'});
    } else {

      // 解析成以下格式
      const tasklist=req.body.tasklist.split("\n");
      const tasks  = tasklist.map((task) => {
        var taskcontent = task.split(/\s+/)
        return {
          title:  taskcontent[0] + ' ' + taskcontent[1],
          description:  taskcontent[2]
        }
      })
      req.body.title = title;
      req.body.tasklist = tasks;
      const newTemplate = await Template.createAsync(req.body);
      
      return res.status(200).json({ success: true, data:newTemplate, template_id: newTemplate._id});
    }
  }
}

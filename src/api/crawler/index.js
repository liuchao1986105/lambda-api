import express from 'express';
import controller from './crawler.controller';
import auth from '../../auth/auth.service';

const router = express.Router();
router.get('/khan', controller.getClassList);
module.exports = router;
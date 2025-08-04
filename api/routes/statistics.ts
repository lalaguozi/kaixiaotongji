import { Router } from 'express';
import { 
  getStatistics, 
  getMonthlyComparison, 
  getCategoryTrends,
  getTodayStatistics
} from '../../server/src/controllers/statisticsController';
import { authenticateToken } from '../../server/src/middleware/auth';
import { 
  validateStatisticsQuery, 
  validateCategoryTrends 
} from '../../server/src/middleware/validation';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取统计数据
router.get('/', validateStatisticsQuery, getStatistics);

// 获取今日统计
router.get('/today', getTodayStatistics);

// 获取月度对比数据
router.get('/monthly-comparison', getMonthlyComparison);

// 获取类别趋势数据
router.get('/category-trends/:categoryId', validateCategoryTrends, getCategoryTrends);

export default router;
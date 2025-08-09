import express from 'express';
import productTypeController from '../controllers/productTypeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all product type routes
router.use(authenticate);

// Product Type CRUD operations
router.post('/', productTypeController.createProductType.bind(productTypeController));
router.get('/', productTypeController.getProductTypes.bind(productTypeController));
router.get('/stats', productTypeController.getProductTypeStats.bind(productTypeController));
router.get('/:id', productTypeController.getProductType.bind(productTypeController));
router.put('/:id', productTypeController.updateProductType.bind(productTypeController));
router.delete('/:id', productTypeController.deleteProductType.bind(productTypeController));

// Product Type specific operations
router.post('/:id/generate-spaces', productTypeController.generateSpaces.bind(productTypeController));

export default router;
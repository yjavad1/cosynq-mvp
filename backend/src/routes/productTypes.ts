import express from 'express';
import productTypeController from '../controllers/productTypeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all product type routes
router.use(authenticate);

// Product Type CRUD operations
router.post('/', productTypeController.createProductType);
router.get('/', productTypeController.getProductTypes);
router.get('/stats', productTypeController.getProductTypeStats);
router.get('/:id', productTypeController.getProductType);
router.put('/:id', productTypeController.updateProductType);
router.delete('/:id', productTypeController.deleteProductType);

// Product Type specific operations
router.post('/:id/generate-spaces', productTypeController.generateSpaces);

export default router;
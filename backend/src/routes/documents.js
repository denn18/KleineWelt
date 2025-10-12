import { Router } from 'express';
import { downloadMembershipInvoice } from '../controllers/documentsController.js';

const router = Router();

router.get('/membership-invoice', downloadMembershipInvoice);

export default router;

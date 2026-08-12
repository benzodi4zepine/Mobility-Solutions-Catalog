import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catalogRouter from "./catalog";
import referralsRouter from "./referrals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogRouter);
router.use(referralsRouter);

export default router;

import { Router } from "express";
import { improvementController } from "../controllers/improvementController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/", (req, res) => improvementController.getAll(req, res));
router.get("/summary", (req, res) => improvementController.getSummary(req, res));
router.get("/student/:studentId", (req, res) => improvementController.getByStudent(req, res));
router.post("/follow-up", requireAuth(["teacher", "admin"]), (req, res) => improvementController.recordFollowUp(req, res));
router.post("/compare", (req, res) => improvementController.compare(req, res));

export default router;

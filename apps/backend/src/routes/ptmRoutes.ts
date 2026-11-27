import { Router } from "express";
import { ptmController } from "../controllers/ptmController";
import { videoController } from "../controllers/videoController";
import { requireRole } from "../middleware/authMiddleware";

const router = Router();

// Teacher / Principal endpoints
router.get("/targets", requireRole(["teacher", "admin"]), (req, res) => ptmController.getTargets(req, res));
router.get("/", requireRole(["teacher", "admin"]), (req, res) => ptmController.listTeacherMeetings(req, res));
router.post("/", requireRole(["teacher", "admin"]), (req, res) => ptmController.create(req, res));

// Parent-only endpoint for viewing own invites
router.get("/my", requireRole(["parent"]), (req, res) => ptmController.listMyMeetings(req, res));

// Single meeting inspection (teacher/admin own or parent invited)
router.get("/:id", requireRole(["teacher", "admin", "parent"]), (req, res) => ptmController.getById(req, res));

// Teacher edit / reschedule / cancel own meeting
router.put("/:id", requireRole(["teacher", "admin"]), (req, res) => ptmController.update(req, res));
router.post("/:id/cancel", requireRole(["teacher", "admin"]), (req, res) => ptmController.cancel(req, res));
router.delete("/:id", requireRole(["teacher", "admin"]), (req, res) => ptmController.cancel(req, res));

// Parent RSVP (accept + pick slot, decline, or request reschedule)
router.post("/:id/rsvp", requireRole(["parent"]), (req, res) => ptmController.rsvp(req, res));

// Video call routes (LiveKit Token, start/end lifecycle, attendance)
router.post("/:id/token", requireRole(["teacher", "admin", "parent"]), (req, res) => videoController.issueToken(req, res));
router.post("/:id/start", requireRole(["teacher", "admin"]), (req, res) => videoController.startMeeting(req, res));
router.post("/:id/end", requireRole(["teacher", "admin"]), (req, res) => videoController.endMeeting(req, res));
router.post("/:id/attendance", requireRole(["teacher", "admin", "parent"]), (req, res) => videoController.recordAttendance(req, res));
router.get("/:id/attendance", requireRole(["teacher", "admin"]), (req, res) => videoController.getAttendance(req, res));

export default router;

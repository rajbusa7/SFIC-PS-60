import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { ptmService, PtmAuthorizationError, PtmValidationError } from "../services/ptmService";
import { validateCreateMeeting, validateMeetingRsvp } from "../../../../packages/shared/src/schemas/validation";
import type { MeetingStatus } from "../../../../packages/shared/src/types";

function handlePtmError(res: Response, err: any) {
  if (err instanceof PtmAuthorizationError || err instanceof PtmValidationError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: err.message || "Internal server error" });
}

export class PtmController {
  async getTargets(req: AuthenticatedRequest, res: Response) {
    try {
      const actor = req.user
        ? {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role,
          email: req.user.email,
        }
        : undefined;
      const data = await ptmService.getScheduleTargets(actor);
      res.status(200).json({ success: true, ...data });
    } catch (err: any) {
      handlePtmError(res, err);
    }
  }

  async listTeacherMeetings(req: AuthenticatedRequest, res: Response) {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        email: req.user!.email,
      };
      const status = req.query.status as MeetingStatus | undefined;
      const classId = req.query.classId as string | undefined;
      const meetings = await ptmService.listTeacherMeetings(actor, { status, classId });
      res.status(200).json({ success: true, count: meetings.length, meetings });
    } catch (err: any) {
      handlePtmError(res, err);
    }
  }

  async listMyMeetings(req: AuthenticatedRequest, res: Response) {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        email: req.user!.email,
      };
      const invites = await ptmService.listParentMeetings(actor);
      res.status(200).json({ success: true, count: invites.length, invites });
    } catch (err: any) {
      handlePtmError(res, err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        email: req.user!.email,
      };
      const meeting = await ptmService.getMeetingDetails(actor, String(req.params.id));
      res.status(200).json({ success: true, meeting });
    } catch (err: any) {
      handlePtmError(res, err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = validateCreateMeeting(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, errors: validation.errors, error: validation.errors[0]?.message });
      }
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        email: req.user!.email,
      };
      const meeting = await ptmService.createMeeting(actor, validation.data!);
      res.status(201).json({ success: true, meeting });
    } catch (err: any) {
      handlePtmError(res, err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        email: req.user!.email,
      };
      const meeting = await ptmService.updateOrRescheduleMeeting(actor, String(req.params.id), req.body || {});
      res.status(200).json({ success: true, meeting });
    } catch (err: any) {
      handlePtmError(res, err);
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        email: req.user!.email,
      };
      const meeting = await ptmService.cancelMeeting(actor, String(req.params.id));
      res.status(200).json({ success: true, meeting });
    } catch (err: any) {
      handlePtmError(res, err);
    }
  }

  async rsvp(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = validateMeetingRsvp(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, errors: validation.errors, error: validation.errors[0]?.message });
      }
      const actor = {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        email: req.user!.email,
      };
      const invite = await ptmService.respondToInvite(actor, String(req.params.id), validation.data!);
      res.status(200).json({ success: true, invite });
    } catch (err: any) {
      handlePtmError(res, err);
    }
  }
}

export const ptmController = new PtmController();

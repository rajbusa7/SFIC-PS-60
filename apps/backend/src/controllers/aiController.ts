import type { Request, Response } from "express";
import { aiService } from "../services/aiService";

export class AiController {
  async tutor(req: Request, res: Response) {
    try {
      const { query, grade, subject, language } = req.body;
      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ success: false, error: "Teacher query is required" });
      }

      const result = await aiService.askTutor(query, Number(grade) || 4, subject, language);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "AI tutor request failed" });
    }
  }

  async chat(req: Request, res: Response) {
    try {
      const { message, history, language, userRole } = req.body;
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ success: false, error: "Message is required" });
      }

      const result = await aiService.askAssistant(message, history, language, userRole);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "AI assistant request failed" });
    }
  }
}

export const aiController = new AiController();

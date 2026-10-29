import { remedialPlanRepository } from "../repositories/remedialPlanRepository";
import { generateRemedialPlan } from "../../../../src/lib/engine/remedialEngine";
import { generateAiContent } from "../../../../src/lib/ai/aiProvider";
import type { RemedialPlan } from "../../../../packages/shared/src/types";

export interface GenerateRemedialInput {
  studentId?: string;
  studentName?: string;
  conceptId?: string;
  conceptName?: string;
  subjectCode?: any;
  latestPercentage?: number;
  gapReason?: string;
  language?: "en" | "gu";
}

export class RemedialService {
  async getRemedialPlans(studentId?: string, status?: string): Promise<RemedialPlan[]> {
    return remedialPlanRepository.findAll(studentId, status);
  }

  async getRemedialPlanById(id: string): Promise<RemedialPlan | null> {
    return remedialPlanRepository.findById(id);
  }

  async generatePlan(input: GenerateRemedialInput): Promise<{
    plan: RemedialPlan;
    isAiGenerated: boolean;
    provider: string;
    modelUsed: string;
    note?: string;
  }> {
    const isGujarati = input.language === "gu";
    const studentName = input.studentName || "Aarav Patel";
    const conceptName = input.conceptName || "Division Basics & Equal Sharing";
    const pct = input.latestPercentage ?? 35;

    const baseEnginePlan = generateRemedialPlan(
      input.studentId || "std-aarav",
      studentName,
      input.conceptId || "c-div-01",
      conceptName,
      input.subjectCode || "MATH",
      {
        conceptId: input.conceptId || "c-div-01",
        conceptName,
        requiresRemediation: true,
        priority: "High",
        masteryStatus: "Needs Support",
        reason: input.gapReason || "Scored below mastery threshold",
        suggestedAction: "Initiate structured 5-step remedial intervention.",
        attemptsCount: 1,
        latestPercentage: pct,
        averagePercentage: pct,
        isSingleObservation: true,
      }
    );

    const fallbackGenerator = () => {
      let finalPlan = { ...baseEnginePlan };
      if (isGujarati) {
        finalPlan = {
          ...finalPlan,
          learningObjective: `વિદ્યાર્થી '${conceptName}' ની પાયાની સંકલ્પના મૂર્ત સાધનો દ્વારા સમજે અને ૮૦% કરતાં વધુ ગુણ સાથે નિપુણતા મેળવે.`,
          recommendationReason: `વિદ્યાર્થીનું મૂલ્યાંકન પરિણામ ${pct}% છે. પાયાની સમજ મજબૂત કરવા ૫ તબક્કાની ઉપચારાત્મક યોજના જરૂરી છે.`,
          requiredMaterials: ["કાંકરા અથવા બીજ (૧૫-૨૦)", "નાના કાગળના વાટકા", "ચોક અને સ્લેટ", "સચિત્ર કાર્યપત્રક"],
          reassessmentCriteria: "૫ માંથી ૪ પ્રશ્નોના સાચા જવાબ (૮૦% ગુણ) મેળવે ત્યારે આ સંકલ્પના પૂર્ણ ગણાશે.",
          teacherInstructions: "બાળક સાથે સહાનુભૂતિપૂર્વક કામ લો. ભૂલોને શીખવાની તક ગણી પ્રોત્સાહન આપો.",
          steps: [
            { stepNumber: 1, title: "પૂર્વજ્ઞાન દ્રઢીકરણ (૫ મિ.)", description: "અગાઉ શીખેલા સરવાળા અને બાદબાકીનું ઝડપી પુનરાવર્તન કરાવો.", durationMinutes: 5 },
            { stepNumber: 2, title: "પ્રત્યક્ષ સાધનોથી સમજ (૮ મિ.)", description: "૧૨ કાંકરા ૩ બાળકો વચ્ચે સરખા વહેંચીને ભાગાકારનો ખ્યાલ આપો.", durationMinutes: 8 },
            { stepNumber: 3, title: "ચિત્રાત્મક રજૂઆત (૭ મિ.)", description: "નોટબુકમાં ગોળ દોરી તેમાં ટપકાં સરખા જૂથમાં વહેંચવા કહો.", durationMinutes: 7 },
            { stepNumber: 4, title: "જોડીમાં મહાવરો (૫ મિ.)", description: "સાથી વિદ્યાર્થી સાથે બેસાડી સાદા કોયડા ઉકેલાવો.", durationMinutes: 5 },
            { stepNumber: 5, title: "પુનઃમૂલ્યાંકન (૫ મિ.)", description: "૫ પ્રશ્નો પૂછી સંકલ્પનાની સ્વતંત્ર સમજ અને ૮૦% બેન્ચમાર્ક સિદ્ધિ ચકાસો.", durationMinutes: 5 },
          ],
        };
      }
      return {
        content: JSON.stringify(finalPlan),
        data: finalPlan,
      };
    };

    const prompt = `Student Name: ${studentName}
Concept: ${conceptName}
Latest Performance: ${pct}%
Language: ${isGujarati ? "Gujarati" : "English"}

Generate a personalized 5-step primary school remedial action plan.`;

    const aiResult = await generateAiContent<RemedialPlan>(
      {
        prompt,
        responseFormat: "json",
      },
      fallbackGenerator
    );

    const generated = aiResult.data || baseEnginePlan;

    // Persist plan in repository
    await remedialPlanRepository.saveCustom(generated);

    return {
      plan: generated,
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    };
  }

  async updatePlan(id: string, updates: Partial<RemedialPlan>): Promise<RemedialPlan | null> {
    return remedialPlanRepository.update(id, updates);
  }
}

export const remedialService = new RemedialService();

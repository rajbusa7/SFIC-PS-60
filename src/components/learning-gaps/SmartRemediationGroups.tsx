"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  SmartRemediationGroup,
  RemediationGroupMember,
  removeStudentFromGroup,
  addStudentToGroup,
  acceptGroup,
  dismissGroup,
  generateGroup5StepPlan,
} from "@/lib/engine/smartGroupingEngine";
import {
  Users,
  Layers,
  Check,
  X,
  Plus,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Wrench,
  ShieldCheck,
  Undo2,
} from "lucide-react";

interface SmartRemediationGroupsProps {
  groups: SmartRemediationGroup[];
  onUpdateGroup: (updatedGroup: SmartRemediationGroup) => void;
  availableClassStudents?: Array<{ id: string; name: string }>;
}

export function SmartRemediationGroups({
  groups,
  onUpdateGroup,
  availableClassStudents = [
    { id: "std-jay", name: "Jay Patel" },
    { id: "std-priya", name: "Priya Solanki" },
    { id: "std-harsh", name: "Harsh Chavda" },
    { id: "std-sneha", name: "Sneha Barot" },
    { id: "std-chirag", name: "Chirag Parmar" },
    { id: "std-sanvi", name: "Sanvi Parekh" },
    { id: "std-ishaan", name: "Ishaan Solanki" },
    { id: "std-anvi", name: "Anvi Bhatt" },
    { id: "std-yash", name: "Yash Trivedi" },
  ],
}: SmartRemediationGroupsProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const [generatingForGroupId, setGeneratingForGroupId] = useState<string | null>(null);
  const [generatedPlanSuccess, setGeneratedPlanSuccess] = useState<Record<string, boolean>>({});
  const [showDismissed, setShowDismissed] = useState(false);

  const activeGroups = groups.filter((g) =>
    showDismissed ? g.status === "dismissed" : g.status !== "dismissed"
  );

  const handleRemove = (group: SmartRemediationGroup, studentId: string) => {
    const updated = removeStudentFromGroup(group, studentId);
    onUpdateGroup(updated);
  };

  const handleAdd = (group: SmartRemediationGroup, studentId: string, studentName: string) => {
    const updated = addStudentToGroup(group, { studentId, studentName });
    onUpdateGroup(updated);
    setAddingToGroupId(null);
  };

  const handleAccept = (group: SmartRemediationGroup) => {
    const updated = acceptGroup(group);
    onUpdateGroup(updated);
  };

  const handleDismiss = (group: SmartRemediationGroup) => {
    const updated = dismissGroup(group);
    onUpdateGroup(updated);
  };

  const handleRestore = (group: SmartRemediationGroup) => {
    const updated: SmartRemediationGroup = {
      ...group,
      status: "suggested",
    };
    onUpdateGroup(updated);
  };

  const handleGeneratePlan = async (group: SmartRemediationGroup) => {
    setGeneratingForGroupId(group.id);
    try {
      // Reuse existing 5-step plan generation engine
      const groupPlan = generateGroup5StepPlan(group);

      // Persist plan via API
      const res = await fetch("/api/remedial-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: groupPlan,
        }),
      });

      const updatedGroup: SmartRemediationGroup = {
        ...group,
        status: "accepted",
        planGenerated: true,
        generatedPlanId: groupPlan.id,
      };
      onUpdateGroup(updatedGroup);

      setGeneratedPlanSuccess((prev) => ({
        ...prev,
        [group.id]: true,
      }));
    } catch (e) {
      console.error("Failed to generate group plan", e);
    } finally {
      setGeneratingForGroupId(null);
    }
  };

  return (
    <Card
      variant="glass"
      className="p-4 sm:p-5 border-[#49352F]/15 bg-gradient-to-r from-[#FAF6E9] via-white to-[#F2DCB5]/40 shadow-[0_4px_20px_rgba(73,53,47,0.06)] space-y-4 text-[#49352F]"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#49352F]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2E7D5E]/15 text-[#2E7D5E] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-sm sm:text-base font-bold text-[#49352F]">
                Smart Remediation Grouping
              </h3>
              <Badge variant="mint" size="sm">
                AI Cohort Assistant
              </Badge>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#2E7D5E] bg-[#EAF4EE] px-2 py-0.5 rounded-full border border-[#2E7D5E]/20">
                <ShieldCheck className="w-3 h-3" />
                Teacher in Control
              </span>
            </div>
            <p className="text-[11px] text-[#7A6862]">
              Clusters students sharing root prerequisite gaps so you can assign targeted small-group interventions in one click.
            </p>
          </div>
        </div>

        {/* Controls: Dismissed toggle & Accordion toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setShowDismissed(!showDismissed)}
            className="text-[11px] font-semibold text-[#7A6862] hover:text-[#49352F] underline underline-offset-2 cursor-pointer"
          >
            {showDismissed ? "Show Active Suggestions" : "View Dismissed"}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSectionOpen(!isSectionOpen)}
            className="rounded-full text-xs bg-white text-[#49352F] border-[#49352F]/15 hover:bg-[#FAF6E9]"
          >
            <span>{isSectionOpen ? "Collapse Groups" : "Expand Groups"}</span>
            {isSectionOpen ? (
              <ChevronUp className="w-3.5 h-3.5 ml-1" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isSectionOpen && (
        <div className="space-y-4 pt-1">
          {activeGroups.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-[#49352F]/10 text-center space-y-2 text-[#7A6862]">
              <Info className="w-5 h-5 mx-auto text-[#B26A1B]" />
              <p className="text-xs font-semibold text-[#49352F]">
                {showDismissed
                  ? "No dismissed suggestions."
                  : "All suggested remediation groups have been processed or dismissed."}
              </p>
              {showDismissed && (
                <button
                  type="button"
                  onClick={() => setShowDismissed(false)}
                  className="text-xs text-[#B26A1B] underline font-bold"
                >
                  Return to Active Suggestions
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeGroups.map((group) => {
                const isAccepted = group.status === "accepted";
                const isPlanDone = Boolean(group.planGenerated || generatedPlanSuccess[group.id]);

                return (
                  <div
                    key={group.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                      isAccepted
                        ? "bg-gradient-to-r from-[#EAF4EE]/70 via-white to-[#FAF6E9] border-[#2E7D5E]/30 shadow-xs"
                        : "bg-white border-[#49352F]/15 hover:border-[#49352F]/30 shadow-xs"
                    }`}
                  >
                    {/* Group Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#49352F]/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#B26A1B] text-white">
                          {group.groupLabel}
                        </span>
                        <h4 className="font-heading font-bold text-sm text-[#49352F]">
                          {group.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6E9] border border-[#49352F]/10 text-[#49352F]">
                          <Clock className="w-2.5 h-2.5 text-[#B26A1B]" />
                          <span>{group.estimatedDuration}</span>
                        </span>
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Accepted</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Shared Obstacle & Suggested Intervention Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#FBECE9]/60 border border-[#C54738]/20 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#A93327] flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3" />
                          Shared Issue:
                        </span>
                        <p className="font-bold text-[#49352F] text-[11px] leading-tight">
                          {group.sharedIssue}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FFFBEB]/70 border border-[#B26A1B]/20 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#8D4E10] flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          Suggested Intervention:
                        </span>
                        <p className="font-bold text-[#49352F] text-[11px] leading-tight">
                          {group.suggestedIntervention}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#7A6862] leading-relaxed">
                      <strong className="text-[#49352F]">Pedagogical Rationale:</strong> {group.groupRationale}
                    </p>

                    {/* Student Member Chips (With Remove Interaction) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] uppercase font-bold text-[#7A6862] tracking-wider">
                          Group Members ({group.students.length} Students):
                        </span>
                        <span className="text-[10px] text-[#7A6862] italic">
                          Click &times; to remove student
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {group.students.map((student) => (
                          <span
                            key={student.studentId}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              student.isCustomAdded
                                ? "bg-[#EAF4EE] text-[#2E7D5E] border-[#2E7D5E]/30"
                                : "bg-[#FAF6E9] text-[#49352F] border-[#49352F]/15"
                            }`}
                            title={`Score: ${student.currentScore}% | Misconception: ${student.errorPattern || group.sharedIssue}`}
                          >
                            <span>{student.studentName}</span>
                            <span className="text-[10px] text-[#7A6862]">({student.currentScore}%)</span>
                            {student.isCustomAdded && (
                              <span className="text-[9px] uppercase font-bold text-[#2E7D5E]">
                                (Added)
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemove(group, student.studentId)}
                              className="w-3.5 h-3.5 rounded-full hover:bg-[#C54738]/20 hover:text-[#C54738] flex items-center justify-center text-[#7A6862] ml-0.5 cursor-pointer"
                              title={`Remove ${student.studentName} from this group`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}

                        {/* Add Student Button / Inline Selector */}
                        {addingToGroupId === group.id ? (
                          <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-[#B26A1B]/40 shadow-xs">
                            <select
                              aria-label="Select student to add"
                              onChange={(e) => {
                                const selected = availableClassStudents.find((s) => s.id === e.target.value);
                                if (selected) {
                                  handleAdd(group, selected.id, selected.name);
                                }
                              }}
                              defaultValue=""
                              className="text-xs bg-transparent outline-none text-[#49352F] cursor-pointer"
                            >
                              <option value="" disabled>
                                Select student...
                              </option>
                              {availableClassStudents
                                .filter((s) => !group.students.some((m) => m.studentId === s.id))
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setAddingToGroupId(null)}
                              className="text-[#7A6862] hover:text-[#C54738] p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddingToGroupId(group.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-[#B26A1B] bg-[#FFFBEB] hover:bg-[#F2DCB5] border border-[#B26A1B]/30 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Student</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Teacher Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#49352F]/10">
                      {/* Left: Dismiss or Restore */}
                      {group.status === "dismissed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(group)}
                          className="rounded-full text-xs text-[#2E7D5E] border-[#2E7D5E]/30 hover:bg-[#EAF4EE]"
                        >
                          <Undo2 className="w-3 h-3 mr-1" />
                          <span>Restore Suggestion</span>
                        </Button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDismiss(group)}
                          className="text-[11px] font-semibold text-[#7A6862] hover:text-[#C54738] transition-colors cursor-pointer"
                        >
                          Dismiss Suggestion
                        </button>
                      )}

                      {/* Right: Accept & Generate Group Plan */}
                      <div className="flex items-center gap-2">
                        {!isAccepted && group.status !== "dismissed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccept(group)}
                            className="rounded-full text-xs bg-white text-[#2E7D5E] border-[#2E7D5E]/30 hover:bg-[#EAF4EE] font-semibold"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>Accept Group</span>
                          </Button>
                        )}

                        <Button
                          variant="saffron"
                          size="sm"
                          onClick={() => handleGeneratePlan(group)}
                          disabled={generatingForGroupId === group.id || isPlanDone}
                          className="rounded-full text-xs font-bold shadow-xs"
                        >
                          <Layers className="w-3.5 h-3.5 mr-1" />
                          <span>
                            {generatingForGroupId === group.id
                              ? "Generating Plan..."
                              : isPlanDone
                              ? "✓ 5-Step Plan Generated"
                              : "Generate Group 5-Step Plan"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

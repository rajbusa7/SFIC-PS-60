"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  buildLearningGapMap,
  LearningGapMapData,
  LearningGapMapNode,
  MapNodeRole,
} from "@/lib/engine/prerequisiteEngine";
import type { MasteryStatus } from "@shared/types";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowDown,
  Target,
  GitFork,
  Layers,
  ArrowRight,
  Info,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface LearningGapMapProps {
  gap: any;
  studentName?: string;
}

export function LearningGapMap({ gap, studentName }: LearningGapMapProps) {
  const mapData: LearningGapMapData = React.useMemo(() => {
    return buildLearningGapMap(gap);
  }, [gap]);

  const { nodes, rootGap, currentGap, affectedConcepts, recommendedLearningOrder } = mapData;

  // Helper for role-specific badge styling matching StudySaathi visual language
  const getRoleBadge = (role: MapNodeRole, isRoot: boolean, isCurrent: boolean) => {
    if (isRoot) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#C54738] text-white shadow-xs">
          <Target className="w-3 h-3" />
          <span>ROOT GAP (REMEDIATE FIRST)</span>
        </span>
      );
    }
    if (isCurrent) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#B26A1B] text-white shadow-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>CURRENT GAP (FLAGGED)</span>
        </span>
      );
    }
    if (role === "AFFECTED CONCEPT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#49352F] text-[#FAF6E9] shadow-xs">
          <ShieldAlert className="w-3 h-3 text-[#F2CAB3]" />
          <span>AFFECTED CONCEPT (BLOCKED)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20">
        <CheckCircle2 className="w-3 h-3" />
        <span>PREREQUISITE</span>
      </span>
    );
  };

  // Helper for node status badge (Needs Support, Developing, Mastered)
  const getStatusBadge = (status: MasteryStatus) => {
    switch (status) {
      case "Mastered":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/25">
            <CheckCircle2 className="w-3 h-3 text-[#2E7D5E]" />
            <span>Mastered</span>
          </span>
        );
      case "Developing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#B26A1B] border border-[#B26A1B]/25">
            <Clock className="w-3 h-3 text-[#B26A1B]" />
            <span>Developing</span>
          </span>
        );
      case "Needs Support":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBECE9] text-[#C54738] border border-[#C54738]/25">
            <AlertTriangle className="w-3 h-3 text-[#C54738]" />
            <span>Needs Support</span>
          </span>
        );
    }
  };

  // Node container card background & border styling adhering strictly to StudySaathi palette
  const getNodeCardStyles = (node: LearningGapMapNode) => {
    if (node.isRoot) {
      return "bg-gradient-to-r from-[#FBECE9] via-white to-[#FAF6E9] border-2 border-[#C54738] shadow-[0_4px_16px_rgba(197,71,56,0.12)]";
    }
    if (node.isCurrent) {
      return "bg-gradient-to-r from-[#FFFBEB] via-white to-[#FAF6E9] border-2 border-[#B26A1B] shadow-[0_4px_16px_rgba(178,106,27,0.1)]";
    }
    if (node.isAffected) {
      return "bg-[#FAF6E9]/80 border border-[#49352F]/20 opacity-95";
    }
    if (node.status === "Mastered") {
      return "bg-gradient-to-r from-[#EAF4EE] via-white to-[#FAF6E9] border border-[#2E7D5E]/30";
    }
    return "bg-white border border-[#49352F]/15";
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 text-[#49352F] space-y-5 animate-in fade-in-50 duration-200">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#B26A1B]/15 flex items-center justify-center text-[#B26A1B] shrink-0">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#49352F]">
              Learning Gap Map • Prerequisite Dependency Graph
            </h4>
            <p className="text-[11px] text-[#7A6862]">
              Interactive visual progression distinguishing foundational root obstacles from target difficulties.
            </p>
          </div>
        </div>

        {/* Status Legend Pill Group */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="font-semibold text-[#7A6862] mr-1">Status:</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#EAF4EE] text-[#2E7D5E] font-medium border border-[#2E7D5E]/20">
            <CheckCircle2 className="w-2.5 h-2.5" /> Mastered
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#B26A1B] font-medium border border-[#B26A1B]/20">
            <Clock className="w-2.5 h-2.5" /> Developing
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FBECE9] text-[#C54738] font-medium border border-[#C54738]/20">
            <AlertTriangle className="w-2.5 h-2.5" /> Needs Support
          </span>
        </div>
      </div>

      {/* Diagnostic Context Bar */}
      {rootGap && (
        <div className="p-3 rounded-xl bg-white border border-[#49352F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-start sm:items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FBECE9] text-[#C54738] shrink-0">
              <Target className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-[#49352F]">
                Root Obstacle Identified:{" "}
                <span className="text-[#C54738] underline decoration-wavy underline-offset-2">
                  {rootGap.name}
                </span>
              </span>
              <p className="text-[11px] text-[#7A6862] mt-0.5">
                {studentName ? `${studentName}'s` : "Student's"} difficulty in{" "}
                <strong>{currentGap?.name}</strong> stems directly from an unmastered prerequisite in{" "}
                <strong>{rootGap.name}</strong>.
              </p>
            </div>
          </div>
          <Badge variant="coral" size="sm">
            Action: Remediate {rootGap.name} First
          </Badge>
        </div>
      )}

      {/* Visual Dependency Graph (Vertical Flow with Directional Connectors) */}
      <div className="space-y-0 relative py-1">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const nextNode = !isLast ? nodes[index + 1] : null;
          const isTransitionBlocked = Boolean(
            (node.isRoot || node.status === "Needs Support") &&
              nextNode &&
              (nextNode.isCurrent || nextNode.isAffected)
          );

          return (
            <React.Fragment key={node.id}>
              {/* Concept Node Card */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl transition-all ${getNodeCardStyles(
                  node
                )}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Left: Role, Title, Grade */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#49352F]/10 text-[#49352F] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {node.orderIndex}
                      </span>
                      {getRoleBadge(node.role, node.isRoot, node.isCurrent)}
                      {node.grade && (
                        <span className="text-[10px] text-[#7A6862] font-semibold bg-[#FAF6E9] px-2 py-0.5 rounded-full border border-[#49352F]/10">
                          Class {node.grade}
                        </span>
                      )}
                    </div>

                    <div className="pt-0.5">
                      <h5 className="font-heading font-bold text-sm sm:text-base text-[#49352F]">
                        {node.name}
                      </h5>
                      {node.nameGujarati && (
                        <span className="text-xs text-[#7A6862] block">
                          {node.nameGujarati}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(node.status)}
                  </div>
                </div>

                {/* Node Note / Diagnostic Guidance */}
                {node.note && (
                  <p className="text-[11px] text-[#7A6862] mt-2 pt-2 border-t border-[#49352F]/10 leading-relaxed">
                    {node.note}
                  </p>
                )}
              </div>

              {/* Directional Downward Connector Arrow */}
              {!isLast && (
                <div className="flex flex-col items-center justify-center py-1 sm:py-1.5 relative">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 sm:h-5 w-0.5 ${
                        isTransitionBlocked
                          ? "bg-gradient-to-b from-[#C54738] to-[#B26A1B] border-dashed"
                          : "bg-[#2E7D5E]"
                      }`}
                    />
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#49352F]/15 text-[10px] font-bold shadow-xs">
                    <ArrowDown
                      className={`w-3 h-3 ${
                        isTransitionBlocked ? "text-[#C54738]" : "text-[#2E7D5E]"
                      }`}
                    />
                    <span
                      className={
                        isTransitionBlocked ? "text-[#C54738]" : "text-[#2E7D5E]"
                      }
                    >
                      {isTransitionBlocked
                        ? "Prerequisite Obstacle (Blocks Progression)"
                        : "Prerequisite Flow (Enables Mastery)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 sm:h-5 w-0.5 ${
                        isTransitionBlocked
                          ? "bg-gradient-to-b from-[#B26A1B] to-[#C54738]"
                          : "bg-[#2E7D5E]"
                      }`}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Recommended Learning Order Section */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#49352F]/12 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#49352F]">
          <Layers className="w-4 h-4 text-[#B26A1B]" />
          <span>Recommended Learning Order (Pedagogical Remediation Sequence)</span>
        </div>

        {/* Step-by-Step Flow Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {recommendedLearningOrder.map((conceptName, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === recommendedLearningOrder.length - 1;
            const isRootStep = Boolean(rootGap && rootGap.name === conceptName);
            const isCurrentStep = Boolean(currentGap && currentGap.name === conceptName);

            return (
              <React.Fragment key={idx}>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold text-xs shadow-2xs ${
                    isRootStep
                      ? "bg-[#FBECE9] border-[#C54738]/40 text-[#C54738]"
                      : isCurrentStep
                      ? "bg-[#FFFBEB] border-[#B26A1B]/40 text-[#B26A1B]"
                      : "bg-[#FAF6E9] border-[#49352F]/12 text-[#49352F]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      isRootStep
                        ? "bg-[#C54738]"
                        : isCurrentStep
                        ? "bg-[#B26A1B]"
                        : "bg-[#2E7D5E]"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{conceptName}</span>
                  {isRootStep && (
                    <span className="text-[9.5px] uppercase font-bold text-[#C54738]">
                      (Root)
                    </span>
                  )}
                  {isCurrentStep && (
                    <span className="text-[9.5px] uppercase font-bold text-[#B26A1B]">
                      (Target)
                    </span>
                  )}
                </div>

                {!isLast && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#B26A1B] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Actionable Pedagogical Insight */}
        <p className="text-[11px] text-[#7A6862] leading-relaxed pt-1 border-t border-[#49352F]/10">
          <strong className="text-[#49352F]">Pedagogical Rationale:</strong> Rather
          than repeatedly drilling the student on <em>{currentGap?.name}</em>, the
          teacher should first remediate the Root Gap (
          <strong>{rootGap?.name || currentGap?.name}</strong>) using hands-on concrete
          manipulatives. Once prerequisite mastery is solidified, progression into{" "}
          <em>{currentGap?.name}</em> and downstream competencies proceeds naturally.
        </p>
      </div>
    </div>
  );
}

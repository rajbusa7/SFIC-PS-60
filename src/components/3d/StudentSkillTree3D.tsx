"use client";

import React, { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Eye, LayoutGrid, Sparkles, BrainCircuit, ArrowRight, X } from "lucide-react";

export interface SkillNode {
  id: string;
  name: string;
  subject: string;
  score: number; // 0 to 100
  status: "mastered" | "gap" | "developing" | "locked";
  reason?: string;
  baselineScore?: number;
  position: [number, number, number];
  connectedTo?: string[];
}

interface StudentSkillTree3DProps {
  studentName: string;
  skills: SkillNode[];
  onSelectSkill?: (skill: SkillNode) => void;
  onGeneratePlan?: (skill: SkillNode) => void;
}

function SkillTreeMesh({
  skills,
  selectedSkill,
  onSelect,
}: {
  skills: SkillNode[];
  selectedSkill: SkillNode | null;
  onSelect: (skill: SkillNode) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const getNodeColor = (status: SkillNode["status"]) => {
    switch (status) {
      case "mastered":
        return "#3DDBA9"; // Mint
      case "gap":
        return "#FF5C6C"; // Coral
      case "developing":
        return "#FF8A3D"; // Saffron
      case "locked":
        return "#475569"; // Slate grey
    }
  };

  return (
    <group ref={groupRef}>
      {/* Connecting Branch Cables */}
      {skills.map((source) =>
        source.connectedTo?.map((targetId) => {
          const target = skills.find((s) => s.id === targetId);
          if (!target) return null;

          const points = [
            new THREE.Vector3(...source.position),
            new THREE.Vector3(...target.position),
          ];
          const curve = new THREE.LineCurve3(points[0], points[1]);
          const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.03, 8, false);

          const isGapPath = source.status === "gap" || target.status === "gap";
          const lineColor = isGapPath ? "#FF5C6C" : source.status === "mastered" ? "#3DDBA9" : "#6366F1";

          return (
            <mesh key={`${source.id}-${targetId}`} geometry={tubeGeo}>
              <meshStandardMaterial
                color={lineColor}
                emissive={lineColor}
                emissiveIntensity={isGapPath ? 0.8 : 0.3}
                roughness={0.4}
              />
            </mesh>
          );
        })
      )}

      {/* Skill Nodes */}
      {skills.map((skill) => {
        const isSelected = selectedSkill?.id === skill.id;
        const color = getNodeColor(skill.status);
        const isGap = skill.status === "gap";

        return (
          <group key={skill.id} position={skill.position}>
            {/* Main Skill Node Sphere */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(skill);
              }}
              scale={isSelected ? [1.35, 1.35, 1.35] : [1, 1, 1]}
            >
              <sphereGeometry args={[0.3, 24, 24]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isGap ? 1.4 : isSelected ? 0.9 : 0.4}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>

            {/* Pulsing Outer Ring for Gaps */}
            {isGap && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.45, 0.02, 8, 24]} />
                <meshStandardMaterial
                  color="#FF5C6C"
                  emissive="#FF5C6C"
                  emissiveIntensity={1.8}
                />
              </mesh>
            )}

            {/* Glowing Orbit Ring for Mastered */}
            {skill.status === "mastered" && (
              <mesh rotation={[0.4, 0.4, 0]}>
                <torusGeometry args={[0.42, 0.015, 8, 24]} />
                <meshStandardMaterial
                  color="#3DDBA9"
                  emissive="#3DDBA9"
                  emissiveIntensity={1}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function StudentSkillTree3D({
  studentName,
  skills,
  onSelectSkill,
  onGeneratePlan,
}: StudentSkillTree3DProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(
    skills.find((s) => s.status === "gap") || skills[0] || null
  );
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");

  const handleSelect = (skill: SkillNode) => {
    setSelectedSkill(skill);
    if (onSelectSkill) onSelectSkill(skill);
  };

  return (
    <div className="relative w-full rounded-3xl bg-[#0d0c28] border border-slate-800 overflow-hidden shadow-2xl select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#14123D]/80">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-amber-400" />
          <h3 className="font-heading text-base font-bold text-white">
            {studentName}&apos;s 3D Skill Progression Tree
          </h3>
          <Badge variant="mint" size="sm">
            Live Pedagogical Graph
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "3d" ? "2d" : "3d")}
            className="rounded-full text-xs h-7"
          >
            {viewMode === "3d" ? <LayoutGrid className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
            <span>{viewMode === "3d" ? "2D Hierarchy" : "3D Tree"}</span>
          </Button>
        </div>
      </div>

      {/* Main Container: Tree Canvas + Side Panel Drawer */}
      <div className="relative flex flex-col lg:flex-row h-[420px]">
        {/* 3D Canvas / 2D Grid */}
        <div className="flex-1 relative h-full">
          {viewMode === "3d" ? (
            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[4, 5, 3]} intensity={1.5} color="#FFD59E" />
              <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#3DDBA9" />

              <Suspense fallback={null}>
                <SkillTreeMesh
                  skills={skills}
                  selectedSkill={selectedSkill}
                  onSelect={handleSelect}
                />
              </Suspense>

              <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 2.5} />
            </Canvas>
          ) : (
            <div className="p-5 overflow-y-auto h-full space-y-2.5">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => handleSelect(skill)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedSkill?.id === skill.id
                      ? "bg-slate-800/90 border-amber-500/80 shadow-md"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        skill.status === "mastered"
                          ? "bg-emerald-400 shadow-[0_0_8px_#3DDBA9]"
                          : skill.status === "gap"
                          ? "bg-rose-400 shadow-[0_0_8px_#FF5C6C] animate-pulse"
                          : skill.status === "developing"
                          ? "bg-amber-400"
                          : "bg-slate-600"
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{skill.name}</h4>
                      <span className="text-[10px] text-slate-400">{skill.subject}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black ${
                        skill.status === "mastered"
                          ? "text-emerald-400"
                          : skill.status === "gap"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      {skill.score}%
                    </span>
                    <Badge
                      variant={
                        skill.status === "mastered"
                          ? "mastered"
                          : skill.status === "gap"
                          ? "needsSupport"
                          : "developing"
                      }
                      size="sm"
                    >
                      {skill.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend Bottom Bar */}
          <div className="absolute bottom-3 left-4 z-10 flex items-center gap-3 text-[10px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 backdrop-blur-md">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#3DDBA9]" /> Mastered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF5C6C] animate-pulse" /> Pulsing Gap
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF8A3D]" /> Developing
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#475569]" /> Locked
            </span>
          </div>
        </div>

        {/* Selected Skill Detail Side Panel */}
        {selectedSkill && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#14123D]/95 p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400">
                    {selectedSkill.subject}
                  </span>
                  <h4 className="font-heading text-lg font-bold text-white leading-tight mt-0.5">
                    {selectedSkill.name}
                  </h4>
                </div>
                <Badge
                  variant={
                    selectedSkill.status === "mastered"
                      ? "mastered"
                      : selectedSkill.status === "gap"
                      ? "needsSupport"
                      : "developing"
                  }
                  size="sm"
                  dot
                >
                  {selectedSkill.status === "gap" ? "Learning Gap" : selectedSkill.status}
                </Badge>
              </div>

              {/* Score Display */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Current Score
                  </span>
                  <span
                    className={`font-heading text-2xl font-black ${
                      selectedSkill.score >= 80
                        ? "text-emerald-400"
                        : selectedSkill.score >= 60
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {selectedSkill.score}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Target Threshold
                  </span>
                  <span className="font-heading text-2xl font-black text-slate-200">
                    60% / 80%
                  </span>
                </div>
              </div>

              {/* Explainable AI Reason */}
              {selectedSkill.reason && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Rule-Engine Diagnosis
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {selectedSkill.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              {selectedSkill.status === "gap" && (
                <Button
                  variant="saffron"
                  size="sm"
                  onClick={() => onGeneratePlan && onGeneratePlan(selectedSkill)}
                  className="w-full rounded-xl text-xs font-black shadow-md shadow-amber-500/30"
                >
                  <span>Generate 5-Step Remedial Plan</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

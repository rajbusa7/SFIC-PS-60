"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface RobotSceneState {
  progress: number; // 0 to 5 (across the 6 scenes)
  sceneIndex: number;
}

interface HumanoidShikshaBotProps {
  sceneState: RobotSceneState;
  scale?: number;
  position?: [number, number, number];
}

export function HumanoidShikshaBot({
  sceneState,
  scale = 1.1,
  position = [1.2, -0.65, 0],
}: HumanoidShikshaBotProps) {
  const robotGroupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const chestRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const pupilLeftRef = useRef<THREE.Mesh>(null);
  const pupilRightRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const faceLightRef = useRef<THREE.PointLight>(null);

  const [isBlinking, setIsBlinking] = useState(false);
  const { pointer } = useThree();

  // Natural blinking interval
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 4200);
    return () => clearInterval(blinkInterval);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const p = sceneState.progress; // continuous scroll progress

    // 1. Natural Breathing & Floating Idle Motion
    const breath = Math.sin(t * 1.6) * 0.035;

    // 2. Scene-Driven Kinematics (Choreographed across the 6 narrative scenes)
    // Scene 0 -> Hero: center-right, looking slightly left
    // Scene 1 -> Challenge: glides closer to camera, head tilts thoughtfully
    // Scene 2 -> Solution: shifts right to clear space for holographic panels, orbits slightly
    // Scene 3 -> Remedial: raises right arm toward learning path
    // Scene 4 -> Analytics: proud posture, subtle elevation, looking upward
    // Scene 5 -> Final CTA: settles gracefully, welcoming open stance
    let targetX = position[0];
    let targetY = position[1] + breath;
    let targetZ = position[2];
    let targetRotY = -0.15; // slightly facing camera left towards hero text
    let targetRightArmRotX = 0;
    let targetRightArmRotZ = -0.05;

    if (p <= 1) {
      // Transition from Scene 0 (Hero) to Scene 1 (Challenge)
      const u = p;
      targetX = THREE.MathUtils.lerp(1.2, 0.8, u);
      targetY = THREE.MathUtils.lerp(-0.65, -0.45, u) + breath;
      targetZ = THREE.MathUtils.lerp(0, 0.5, u);
      targetRotY = THREE.MathUtils.lerp(-0.15, -0.3, u);
    } else if (p <= 2) {
      // Transition from Scene 1 to Scene 2 (Understand / Holographic Diagnostics)
      const u = p - 1;
      targetX = THREE.MathUtils.lerp(0.8, 1.45, u);
      targetY = THREE.MathUtils.lerp(-0.45, -0.6, u) + breath;
      targetZ = THREE.MathUtils.lerp(0.5, -0.2, u);
      targetRotY = THREE.MathUtils.lerp(-0.3, -0.45, u);
    } else if (p <= 3) {
      // Transition from Scene 2 to Scene 3 (Path Forward / Raising Arm)
      const u = p - 2;
      targetX = THREE.MathUtils.lerp(1.45, 1.3, u);
      targetY = THREE.MathUtils.lerp(-0.6, -0.55, u) + breath;
      targetZ = THREE.MathUtils.lerp(-0.2, 0.1, u);
      targetRotY = THREE.MathUtils.lerp(-0.45, -0.2, u);
      // Raise right arm gesture
      targetRightArmRotX = THREE.MathUtils.lerp(0, -0.85, u);
      targetRightArmRotZ = THREE.MathUtils.lerp(-0.05, -0.35, u);
    } else if (p <= 4) {
      // Transition from Scene 3 to Scene 4 (Make Improvement Visible)
      const u = p - 3;
      targetX = THREE.MathUtils.lerp(1.3, 1.1, u);
      targetY = THREE.MathUtils.lerp(-0.55, -0.5, u) + breath;
      targetZ = THREE.MathUtils.lerp(0.1, 0.3, u);
      targetRotY = THREE.MathUtils.lerp(-0.2, -0.1, u);
      targetRightArmRotX = THREE.MathUtils.lerp(-0.85, -0.2, u);
    } else {
      // Transition to Scene 5 (Final CTA)
      const u = Math.min(1, p - 4);
      targetX = THREE.MathUtils.lerp(1.1, 0.9, u);
      targetY = THREE.MathUtils.lerp(-0.5, -0.58, u) + breath;
      targetZ = THREE.MathUtils.lerp(0.3, 0, u);
      targetRotY = THREE.MathUtils.lerp(-0.1, 0, u);
    }

    if (robotGroupRef.current) {
      robotGroupRef.current.position.x = THREE.MathUtils.lerp(robotGroupRef.current.position.x, targetX, delta * 3.5);
      robotGroupRef.current.position.y = THREE.MathUtils.lerp(robotGroupRef.current.position.y, targetY, delta * 3.5);
      robotGroupRef.current.position.z = THREE.MathUtils.lerp(robotGroupRef.current.position.z, targetZ, delta * 3.5);
      robotGroupRef.current.rotation.y = THREE.MathUtils.lerp(robotGroupRef.current.rotation.y, targetRotY, delta * 3.5);
    }

    // 3. Right Arm Gesture Animation
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, targetRightArmRotX, delta * 4);
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetRightArmRotZ, delta * 4);
    }

    // 4. Subtle Chest Respiration
    if (chestRef.current) {
      chestRef.current.rotation.x = Math.sin(t * 1.6) * 0.02;
    }

    // 5. Head Tracking & Cursor Responsiveness
    if (headRef.current) {
      const headCursorY = pointer.x * 0.55;
      const headCursorX = -pointer.y * 0.35;
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, headCursorY, delta * 4);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, headCursorX, delta * 4);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, -pointer.x * 0.08, delta * 3);
    }

    // 6. Pupil Tracking & Natural Blinking
    const blinkScale = isBlinking ? 0.08 : 1;
    if (pupilLeftRef.current) {
      pupilLeftRef.current.position.x = THREE.MathUtils.lerp(pupilLeftRef.current.position.x, -0.14 + pointer.x * 0.07, delta * 8);
      pupilLeftRef.current.position.y = THREE.MathUtils.lerp(pupilLeftRef.current.position.y, pointer.y * 0.05, delta * 8);
      pupilLeftRef.current.scale.y = THREE.MathUtils.lerp(pupilLeftRef.current.scale.y, blinkScale, delta * 25);
    }
    if (pupilRightRef.current) {
      pupilRightRef.current.position.x = THREE.MathUtils.lerp(pupilRightRef.current.position.x, 0.14 + pointer.x * 0.07, delta * 8);
      pupilRightRef.current.position.y = THREE.MathUtils.lerp(pupilRightRef.current.position.y, pointer.y * 0.05, delta * 8);
      pupilRightRef.current.scale.y = THREE.MathUtils.lerp(pupilRightRef.current.scale.y, blinkScale, delta * 25);
    }

    // 7. Luminous Halo Pulse
    if (haloRef.current) {
      const pulse = 3.2 + Math.sin(t * 3.2) * 0.6;
      (haloRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <group ref={robotGroupRef} position={position} scale={scale} dispose={null}>
      {/* ============================================================== */}
      {/* 1. HEAD & VISOR ASSEMBLY                                      */}
      {/* ============================================================== */}
      <group ref={headRef} position={[0, 1.38, 0]}>
        {/* Pearl White Sculpted Helmet Shell */}
        <mesh castShadow receiveShadow position={[0, 0, -0.04]}>
          <sphereGeometry args={[0.42, 36, 36]} />
          <meshStandardMaterial
            color="#f1f5f9"
            roughness={0.12}
            metalness={0.08}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Sculpted Chin & Jaw Plate */}
        <mesh position={[0, -0.22, 0.12]} rotation={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.22, 0.18, 28]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.18} metalness={0.12} />
        </mesh>

        {/* Recessed Dark Visor Face Screen */}
        <mesh position={[0, 0.02, 0.18]} scale={[1, 1.28, 0.82]}>
          <sphereGeometry args={[0.32, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial
            color="#04060c"
            roughness={0.04}
            metalness={0.92}
          />
        </mesh>

        {/* GLOWING CYAN HALO RING (Target Image 2 Landmark) */}
        <mesh ref={haloRef} position={[0, 0.04, 0.36]} scale={[1, 1.45, 0.3]}>
          <torusGeometry args={[0.23, 0.038, 24, 72]} />
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={3.6}
            toneMapped={false}
          />
        </mesh>

        {/* Soft Blue Face Glow Point Light onto Torso */}
        <pointLight
          ref={faceLightRef}
          position={[0, 0.04, 0.45]}
          color="#00f0ff"
          intensity={2.2}
          distance={1.5}
        />

        {/* Digital Pupil Eye Left */}
        <mesh ref={pupilLeftRef} position={[-0.14, 0.01, 0.33]}>
          <sphereGeometry args={[0.04, 18, 18]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>

        {/* Digital Pupil Eye Right */}
        <mesh ref={pupilRightRef} position={[0.14, 0.01, 0.33]}>
          <sphereGeometry args={[0.04, 18, 18]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>

        {/* Top Antenna Node */}
        <mesh position={[0, 0.44, -0.04]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.51, -0.04]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>

        {/* Lateral Ear Actuators */}
        <mesh position={[-0.43, 0.02, -0.04]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 0.06, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0.43, 0.02, -0.04]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 0.06, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 2. TITANIUM CERVICAL NECK                                     */}
      {/* ============================================================== */}
      <group position={[0, 1.0, -0.03]}>
        <mesh>
          <cylinderGeometry args={[0.065, 0.075, 0.22, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <torusGeometry args={[0.095, 0.018, 16, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <torusGeometry args={[0.105, 0.02, 16, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 3. PEARL TORSO & CHEST CHASSIS (Unitree/Mira Style)           */}
      {/* ============================================================== */}
      <group ref={chestRef} position={[0, 0.54, 0]}>
        {/* Sculpted Front Breastplate */}
        <mesh castShadow receiveShadow position={[0, 0.12, 0.04]}>
          <boxGeometry args={[0.84, 0.58, 0.46]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.12}
            metalness={0.08}
            envMapIntensity={1.4}
          />
        </mesh>

        {/* Chest Plate Badge Emblem (SHIKSHASETU) */}
        <mesh position={[0, 0.23, 0.28]}>
          <boxGeometry args={[0.36, 0.09, 0.02]} />
          <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.23, 0.295]}>
          <planeGeometry args={[0.28, 0.015]} />
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>

        {/* Mechanical Flank Vents Left */}
        <mesh position={[-0.35, 0.06, 0.08]} rotation={[0, 0.28, 0]}>
          <boxGeometry args={[0.12, 0.34, 0.3]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.35} />
        </mesh>

        {/* Mechanical Flank Vents Right */}
        <mesh position={[0.35, 0.06, 0.08]} rotation={[0, -0.28, 0]}>
          <boxGeometry args={[0.12, 0.34, 0.3]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.35} />
        </mesh>

        {/* ============================================================ */}
        {/* 4. SHOULDERS & ARTICULATED ARMS                              */}
        {/* ============================================================ */}
        {/* Left Arm Assembly */}
        <group ref={leftArmRef} position={[-0.55, 0.26, 0]}>
          {/* Shoulder Sphere */}
          <mesh>
            <sphereGeometry args={[0.155, 24, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.08} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.16, 0.015, 16, 32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* Bicep Casing */}
          <mesh position={[-0.04, -0.32, 0]}>
            <cylinderGeometry args={[0.075, 0.065, 0.38, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} />
          </mesh>
          {/* Elbow Joint */}
          <mesh position={[-0.04, -0.54, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.12, 18]} />
            <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.04, -0.78, 0.04]}>
            <cylinderGeometry args={[0.06, 0.05, 0.36, 18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} />
          </mesh>
          {/* Hand */}
          <mesh position={[-0.04, -1.02, 0.05]}>
            <boxGeometry args={[0.08, 0.12, 0.04]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>

        {/* Right Arm Assembly (Articulated for Gestures) */}
        <group ref={rightArmRef} position={[0.55, 0.26, 0]}>
          {/* Shoulder Sphere */}
          <mesh>
            <sphereGeometry args={[0.155, 24, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.08} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.16, 0.015, 16, 32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* Bicep Casing */}
          <mesh position={[0.04, -0.32, 0]}>
            <cylinderGeometry args={[0.075, 0.065, 0.38, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} />
          </mesh>
          {/* Elbow Joint */}
          <mesh position={[0.04, -0.54, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.12, 18]} />
            <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.04, -0.78, 0.04]}>
            <cylinderGeometry args={[0.06, 0.05, 0.36, 18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} />
          </mesh>
          {/* Hand */}
          <mesh position={[0.04, -1.02, 0.05]}>
            <boxGeometry args={[0.08, 0.12, 0.04]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* ============================================================== */}
      {/* 5. MECHANICAL WAIST SUSPENSION & COIL SPRING                  */}
      {/* ============================================================== */}
      <group position={[0, 0.06, 0]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.38, 24]} />
          <meshStandardMaterial color="#080c16" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Chrome Coils */}
        {[-0.11, -0.04, 0.03, 0.1].map((yOffset, i) => (
          <mesh key={i} position={[0, yOffset, 0]}>
            <torusGeometry args={[0.13, 0.02, 16, 32]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.08} />
          </mesh>
        ))}
        {/* Dual Actuator Rods */}
        <mesh position={[-0.18, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.34, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0.18, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.34, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 6. PELVIC CHASSIS & THIGH ACTUATORS                           */}
      {/* ============================================================== */}
      <group position={[0, -0.32, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.26, 0.34, 0.28, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.16} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[0.18, 0.14, 0.05]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Left Hip Joint & Thigh Mount */}
        <group position={[-0.24, -0.16, 0]}>
          <mesh>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.11, 0.09, 0.34, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} />
          </mesh>
        </group>

        {/* Right Hip Joint & Thigh Mount */}
        <group position={[0.24, -0.16, 0]}>
          <mesh>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.11, 0.09, 0.34, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

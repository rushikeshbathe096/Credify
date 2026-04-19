"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Points, PointMaterial } from "@react-three/drei";

// Define the 4 states for the entity
type EntityState = "idle" | "thinking" | "speaking" | "success";

interface ParticleLayerProps {
  count: number;
  color: string;
  size: number;
  radius: number;
  speed: number;
  state: EntityState;
  layerType: "outer" | "mid" | "core";
}

function ParticleLayer({ count, color, size, radius, speed, state, layerType }: ParticleLayerProps) {
  const pointsRef = useRef<THREE.Points>(null!);

  // Initialize particle positions
  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initPos = [];
    for (let i = 0; i < count; i++) {
      // Random spherical distribution
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      initPos.push(new THREE.Vector3(x, y, z));
    }
    return [pos, initPos];
  }, [count, radius]);

  useFrame((stateObj, delta) => {
    const time = stateObj.clock.getElapsedTime();
    const positionsAttr = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      let x = initialPositions[i].x;
      let y = initialPositions[i].y;
      let z = initialPositions[i].z;

      if (state === "idle") {
        // Brownian-like drift
        const phase = i * 0.1;
        x += Math.sin(time * speed + phase) * 0.05;
        y += Math.cos(time * speed * 1.1 + phase) * 0.05;
        z += Math.sin(time * speed * 0.9 + phase) * 0.05;
      } else if (state === "thinking") {
        // Sine wave directional flow
        const wave = Math.sin(time * 5 + initialPositions[i].x * 2) * 0.2;
        x += wave;
      } else if (state === "speaking") {
        // Frequency modulation Simulation (noise-based for now)
        const noise = (Math.random() - 0.5) * 0.15;
        x *= (1 + noise);
        y *= (1 + noise);
        z *= (1 + noise);
      }

      // Special rotation per layer
      if (layerType === "outer") {
        const rotationSpeed = time * 0.2;
        const rx = x * Math.cos(rotationSpeed) - z * Math.sin(rotationSpeed);
        const rz = x * Math.sin(rotationSpeed) + z * Math.cos(rotationSpeed);
        positionsAttr.setXYZ(i, rx, y, rz);
      } else if (layerType === "mid") {
        // Lissajous curve drift
        const lissaX = x + Math.sin(time * 0.8 + i) * 0.1;
        const lissaY = y + Math.cos(time * 0.5 + i) * 0.1;
        positionsAttr.setXYZ(i, lissaX, lissaY, z);
      } else {
        // Core Nucleus Pulse
        const pulse = 1 + Math.sin(time * 5) * 0.05;
        positionsAttr.setXYZ(i, x * pulse, y * pulse, z * pulse);
      }
    }
    positionsAttr.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export default function AIEntity({ state = "idle" }: { state?: EntityState }) {
  return (
    <div className="w-[300px] h-[300px] relative overflow-hidden flex items-center justify-center">
      {/* Background Aurora Gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-credify-cyan/5 via-transparent to-transparent opacity-40 animate-pulse" />

      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <group>
          {/* Outer Ring: 70 particles, Cyan */}
          <ParticleLayer
            count={70}
            color="#00E5FF"
            size={0.12}
            radius={2.2}
            speed={0.5}
            state={state}
            layerType="outer"
          />

          {/* Mid Layer: 45 particles, Electric Blue */}
          <ParticleLayer
            count={45}
            color="#3B82F6"
            size={0.08}
            radius={1.5}
            speed={0.8}
            state={state}
            layerType="mid"
          />

          {/* Core Nucleus: 120 particles, White */}
          <ParticleLayer
            count={120}
            color="#FFFFFF"
            size={0.04}
            radius={0.6}
            speed={1.5}
            state={state}
            layerType="core"
          />
        </group>
      </Canvas>

      {/* Depth Fog Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-black/5 backdrop-blur-[1px] rounded-full scale-95 opacity-50" />
    </div>
  );
}

import { useEffect, useMemo, useRef } from 'react';
import { ShaderMaterial, Color, DoubleSide } from 'three';
import { useFrame } from '@react-three/fiber';

interface WaterFlowMaterialProps {
  baseColor: string;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uWaterColor;
  varying vec2 vUv;

  void main() {
    float flowSpeed = uTime * 2.5;

    // Flowing streaks along the slide (vUv.y = length direction)
    float streaks = sin(vUv.y * 40.0 + flowSpeed) * 0.5 + 0.5;
    streaks = pow(streaks, 3.0);

    // Edge foam at the sides of the U-shape
    float edgeDist = abs(vUv.x - 0.5) * 2.0;
    float foam = smoothstep(0.6, 0.9, edgeDist);
    float foamNoise = sin(vUv.y * 80.0 + flowSpeed * 1.5) * 0.5 + 0.5;
    foam *= foamNoise;

    // Base color is dominant — water streaks add a subtle shimmer
    vec3 color = uBaseColor;
    color = mix(color, uWaterColor, streaks * 0.25);
    color = mix(color, vec3(1.0), foam * 0.5);
    // Subtle center darkening for depth
    float centerDarken = 1.0 - (1.0 - abs(vUv.x - 0.5) * 2.0) * 0.15;
    color *= centerDarken;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function WaterFlowMaterial({ baseColor }: WaterFlowMaterialProps) {
  const materialRef = useRef<ShaderMaterial>(null);

  // Create uniforms once — never recreate the object so R3F doesn't replace the material
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBaseColor: { value: new Color(baseColor) },
    uWaterColor: { value: new Color('#a8f0ff') },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // When the chunk color prop changes, push the new color into the existing uniform
  useEffect(() => {
    uniforms.uBaseColor.value.set(baseColor);
    if (materialRef.current) {
      materialRef.current.uniforms.uBaseColor.value.set(baseColor);
    }
  }, [baseColor, uniforms]);

  useFrame((_state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      side={DoubleSide}
    />
  );
}

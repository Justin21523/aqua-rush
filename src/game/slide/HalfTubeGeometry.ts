import { BufferGeometry, Float32BufferAttribute, Vector3, CatmullRomCurve3 } from 'three';

/**
 * Custom geometry that creates a U-shaped (half-tube) slide.
 * Unlike ExtrudeGeometry, this maintains a consistent "up" direction
 * relative to the world, preventing the slide from twisting.
 */
export class HalfTubeGeometry extends BufferGeometry {
  constructor(
    curve: CatmullRomCurve3,
    tubularSegments: number,
    radius: number,
    radialSegments: number = 16 // Only half circle, so fewer segments needed
  ) {
    super();

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const worldUp = new Vector3(0, 1, 0);

    // Generate vertices along the curve
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();

      // Calculate stable right vector (perpendicular to tangent and world up)
      let right = new Vector3().crossVectors(worldUp, tangent).normalize();
      if (right.lengthSq() < 0.001) {
        right.set(1, 0, 0); // Fallback
      }

      // Calculate local up (perpendicular to both tangent and right)
      const localUp = new Vector3().crossVectors(tangent, right).normalize();

      // Generate U-shaped cross-section (bottom 180 degrees only)
      // We go from -90° to +90° (or -PI/2 to +PI/2) to create the U shape
      // Generate U-shaped cross-section
      for (let j = 0; j <= radialSegments; j++) {
        // Map j to angle [PI, 2*PI] to create the bottom half (U-shape).
        // PI = left edge, 3PI/2 = bottom, 2PI = right edge.
        const angle = Math.PI + (j / radialSegments) * Math.PI;

        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        // Position: center + right * (cos * radius) + localUp * (sin * radius)
        const vertex = new Vector3()
          .copy(point)
          .addScaledVector(right, cos * radius)
          .addScaledVector(localUp, sin * radius);

        positions.push(vertex.x, vertex.y, vertex.z);

        // Calculate the normal vector in world space.
        // It points inward (toward the center of the tube) so the inside is lit correctly.
        const worldNormal = new Vector3()
          .copy(right).multiplyScalar(cos)
          .add(localUp.clone().multiplyScalar(sin))
          .normalize()
          .negate(); // Invert to point inward
        
        normals.push(worldNormal.x, worldNormal.y, worldNormal.z);

        // UV coordinates
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }

    // Generate indices (triangles)
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = a + 1;
        const c = (i + 1) * (radialSegments + 1) + j;
        const d = c + 1;

        // Two triangles per quad, wound counter-clockwise for correct face culling
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    // Apply the generated attributes to the BufferGeometry
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}
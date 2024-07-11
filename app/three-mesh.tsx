'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Rep } from './page';

interface ThreeMeshProps {
  lightRefs: React.RefObject<THREE.DirectionalLight>[];
  data: Rep[] | null;
  manualTime?: Date;
}

const ThreeMesh: React.FC<ThreeMeshProps> = ({
  lightRefs,
  data,
  manualTime
}) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const sunRef = useRef<THREE.Mesh>(null);
  const { scene } = useThree();

  const props = useTexture({
    map: '/earth-assets/earth_no_clouds_8k.jpg',
    bumpMap: '/earth-assets/earth_elev_bump_8k.jpg',
    specularMap: '/earth-assets/earth_water_8k.png',
    emissiveMap: '/earth-assets/earth_night_8k.jpg'
  });

  const sunMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      }),
    []
  );

  const calculateSunPosition = (date: Date): THREE.Vector3 => {
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    const manualOffset = 12; // 12-hour manual offset

    // Calculate the angle of the sun (in radians)
    const totalSeconds = (hour + manualOffset) * 3600 + minute * 60 + second;
    const angle = ((totalSeconds % 86400) / 86400) * Math.PI * 2; // Ensure 24-hour cycle

    // Calculate the day of the year (0-365)
    const start = new Date(date.getUTCFullYear(), 0, 0);
    const diff =
      date.getTime() -
      start.getTime() +
      (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Calculate solar declination angle
    const declination =
      -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
    const declinationRad = declination * (Math.PI / 180);

    // Calculate sun position (reversed rotation)
    const x = Math.cos(angle);
    const y = Math.sin(declinationRad);
    const z = Math.sin(angle);

    return new THREE.Vector3(x, y, z).normalize();
  };

  useEffect(() => {
    const currentTime = manualTime || new Date();
    const sunPosition = calculateSunPosition(currentTime);

    // Update light position
    lightRefs.forEach((lightRef) => {
      if (lightRef.current) {
        const lightPosition = sunPosition.clone().multiplyScalar(50);
        lightRef.current.position.copy(lightPosition);
        lightRef.current.lookAt(new THREE.Vector3(0, 0, 0));
      }
    });

    // Update sun visualization position
    if (sunRef.current) {
      sunRef.current.position.copy(sunPosition.clone().multiplyScalar(10));
    }

    // Update Earth's axial tilt
    if (earthRef.current) {
      const axialTilt = 23.5 * (Math.PI / 180); // 23.5 degrees in radians
      earthRef.current.rotation.x = axialTilt;
    }
  }, [manualTime, lightRefs]);

  return (
    <>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          bumpScale={0.005}
          displacementScale={0.02}
          emissive={'lightyellow'}
          emissiveIntensity={0.1}
          {...props}
        />
      </mesh>
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <primitive object={sunMaterial} attach="material" />
      </mesh>
    </>
  );
};

export default ThreeMesh;

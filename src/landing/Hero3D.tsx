import { Environment, Float, Lightformer, RoundedBox, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import type { Group } from 'three'

const FONT = '/fonts/space-grotesk-latin-600-normal.woff'
const MONO = '/fonts/space-grotesk-latin-500-normal.woff'

const TILES = [
  {
    title: 'Ship the deck',
    time: '09:00',
    pos: [0.1, 1.8, -0.3],
    rot: [0.1, 0.35, -0.08],
    accent: true,
  },
  { title: 'Deep work', time: '10:30', pos: [3.0, 0.7, -1.0], rot: [-0.05, -0.4, 0.06] },
  { title: 'Call mom', time: '17:00', pos: [-0.4, -0.6, -2.0], rot: [0.12, 0.45, 0.05] },
  { title: 'Gym · 45m', time: '18:15', pos: [2.5, -1.5, -0.2], rot: [-0.1, -0.3, -0.1] },
  { title: 'Inbox zero', time: '12:00', pos: [2.6, 2.4, -2.4], rot: [0.2, 0.05, 0.04] },
  {
    title: 'Plan tomorrow',
    time: '21:00',
    pos: [0.2, -2.4, -1.0],
    rot: [-0.15, -0.1, 0.05],
    accent: true,
  },
] as const

function Tile({
  title,
  time,
  accent,
  ...props
}: {
  title: string
  time: string
  accent?: boolean
  position: readonly number[]
  rotation: readonly number[]
}) {
  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.8}>
      <group
        position={props.position as [number, number, number]}
        rotation={props.rotation as [number, number, number]}
      >
        <RoundedBox args={[2.4, 0.9, 0.18]} radius={0.16} smoothness={6}>
          <meshPhysicalMaterial
            color={accent ? '#ff6b3d' : '#1c2230'}
            roughness={0.18}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.15}
            transmission={accent ? 0 : 0.35}
            thickness={0.6}
            ior={1.4}
          />
        </RoundedBox>
        <mesh position={[-0.88, 0, 0.1]}>
          <ringGeometry args={[0.11, 0.15, 32]} />
          <meshBasicMaterial color={accent ? '#1a0a04' : '#9aa4b2'} />
        </mesh>
        <Text
          font={FONT}
          fontSize={0.2}
          position={[-0.64, 0.06, 0.1]}
          anchorX="left"
          anchorY="middle"
          color={accent ? '#1a0a04' : '#e9ecee'}
        >
          {title}
        </Text>
        <Text
          font={MONO}
          fontSize={0.11}
          letterSpacing={0.12}
          position={[-0.64, -0.18, 0.1]}
          anchorX="left"
          anchorY="middle"
          color={accent ? '#1a0a04' : '#7cc4ff'}
        >
          {time}
        </Text>
      </group>
    </Float>
  )
}

/** Tilts the whole cloud of tiles toward the pointer, smoothly. */
function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null)
  const { pointer } = useThree()
  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    g.rotation.y += (pointer.x * 0.25 - g.rotation.y) * Math.min(1, delta * 3)
    g.rotation.x += (-pointer.y * 0.15 - g.rotation.x) * Math.min(1, delta * 3)
  })
  return (
    <group ref={group} scale={0.82} position={[-0.3, 0, 0]}>
      {children}
    </group>
  )
}

export default function Hero3D() {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  // Stop rendering once the hero scrolls out of view.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        className="!absolute inset-0"
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        aria-hidden
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 6, 5]} intensity={1.6} />
        <Rig>
          {TILES.map((t) => (
            <Tile
              key={t.title}
              title={t.title}
              time={t.time}
              accent={'accent' in t}
              position={t.pos}
              rotation={t.rot}
            />
          ))}
        </Rig>
        {/* Studio light made from shapes, so no HDR file is downloaded. */}
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 2, 1]} />
          <Lightformer
            form="rect"
            intensity={2}
            color="#ff6b3d"
            position={[-5, 0, 2]}
            scale={[2, 6, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2}
            color="#7cc4ff"
            position={[5, 0, 2]}
            scale={[2, 6, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  )
}

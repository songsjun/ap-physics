// @vitest-environment node
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '@/lib/types'

type Concept = {
  id: string
  unit: number
  ced_topic: string
  ced_topic_name: string
}

type Resource = {
  id: string
  type: string
  platform?: string
  url?: string
  concepts: string[]
}

type ContentLibrary = {
  concepts: Concept[]
  resources: Resource[]
}

const AP_PHYSICS_1_FALL_2024_TOPICS: Record<string, string> = {
  '1.1': 'Scalars and Vectors in One Dimension',
  '1.2': 'Displacement, Velocity, and Acceleration',
  '1.3': 'Representing Motion',
  '1.4': 'Reference Frames and Relative Motion',
  '1.5': 'Vectors and Motion in Two Dimensions',
  '2.1': 'Systems and Center of Mass',
  '2.2': 'Forces and Free-Body Diagrams',
  '2.3': "Newton's Third Law",
  '2.4': "Newton's First Law",
  '2.5': "Newton's Second Law",
  '2.6': 'Gravitational Force',
  '2.7': 'Kinetic and Static Friction',
  '2.8': 'Spring Forces',
  '2.9': 'Circular Motion',
  '3.1': 'Translational Kinetic Energy',
  '3.2': 'Work',
  '3.3': 'Potential Energy',
  '3.4': 'Conservation of Energy',
  '3.5': 'Power',
  '4.1': 'Linear Momentum',
  '4.2': 'Change in Momentum and Impulse',
  '4.3': 'Conservation of Linear Momentum',
  '4.4': 'Elastic and Inelastic Collisions',
  '5.1': 'Rotational Kinematics',
  '5.2': 'Connecting Linear and Rotational Motion',
  '5.3': 'Torque',
  '5.4': 'Rotational Inertia',
  '5.5': "Rotational Equilibrium and Newton's First Law in Rotational Form",
  '5.6': "Newton's Second Law in Rotational Form",
  '6.1': 'Rotational Kinetic Energy',
  '6.2': 'Torque and Work',
  '6.3': 'Angular Momentum and Angular Impulse',
  '6.4': 'Conservation of Angular Momentum',
  '6.5': 'Rolling',
  '6.6': 'Motion of Orbiting Satellites',
  '7.1': 'Defining Simple Harmonic Motion (SHM)',
  '7.2': 'Frequency and Period of SHM',
  '7.3': 'Representing and Analyzing SHM',
  '7.4': 'Energy of Simple Harmonic Oscillators',
  '8.1': 'Internal Structure and Density',
  '8.2': 'Pressure',
  '8.3': "Fluids and Newton's Laws",
  '8.4': 'Fluids and Conservation Laws',
}

const TEACHING_RESOURCE_TYPES = new Set(['video', 'reading', 'article', 'interactive'])
const PRACTICE_RESOURCE_TYPES = new Set(['exercise'])
const KHAN_PREFIX = 'xf557a762645cccc5'
const KHAN_AP_PHYSICS_1_BASE = 'https://www.khanacademy.org/science/ap-college-physics-1'
const KHAN_AP_PHYSICS_1_COURSE_CHALLENGE = `${KHAN_AP_PHYSICS_1_BASE}/test/${KHAN_PREFIX}:course-challenge`
const KHAN_ACTIVITY_TYPES: Record<string, readonly string[]> = {
  a: ['reading', 'article'],
  e: ['exercise'],
  quiz: ['exercise'],
  test: ['exercise'],
  v: ['video'],
}
const KHAN_SKILL_TOPIC_CROSSWALK: Record<string, readonly string[]> = {
  [`${KHAN_PREFIX}:kinematics/${KHAN_PREFIX}:scalars-and-vectors-in-1d`]: ['1.1', '1.2', '1.4'],
  [`${KHAN_PREFIX}:kinematics/${KHAN_PREFIX}:visual-models-of-motion`]: ['1.2', '1.3'],
  [`${KHAN_PREFIX}:kinematics/${KHAN_PREFIX}:mathematical-models-of-motion`]: ['1.2', '1.3'],
  [`${KHAN_PREFIX}:kinematics/${KHAN_PREFIX}:motion-in-2d`]: ['1.4', '1.5'],
  [`${KHAN_PREFIX}:force-and-translational-dynamics/${KHAN_PREFIX}:forces-and-systems`]: [
    '2.2',
    '2.3',
  ],
  [`${KHAN_PREFIX}:force-and-translational-dynamics/${KHAN_PREFIX}:forces-and-acceleration`]: [
    '2.1',
    '2.4',
    '2.5',
  ],
  [`${KHAN_PREFIX}:force-and-translational-dynamics/${KHAN_PREFIX}:gravitational-force`]: [
    '2.4',
    '2.6',
    '2.9',
  ],
  [`${KHAN_PREFIX}:force-and-translational-dynamics/${KHAN_PREFIX}:frictional-force`]: ['2.7'],
  [`${KHAN_PREFIX}:force-and-translational-dynamics/${KHAN_PREFIX}:spring-force`]: ['2.8'],
  [`${KHAN_PREFIX}:force-and-translational-dynamics/${KHAN_PREFIX}:circular-motion`]: ['2.9'],
  [`${KHAN_PREFIX}:work-energy-and-power/${KHAN_PREFIX}:translational-kinetic-energy-and-work`]: [
    '3.1',
    '3.2',
  ],
  [`${KHAN_PREFIX}:work-energy-and-power/${KHAN_PREFIX}:potential-energy`]: ['3.3'],
  [`${KHAN_PREFIX}:work-energy-and-power/${KHAN_PREFIX}:untitled-271`]: ['2.7', '3.4', '4.3'],
  [`${KHAN_PREFIX}:work-energy-and-power/${KHAN_PREFIX}:power`]: ['3.2', '3.5'],
  [`${KHAN_PREFIX}:linear-momentum/${KHAN_PREFIX}:linear-momentum-and-impulse`]: ['4.1', '4.2'],
  [`${KHAN_PREFIX}:linear-momentum/${KHAN_PREFIX}:untitled-303`]: ['4.3', '4.4'],
  [`${KHAN_PREFIX}:linear-momentum/${KHAN_PREFIX}:center-of-mass`]: ['2.1'],
  [`${KHAN_PREFIX}:torque-and-rotational-dynamics/${KHAN_PREFIX}:untitled-320`]: ['5.1', '5.2'],
  [`${KHAN_PREFIX}:torque-and-rotational-dynamics/${KHAN_PREFIX}:torque`]: ['5.3', '5.5'],
  [`${KHAN_PREFIX}:torque-and-rotational-dynamics/${KHAN_PREFIX}:newton-s-second-law-in-rotational-form`]: [
    '5.4',
    '5.6',
  ],
  [`${KHAN_PREFIX}:energy-and-momentum-of-rotating-systems/${KHAN_PREFIX}:rotational-kinetic-energy`]: [
    '6.1',
    '6.2',
    '6.5',
  ],
  [`${KHAN_PREFIX}:energy-and-momentum-of-rotating-systems/${KHAN_PREFIX}:angular-momentum`]: [
    '6.1',
    '6.2',
    '6.3',
    '6.4',
  ],
  [`${KHAN_PREFIX}:energy-and-momentum-of-rotating-systems/${KHAN_PREFIX}:conservation-of-angular-momentum`]: [
    '6.3',
    '6.4',
  ],
  [`${KHAN_PREFIX}:energy-and-momentum-of-rotating-systems/${KHAN_PREFIX}:satellites-and-orbits`]: [
    '6.6',
  ],
  [`${KHAN_PREFIX}:oscillations/${KHAN_PREFIX}:simple-harmonic-oscillators`]: ['7.1', '7.2', '7.3'],
  [`${KHAN_PREFIX}:oscillations/${KHAN_PREFIX}:period-of-simple-harmonic-oscillators`]: ['7.2'],
  [`${KHAN_PREFIX}:oscillations/${KHAN_PREFIX}:energy-of-simple-harmonic-oscillator`]: ['7.4'],
  [`${KHAN_PREFIX}:fluids/${KHAN_PREFIX}:untitled-354`]: ['8.1', '8.2'],
  [`${KHAN_PREFIX}:fluids/${KHAN_PREFIX}:buoyant-force`]: ['8.3'],
  [`${KHAN_PREFIX}:fluids/${KHAN_PREFIX}:fluid-flow`]: ['8.4'],
}

const contentLibrary = JSON.parse(
  readFileSync(join(__dirname, '../../data/content_library.json'), 'utf8'),
) as ContentLibrary

const conceptById = new Map(contentLibrary.concepts.map(concept => [concept.id, concept]))

const questions = JSON.parse(
  readFileSync(join(__dirname, '../../public/quiz-bank.json'), 'utf8'),
) as QuizQuestion[]

function conceptsForTopic(topic: string) {
  return contentLibrary.concepts.filter(concept => concept.ced_topic === topic)
}

function resourcesForConcepts(conceptIds: Set<string>) {
  return contentLibrary.resources.filter(resource =>
    resource.concepts.some(conceptId => conceptIds.has(conceptId)),
  )
}

function quizzesForConcepts(conceptIds: Set<string>) {
  return questions.filter(question =>
    question.concept_ids.some(conceptId => conceptIds.has(conceptId)),
  )
}

function normalizeUrl(url: string) {
  const parsed = new URL(url)
  parsed.hash = ''
  parsed.search = ''
  return decodeURI(parsed.toString()).replace(/%3A/gi, ':')
}

function cedTopicsForResource(resource: Resource) {
  return resource.concepts
    .map(conceptId => conceptById.get(conceptId)?.ced_topic)
    .filter((topic): topic is string => Boolean(topic))
}

describe('AP Physics 1 Fall 2024 CED coverage', () => {
  it('uses only official Fall 2024 CED topics', () => {
    const officialTopics = new Set(Object.keys(AP_PHYSICS_1_FALL_2024_TOPICS))

    for (const concept of contentLibrary.concepts) {
      expect(officialTopics.has(concept.ced_topic), `${concept.id}: non-CED topic ${concept.ced_topic}`).toBe(true)
    }
  })

  it('has at least one concept for every official CED topic', () => {
    for (const [topic, name] of Object.entries(AP_PHYSICS_1_FALL_2024_TOPICS)) {
      const concepts = conceptsForTopic(topic)
      expect(concepts.length, `${topic} ${name}: missing concept coverage`).toBeGreaterThan(0)
    }
  })

  it('all resource and quiz concept references resolve', () => {
    const conceptIds = new Set(contentLibrary.concepts.map(concept => concept.id))

    for (const resource of contentLibrary.resources) {
      expect(resource.concepts.length, `${resource.id}: missing concepts`).toBeGreaterThan(0)
      for (const conceptId of resource.concepts) {
        expect(conceptIds.has(conceptId), `${resource.id}: unknown concept ${conceptId}`).toBe(true)
      }
    }

    for (const question of questions) {
      expect(question.concept_ids.length, `${question.id}: missing concept_ids`).toBeGreaterThan(0)
      for (const conceptId of question.concept_ids) {
        expect(conceptIds.has(conceptId), `${question.id}: unknown concept ${conceptId}`).toBe(true)
      }
    }
  })

  it('covers every official CED topic with teaching resources, practice resources, and quiz questions', () => {
    const failures: string[] = []

    for (const [topic, name] of Object.entries(AP_PHYSICS_1_FALL_2024_TOPICS)) {
      const conceptIds = new Set(conceptsForTopic(topic).map(concept => concept.id))
      const resources = resourcesForConcepts(conceptIds)
      const quizzes = quizzesForConcepts(conceptIds)

      if (!resources.some(resource => TEACHING_RESOURCE_TYPES.has(resource.type))) {
        failures.push(`${topic} ${name}: missing teaching resource`)
      }
      if (!resources.some(resource => PRACTICE_RESOURCE_TYPES.has(resource.type))) {
        failures.push(`${topic} ${name}: missing practice resource`)
      }
      if (quizzes.length === 0) {
        failures.push(`${topic} ${name}: missing quiz`)
      }
    }

    expect(failures, failures.join('\n')).toHaveLength(0)
  })

  it('uses current direct Khan AP Physics 1 URLs with matching CED topics', () => {
    const failures: string[] = []

    for (const resource of contentLibrary.resources.filter(resource => resource.platform === 'khan')) {
      if (!resource.url) {
        failures.push(`${resource.id}: missing Khan URL`)
        continue
      }

      let url: string
      try {
        url = normalizeUrl(resource.url)
      } catch {
        failures.push(`${resource.id}: invalid Khan URL ${resource.url}`)
        continue
      }

      if (!url.startsWith(`${KHAN_AP_PHYSICS_1_BASE}/`)) {
        failures.push(`${resource.id}: Khan URL must use current AP Physics 1 course path`)
        continue
      }

      if (url === KHAN_AP_PHYSICS_1_BASE || url.includes('/search')) {
        failures.push(`${resource.id}: Khan URL must be a direct lesson, practice, quiz, or test URL`)
        continue
      }

      const activityMatch = url.match(/\/(v|a|e|quiz|test)\//)
      if (!activityMatch) {
        failures.push(`${resource.id}: Khan URL missing direct activity segment`)
        continue
      }

      const expectedTypes = KHAN_ACTIVITY_TYPES[activityMatch[1]]
      if (!expectedTypes.includes(resource.type)) {
        failures.push(
          `${resource.id}: Khan ${activityMatch[1]} URL is typed ${resource.type}, expected ${expectedTypes.join('/')}`,
        )
      }

      if (url === KHAN_AP_PHYSICS_1_COURSE_CHALLENGE) continue

      const skillMatch = url.match(
        /\/science\/ap-college-physics-1\/([^/]+)\/([^/]+)\/(?:v|a|e|quiz|test)\//,
      )
      if (!skillMatch) {
        failures.push(`${resource.id}: Khan URL missing unit/skill path`)
        continue
      }

      const skillKey = `${skillMatch[1]}/${skillMatch[2]}`
      const allowedTopics = KHAN_SKILL_TOPIC_CROSSWALK[skillKey]
      if (!allowedTopics) {
        failures.push(`${resource.id}: unreviewed Khan skill path ${skillKey}`)
        continue
      }

      const allowedTopicSet = new Set(allowedTopics)
      for (const topic of cedTopicsForResource(resource)) {
        if (!allowedTopicSet.has(topic)) {
          failures.push(`${resource.id}: Khan skill ${skillKey} does not match CED topic ${topic}`)
        }
      }
    }

    expect(failures, failures.join('\n')).toHaveLength(0)
  })
})

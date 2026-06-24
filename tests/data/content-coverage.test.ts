// @vitest-environment node
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '@/lib/types'

type Concept = {
  id: string
  ced_topic: string
  ced_topic_name: string
}

type Resource = {
  id: string
  type: string
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

const contentLibrary = JSON.parse(
  readFileSync(join(__dirname, '../../data/content_library.json'), 'utf8'),
) as ContentLibrary

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
})

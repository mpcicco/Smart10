import { SLOT_KEYS, type Category, type Deck, type QuestionCard, type SlotKey } from '../types/game'

const CATEGORY_SET = new Set<Category>([
  'geografia',
  'storia',
  'scienza',
  'natura',
  'arte-e-letteratura',
  'cinema-e-tv',
  'musica',
  'sport',
  'cultura-generale',
  'cibo-e-tradizioni',
])

const SLOT_SET = new Set(SLOT_KEYS)

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const hasAllSlots = (record: Record<string, unknown>) =>
  SLOT_KEYS.every((slot) => Object.hasOwn(record, slot))

export const validateDeck = (raw: unknown): Deck => {
  if (!isObject(raw)) {
    throw new Error('Deck non valido: root non oggetto.')
  }

  const questions = raw.questions
  if (!Array.isArray(questions)) {
    throw new Error('Deck non valido: questions mancante o non array.')
  }

  const categories = raw.categories
  if (!Array.isArray(categories)) {
    throw new Error('Deck non valido: categories mancante o non array.')
  }

  for (const category of categories) {
    if (typeof category !== 'string' || !CATEGORY_SET.has(category as Category)) {
      throw new Error(`Categoria non valida nel deck: ${String(category)}`)
    }
  }

  const deck = raw as Deck
  for (const question of deck.questions) {
    validateQuestion(question)
  }

  return deck
}

const validateQuestion = (question: QuestionCard) => {
  if (!question?.id || !question.type || !question.prompt) {
    throw new Error(`Domanda non valida: campi base mancanti (${question?.id ?? 'id assente'}).`)
  }

  if (!CATEGORY_SET.has(question.category)) {
    throw new Error(`Domanda ${question.id}: categoria non valida (${question.category}).`)
  }

  if (!Array.isArray(question.slots) || question.slots.length !== 10) {
    throw new Error(`Domanda ${question.id}: slots deve contenere esattamente 10 elementi.`)
  }

  const seen = new Set<SlotKey>()
  for (const slot of question.slots) {
    if (!SLOT_SET.has(slot.key)) {
      throw new Error(`Domanda ${question.id}: key slot non valida (${slot.key}).`)
    }

    if (seen.has(slot.key)) {
      throw new Error(`Domanda ${question.id}: key slot duplicata (${slot.key}).`)
    }

    seen.add(slot.key)
  }

  if (!question.payload || typeof question.payload !== 'object') {
    throw new Error(`Domanda ${question.id}: payload mancante.`)
  }

  const payload = question.payload as Record<string, unknown>
  switch (question.type) {
    case 'true_false':
      assertPayloadMap(question.id, payload, 'truthBySlot')
      break
    case 'number':
      assertPayloadMap(question.id, payload, 'exactBySlot')
      break
    case 'order':
      assertPayloadMap(question.id, payload, 'rankBySlot')
      break
    case 'century_decade':
      if (payload.mode !== 'century' && payload.mode !== 'decade') {
        throw new Error(`Domanda ${question.id}: mode non valido per century_decade.`)
      }
      assertPayloadMap(question.id, payload, 'valueBySlot')
      break
    case 'color':
      assertPayloadMap(question.id, payload, 'colorBySlot')
      break
    case 'open':
      assertPayloadMap(question.id, payload, 'acceptedBySlot')
      break
    default:
      throw new Error('Domanda: tipo non supportato.')
  }
}

const assertPayloadMap = (questionId: string, payload: Record<string, unknown>, key: string) => {
  if (!isObject(payload[key])) {
    throw new Error(`Domanda ${questionId}: payload.${key} mancante o non oggetto.`)
  }

  if (!hasAllSlots(payload[key] as Record<string, unknown>)) {
    throw new Error(`Domanda ${questionId}: payload.${key} deve contenere A..J.`)
  }
}

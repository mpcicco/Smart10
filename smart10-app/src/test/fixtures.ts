import { SLOT_KEYS, type Deck, type SlotKey } from '../types/game'

const slots = SLOT_KEYS.map((key) => ({ key, label: `Opzione ${key}` }))

const truthPayload = Object.fromEntries(SLOT_KEYS.map((key) => [key, key === 'A'])) as Record<
  SlotKey,
  boolean
>

const numberPayload = Object.fromEntries(SLOT_KEYS.map((key) => [key, 8])) as Record<
  SlotKey,
  number
>

const openPayload = Object.fromEntries(
  SLOT_KEYS.map((key) => [key, [`risposta-${key.toLowerCase()}`]]),
) as Record<SlotKey, string[]>

export const fixtureDeck: Deck = {
  schemaVersion: '1.1',
  deckId: 'fixture',
  language: 'it',
  categories: [
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
  ],
  questions: [
    {
      id: 'q1',
      type: 'true_false',
      category: 'geografia',
      prompt: 'Q1',
      slots,
      payload: { truthBySlot: truthPayload },
    },
    {
      id: 'q2',
      type: 'number',
      category: 'storia',
      prompt: 'Q2',
      slots,
      payload: { exactBySlot: numberPayload, unit: 'anno' },
    },
    {
      id: 'q3',
      type: 'open',
      category: 'scienza',
      prompt: 'Q3',
      slots,
      payload: { acceptedBySlot: openPayload },
    },
  ],
}

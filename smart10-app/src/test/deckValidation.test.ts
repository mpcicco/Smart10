import { describe, expect, test } from 'vitest'
import { validateDeck } from '../game/deckValidation'
import { fixtureDeck } from './fixtures'

describe('validateDeck', () => {
  test('accetta un deck valido', () => {
    expect(validateDeck(fixtureDeck)).toEqual(fixtureDeck)
  })

  test('rifiuta domanda con meno di 10 slot', () => {
    const broken = {
      ...fixtureDeck,
      questions: [{ ...fixtureDeck.questions[0], slots: fixtureDeck.questions[0].slots.slice(0, 9) }],
    }

    expect(() => validateDeck(broken)).toThrow('slots deve contenere esattamente 10')
  })
})

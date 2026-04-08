import { describe, expect, test } from 'vitest'
import { pickNextQuestion } from '../game/questionPicker'
import { fixtureDeck } from './fixtures'

describe('questionPicker', () => {
  test('sceglie categoria pending prioritaria quando disponibile', () => {
    const result = pickNextQuestion({
      deck: fixtureDeck,
      selectedCategories: ['geografia', 'storia', 'scienza'],
      excludedQuestionIds: [],
      shownQuestionIds: [],
      pendingCategories: ['storia', 'geografia', 'scienza'],
    })

    expect(result.question?.category).toBe('storia')
    expect(result.pendingCategories).not.toContain('storia')
  })

  test('resetta shown quando tutte mostrate', () => {
    const result = pickNextQuestion({
      deck: fixtureDeck,
      selectedCategories: ['geografia', 'storia', 'scienza'],
      excludedQuestionIds: [],
      shownQuestionIds: fixtureDeck.questions.map((q) => q.id),
      pendingCategories: [],
    })

    expect(result.question).not.toBeNull()
    expect(result.shownQuestionIds.length).toBeGreaterThan(0)
  })
})

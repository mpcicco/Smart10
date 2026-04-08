import { describe, expect, test } from 'vitest'
import {
  answerTrueFalse,
  applyQuestionVote,
  createGame,
  passTurn,
  startNextRound,
} from '../game/engine'
import { fixtureDeck } from './fixtures'

const emptyStorage = {
  shownQuestionIds: [],
  excludedQuestionIds: [],
  questionVotes: {},
  pendingCategories: [],
}

describe('engine', () => {
  test('pass rimuove giocatore dal round', () => {
    const game = createGame(
      fixtureDeck,
      {
        playerNames: ['A', 'B'],
        selectedCategories: ['geografia', 'storia'],
        winTarget: 10,
      },
      emptyStorage,
    )

    const next = passTurn(game)
    expect(next.players[0].activeInRound).toBe(false)
  })

  test('true_false corretto assegna peg', () => {
    const game = createGame(
      fixtureDeck,
      {
        playerNames: ['A', 'B'],
        selectedCategories: ['geografia'],
        winTarget: 10,
      },
      emptyStorage,
    )

    expect(game.currentQuestion?.type).toBe('true_false')
    const next = answerTrueFalse(game, 'A', true)
    expect(next.players[0].roundPegs).toBe(1)
  })

  test('voto down esclude la domanda e avanza round', () => {
    const game = createGame(
      fixtureDeck,
      {
        playerNames: ['A', 'B'],
        selectedCategories: ['geografia', 'storia', 'scienza'],
        winTarget: 10,
      },
      emptyStorage,
    )

    const ended = { ...game, phase: 'voteQuestion' as const, lastRoundQuestionId: game.currentQuestion?.id ?? null }
    const voted = applyQuestionVote(ended, 'down')
    const after = startNextRound(voted)
    expect(voted.excludedQuestionIds).toContain(ended.lastRoundQuestionId as string)
    expect(after.currentQuestion?.id).not.toBe(ended.lastRoundQuestionId)
  })
})

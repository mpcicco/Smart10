import { pickNextQuestion } from './questionPicker'
import type {
  Category,
  Deck,
  GameConfig,
  GameState,
  Player,
  QuestionCard,
  SlotKey,
  StorageSnapshot,
  VoteValue,
} from '../types/game'

const nextIndex = (current: number, size: number) => (current + 1) % size

const eligiblePlayerIndexes = (state: GameState) => {
  if (!state.tiebreakPlayerIds) {
    return state.players.map((_, index) => index)
  }

  return state.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => state.tiebreakPlayerIds?.includes(player.id))
    .map(({ index }) => index)
}

const findNextActivePlayerIndex = (state: GameState, fromIndex: number): number => {
  const eligible = new Set(eligiblePlayerIndexes(state))
  const size = state.players.length
  let index = fromIndex

  for (let i = 0; i < size; i += 1) {
    index = nextIndex(index, size)
    if (eligible.has(index) && state.players[index].activeInRound) {
      return index
    }
  }

  return fromIndex
}

const activePlayersCount = (state: GameState) =>
  state.players.filter((player) => player.activeInRound).length

const evaluateRoundEnd = (state: GameState): GameState => {
  if (state.usedSlots.length >= 10 || activePlayersCount(state) === 0) {
    const players = state.players.map((player) => ({
      ...player,
      totalScore: player.totalScore + player.roundPegs,
      roundPegs: 0,
      activeInRound: false,
    }))

    const updated = {
      ...state,
      players,
      phase: 'voteQuestion' as const,
      lastRoundQuestionId: state.currentQuestion?.id ?? null,
      manualResolution: null,
    }

    return resolveVictory(updated)
  }

  return state
}

const resolveVictory = (state: GameState): GameState => {
  const maxScore = Math.max(...state.players.map((player) => player.totalScore))
  if (maxScore < state.winTarget) {
    return state
  }

  if (state.tiebreakPlayerIds) {
    const tiebreakPlayers = state.players.filter((player) =>
      state.tiebreakPlayerIds?.includes(player.id),
    )
    const tiebreakMax = Math.max(...tiebreakPlayers.map((player) => player.totalScore))
    const winners = tiebreakPlayers.filter((player) => player.totalScore === tiebreakMax)
    if (winners.length === 1) {
      return { ...state, phase: 'gameOver', winnerIds: winners.map((winner) => winner.id) }
    }

    return {
      ...state,
      phase: 'tiebreak',
      tiebreakPlayerIds: winners.map((winner) => winner.id),
    }
  }

  const leaders = state.players.filter((player) => player.totalScore === maxScore)
  if (leaders.length === 1) {
    return { ...state, phase: 'gameOver', winnerIds: leaders.map((leader) => leader.id) }
  }

  return {
    ...state,
    phase: 'tiebreak',
    tiebreakPlayerIds: leaders.map((leader) => leader.id),
  }
}

const setupRoundPlayers = (players: Player[], eligibleIds: string[] | null): Player[] =>
  players.map((player) => ({
    ...player,
    roundPegs: 0,
    activeInRound: eligibleIds ? eligibleIds.includes(player.id) : true,
    roundState: 'active',
  }))

const resolveManualSolution = (question: QuestionCard, slotKey: SlotKey): string => {
  switch (question.type) {
    case 'number':
      return String(question.payload.exactBySlot[slotKey])
    case 'order':
      return `Posizione ${question.payload.rankBySlot[slotKey]}`
    case 'century_decade':
      return question.payload.valueBySlot[slotKey]
    case 'color':
      return question.payload.colorBySlot[slotKey]
    case 'open':
      return question.payload.acceptedBySlot[slotKey].join(' / ')
    default:
      return ''
  }
}

export const createGame = (
  deck: Deck,
  config: GameConfig,
  storage: StorageSnapshot,
): GameState => {
  const players = config.playerNames.map((name, index) => ({
    id: `p${index + 1}`,
    name,
    totalScore: 0,
    roundPegs: 0,
    activeInRound: true,
    roundState: 'active' as const,
  }))

  const initial: GameState = {
    deck,
    phase: 'playing',
    players,
    selectedCategories: config.selectedCategories,
    roundStarterIndex: 0,
    currentTurnIndex: 0,
    winTarget: config.winTarget,
    currentQuestion: null,
    usedSlots: [],
    shownQuestionIds: storage.shownQuestionIds,
    excludedQuestionIds: storage.excludedQuestionIds,
    questionVotes: storage.questionVotes,
    pendingCategories: storage.pendingCategories,
    manualResolution: null,
    lastRoundQuestionId: null,
    tiebreakPlayerIds: null,
    winnerIds: [],
  }

  return startNextRound(initial)
}

export const startNextRound = (state: GameState): GameState => {
  const picker = pickNextQuestion({
    deck: state.deck,
    selectedCategories: state.selectedCategories,
    excludedQuestionIds: state.excludedQuestionIds,
    shownQuestionIds: state.shownQuestionIds,
    pendingCategories: state.pendingCategories,
  })

  if (!picker.question) {
    return { ...state, phase: 'gameOver', winnerIds: state.players.map((player) => player.id) }
  }

  const players = setupRoundPlayers(state.players, state.tiebreakPlayerIds)
  let starter = state.roundStarterIndex
  const eligible = eligiblePlayerIndexes({ ...state, players })
  if (!eligible.includes(starter)) {
    starter = eligible[0]
  }

  return {
    ...state,
    phase: state.tiebreakPlayerIds ? 'tiebreak' : 'playing',
    players,
    currentQuestion: picker.question,
    usedSlots: [],
    shownQuestionIds: picker.shownQuestionIds,
    pendingCategories: picker.pendingCategories,
    currentTurnIndex: starter,
    manualResolution: null,
  }
}

export const passTurn = (state: GameState): GameState => {
  const players = [...state.players]
  players[state.currentTurnIndex] = {
    ...players[state.currentTurnIndex],
    activeInRound: false,
    roundState: 'passed',
  }

  const nextTurn = findNextActivePlayerIndex({ ...state, players }, state.currentTurnIndex)
  return evaluateRoundEnd({ ...state, players, currentTurnIndex: nextTurn })
}

const registerAnswerResult = (state: GameState, slotKey: SlotKey, correct: boolean): GameState => {
  const players = [...state.players]
  const current = players[state.currentTurnIndex]
  const usedSlots = [...state.usedSlots, slotKey]

  players[state.currentTurnIndex] = correct
    ? { ...current, roundPegs: current.roundPegs + 1, roundState: 'active' }
    : { ...current, roundPegs: 0, activeInRound: false, roundState: 'eliminated' }

  const nextTurn = findNextActivePlayerIndex({ ...state, players }, state.currentTurnIndex)

  return evaluateRoundEnd({
    ...state,
    players,
    usedSlots,
    currentTurnIndex: nextTurn,
    manualResolution: null,
    phase: 'playing',
  })
}

export const answerTrueFalse = (state: GameState, slotKey: SlotKey, value: boolean): GameState => {
  if (!state.currentQuestion || state.currentQuestion.type !== 'true_false') return state
  if (state.usedSlots.includes(slotKey)) return state
  const expected = state.currentQuestion.payload.truthBySlot[slotKey]
  return registerAnswerResult(state, slotKey, expected === value)
}

export const prepareManualResolution = (state: GameState, slotKey: SlotKey): GameState => {
  if (!state.currentQuestion || state.currentQuestion.type === 'true_false') return state
  if (state.usedSlots.includes(slotKey)) return state

  return {
    ...state,
    phase: 'manualResolution',
    manualResolution: {
      slotKey,
      solution: resolveManualSolution(state.currentQuestion, slotKey),
    },
  }
}

export const confirmManualAnswer = (state: GameState, correct: boolean): GameState => {
  if (!state.manualResolution) return state
  return registerAnswerResult(state, state.manualResolution.slotKey, correct)
}

export const applyQuestionVote = (
  state: GameState,
  vote: VoteValue | 'skip',
): GameState => {
  if (!state.lastRoundQuestionId) return state
  const questionId = state.lastRoundQuestionId
  const questionVotes = { ...state.questionVotes }
  const excluded = new Set(state.excludedQuestionIds)
  const mappedVote: VoteValue = vote === 'up' ? 'up' : 'down'
  questionVotes[questionId] = mappedVote

  if (mappedVote === 'down') {
    excluded.add(questionId)
  }

  return {
    ...state,
    questionVotes,
    excludedQuestionIds: Array.from(excluded),
    roundStarterIndex: nextIndex(state.roundStarterIndex, state.players.length),
    phase: 'playing',
  }
}

export const currentPlayer = (state: GameState) => state.players[state.currentTurnIndex]

export const isSlotUsed = (state: GameState, slotKey: SlotKey) => state.usedSlots.includes(slotKey)

export const selectedCategoriesOrAll = (categories: Category[]) =>
  categories.length > 0 ? categories : []

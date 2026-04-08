export const SLOT_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const

export type SlotKey = (typeof SLOT_KEYS)[number]

export type QuestionType =
  | 'true_false'
  | 'number'
  | 'order'
  | 'century_decade'
  | 'color'
  | 'open'

export type Category =
  | 'geografia'
  | 'storia'
  | 'scienza'
  | 'natura'
  | 'arte-e-letteratura'
  | 'cinema-e-tv'
  | 'musica'
  | 'sport'
  | 'cultura-generale'
  | 'cibo-e-tradizioni'

export type Slot = {
  key: SlotKey
  label: string
}

type QuestionBase = {
  id: string
  category: Category
  prompt: string
  slots: Slot[]
}

export type TrueFalseQuestion = QuestionBase & {
  type: 'true_false'
  payload: { truthBySlot: Record<SlotKey, boolean> }
}

export type NumberQuestion = QuestionBase & {
  type: 'number'
  payload: { exactBySlot: Record<SlotKey, number>; unit?: string }
}

export type OrderQuestion = QuestionBase & {
  type: 'order'
  payload: { rankBySlot: Record<SlotKey, number>; orderLabel?: string }
}

export type CenturyDecadeQuestion = QuestionBase & {
  type: 'century_decade'
  payload: { mode: 'century' | 'decade'; valueBySlot: Record<SlotKey, string> }
}

export type ColorQuestion = QuestionBase & {
  type: 'color'
  payload: { colorBySlot: Record<SlotKey, string> }
}

export type OpenQuestion = QuestionBase & {
  type: 'open'
  payload: { acceptedBySlot: Record<SlotKey, string[]> }
}

export type QuestionCard =
  | TrueFalseQuestion
  | NumberQuestion
  | OrderQuestion
  | CenturyDecadeQuestion
  | ColorQuestion
  | OpenQuestion

export type Deck = {
  schemaVersion: string
  deckId: string
  language: 'it'
  categories: Category[]
  questions: QuestionCard[]
}

export type VoteValue = 'up' | 'down'

export type ManualResolution = {
  slotKey: SlotKey
  solution: string
}

export type Player = {
  id: string
  name: string
  totalScore: number
  roundPegs: number
  activeInRound: boolean
  roundState: 'active' | 'passed' | 'eliminated'
}

export type GamePhase =
  | 'setup'
  | 'playing'
  | 'manualResolution'
  | 'voteQuestion'
  | 'gameOver'
  | 'tiebreak'

export type WinTarget = 10 | 20 | 30

export type GameConfig = {
  playerNames: string[]
  selectedCategories: Category[]
  winTarget: WinTarget
}

export type StorageSnapshot = {
  shownQuestionIds: string[]
  excludedQuestionIds: string[]
  questionVotes: Record<string, VoteValue>
  pendingCategories: Category[]
}

export type GameState = {
  deck: Deck
  phase: GamePhase
  players: Player[]
  selectedCategories: Category[]
  roundStarterIndex: number
  currentTurnIndex: number
  winTarget: WinTarget
  currentQuestion: QuestionCard | null
  usedSlots: SlotKey[]
  shownQuestionIds: string[]
  excludedQuestionIds: string[]
  questionVotes: Record<string, VoteValue>
  pendingCategories: Category[]
  manualResolution: ManualResolution | null
  lastRoundQuestionId: string | null
  tiebreakPlayerIds: string[] | null
  winnerIds: string[]
}

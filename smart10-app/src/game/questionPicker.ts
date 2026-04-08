import type { Category, Deck, QuestionCard } from '../types/game'

export type PickQuestionInput = {
  deck: Deck
  selectedCategories: Category[]
  excludedQuestionIds: string[]
  shownQuestionIds: string[]
  pendingCategories: Category[]
}

export type PickQuestionOutput = {
  question: QuestionCard | null
  shownQuestionIds: string[]
  pendingCategories: Category[]
}

export const pickNextQuestion = (input: PickQuestionInput): PickQuestionOutput => {
  const {
    deck,
    selectedCategories,
    excludedQuestionIds,
    shownQuestionIds: inputShown,
    pendingCategories: inputPending,
  } = input

  const excluded = new Set(excludedQuestionIds)
  const activeQuestions = deck.questions.filter(
    (question) =>
      selectedCategories.includes(question.category) && !excluded.has(question.id),
  )

  if (activeQuestions.length === 0) {
    return { question: null, shownQuestionIds: inputShown, pendingCategories: inputPending }
  }

  const shown = new Set(inputShown)
  let candidates = activeQuestions.filter((question) => !shown.has(question.id))
  if (candidates.length === 0) {
    shown.clear()
    candidates = activeQuestions
  }

  const availableCategories = selectedCategories.filter((category) =>
    candidates.some((question) => question.category === category),
  )

  let pending = inputPending.filter((category) => availableCategories.includes(category))
  if (pending.length === 0) {
    pending = [...availableCategories]
  }

  let targetCategory = pending.find((category) =>
    candidates.some((question) => question.category === category),
  )

  if (!targetCategory) {
    pending = [...availableCategories]
    targetCategory = pending.find((category) =>
      candidates.some((question) => question.category === category),
    )
  }

  const categoryCandidates = targetCategory
    ? candidates.filter((question) => question.category === targetCategory)
    : candidates

  const finalCandidates = categoryCandidates.length > 0 ? categoryCandidates : candidates
  const selected =
    finalCandidates[Math.floor(Math.random() * finalCandidates.length)] ?? null

  if (!selected) {
    return {
      question: null,
      shownQuestionIds: Array.from(shown),
      pendingCategories: pending,
    }
  }

  shown.add(selected.id)
  pending = pending.filter((category) => category !== selected.category)

  return {
    question: selected,
    shownQuestionIds: Array.from(shown),
    pendingCategories: pending,
  }
}

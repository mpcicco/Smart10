import type { Category, StorageSnapshot, VoteValue } from '../types/game'

const STORAGE_VERSION = '1.0'
const KEY_PREFIX = 'smart10'

const keys = {
  version: `${KEY_PREFIX}.storageVersion`,
  shown: `${KEY_PREFIX}.shownQuestionIds`,
  votes: `${KEY_PREFIX}.questionVotes`,
  excluded: `${KEY_PREFIX}.excludedQuestionIds`,
  pendingCategories: `${KEY_PREFIX}.categoryCycle`,
}

const inMemoryFallback = new Map<string, string>()

const write = (key: string, value: unknown) => {
  const serialized = JSON.stringify(value)
  try {
    localStorage.setItem(key, serialized)
  } catch {
    inMemoryFallback.set(key, serialized)
  }
}

const read = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key)
    if (!value) return defaultValue
    return JSON.parse(value) as T
  } catch {
    const fallback = inMemoryFallback.get(key)
    if (!fallback) return defaultValue
    return JSON.parse(fallback) as T
  }
}

export const initializeStorage = () => {
  const current = read<string | null>(keys.version, null)
  if (current !== STORAGE_VERSION) {
    write(keys.version, STORAGE_VERSION)
  }
}

export const loadStorageSnapshot = (): StorageSnapshot => ({
  shownQuestionIds: read<string[]>(keys.shown, []),
  excludedQuestionIds: read<string[]>(keys.excluded, []),
  questionVotes: read<Record<string, VoteValue>>(keys.votes, {}),
  pendingCategories: read<Category[]>(keys.pendingCategories, []),
})

export const saveShownQuestionIds = (ids: string[]) => write(keys.shown, ids)

export const saveExcludedQuestionIds = (ids: string[]) => write(keys.excluded, ids)

export const saveVotes = (votes: Record<string, VoteValue>) => write(keys.votes, votes)

export const savePendingCategories = (categories: Category[]) =>
  write(keys.pendingCategories, categories)

export const clearExcludedAndVotes = () => {
  write(keys.excluded, [])
  write(keys.votes, {})
}

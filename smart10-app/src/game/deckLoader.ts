import { validateDeck } from './deckValidation'
import type { Deck } from '../types/game'

export const loadDeck = async (path = '/decks/demo.json'): Promise<Deck> => {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Impossibile caricare il deck: ${response.status}`)
  }

  const raw = await response.json()
  return validateDeck(raw)
}

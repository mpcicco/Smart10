import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  answerTrueFalse,
  applyQuestionVote,
  confirmManualAnswer,
  createGame,
  currentPlayer,
  passTurn,
  prepareManualResolution,
  startNextRound,
} from './game/engine'
import { loadDeck } from './game/deckLoader'
import {
  initializeStorage,
  loadStorageSnapshot,
  saveExcludedQuestionIds,
  savePendingCategories,
  saveShownQuestionIds,
  saveVotes,
} from './storage/smart10Storage'
import type { Category, Deck, GameState, SlotKey, WinTarget } from './types/game'

const DEFAULT_NAMES = ['Giocatore 1', 'Giocatore 2', 'Giocatore 3', 'Giocatore 4']

const App = () => {
  const [deck, setDeck] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<GameState | null>(null)

  useEffect(() => {
    initializeStorage()
    loadDeck()
      .then(setDeck)
      .catch((loadError: Error) => setError(loadError.message))
  }, [])

  useEffect(() => {
    if (!state) return
    saveShownQuestionIds(state.shownQuestionIds)
    saveVotes(state.questionVotes)
    saveExcludedQuestionIds(state.excludedQuestionIds)
    savePendingCategories(state.pendingCategories)
  }, [state])

  if (error) {
    return <div className="page"><h1>Errore</h1><p>{error}</p></div>
  }

  if (!deck) {
    return <div className="page"><h1>Smart10</h1><p>Caricamento deck...</p></div>
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/setup"
        element={<Setup deck={deck} onStart={(gameState) => setState(gameState)} />}
      />
      <Route
        path="/play"
        element={
          state ? (
            <Play
              state={state}
              setState={setState}
            />
          ) : (
            <Navigate to="/setup" replace />
          )
        }
      />
      <Route
        path="/vote"
        element={
          state ? (
            <Vote state={state} setState={setState} />
          ) : (
            <Navigate to="/setup" replace />
          )
        }
      />
      <Route
        path="/game-over"
        element={state ? <GameOver state={state} /> : <Navigate to="/setup" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const Home = () => {
  const navigate = useNavigate()
  return (
    <div className="page">
      <h1>Smart10 Web</h1>
      <p>Versione locale iPad. Passa il dispositivo tra i giocatori.</p>
      <button className="cta" onClick={() => navigate('/setup')}>
        Nuova partita
      </button>
    </div>
  )
}

const Setup = ({ deck, onStart }: { deck: Deck; onStart: (state: GameState) => void }) => {
  const navigate = useNavigate()
  const [playersCount, setPlayersCount] = useState(2)
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_NAMES)
  const [target, setTarget] = useState<WinTarget>(20)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(deck.categories)
  const [step, setStep] = useState(1)

  const toggleCategory = (category: Category) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    )
  }

  const submit = () => {
    if (selectedCategories.length === 0) return
    const names = playerNames.slice(0, playersCount).map((name, idx) => name.trim() || `Giocatore ${idx + 1}`)
    const game = createGame(
      deck,
      { playerNames: names, selectedCategories, winTarget: target },
      loadStorageSnapshot(),
    )
    onStart(game)
    navigate('/play')
  }

  return (
    <div className="page">
      <h1>Setup partita</h1>
      <p>Step {step} di 4</p>
      {step === 1 ? (
        <section className="panel setup-step">
          <h2>Quanti giocatori partecipano?</h2>
          <label>
            Giocatori
            <select value={playersCount} onChange={(event) => setPlayersCount(Number(event.target.value))}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel setup-step">
          <h2>Assegna un nome a ogni giocatore</h2>
          {Array.from({ length: playersCount }).map((_, index) => (
            <label key={index}>
              Nome {index + 1}
              <input
                value={playerNames[index]}
                onChange={(event) =>
                  setPlayerNames((current) => current.map((name, idx) => (idx === index ? event.target.value : name)))
                }
              />
            </label>
          ))}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="panel setup-step">
          <h2>Quali categorie vuoi usare?</h2>
          <div className="chip-grid">
            {deck.categories.map((category) => (
              <button
                key={category}
                className={`chip ${selectedCategories.includes(category) ? 'selected' : ''}`}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="panel setup-step">
          <h2>Quanti punti servono per vincere?</h2>
          <label>
            Target punti
            <select value={target} onChange={(event) => setTarget(Number(event.target.value) as WinTarget)}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </label>
          <div className="summary-card">
            <p>Giocatori: {playersCount}</p>
            <p>Categorie attive: {selectedCategories.length}</p>
            <p>Punti vittoria: {target}</p>
          </div>
        </section>
      ) : null}

      <div className="wizard-actions">
        <button className="warn" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>
          Indietro
        </button>
        {step < 4 ? (
          <button
            className="cta"
            onClick={() => setStep((current) => Math.min(4, current + 1))}
            disabled={step === 3 && selectedCategories.length === 0}
          >
            Avanti
          </button>
        ) : (
          <button className="cta" onClick={submit} disabled={selectedCategories.length === 0}>
            Avvia partita
          </button>
        )}
      </div>
    </div>
  )
}

const Play = ({
  state,
  setState,
}: {
  state: GameState
  setState: (value: GameState) => void
}) => {
  const navigate = useNavigate()
  const question = state.currentQuestion
  const player = currentPlayer(state)
  const [selectedSlot, setSelectedSlot] = useState<SlotKey | null>(null)

  useEffect(() => {
    if (state.phase === 'voteQuestion') navigate('/vote')
    if (state.phase === 'gameOver') navigate('/game-over')
  }, [navigate, state.phase])

  useEffect(() => {
    setSelectedSlot(null)
  }, [state.currentQuestion?.id, state.usedSlots.length])

  if (!question) {
    return <Navigate to="/setup" replace />
  }

  const onSlotClick = (slotKey: SlotKey) => {
    if (state.usedSlots.includes(slotKey)) return
    if (question.type === 'true_false') {
      setSelectedSlot(slotKey)
      return
    }
    setState(prepareManualResolution(state, slotKey))
  }

  const slots = useMemo(
    () =>
      question.slots.map((slot, index) => {
        const angle = (index / 10) * Math.PI * 2 - Math.PI / 2
        const radiusPercent = 38
        const x = 50 + radiusPercent * Math.cos(angle)
        const y = 50 + radiusPercent * Math.sin(angle)
        return { ...slot, x, y }
      }),
    [question.slots],
  )

  return (
    <div className="play-layout">
      <section className="play-stage">
        <aside className="players-side panel">
          {state.players.map((item, index) => {
            const roundLabel =
              item.roundState === 'passed'
                ? 'Passato'
                : item.roundState === 'eliminated'
                  ? 'Eliminato'
                  : `${item.roundPegs} punti in ballo`
            return (
              <div
                key={item.id}
                className={`player-pill ${index === state.currentTurnIndex ? 'active' : ''} ${!item.activeInRound ? 'out' : ''}`}
              >
                <strong>{item.name}</strong>
                <span>{item.totalScore} pt</span>
                <span className="round-badge">{roundLabel}</span>
              </div>
            )
          })}
          <div className="players-controls">
            <p className="round-summary"><strong>Turno:</strong> {player.name}</p>
            <div className="action-bar">
              <button className="warn" onClick={() => setState(passTurn(state))}>
                Passa
              </button>
              {question.type === 'true_false' ? (
                <>
                  <button
                    className="cta"
                    onClick={() => selectedSlot && setState(answerTrueFalse(state, selectedSlot, true))}
                    disabled={!selectedSlot}
                  >
                    Segna vero
                  </button>
                  <button
                    className="cta"
                    onClick={() => selectedSlot && setState(answerTrueFalse(state, selectedSlot, false))}
                    disabled={!selectedSlot}
                  >
                    Segna falso
                  </button>
                </>
              ) : (
                <p>Seleziona uno slot, rispondi a voce e poi conferma l'esito.</p>
              )}
            </div>
          </div>
        </aside>
        <main className="board-panel">
          <div className="board">
          {slots.map((slot) => (
            <button
              key={slot.key}
              className={`slot ${state.usedSlots.includes(slot.key) ? 'used' : ''}`}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              onClick={() => onSlotClick(slot.key)}
              disabled={state.usedSlots.includes(slot.key) || state.phase === 'manualResolution'}
            >
              <span>{slot.key}</span>
              <small>{slot.label}</small>
            </button>
          ))}
          <div className="question-core">
            <p className="category">{question.category}</p>
            <h2>{question.prompt}</h2>
            <p>Turno: {player.name}</p>
          </div>
          </div>
        </main>
      </section>

      {state.phase === 'manualResolution' && state.manualResolution ? (
        <div className="modal">
          <div className="modal-card">
            <h3>Soluzione</h3>
            <p>{state.manualResolution.solution}</p>
            <div className="modal-actions">
              <button className="cta" onClick={() => setState(confirmManualAnswer(state, true))}>
                Corretto
              </button>
              <button className="warn" onClick={() => setState(confirmManualAnswer(state, false))}>
                Errato
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const Vote = ({
  state,
  setState,
}: {
  state: GameState
  setState: (value: GameState) => void
}) => {
  const navigate = useNavigate()
  const submitVote = (vote: 'up' | 'down' | 'skip') => {
    const voted = applyQuestionVote(state, vote)
    const withRound = startNextRound(voted)
    setState(withRound)
    if (withRound.phase === 'gameOver') navigate('/game-over')
    else navigate('/play')
  }

  return (
    <div className="page">
      <h1>Valuta la domanda</h1>
      <p>Domanda appena giocata: {state.lastRoundQuestionId}</p>
      <div className="vote-actions">
        <button className="cta" onClick={() => submitVote('up')}>Pollice su</button>
        <button className="warn" onClick={() => submitVote('down')}>Pollice giu</button>
        <button className="warn" onClick={() => submitVote('skip')}>Salta</button>
      </div>
    </div>
  )
}

const GameOver = ({ state }: { state: GameState }) => {
  const winners = state.players.filter((player) => state.winnerIds.includes(player.id))
  return (
    <div className="page">
      <h1>Fine partita</h1>
      <p>
        Vincitore{winners.length > 1 ? 'i' : ''}: {winners.map((winner) => winner.name).join(', ')}
      </p>
      <section className="panel">
        {state.players.map((player) => (
          <div key={player.id} className="score-row">
            <span>{player.name}</span>
            <strong>{player.totalScore}</strong>
          </div>
        ))}
      </section>
    </div>
  )
}

export default App

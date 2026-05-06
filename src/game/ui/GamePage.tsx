import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'

import { appConfig } from '../../config/appConfig'
import { siteContent } from '../../data/siteContent'
import { buildAppPath } from '../../lib/routes'
import { createGameConfig } from '../core/config'
import type { DifficultyId } from '../content/difficulty'
import type { PlayerCharacterId } from '../core/systems/PlayerSelection'
import { PROGRESS_TAMPER_EVENT, progressStorage } from '../core/systems/ProgressStorage'
import { getGameModeContent } from '../content/gameContent'
import { getLeaderboard, submitScore } from '../api/scoreboard'
import { secureGameTransport } from '../api/secureTransport'
import type { ScoreEntry } from '../api/types'
import styles from './GamePage.module.css'

interface EndingData {
  score: number
  playTime: number
  character: PlayerCharacterId
  difficulty: DifficultyId
}

const DIFFICULTY_OPTIONS: DifficultyId[] = ['easy', 'normal', 'hard']
const LEADERBOARD_LIMIT = 10
const DIFFICULTY_LABELS: Record<DifficultyId, string> = {
  easy: 'EASY',
  normal: 'NORMAL',
  hard: 'HARD',
}
const CHARACTER_LABELS: Record<PlayerCharacterId, string> = {
  bride: '용사',
  dragon: '용',
}

export function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [ending, setEnding] = useState<EndingData | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([])
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyId>('normal')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [progressWarningVisible, setProgressWarningVisible] = useState(false)

  const { gameConfig } = siteContent
  const defaultModeContent = getGameModeContent('bride')
  const endingModeContent = getGameModeContent(ending?.character ?? 'bride')

  useEffect(() => {
    document.title = `${defaultModeContent.title} | ${siteContent.meta.title}`
  }, [defaultModeContent.title])

  useEffect(() => {
    window.scrollTo(0, 0)

    const previousOverflow = document.body.style.overflow
    const previousOverscroll = document.body.style.overscrollBehavior

    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.overscrollBehavior = previousOverscroll
    }
  }, [])

  useEffect(() => {
    const handleProgressReset = () => {
      setProgressWarningVisible(true)
    }
    window.addEventListener(PROGRESS_TAMPER_EVENT, handleProgressReset)
    progressStorage.initialize()
    return () => {
      window.removeEventListener(PROGRESS_TAMPER_EVENT, handleProgressReset)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return
    const game = new Phaser.Game(createGameConfig(containerRef.current))
    gameRef.current = game
    if (import.meta.env.DEV) {
      ;(window as typeof window & { __weddingGame?: Phaser.Game }).__weddingGame = game
    }

    const handleEnd = (data: EndingData) => {
      progressStorage.recordEnding(data.character, data.difficulty, data.score, data.playTime)
      setEnding(data)
    }
    const handleOpenScoreDashboard = () => {
      setActiveDifficulty('normal')
      setDashboardOpen(true)
    }

    game.events.on('game-ended', handleEnd)
    game.events.on('open-score-dashboard', handleOpenScoreDashboard)
    return () => {
      game.events.off('game-ended', handleEnd)
      game.events.off('open-score-dashboard', handleOpenScoreDashboard)
      game.destroy(true)
      if ((window as typeof window & { __weddingGame?: Phaser.Game }).__weddingGame === game) {
        delete (window as typeof window & { __weddingGame?: Phaser.Game }).__weddingGame
      }
      gameRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!dashboardOpen && !submitted) return
    let cancelled = false
    getLeaderboard(activeDifficulty, LEADERBOARD_LIMIT).then((result) => {
      if (!cancelled) {
        setLeaderboard(result.entries)
      }
    })
    return () => {
      cancelled = true
    }
  }, [activeDifficulty, dashboardOpen, submitted])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!ending || !name.trim()) return

    await submitScore({
      userId: progressStorage.getUserId(),
      runId: secureGameTransport.getRunId(),
      playerName: name.trim(),
      score: ending.score,
      message: message.trim(),
      playTimeSeconds: Math.floor(ending.playTime / 1000),
      difficulty: ending.difficulty,
      character: ending.character,
      finalEventHash: secureGameTransport.getCurrentHash(),
      timestamp: Date.now(),
    })

    setActiveDifficulty(ending.difficulty)
    const result = await getLeaderboard(ending.difficulty, LEADERBOARD_LIMIT)
    setLeaderboard(result.entries)
    setDashboardOpen(true)
    setSubmitted(true)
  }

  function handleSkipSubmit() {
    setSubmitted(true)
  }

  function handleRestart() {
    setEnding(null)
    setSubmitted(false)
    setDashboardOpen(false)
    setLeaderboard([])
    setName('')
    setMessage('')
    gameRef.current?.events.emit('restart-game')
  }

  function handleCloseDashboard() {
    setDashboardOpen(false)
    if (!ending) {
      setLeaderboard([])
    }
  }

  const dashboardTitle = submitted && ending ? endingModeContent.victoryMessages.submitSuccess : 'High Score'

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.gameContainer} />

      {ending && !submitted && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{endingModeContent.victoryMessages.title}</h2>
            <p className={styles.scoreText}>SCORE: {ending.score.toLocaleString()}</p>

            {gameConfig.scoreApi.submissionsEnabled ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder={gameConfig.scoreForm.nicknamePlaceholder}
                  maxLength={10}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <textarea
                  className={styles.textarea}
                  placeholder={gameConfig.scoreForm.messagePlaceholder}
                  maxLength={100}
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <button className={styles.button} type="submit">
                  {gameConfig.scoreForm.submitLabel}
                </button>
                <button className={styles.linkButton} type="button" onClick={handleSkipSubmit}>
                  {gameConfig.scoreForm.skipSubmitLabel}
                </button>
              </form>
            ) : (
              <>
                <p className={styles.notice}>{gameConfig.scoreForm.disabledNotice}</p>
                <div className={styles.buttonGroup}>
                  <button className={styles.button} type="button" onClick={handleRestart}>
                    {gameConfig.scoreForm.restartLabel}
                  </button>
                  <a className={styles.linkButton} href={buildAppPath(appConfig.homePath)}>
                    {gameConfig.homeHrefLabel}
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {submitted && dashboardOpen && (
        <div className={styles.overlay}>
          <div className={`${styles.card} ${styles.dashboardCard}`}>
            <ScoreDashboard
              title={dashboardTitle}
              activeDifficulty={activeDifficulty}
              entries={leaderboard}
              onDifficultyChange={setActiveDifficulty}
            />

            <div className={styles.buttonGroup}>
              <button className={styles.button} type="button" onClick={handleRestart}>
                {gameConfig.scoreForm.restartLabel}
              </button>
              <a className={styles.linkButton} href={buildAppPath(appConfig.homePath)}>
                {gameConfig.homeHrefLabel}
              </a>
            </div>
          </div>
        </div>
      )}

      {submitted && !dashboardOpen && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>기록하지 않았어요</h2>
            <p className={styles.notice}>점수 저장 없이 게임을 마쳤습니다.</p>
            <div className={styles.buttonGroup}>
              <button className={styles.button} type="button" onClick={handleRestart}>
                {gameConfig.scoreForm.restartLabel}
              </button>
              <a className={styles.linkButton} href={buildAppPath(appConfig.homePath)}>
                {gameConfig.homeHrefLabel}
              </a>
            </div>
          </div>
        </div>
      )}

      {dashboardOpen && !submitted && (
        <div className={styles.overlay}>
          <div className={`${styles.card} ${styles.dashboardCard}`}>
            <ScoreDashboard
              title="High Score"
              activeDifficulty={activeDifficulty}
              entries={leaderboard}
              onDifficultyChange={setActiveDifficulty}
            />
            <button className={styles.linkButton} type="button" onClick={handleCloseDashboard}>
              닫기
            </button>
          </div>
        </div>
      )}

      {progressWarningVisible && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>저장 데이터가 초기화되었습니다</h2>
            <p className={styles.notice}>
              저장된 진행도에서 조작 또는 손상이 감지되어 데이터를 새로 생성했어요.
            </p>
            <button
              className={styles.button}
              type="button"
              onClick={() => setProgressWarningVisible(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ScoreDashboardProps {
  title: string
  activeDifficulty: DifficultyId
  entries: ScoreEntry[]
  onDifficultyChange: (difficulty: DifficultyId) => void
}

function ScoreDashboard({
  title,
  activeDifficulty,
  entries,
  onDifficultyChange,
}: ScoreDashboardProps) {
  return (
    <section className={styles.dashboard} aria-label={title}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={styles.difficultyTabs} role="tablist" aria-label="난이도별 순위">
        {DIFFICULTY_OPTIONS.map((difficulty) => (
          <button
            key={difficulty}
            className={`${styles.difficultyTab} ${
              difficulty === activeDifficulty ? styles.difficultyTabActive : ''
            }`}
            type="button"
            role="tab"
            aria-selected={difficulty === activeDifficulty}
            onClick={() => onDifficultyChange(difficulty)}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </button>
        ))}
      </div>

      <div className={styles.leaderboard}>
        <h3>{DIFFICULTY_LABELS[activeDifficulty]} Ranking</h3>
        {entries.length > 0 ? (
          <ol className={styles.leaderList}>
            {entries.map((entry, index) => (
              <li key={entry.id} className={styles.leaderEntry}>
                <span className={styles.rank}>{index + 1}</span>
                <span
                  className={`${styles.characterIcon} ${styles[entry.character]}`}
                  aria-label={CHARACTER_LABELS[entry.character]}
                  title={CHARACTER_LABELS[entry.character]}
                />
                <span className={styles.leaderBody}>
                  <span className={styles.leaderName}>{entry.playerName}</span>
                  {entry.message && <span className={styles.leaderMessage}>{entry.message}</span>}
                </span>
                <span className={styles.leaderScore}>{entry.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.emptyState}>아직 {DIFFICULTY_LABELS[activeDifficulty]} 기록이 없습니다.</p>
        )}
      </div>
    </section>
  )
}

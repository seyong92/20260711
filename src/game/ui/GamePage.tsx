import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'

import { appConfig } from '../../config/appConfig'
import { siteContent } from '../../data/siteContent'
import { buildAppPath } from '../../lib/routes'
import { createGameConfig } from '../core/config'
import type { PlayerCharacterId } from '../core/systems/PlayerSelection'
import { PROGRESS_TAMPER_EVENT, progressStorage } from '../core/systems/ProgressStorage'
import { getGameModeContent } from '../content/gameContent'
import { getLeaderboard, submitScore } from '../api/scoreboard'
import styles from './GamePage.module.css'

interface EndingData {
  score: number
  playTime: number
  character: PlayerCharacterId
}

export function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [ending, setEnding] = useState<EndingData | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Array<{ playerName: string; score: number }>>([])
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
      setEnding(data)
    }

    game.events.on('game-ended', handleEnd)
    return () => {
      game.events.off('game-ended', handleEnd)
      game.destroy(true)
      if ((window as typeof window & { __weddingGame?: Phaser.Game }).__weddingGame === game) {
        delete (window as typeof window & { __weddingGame?: Phaser.Game }).__weddingGame
      }
      gameRef.current = null
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!ending || !name.trim()) return

    await submitScore({
      playerName: name.trim(),
      score: ending.score,
      message: message.trim(),
      playTimeSeconds: Math.floor(ending.playTime / 1000),
      checksum: '',
      timestamp: Date.now(),
    })

    const result = await getLeaderboard(10)
    setLeaderboard(result.entries)
    setSubmitted(true)
  }

  function handleSkipSubmit() {
    setSubmitted(true)
  }

  function handleRestart() {
    setEnding(null)
    setSubmitted(false)
    setLeaderboard([])
    setName('')
    setMessage('')
    gameRef.current?.events.emit('restart-game')
  }

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

      {submitted && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{endingModeContent.victoryMessages.submitSuccess}</h2>
            {leaderboard.length > 0 && (
              <div className={styles.leaderboard}>
                <h3>{gameConfig.scoreForm.leaderboardTitle}</h3>
                <ol className={styles.leaderList}>
                  {leaderboard.map((entry, index) => (
                    <li key={`${entry.playerName}-${index}`} className={styles.leaderEntry}>
                      <span className={styles.rank}>{index + 1}</span>
                      <span>{entry.playerName}</span>
                      <span>{entry.score.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

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

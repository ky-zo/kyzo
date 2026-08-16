'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import styles from './FollowerCounterDesktop.module.css'

const DASHBOARD_URL = '/follower-counter/index.html'

function FollowerCounterIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? styles.titleIcon : styles.shortcutGraphic}
      viewBox="0 0 64 64"
      aria-hidden="true"
      shapeRendering="crispEdges">
      <path
        fill="#111827"
        d="M8 8h48v38H8z"
      />
      <path
        fill="#dfdfdf"
        d="M10 10h44v34H10z"
      />
      <path
        fill="#fff"
        d="M12 12h40v28H12z"
      />
      <path
        fill="#000080"
        d="M12 12h40v5H12z"
      />
      <path
        fill="#111827"
        d="M21 21h6l5 6 5-6h6l-8 10 9 9h-7l-5-6-5 6h-7l9-10z"
      />
      <path
        fill="#808080"
        d="M27 46h10v6H27z"
      />
      <path
        fill="#111827"
        d="M18 52h28v4H18z"
      />
      <path
        fill="#fff"
        d="M12 42h40v2H12zM54 10h2v36h-2z"
      />
      <path
        fill="#808080"
        d="M8 46h48v2H8zM8 8h48v2H8z"
      />
    </svg>
  )
}

export default function FollowerCounterDesktop() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const shortcutRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const openWindow = useCallback(() => {
    setIsSelected(true)
    setIsOpen(true)
  }, [])

  const closeWindow = useCallback(() => {
    setIsOpen(false)
    requestAnimationFrame(() => shortcutRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWindow()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeWindow, isOpen])

  return (
    <>
      <button
        ref={shortcutRef}
        type="button"
        className={styles.shortcut}
        data-selected={isSelected}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Follower Counter. Double-click to open."
        title="Double-click to open"
        onClick={() => setIsSelected(true)}
        onDoubleClick={openWindow}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse') openWindow()
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          openWindow()
        }}>
        <span className={styles.iconPlate}>
          <FollowerCounterIcon />
        </span>
        <span className={styles.shortcutLabel}>Follower Counter</span>
      </button>

      <section
        className={styles.window}
        data-open={isOpen}
        role="dialog"
        aria-modal="false"
        aria-hidden={!isOpen}
        aria-labelledby="follower-counter-title">
        <header className={styles.titleBar}>
          <span className={styles.titleIdentity}>
            <FollowerCounterIcon small />
            <span id="follower-counter-title">Follower Counter</span>
          </span>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeButton}
            onClick={closeWindow}
            aria-label="Close Follower Counter">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className={styles.windowBody}>
          <iframe
            className={styles.dashboard}
            src={DASHBOARD_URL}
            title="Kyzo follower counter"
            loading="lazy"
          />
        </div>
      </section>
    </>
  )
}

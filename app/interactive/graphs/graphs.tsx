'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'

import type { FollowerHistory } from '@/lib/followers/types'

import {
  areaPath,
  axisLabels,
  axisTicks,
  CHART_SIZE,
  compact,
  cutoffFor,
  deltaText,
  easeInOutQuart,
  fmt,
  geometryPath,
  GRAPH_ZOOM_DURATION,
  historyFrom,
  labelText,
  nextSeriesState,
  PERIODS,
  project,
  seriesFrom,
  shortDate,
  SLIDER_CLICK_DURATION,
  SLIDER_DRAG_DURATION,
  toFollowerSeries,
  toGithubSeries,
  valueAt,
  xAt,
  yAt,
  yDomain,
  type Domain,
  type SeriesPoint,
} from './chart'
import styles from './graphs.module.css'

type GithubState = 'loading' | 'ready' | 'error'
type Hover = {
  date: Date
  x: number
  left: string
  top: string
  entries: Array<{ key: 'followers' | 'github'; value: number; y: number }>
}

type Paths = {
  followers: string
  github: string
  followersArea: string
  githubArea: string
}

const EMPTY_PATHS: Paths = { followers: '', github: '', followersArea: '', githubArea: '' }
const { w: WIDTH, h: HEIGHT, t: PAD_TOP, r: PAD_RIGHT, b: PAD_BOTTOM, l: PAD_LEFT } = CHART_SIZE
const INNER_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT
const INNER_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM
const BASELINE = PAD_TOP + INNER_HEIGHT

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function Graphs({ history }: { history: FollowerHistory }) {
  const followers = useMemo(() => toFollowerSeries(history.points), [history.points])
  const [periodIndex, setPeriodIndex] = useState(2)
  const [followersOn, setFollowersOn] = useState(true)
  const [githubOn, setGithubOn] = useState(false)
  const [githubState, setGithubState] = useState<GithubState>('loading')
  const [githubPoints, setGithubPoints] = useState<SeriesPoint[]>([])
  const [githubTotal, setGithubTotal] = useState<number | null>(null)
  const [paths, setPaths] = useState<Paths>(EMPTY_PATHS)
  const [hover, setHover] = useState<Hover | null>(null)
  const [zooming, setZooming] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const followersLineRef = useRef<SVGPathElement>(null)
  const githubLineRef = useRef<SVGPathElement>(null)
  const followersAreaRef = useRef<SVGPathElement>(null)
  const githubAreaRef = useRef<SVGPathElement>(null)
  const domainRef = useRef<Domain | null>(null)
  const hasRendered = useRef(false)
  const frameRef = useRef(0)
  const progressMotion = useRef<Animation | null>(null)
  const animateGraph = useRef(true)
  const pendingZoom = useRef(false)
  const sliderDuration = useRef(SLIDER_CLICK_DURATION)
  const keyboardToggle = useRef(false)
  const sliderPointer = useRef({ active: false, moved: false, startX: 0 })
  const reduceMotion = useRef(prefersReducedMotion()).current

  const period = PERIODS[periodIndex]
  const displayEnd = followers[followers.length - 1]?.date ?? new Date()
  const cutoff = cutoffFor(period, displayEnd)
  const followersRaw = historyFrom(followers, cutoff)
  const githubRaw = githubState === 'ready' ? seriesFrom(githubPoints, cutoff, displayEnd) : []
  const showFollowers = followersOn
  const showGithub = githubOn && githubState === 'ready'
  const selectedValues = [...(showFollowers ? followersRaw.map((point) => point.value) : []), ...(showGithub ? githubRaw.map((point) => point.value) : [])]
  const visibleValues = selectedValues.length ? selectedValues : [...followersRaw.map((point) => point.value), ...githubRaw.map((point) => point.value)]
  const scale = yDomain(visibleValues.length ? visibleValues : [0, 1], period)
  const targetDomain: Domain = { cutoff: cutoff.getTime(), yMin: scale.yMin, yMax: scale.yMax }
  const ticks = axisTicks(scale.tickStart, scale.yMax, scale.step)
  const labels = axisLabels(period, cutoff, displayEnd)
  const followersChange = followersRaw.length > 1 ? followersRaw[followersRaw.length - 1].value - followersRaw[0].value : 0
  const githubChange = githubRaw.reduce((sum, point) => sum + (point.contributions ?? 0), 0)
  const seriesNames = [showFollowers ? 'followers' : '', showGithub ? 'github contributions' : ''].filter(Boolean)
  const endTime = displayEnd.getTime()

  function pathsFor(domain: Domain): Paths {
    const projectedFollowers = showFollowers ? project(historyFrom(followers, domain.cutoff), domain, endTime) : []
    const projectedGithub = showGithub ? project(seriesFrom(githubPoints, domain.cutoff, displayEnd), domain, endTime) : []
    return {
      followers: projectedFollowers.length > 1 ? geometryPath(projectedFollowers) : '',
      github: projectedGithub.length > 1 ? geometryPath(projectedGithub) : '',
      followersArea: areaPath(projectedFollowers, BASELINE),
      githubArea: areaPath(projectedGithub, BASELINE),
    }
  }

  const staticPaths = pathsFor(targetDomain)
  const drawn = zooming || pendingZoom.current ? paths : staticPaths

  function markGraphAnimation(nextAnimateGraph: boolean) {
    animateGraph.current = nextAnimateGraph
    pendingZoom.current = nextAnimateGraph && hasRendered.current && !reduceMotion
  }

  function updateSliderPosition(index: number, animate: boolean, duration: number) {
    const track = trackRef.current
    const progress = progressRef.current
    const thumb = thumbRef.current
    if (!track || !progress || !thumb) return

    const ratio = index / (PERIODS.length - 1)
    const thumbWidth = thumb.offsetWidth || 32
    const targetWidth = `${thumbWidth / 2 + Math.max(0, track.clientWidth - thumbWidth) * ratio}px`
    const shouldAnimate = animate && hasRendered.current && !reduceMotion
    const currentWidth = getComputedStyle(progress).width
    progressMotion.current?.cancel()
    progress.style.width = targetWidth
    if (shouldAnimate) {
      progressMotion.current = progress.animate([{ width: currentWidth }, { width: targetWidth }], {
        duration,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      })
    }
  }

  function drawIn(line: SVGPathElement | null, area: SVGPathElement | null, extra = 0) {
    if (!line || reduceMotion) return
    const length = line.getTotalLength()
    line.animate(
      [
        { strokeDasharray: `${length}`, strokeDashoffset: length },
        { strokeDasharray: `${length}`, strokeDashoffset: 0 },
      ],
      { duration: 420 + extra, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    )
    area?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
  }

  useLayoutEffect(() => {
    const fromDomain = domainRef.current
    const shouldZoom = hasRendered.current && animateGraph.current && !reduceMotion && Boolean(fromDomain)
    setHover(null)
    updateSliderPosition(periodIndex, true, sliderDuration.current)

    if (frameRef.current) cancelAnimationFrame(frameRef.current)

    if (shouldZoom && fromDomain) {
      pendingZoom.current = false
      setZooming(true)
      const started = performance.now()
      const frame = (now: number) => {
        const progress = Math.min(1, (now - started) / GRAPH_ZOOM_DURATION)
        const eased = easeInOutQuart(progress)
        const domain: Domain = {
          cutoff: fromDomain.cutoff + (targetDomain.cutoff - fromDomain.cutoff) * eased,
          yMin: fromDomain.yMin + (targetDomain.yMin - fromDomain.yMin) * eased,
          yMax: fromDomain.yMax + (targetDomain.yMax - fromDomain.yMax) * eased,
        }
        domainRef.current = domain
        setPaths(pathsFor(domain))
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(frame)
          return
        }
        frameRef.current = 0
        domainRef.current = targetDomain
        setPaths(pathsFor(targetDomain))
        setZooming(false)
      }
      frameRef.current = requestAnimationFrame(frame)
    } else {
      pendingZoom.current = false
      domainRef.current = targetDomain
      setPaths(staticPaths)
      if (!hasRendered.current && !reduceMotion) {
        requestAnimationFrame(() => {
          drawIn(followersLineRef.current, followersAreaRef.current)
          drawIn(githubLineRef.current, githubAreaRef.current, 60)
        })
      }
    }

    hasRendered.current = true
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [periodIndex, followersOn, githubOn, githubState, followers, githubPoints])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(() => updateSliderPosition(periodIndex, false, 0))
    observer.observe(track)
    return () => observer.disconnect()
  }, [periodIndex])

  useEffect(() => {
    let cancelled = false
    fetch('/api/github-contributions')
      .then(async (response) => {
        if (!response.ok) throw new Error(`GitHub contributions returned HTTP ${response.status}`)
        const payload = await response.json()
        if (!Array.isArray(payload.points)) throw new Error('GitHub contribution response was invalid')
        if (cancelled) return
        const series = toGithubSeries(payload.points)
        markGraphAnimation(true)
        sliderDuration.current = SLIDER_CLICK_DURATION
        setGithubPoints(series)
        setGithubTotal(Number.isFinite(payload.totalContributions) ? payload.totalContributions : (series.at(-1)?.value ?? 0))
        setGithubState('ready')
      })
      .catch((error) => {
        if (cancelled) return
        console.error('GitHub activity unavailable', error)
        setGithubOn(false)
        setGithubState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function selectPeriod(index: number, nextAnimateGraph: boolean, duration = SLIDER_CLICK_DURATION) {
    markGraphAnimation(nextAnimateGraph)
    sliderDuration.current = duration
    setPeriodIndex(index)
  }

  function toggleSeries(key: 'followers' | 'github') {
    if (key === 'github' && githubState !== 'ready') return
    markGraphAnimation(!keyboardToggle.current)
    sliderDuration.current = SLIDER_CLICK_DURATION
    const next = nextSeriesState(key, followersOn, githubOn, githubState === 'ready')
    setFollowersOn(next.followersOn)
    setGithubOn(next.githubOn)
  }

  function onPlotMove(event: PointerEvent<SVGRectElement>) {
    const svg = svgRef.current
    const plot = plotRef.current
    if (!svg || !plot || zooming) return
    const hoverPoints = [...(showFollowers ? followersRaw : []), ...(showGithub ? githubRaw : [])]
    if (!hoverPoints.length) return

    const rect = svg.getBoundingClientRect()
    const mouseX = ((event.clientX - rect.left) / rect.width) * WIDTH
    const hoverTime = targetDomain.cutoff + ((mouseX - PAD_LEFT) / INNER_WIDTH) * (endTime - targetDomain.cutoff)
    const point = hoverPoints.reduce((best, candidate) =>
      Math.abs(candidate.date.getTime() - hoverTime) < Math.abs(best.date.getTime() - hoverTime) ? candidate : best,
    )
    const pointX = xAt(point.date, targetDomain, endTime)
    const entries: Hover['entries'] = []
    if (showFollowers) {
      const value = Math.round(valueAt(followersRaw, point.date.getTime()) ?? 0)
      entries.push({ key: 'followers', value, y: yAt(value, targetDomain) })
    }
    if (showGithub) {
      const value = Math.round(valueAt(githubRaw, point.date.getTime()) ?? 0)
      entries.push({ key: 'github', value, y: yAt(value, targetDomain) })
    }

    const tooltipHalf = (tooltipRef.current?.offsetWidth || 168) / 2
    const inset = Math.min(48, ((tooltipHalf + 4) / Math.max(1, plot.clientWidth)) * 100)
    setHover({
      date: point.date,
      x: pointX,
      left: `${Math.min(100 - inset, Math.max(inset, (pointX / WIDTH) * 100))}%`,
      top: `${Math.min(94, Math.max(16, (Math.min(...entries.map((entry) => entry.y)) / HEIGHT) * 100))}%`,
      entries,
    })
  }

  return (
    <div className={styles.shell}>
      <section
        className={styles.rangePanel}
        aria-label="Follower history range">
        <div className={styles.rangeMeta}>
          <span className={styles.rangeValue}>{period.label}</span>
        </div>
        <div className={styles.rangeControl}>
          <div
            ref={trackRef}
            className={styles.sliderTrack}
            aria-hidden="true">
            <span className={styles.sliderRail} />
            <span
              ref={progressRef}
              className={styles.sliderProgress}>
              <span className={styles.sliderFill} />
              <span
                ref={thumbRef}
                className={styles.sliderThumb}
              />
            </span>
            <span className={styles.sliderStops}>
              {PERIODS.map((item, index) => (
                <i
                  key={item.short}
                  className={index <= periodIndex ? `${styles.sliderStop} ${styles.sliderStopActive}` : styles.sliderStop}
                />
              ))}
            </span>
          </div>
          <input
            className={styles.rangeSlider}
            type="range"
            min={0}
            max={PERIODS.length - 1}
            step={1}
            value={periodIndex}
            aria-label="Select chart time range"
            onPointerDown={(event) => {
              sliderPointer.current = { active: true, moved: false, startX: event.clientX }
            }}
            onPointerMove={(event) => {
              if (sliderPointer.current.active && Math.abs(event.clientX - sliderPointer.current.startX) > 2) {
                sliderPointer.current.moved = true
              }
            }}
            onPointerUp={() => {
              sliderPointer.current = { active: false, moved: false, startX: 0 }
            }}
            onPointerCancel={() => {
              sliderPointer.current = { active: false, moved: false, startX: 0 }
              updateSliderPosition(periodIndex, false, 0)
            }}
            onChange={(event) => {
              const pointer = sliderPointer.current
              selectPeriod(Number(event.currentTarget.value), pointer.active, pointer.moved ? SLIDER_DRAG_DURATION : SLIDER_CLICK_DURATION)
            }}
          />
          <span
            className={styles.sliderFocus}
            aria-hidden="true"
          />
          <nav
            className={styles.ranges}
            aria-label="Time ranges">
            {PERIODS.map((item, index) => (
              <button
                key={item.short}
                className={index === periodIndex ? `${styles.range} ${styles.rangeActive}` : styles.range}
                aria-pressed={index === periodIndex}
                onClick={(event) => selectPeriod(index, event.detail !== 0)}>
                {item.short}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section aria-labelledby="metricTitle">
        <header className={styles.chartHead}>
          <div
            className={styles.seriesControls}
            id="metricTitle"
            role="group"
            aria-label="Visible chart lines">
            <label className={`${styles.seriesToggle} ${styles.followers}`}>
              <input
                type="checkbox"
                checked={followersOn}
                onKeyDown={() => {
                  keyboardToggle.current = true
                }}
                onPointerDown={() => {
                  keyboardToggle.current = false
                }}
                onChange={() => toggleSeries('followers')}
              />
              <span
                className={styles.seriesCheck}
                aria-hidden="true">
                ✓
              </span>
              <span className={styles.seriesName}>followers</span>
              <strong className={styles.seriesValue}>{fmt.format(history.currentFollowers)}</strong>
              <span className={followersChange < 0 ? `${styles.seriesDelta} ${styles.seriesDeltaNegative}` : styles.seriesDelta}>
                {deltaText(followersChange)}
              </span>
            </label>
            <label className={`${styles.seriesToggle} ${styles.github}`}>
              <input
                type="checkbox"
                checked={githubOn}
                disabled={githubState !== 'ready'}
                onKeyDown={() => {
                  keyboardToggle.current = true
                }}
                onPointerDown={() => {
                  keyboardToggle.current = false
                }}
                onChange={() => toggleSeries('github')}
              />
              <span
                className={styles.seriesCheck}
                aria-hidden="true">
                ✓
              </span>
              <span className={styles.seriesName}>github</span>
              <strong className={styles.seriesValue}>
                {githubState === 'ready' && githubTotal !== null ? fmt.format(githubTotal) : githubState === 'error' ? 'unavailable' : 'loading'}
              </strong>
              {githubState === 'ready' ? <span className={styles.seriesDelta}>{deltaText(githubChange)}</span> : null}
            </label>
          </div>
          {githubState === 'error' ? <div className={styles.githubError}>GitHub activity is temporarily unavailable</div> : null}
        </header>

        <div
          ref={plotRef}
          className={styles.plot}>
          <svg
            ref={svgRef}
            className={styles.chart}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`${period.label} chart showing ${seriesNames.join(' and ') || 'no selected metrics'}`}>
            <defs>
              <clipPath id="plotClip">
                <rect
                  x={PAD_LEFT}
                  y={PAD_TOP}
                  width={INNER_WIDTH}
                  height={INNER_HEIGHT}
                />
              </clipPath>
              <linearGradient
                id="followersGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--blue)"
                  stopOpacity="0.8"
                />
                <stop
                  offset="95%"
                  stopColor="var(--blue)"
                  stopOpacity="0.1"
                />
              </linearGradient>
              <linearGradient
                id="githubGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--green)"
                  stopOpacity="0.8"
                />
                <stop
                  offset="95%"
                  stopColor="var(--green)"
                  stopOpacity="0.1"
                />
              </linearGradient>
            </defs>
            <line
              className={styles.plotBoundary}
              x1={PAD_LEFT}
              x2={PAD_LEFT + INNER_WIDTH}
              y1={PAD_TOP}
              y2={PAD_TOP}
            />
            {ticks.map((value) => {
              const y = yAt(value, targetDomain)
              return (
                <g key={value}>
                  {Math.abs(y - PAD_TOP) > 0.5 ? (
                    <line
                      className={styles.grid}
                      x1={PAD_LEFT}
                      x2={PAD_LEFT + INNER_WIDTH}
                      y1={y}
                      y2={y}
                    />
                  ) : null}
                  <text
                    x={PAD_LEFT + INNER_WIDTH + 11}
                    y={y + 9}>
                    {compact(value)}
                  </text>
                </g>
              )
            })}
            <g clipPath="url(#plotClip)">
              {drawn.followersArea ? (
                <path
                  ref={followersAreaRef}
                  className={styles.seriesArea}
                  fill="url(#followersGradient)"
                  d={drawn.followersArea}
                />
              ) : null}
              {drawn.githubArea ? (
                <path
                  ref={githubAreaRef}
                  className={styles.seriesArea}
                  fill="url(#githubGradient)"
                  d={drawn.githubArea}
                />
              ) : null}
              {drawn.followers ? (
                <path
                  ref={followersLineRef}
                  className={styles.followersLine}
                  d={drawn.followers}
                />
              ) : null}
              {drawn.github ? (
                <path
                  ref={githubLineRef}
                  className={styles.githubLine}
                  d={drawn.github}
                />
              ) : null}
            </g>
            <line
              className={styles.base}
              x1={PAD_LEFT}
              x2={PAD_LEFT + INNER_WIDTH}
              y1={BASELINE}
              y2={BASELINE}
            />
            {labels.map((label) => (
              <g key={label.x}>
                <circle
                  cx={label.x}
                  cy={BASELINE + 9}
                  r="3.3"
                  fill="var(--rule-strong)"
                />
                <text
                  x={label.x}
                  y={BASELINE + 33}
                  textAnchor="middle">
                  {labelText(label.date, period)}
                </text>
              </g>
            ))}
            {hover ? (
              <>
                <line
                  className={styles.focusLine}
                  x1={hover.x}
                  x2={hover.x}
                  y1={PAD_TOP}
                  y2={BASELINE}
                />
                {hover.entries.map((entry) => (
                  <circle
                    key={entry.key}
                    className={entry.key === 'followers' ? `${styles.focus} ${styles.focusFollowers}` : `${styles.focus} ${styles.focusGithub}`}
                    cx={hover.x}
                    cy={entry.y}
                    r="4.8"
                  />
                ))}
              </>
            ) : null}
            <rect
              x={PAD_LEFT}
              y={PAD_TOP}
              width={INNER_WIDTH}
              height={INNER_HEIGHT}
              fill="transparent"
              style={{ pointerEvents: zooming ? 'none' : 'auto' }}
              onPointerMove={onPlotMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
          <div
            ref={tooltipRef}
            className={hover ? `${styles.tooltip} ${styles.tooltipVisible}` : styles.tooltip}
            role="status"
            aria-live="polite"
            style={hover ? { left: hover.left, top: hover.top } : undefined}>
            {hover ? (
              <>
                <div className={styles.tooltipDate}>{shortDate(hover.date)}</div>
                {hover.entries.map((entry) => (
                  <div
                    key={entry.key}
                    className={`${styles.tooltipEntry} ${entry.key === 'followers' ? styles.followers : styles.github}`}>
                    <span className={styles.tooltipSeriesDot} />
                    <span className={styles.tooltipSeries}>{entry.key}</span>
                    <span className={styles.tooltipValue}>{fmt.format(entry.value)}</span>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import posthog from 'posthog-js'

import { KILOGRAM_VALUES, kilogramsToPounds, POUND_VALUES, poundsToKilograms, stepVisualIndex, valueToVisualIndex, visualIndexToStopIndex } from './conversion'
import styles from './weight-converter.module.css'

type Unit = 'lb' | 'kg'

function formatValue(value: number) {
  if (Number.isInteger(value)) return value.toLocaleString('en-US')

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })
}

type SliderProps = {
  unit: Unit
  pounds: number
  direct: boolean
  onUnitChange: (unit: Unit) => void
  onSelect: (index: number, animateSlider: boolean) => void
}

const STOPS: Record<Unit, readonly number[]> = { lb: POUND_VALUES, kg: KILOGRAM_VALUES }

function WeightSlider({ unit, pounds, direct, onUnitChange, onSelect }: SliderProps) {
  const keyboardInput = useRef(false)
  const values = STOPS[unit]
  const kilograms = poundsToKilograms(pounds)
  const value = unit === 'lb' ? pounds : kilograms
  const visualIndex = valueToVisualIndex(value, values)
  const progress = visualIndex / (values.length - 1)
  const style = {
    '--slider-progress': `${progress * 100}%`,
  } as CSSProperties
  const valueText = `${formatValue(pounds)} lb, ${formatValue(kilograms)} kg`

  return (
    <section
      className={styles.unit}
      aria-labelledby="weight-label">
      <div className={styles.unitHeader}>
        <h2
          id="weight-label"
          className={styles.label}>
          weight
        </h2>
        <div
          className={styles.readout}
          role="radiogroup"
          aria-label="slider unit">
          {(['lb', 'kg'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={unit === option}
              className={styles.value}
              data-exact={unit === option}
              onClick={() => onUnitChange(option)}>
              {formatValue(option === 'lb' ? pounds : kilograms)} <span>{option}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className={styles.control}
        style={style}
        data-direct={direct}>
        <div
          className={styles.sliderVisual}
          aria-hidden="true">
          <div className={styles.rail} />
          <div className={styles.tickLayer}>
            {values.map((stop, index) => (
              <span
                key={stop}
                className={styles.tick}
                data-active={index <= visualIndex}
                style={{ left: `${(index / (values.length - 1)) * 100}%` }}
              />
            ))}
          </div>
          <div className={styles.mover}>
            <span className={styles.fill} />
            <span className={styles.thumb} />
          </div>
        </div>

        <input
          className={styles.input}
          type="range"
          min={0}
          max={values.length - 1}
          step="any"
          value={visualIndex}
          aria-label={`weight: ${valueText}`}
          aria-valuetext={valueText}
          onKeyDown={(event) => {
            keyboardInput.current = true

            if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault()
              onSelect(event.key === 'Home' ? 0 : values.length - 1, false)
              return
            }

            const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : null

            if (direction) {
              event.preventDefault()
              onSelect(stepVisualIndex(visualIndex, direction, values.length), false)
            }
          }}
          onPointerDown={() => {
            keyboardInput.current = false
          }}
          onChange={(event) => onSelect(visualIndexToStopIndex(Number(event.currentTarget.value), values), !keyboardInput.current)}
        />
      </div>

      <div
        className={styles.extents}
        aria-hidden="true">
        <span>
          {formatValue(values[0])} {unit}
        </span>
        <span>
          {formatValue(values[values.length - 1])} {unit}
        </span>
      </div>
    </section>
  )
}

type SpinnerProps = {
  label: string
  unit: Unit
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}

const ROW_HEIGHT = 52
const VISIBLE_NEIGHBORS = 4
const WHEEL_DELTA_PER_STEP = 53
const TAP_MOVEMENT_THRESHOLD = 6

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function UnitSpinner({ label, unit, min, max, step, value, onChange }: SpinnerProps) {
  // first stop on the wheel grid at or above min (0.1 lb → 1 lb, 0.1 kg → 0.5 kg)
  const minIndex = Math.ceil(min / step - 1e-6)
  const maxIndex = Math.round(max / step)
  const valueIndex = clamp(value / step, minIndex, maxIndex)
  // the wheel rests on the stop nearest the value; when the value sits between
  // stops (converted from the other unit), that stop's label shows the exact value
  const restIndex = Math.round(valueIndex)
  const offGrid = Math.abs(value / step - restIndex) > 1e-6

  const [position, setPosition] = useState(restIndex)
  const [dragging, setDragging] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startY: number; startPosition: number; position: number; lastStop: number; moved: boolean } | null>(null)
  const latest = useRef({ position, valueIndex, minIndex, maxIndex, step, onChange })
  latest.current = { position, valueIndex, minIndex, maxIndex, step, onChange }

  // follow the value when it changes elsewhere (other spinner, sliders)
  useEffect(() => {
    if (!drag.current) setPosition(restIndex)
  }, [restIndex])

  function selectStop(index: number) {
    const { valueIndex, minIndex, maxIndex, step, onChange } = latest.current
    const target = clamp(index, minIndex, maxIndex)

    setPosition(target)
    if (target !== valueIndex) onChange(target * step)
  }

  function applySteps(count: number) {
    // step from the exact value, not the rest stop, so every stop next to an
    // off-grid value stays reachable (29.76 steps up to 30, not 31)
    const { valueIndex } = latest.current
    const base = count > 0 ? Math.floor(valueIndex + 1e-6) : Math.ceil(valueIndex - 1e-6)

    selectStop(base + count)
  }

  const applyStepsRef = useRef(applySteps)
  applyStepsRef.current = applySteps

  useEffect(() => {
    const wheel = wheelRef.current
    if (!wheel) return

    let acc = 0

    // React attaches wheel listeners passively, so preventDefault needs a manual non-passive listener
    function onWheel(event: WheelEvent) {
      event.preventDefault()
      acc += -event.deltaY
      const steps = Math.trunc(acc / WHEEL_DELTA_PER_STEP)

      if (steps !== 0) {
        acc -= steps * WHEEL_DELTA_PER_STEP
        applyStepsRef.current(steps)
      }
    }

    wheel.addEventListener('wheel', onWheel, { passive: false })
    return () => wheel.removeEventListener('wheel', onWheel)
  }, [])

  const centerIndex = Math.round(position)
  const items = []

  for (let index = Math.max(minIndex, centerIndex - VISIBLE_NEIGHBORS); index <= Math.min(maxIndex, centerIndex + VISIBLE_NEIGHBORS); index++) {
    const distance = index - position
    const magnitude = Math.abs(distance)
    const showsExactValue = index === restIndex && offGrid && !dragging

    items.push(
      <span
        key={index}
        className={styles.wheelItem}
        data-index={index}
        data-center={index === centerIndex}
        style={{
          transform: `translateY(${distance * ROW_HEIGHT}px) scale(${Math.max(0.35, 1 - 0.24 * magnitude)})`,
          opacity: Math.max(0, 1 - 0.32 * magnitude),
          filter: `blur(${Math.min(5, magnitude * 1.6)}px)`,
        }}>
        {showsExactValue ? formatValue(value) : formatValue(index * step)}
      </span>,
    )
  }

  return (
    <section className={styles.spinnerUnit}>
      <span className={styles.spinnerLabel}>{label}</span>
      <div
        ref={wheelRef}
        className={styles.wheel}
        data-dragging={dragging}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${formatValue(value)} ${unit}`}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return

          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            // the pointer may already be gone; the drag still works without capture
          }

          const { position } = latest.current
          drag.current = { startY: event.clientY, startPosition: position, position, lastStop: Math.round(position), moved: false }
          setDragging(true)
        }}
        onPointerMove={(event) => {
          const state = drag.current
          if (!state) return

          if (Math.abs(event.clientY - state.startY) > TAP_MOVEMENT_THRESHOLD) state.moved = true

          const { minIndex, maxIndex, step, onChange } = latest.current
          const next = clamp(state.startPosition + (state.startY - event.clientY) / ROW_HEIGHT, minIndex, maxIndex)
          state.position = next
          setPosition(next)

          const stop = Math.round(next)

          if (stop !== state.lastStop) {
            state.lastStop = stop
            onChange(stop * step)
          }
        }}
        onPointerUp={(event) => {
          const state = drag.current
          drag.current = null
          setDragging(false)
          if (!state) return

          if (state.moved) {
            selectStop(Math.round(state.position))
            return
          }

          const tapped = (event.target as HTMLElement).closest<HTMLElement>('[data-index]')
          if (tapped) selectStop(Number(tapped.dataset.index))
        }}
        onPointerCancel={() => {
          drag.current = null
          setDragging(false)
          selectStop(Math.round(latest.current.position))
        }}
        onKeyDown={(event) => {
          const steps =
            event.key === 'ArrowUp' || event.key === 'ArrowRight'
              ? 1
              : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
                ? -1
                : event.key === 'PageUp'
                  ? 10
                  : event.key === 'PageDown'
                    ? -10
                    : null

          if (steps !== null) {
            event.preventDefault()
            applySteps(steps)
            return
          }

          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault()
            selectStop(event.key === 'Home' ? minIndex : maxIndex)
          }
        }}>
        <div
          className={styles.wheelItems}
          aria-hidden="true">
          {items}
        </div>
        <span
          className={styles.wheelUnit}
          aria-hidden="true">
          {unit}
        </span>
      </div>
    </section>
  )
}

export default function WeightConverter() {
  const [unit, setUnit] = useState<Unit>('lb')
  const [sliderDirect, setSliderDirect] = useState(true)
  const [pounds, setPounds] = useState(20)
  const kilograms = poundsToKilograms(pounds)

  // one event per visit, not one per drag tick
  const usageTracked = useRef(false)

  function trackFirstUse(control: 'slider' | 'spinner') {
    if (usageTracked.current) return
    usageTracked.current = true
    posthog.capture('weight_converter_used', { control })
  }

  function selectStop(index: number, animate: boolean) {
    trackFirstUse('slider')
    // pointer drags snap with an animation; keyboard steps jump
    setSliderDirect(!animate)
    setPounds(unit === 'lb' ? POUND_VALUES[index] : kilogramsToPounds(KILOGRAM_VALUES[index]))
  }

  function switchUnit(next: Unit) {
    // the value stays put; the track re-scales under it without animating
    setSliderDirect(true)
    setUnit(next)
  }

  function spinPounds(value: number) {
    trackFirstUse('spinner')
    setSliderDirect(false)
    setPounds(value)
  }

  function spinKilograms(value: number) {
    trackFirstUse('spinner')
    setSliderDirect(false)
    setPounds(kilogramsToPounds(value))
  }

  return (
    <div className={styles.converter}>
      <header className={styles.header}>
        <h1>weight converter</h1>
        <p>tap a unit to slide in it, the other follows</p>
      </header>

      <WeightSlider
        unit={unit}
        pounds={pounds}
        direct={sliderDirect}
        onUnitChange={switchUnit}
        onSelect={selectStop}
      />

      <div className={styles.spinnerSection}>
        <p className={styles.spinnerHint}>or swipe a number up and down</p>
        <div className={styles.spinnerRow}>
          <UnitSpinner
            label="pounds"
            unit="lb"
            min={POUND_VALUES[0]}
            max={POUND_VALUES[POUND_VALUES.length - 1]}
            step={1}
            value={pounds}
            onChange={spinPounds}
          />
          <UnitSpinner
            label="kilograms"
            unit="kg"
            min={KILOGRAM_VALUES[0]}
            max={KILOGRAM_VALUES[KILOGRAM_VALUES.length - 1]}
            step={0.5}
            value={kilograms}
            onChange={spinKilograms}
          />
        </div>
      </div>
    </div>
  )
}

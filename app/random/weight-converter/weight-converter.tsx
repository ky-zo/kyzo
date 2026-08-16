'use client'

import { useRef, useState, type CSSProperties } from 'react'

import { KILOGRAM_VALUES, kilogramsToPounds, POUND_VALUES, poundsToKilograms, stepVisualIndex, valueToVisualIndex, visualIndexToStopIndex } from './conversion'
import styles from './weight-converter.module.css'

type Unit = 'lb' | 'kg'

type SliderProps = {
  label: string
  unit: Unit
  values: readonly number[]
  visualIndex: number
  direct: boolean
  displayValue: number
  onSelect: (index: number, animateLinkedSlider: boolean) => void
}

function formatValue(value: number) {
  if (Number.isInteger(value)) return value.toLocaleString('en-US')

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })
}

function UnitSlider({ label, unit, values, visualIndex, direct, displayValue, onSelect }: SliderProps) {
  const keyboardInput = useRef(false)
  const progress = visualIndex / (values.length - 1)
  const style = {
    '--slider-progress': `${progress * 100}%`,
  } as CSSProperties

  return (
    <section
      className={styles.unit}
      aria-labelledby={`${unit}-label`}>
      <div className={styles.unitHeader}>
        <h2
          id={`${unit}-label`}
          className={styles.label}>
          {label}
        </h2>
        <output
          className={styles.value}
          aria-live="polite">
          {formatValue(displayValue)} <span>{unit}</span>
        </output>
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
            {values.map((value, index) => (
              <span
                key={value}
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
          aria-label={`${label}: ${formatValue(displayValue)} ${unit}`}
          aria-valuetext={`${formatValue(displayValue)} ${unit}`}
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

export default function WeightConverter() {
  const [sourceUnit, setSourceUnit] = useState<Unit>('lb')
  const [animateLinkedSlider, setAnimateLinkedSlider] = useState(true)
  const [pounds, setPounds] = useState(20)
  const kilograms = poundsToKilograms(pounds)

  function selectPounds(index: number, animate: boolean) {
    setSourceUnit('lb')
    setAnimateLinkedSlider(animate)
    setPounds(POUND_VALUES[index])
  }

  function selectKilograms(index: number, animate: boolean) {
    setSourceUnit('kg')
    setAnimateLinkedSlider(animate)
    setPounds(kilogramsToPounds(KILOGRAM_VALUES[index]))
  }

  return (
    <div className={styles.converter}>
      <header className={styles.header}>
        <h1>weight converter</h1>
        <p>slide either unit — the other follows</p>
      </header>

      <div className={styles.sliders}>
        <UnitSlider
          label="pounds"
          unit="lb"
          values={POUND_VALUES}
          visualIndex={valueToVisualIndex(pounds, POUND_VALUES)}
          direct={sourceUnit === 'lb' || !animateLinkedSlider}
          displayValue={pounds}
          onSelect={selectPounds}
        />

        <UnitSlider
          label="kilograms"
          unit="kg"
          values={KILOGRAM_VALUES}
          visualIndex={valueToVisualIndex(kilograms, KILOGRAM_VALUES)}
          direct={sourceUnit === 'kg' || !animateLinkedSlider}
          displayValue={kilograms}
          onSelect={selectKilograms}
        />
      </div>
    </div>
  )
}

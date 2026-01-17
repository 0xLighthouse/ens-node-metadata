'use client'

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'

export type WizardStep = {
  key: string
  label: string
}

interface Props {
  steps: WizardStep[]
  activeStep: string
  onStepChange: (step: string) => void
  children: React.ReactNode
  height?: number | 'auto'
}

export function WizardContainer({ steps, activeStep, onStepChange, children, height }: Props) {
  const isMounted = useMounted()
  const viewsContainerRef = useRef<HTMLDivElement>(null)
  const [viewsContainerWidth, setViewsContainerWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      if (viewsContainerRef.current) {
        const width = viewsContainerRef.current.getBoundingClientRect().width
        setViewsContainerWidth(width)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [viewsContainerWidth])

  const activeIndex = steps.findIndex((s) => s.key === activeStep)

  return (
    <div className="flex flex-col gap-6 justify-start items-center p-4">
      <WizardProgress steps={steps} activeStep={activeStep} onStepChange={onStepChange} />
      <div
        id="views-container"
        ref={viewsContainerRef}
        className="relative w-full bg-transparent backdrop-blur-[10px]"
        style={{ height: height || 'auto' }}
      >
        {isMounted &&
          React.Children.map(children, (child, idx) => (
            <WizardView
              key={steps[idx]?.key}
              containerWidth={viewsContainerWidth}
              viewIndex={idx}
              activeIndex={activeIndex}
            >
              {child}
            </WizardView>
          ))}
      </div>
    </div>
  )
}

interface WizardViewProps {
  children: React.ReactNode
  containerWidth: number
  viewIndex: number
  activeIndex: number
}

export function WizardView({ children, containerWidth, viewIndex, activeIndex }: WizardViewProps) {
  const [difference, setDifference] = useState(activeIndex - viewIndex)
  const x = useSpring(calculateViewX(difference, containerWidth), {
    stiffness: 400,
    damping: 60,
  })
  const xVelocity = useVelocity(x)
  const opacity = useTransform(x, [-containerWidth * 0.6, 0, containerWidth * 0.6], [0, 1, 0])
  const blur = useTransform(xVelocity, [-1000, 0, 1000], [4, 0, 4], {
    clamp: false,
  })

  useEffect(() => {
    const newDifference = activeIndex - viewIndex
    setDifference(newDifference)
    const newX = calculateViewX(newDifference, containerWidth)
    x.set(newX)
  }, [activeIndex, containerWidth, difference, viewIndex, x])

  return (
    <motion.div
      className="absolute inset-0 origin-center translate3d-0 will-change-transform isolate"
      style={{
        x,
        opacity,
        filter: useMotionTemplate`blur(${blur}px)`,
        transform: 'translate3d(0, 0, 0)',
        transformOrigin: 'center',
        willChange: 'transform, filter',
      }}
    >
      <div className="w-full h-full box-border flex flex-col justify-start items-center p-5">
        {children}
      </div>
    </motion.div>
  )
}

interface WizardProgressProps {
  steps: WizardStep[]
  activeStep: string
  onStepChange: (step: string) => void
}

export function WizardProgress({ steps, activeStep, onStepChange }: WizardProgressProps) {
  return (
    <div className="flex p-2 w-fit rounded-[10px] bg-[#0b1011] gap-3">
      {steps.map((step) => (
        <motion.button
          key={step.key}
          initial={{ scale: 1, backgroundColor: '#2b323d00' }}
          whileTap={{ scale: 0.9 }}
          whileFocus={{ boxShadow: '0 0 0 2px #ff0088' }}
          className="flex-[0_0_auto] px-2 py-2 rounded border-none bg-transparent cursor-pointer text-sm leading-none inline-flex items-center justify-center relative"
          style={{
            color: activeStep === step.key ? '#f5f5f5' : '#a1a1aa',
          }}
          onClick={() => onStepChange(step.key)}
        >
          <span className="relative z-[1]">{step.label}</span>
          <AnimatePresence initial={false}>
            {activeStep === step.key && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 bottom-0 right-0 bg-[#2b323dff] rounded-[5px] mix-blend-lighten"
                layoutId="selected-indicator"
              />
            )}
          </AnimatePresence>
        </motion.button>
      ))}
    </div>
  )
}

export function WizardContent({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6 justify-start items-center">{children}</div>
}

export function WizardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      )}
    </div>
  )
}

export function WizardActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3 justify-end">{children}</div>
}

const calculateViewX = (difference: number, containerWidth: number) => {
  return difference * (containerWidth * 0.75) * -1
}

const useMounted = () => {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  return isMounted
}

/**
 * Helper hook for managing step navigation.
 * @param steps - The steps to navigate through.
 * @returns An object with the current step, current index, and navigation functions.
 */
export function useWizardNavigation(steps: WizardStep[]) {
  const [activeStep, setActiveStep] = useState(steps[0].key)

  const currentIndex = steps.findIndex((s) => s.key === activeStep)

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1].key)
    }
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1].key)
    }
  }

  const goToStep = (stepId: string) => {
    if (steps.find((s) => s.key === stepId)) {
      setActiveStep(stepId)
    }
  }

  return {
    activeStep,
    currentIndex,
    goNext,
    goBack,
    goToStep,
    setActiveStep,
  }
}

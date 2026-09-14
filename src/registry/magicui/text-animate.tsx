"use client"

import * as React from "react"
import { motion, type Variants } from "motion/react"
import { cn } from "@/lib/utils"

export type AnimationType =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown"
  | "scaleUp"

export interface TextAnimateProps extends React.ComponentPropsWithoutRef<"p"> {
  children: string | React.ReactNode
  animation?: AnimationType
  by?: "character" | "word" | "line"
  as?: React.ElementType
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

const animationVariants: Record<AnimationType, { container: Variants; item: Variants }> = {
  fadeIn: {
    container: {
      hidden: { opacity: 0 },
      show: (delay = 0) => ({
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: delay },
      }),
    },
    item: {
      hidden: { opacity: 0, y: 4 },
      show: { opacity: 1, y: 0 },
    },
  },
  blurIn: {
    container: {
      hidden: { opacity: 0 },
      show: (delay = 0) => ({
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: delay },
      }),
    },
    item: {
      hidden: { opacity: 0, filter: "blur(12px)", y: 6 },
      show: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
      },
    },
  },
  blurInUp: {
    container: {
      hidden: { opacity: 0 },
      show: (delay = 0) => ({
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: delay },
      }),
    },
    item: {
      hidden: { opacity: 0, filter: "blur(8px)", y: 12 },
      show: { opacity: 1, filter: "blur(0px)", y: 0 },
    },
  },
  blurInDown: {
    container: {
      hidden: { opacity: 0 },
      show: (delay = 0) => ({
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: delay },
      }),
    },
    item: {
      hidden: { opacity: 0, filter: "blur(8px)", y: -12 },
      show: { opacity: 1, filter: "blur(0px)", y: 0 },
    },
  },
  slideUp: {
    container: {
      hidden: { opacity: 0 },
      show: (delay = 0) => ({
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: delay },
      }),
    },
    item: {
      hidden: { opacity: 0, y: 12 },
      show: { opacity: 1, y: 0 },
    },
  },
  slideDown: {
    container: {
      hidden: { opacity: 0 },
      show: (delay = 0) => ({
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: delay },
      }),
    },
    item: {
      hidden: { opacity: 0, y: -12 },
      show: { opacity: 1, y: 0 },
    },
  },
  scaleUp: {
    container: {
      hidden: { opacity: 0 },
      show: (delay = 0) => ({
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: delay },
      }),
    },
    item: {
      hidden: { opacity: 0, scale: 0.85 },
      show: { opacity: 1, scale: 1 },
    },
  },
}

export function TextAnimate({
  children,
  animation = "fadeIn",
  by = "word",
  as: Component = "p",
  delay = 0,
  duration,
  className,
  once = true,
  ...props
}: TextAnimateProps) {
  const MotionComponent = React.useMemo(() => motion.create(Component), [Component])

  // Se children não for string simples, anima em bloco
  if (typeof children !== "string") {
    const variants = animationVariants[animation] || animationVariants.fadeIn
    return (
      <MotionComponent
        variants={variants.item}
        initial="hidden"
        animate="show"
        transition={{ duration, delay }}
        className={className}
        {...props}
      >
        {children}
      </MotionComponent>
    )
  }

  // Divide o texto conforme o padrão ('character', 'word', 'line')
  const segments = React.useMemo(() => {
    if (by === "character") return children.split("")
    if (by === "line") return children.split("\n")
    return children.split(" ")
  }, [children, by])

  const variants = animationVariants[animation] || animationVariants.fadeIn

  return (
    <MotionComponent
      variants={variants.container}
      initial="hidden"
      animate="show"
      custom={delay}
      className={cn("inline-flex flex-wrap items-baseline gap-[0.25em]", className)}
      {...props}
    >
      {segments.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          variants={variants.item}
          {...(duration !== undefined ? { transition: { duration } } : {})}
          className="inline-block"
        >
          {segment}
          {by === "word" && index < segments.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </MotionComponent>
  )
}

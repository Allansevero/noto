"use client"

import * as React from "react"
import { motion, AnimatePresence, type Transition } from "motion/react"
import { cn } from "@/lib/utils"

export interface AvatarGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "translate"> {
  children: React.ReactNode
  invertOverlap?: boolean
  translate?: string | number
  transition?: Transition
}

export interface AvatarGroupTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function AvatarGroupTooltip({ children }: AvatarGroupTooltipProps) {
  return null
}
AvatarGroupTooltip.displayName = "AvatarGroupTooltip"

export interface AvatarGroupBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function AvatarGroupBadge({ children }: AvatarGroupBadgeProps) {
  return null
}
AvatarGroupBadge.displayName = "AvatarGroupBadge"

interface SingleAvatarWrapperProps {
  child: React.ReactElement
  index: number
  total: number
  invertOverlap: boolean
  translate: string | number
  transition: Transition
}

function SingleAvatarWrapper({
  child,
  index,
  total,
  invertOverlap,
  translate,
  transition,
}: SingleAvatarWrapperProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  // Extrai o conteúdo do tooltip e badge se estiverem dentro dos filhos do Avatar
  let tooltipContent: React.ReactNode = null
  let badgeContent: React.ReactNode = null
  const avatarChildren: React.ReactNode[] = []

  if (React.isValidElement(child) && (child.props as any)?.children) {
    React.Children.forEach((child.props as any).children, (c) => {
      if (
        React.isValidElement(c) &&
        (c.type === AvatarGroupTooltip || (c.type as any)?.displayName === "AvatarGroupTooltip")
      ) {
        tooltipContent = (c.props as any)?.children
      } else if (
        React.isValidElement(c) &&
        (c.type === AvatarGroupBadge || (c.type as any)?.displayName === "AvatarGroupBadge")
      ) {
        badgeContent = (c.props as any)?.children
      } else {
        avatarChildren.push(c)
      }
    })
  }

  // Clona o avatar sem o tooltip e badge para evitar problemas de overflow-hidden do Avatar
  const sanitizedChild = React.cloneElement(child, {
    ...(child.props as any),
    children: avatarChildren.length > 0 ? avatarChildren : (child.props as any)?.children,
  })

  const baseZIndex = invertOverlap ? total - index : index + 1
  const zIndex = isHovered ? 50 : baseZIndex

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ zIndex }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          y: isHovered ? (typeof translate === "number" ? translate : -5) : 0,
          scale: isHovered ? 1.08 : 1,
        }}
        transition={transition}
        className="relative cursor-pointer"
      >
        {sanitizedChild}
        {badgeContent && (
          <div className="absolute -bottom-0.5 -right-0.5 z-20 pointer-events-none">
            {badgeContent}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isHovered && tooltipContent && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] pointer-events-none flex flex-col items-center"
          >
            <div className="bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 text-[11px] font-medium px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap border border-neutral-700/50 dark:border-neutral-200">
              {tooltipContent}
            </div>
            <div className="w-0 h-0 border-x-3 border-x-transparent border-t-3 border-t-neutral-900 dark:border-t-neutral-100 -mt-[0.5px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AvatarGroup({
  children,
  className,
  invertOverlap = true,
  translate = -5,
  transition = { type: "spring", stiffness: 350, damping: 22 },
  ...props
}: AvatarGroupProps) {
  const validChildren = React.Children.toArray(children).filter(
    React.isValidElement
  ) as React.ReactElement[]

  return (
    <div className={cn("flex items-center -space-x-2", className)} {...props}>
      {validChildren.map((child, index) => (
        <SingleAvatarWrapper
          key={child.key ?? index}
          child={child}
          index={index}
          total={validChildren.length}
          invertOverlap={invertOverlap}
          translate={translate}
          transition={transition}
        />
      ))}
    </div>
  )
}

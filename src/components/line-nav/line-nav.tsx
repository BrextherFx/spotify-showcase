'use client'

import React, { memo, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const lineVariants = {
  normal: { width: 24 },
  active: { width: 40 },
  hover: { width: 40 },
}

export type LineNavItem = {
  title: string
  href: string
}

export type LineNavProps = {
  className?: string
  items: LineNavItem[]
  activeHref?: string
  scrollActiveIntoView?: boolean
  onItemClick?: (item: LineNavItem, event: React.MouseEvent) => void
}

export function LineNav({
  className,
  items,
  activeHref,
  scrollActiveIntoView = true,
  onItemClick,
}: LineNavProps) {
  const activeItemRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (scrollActiveIntoView && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'center' })
    }
  }, [scrollActiveIntoView, activeHref])

  return (
    <nav className={cn('flex flex-col gap-0', className)}>
      {items.map((item, index) => {
        const isActive = item.href === activeHref
        const isLast = index === items.length - 1

        return (
          <LineNavItemWrapper
            key={item.href}
            ref={isActive ? activeItemRef : null}
            item={item}
            active={isActive}
            isLast={isLast}
            onClick={(e) => onItemClick?.(item, e)}
          />
        )
      })}
    </nav>
  )
}

interface LineNavItemWrapperProps {
  item: LineNavItem
  active?: boolean
  isLast?: boolean
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

const LineNavItemWrapper = memo(
  React.forwardRef<HTMLAnchorElement, LineNavItemWrapperProps>(
    ({ item, active = false, isLast = false, onClick }, ref) => {
      return (
        <div className="relative flex items-center gap-3 py-2">
          <motion.div
            className="h-0.5 origin-left bg-foreground"
            variants={lineVariants}
            initial="normal"
            animate={active ? 'active' : 'normal'}
            whileHover="hover"
            transition={{ duration: 0.3 }}
          />
          <motion.a
            ref={ref}
            href={item.href}
            className={cn(
              'text-sm transition-colors',
              active
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            initial={false}
            animate={active ? 'active' : 'normal'}
            whileHover="hover"
            onClick={onClick}
          >
            {item.title}
          </motion.a>

          {!isLast && (
            <div className="absolute bottom-0 left-3 top-full h-2 w-px bg-border" />
          )}
        </div>
      )
    }
  )
)

LineNavItemWrapper.displayName = 'LineNavItemWrapper'

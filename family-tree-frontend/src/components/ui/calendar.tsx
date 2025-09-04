"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

const Calendar = React.forwardRef<
  HTMLDivElement,
  CalendarProps
>(({ className, selected, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-3", className)}
    {...props}
  >
    <input
      type="date"
      value={selected ? selected.toISOString().split('T')[0] : ''}
      onChange={(e) => onSelect?.(e.target.value ? new Date(e.target.value) : undefined)}
      className="w-full p-2 border rounded"
    />
  </div>
))
Calendar.displayName = "Calendar"

export { Calendar }

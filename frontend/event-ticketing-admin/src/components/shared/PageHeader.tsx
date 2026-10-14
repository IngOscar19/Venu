import React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#21262D]">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#F0F6FC] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[#8B949E] mt-1 font-normal">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  )
}

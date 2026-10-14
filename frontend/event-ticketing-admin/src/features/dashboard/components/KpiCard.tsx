import React from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBg?: string
  progressPercent?: number
  progressColor?: string
  subtitle?: React.ReactNode
}

export function KpiCard({
  title,
  value,
  icon,
  iconBg = 'bg-[#FA4616]/15 text-[#FA4616]',
  progressPercent,
  progressColor = 'bg-[#FA4616]',
  subtitle,
}: KpiCardProps) {
  return (
    <div className="bg-[#161B22] rounded-2xl p-6 border border-[#30363D] relative overflow-hidden transition-all hover:border-[#484F58]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#8B949E]">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-[#F0F6FC] mt-2 font-headline">
            {value}
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>

      {/* Styled progress bar matching the Stitch design system showcase */}
      {typeof progressPercent === 'number' && (
        <div className="mt-4 w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(Math.max(progressPercent, 5), 100)}%` }}
          />
        </div>
      )}

      {subtitle && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#8B949E]">
          {subtitle}
        </div>
      )}
    </div>
  )
}

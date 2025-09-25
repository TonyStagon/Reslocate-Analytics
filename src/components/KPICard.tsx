import { DivideIcon as LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: typeof LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function KPICard({ title, value, subtitle, icon: Icon, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-3 text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className="text-lg">{trend.isPositive ? '↗' : '↘'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-4 shadow-inner">
          <Icon className="h-7 w-7 text-green-700" />
        </div>
      </div>
    </div>
  )
}
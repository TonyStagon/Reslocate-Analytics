import React, { useState, useMemo } from 'react'
import { Search, Download } from 'lucide-react'

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface SearchableTableProps {
  data: any[]
  columns: Column[]
  searchPlaceholder?: string
  exportFilename?: string
}

export function SearchableTable({ 
  data, 
  columns, 
  searchPlaceholder = 'Search...', 
  exportFilename = 'data' 
}: SearchableTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(row =>
      columns.some(col =>
        String(row[col.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    )

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, sortConfig, columns])

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const exportToCSV = () => {
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...filteredAndSortedData.map(row =>
        columns.map(col => `"${row[col.key] || ''}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFilename}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-200 transition-colors duration-150' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable !== false && sortConfig?.key === column.key && (
                      <span className="ml-2 text-green-600 font-bold">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((row, index) => (
                <tr key={index} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-150">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {column.render ? column.render(row[column.key], row) : (row[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {filteredAndSortedData.length > 0 && (
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 text-sm text-gray-600 font-medium">
          Showing {filteredAndSortedData.length} of {data.length} results
        </div>
      )}
    </div>
  )
}
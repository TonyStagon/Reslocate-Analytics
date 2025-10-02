import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useSupabaseQuery<T>(
  query: string,
  dependencies: any[] = []
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let isMounted = true

    const executeQuery = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        const { data, error } = await supabase.rpc('execute_sql', { 
          sql_query: query 
        })

        if (error) {
          throw error
        }

        if (isMounted) {
          setState({
            data: data as T,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred'
          })
        }
      }
    }

    executeQuery()

    return () => {
      isMounted = false
    }
  }, dependencies)

  return state
}
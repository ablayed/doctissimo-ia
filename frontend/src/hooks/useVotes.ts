import { useEffect, useState } from 'react'

type VoteValue = 'credible' | 'noise' | null
type Votes = Record<string, VoteValue>

const STORAGE_KEY = 'doctissimo-votes'

export function useVotes(threadId: string) {
  const key = `${STORAGE_KEY}:${threadId}`
  const [votes, setVotes] = useState<Votes>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}') as Votes
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(votes))
  }, [key, votes])

  const vote = (postId: string, value: VoteValue) => {
    setVotes((current) => ({ ...current, [postId]: current[postId] === value ? null : value }))
  }

  const totalVotes = Object.values(votes).filter((value) => value !== null).length

  return { votes, vote, totalVotes }
}

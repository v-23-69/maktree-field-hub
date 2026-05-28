import type { ManagerTeamActivityData } from '@/hooks/useDashboardStats'
import type { LeaderboardRankingItem } from '@/components/ui/leaderboard-rankings'
import type { LeaderboardPodiumRanking } from '@/components/ui/leaderboard-podium'

export type MrLeaderboardRow = {
  userId: string
  userName: string
  rank: number
  value: number
  doctors: number
  visits: number
  dcrs: number
}

function aggregateRows(
  activity: ManagerTeamActivityData,
  managerId: string,
): Omit<MrLeaderboardRow, 'rank'>[] {
  const map = new Map<
    string,
    { userName: string; doctors: number; visits: number; dcrs: number }
  >()

  for (const person of activity.doctorsByPerson) {
    if (person.is_manager) continue
    map.set(person.user_id, {
      userName: person.full_name,
      doctors: person.doctor_count,
      visits: 0,
      dcrs: 0,
    })
  }

  for (const report of activity.reports) {
    if (report.is_manager || report.mr_id === managerId) continue
    const row = map.get(report.mr_id) ?? {
      userName: report.person_name,
      doctors: 0,
      visits: 0,
      dcrs: 0,
    }
    row.dcrs += 1
    row.visits += report.visit_count
    map.set(report.mr_id, row)
  }

  return [...map.entries()]
    .map(([userId, row]) => ({
      userId,
      userName: row.userName,
      doctors: row.doctors,
      visits: row.visits,
      dcrs: row.dcrs,
      value: row.doctors,
    }))
    .filter(r => r.value > 0 || r.dcrs > 0)
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value
      if (b.visits !== a.visits) return b.visits - a.visits
      return b.dcrs - a.dcrs
    })
}

export function buildMrLeaderboard(
  activity: ManagerTeamActivityData | undefined,
  managerId: string,
): { podium: LeaderboardPodiumRanking[]; rankings: LeaderboardRankingItem[]; rows: MrLeaderboardRow[] } {
  if (!activity) return { podium: [], rankings: [], rows: [] }

  const sorted = aggregateRows(activity, managerId).map((row, index) => ({
    ...row,
    rank: index + 1,
  }))

  const podium: LeaderboardPodiumRanking[] = sorted.slice(0, 3).map(r => ({
    userId: r.userId,
    userName: r.userName,
    rank: r.rank as 1 | 2 | 3,
    value: r.value,
  }))

  const rankings: LeaderboardRankingItem[] = sorted.map(r => ({
    userId: r.userId,
    rank: r.rank,
    userName: r.userName,
    byline: `${r.dcrs} DCR${r.dcrs === 1 ? '' : 's'} · ${r.visits} visit${r.visits === 1 ? '' : 's'}`,
    value: r.value,
    valueLabel: 'doctors',
    displayed: true,
  }))

  return { podium, rankings, rows: sorted }
}

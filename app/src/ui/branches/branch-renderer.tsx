import * as React from 'react'

import { Branch } from '../../models/branch'
import { IMatches } from '../../models/filter-list'

import { IBranchListItem } from './group-branches'
import { BranchListItem } from './branch-list-item'

export function renderDefaultBranch(
  item: IBranchListItem,
  matches: IMatches,
  currentBranch: Branch | null
): JSX.Element {
  const branch = item.branch
  const commit = branch.tip
  const currentBranchName = currentBranch ? currentBranch.name : null
  return (
    <BranchListItem
      name={branch.name}
      isCurrentBranch={branch.name === currentBranchName}
      lastCommitDate={commit ? commit.author.date : null}
      matches={matches}
    />
  )
}

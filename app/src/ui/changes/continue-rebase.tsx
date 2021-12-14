import * as React from 'react'
import { Button } from '../lib/button'
import { Loading } from '../lib/loading'
import { RebaseConflictState } from '../../lib/app-state'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { WorkingDirectoryStatus } from '../../models/status'
import { getConflictedFiles } from '../../lib/status'

interface IContinueRebaseProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly workingDirectory: WorkingDirectoryStatus
  readonly rebaseConflictState: RebaseConflictState
  readonly isCommitting: boolean
}

export class ContinueRebase extends React.Component<IContinueRebaseProps, {}> {
  private onSubmit = async () => {
    const { manualResolutions } = this.props.rebaseConflictState

    await this.props.dispatcher.continueRebase(
      this.props.repository,
      this.props.workingDirectory,
      manualResolutions
    )
  }

  public render() {
    const { manualResolutions } = this.props.rebaseConflictState

    let canCommit = true
    let tooltip = 'Continue rebase'

    const conflictedFilesCount = getConflictedFiles(
      this.props.workingDirectory,
      manualResolutions
    ).length

    if (conflictedFilesCount > 0) {
      tooltip = 'Resolve all conflicts before continuing'
      canCommit = false
    }

    const buttonEnabled = canCommit && !this.props.isCommitting

    const loading = this.props.isCommitting ? <Loading /> : undefined

    return (
      <div id="continue-rebase" role="group">
        <Button
          type="submit"
          className="commit-button"
          onClick={this.onSubmit}
          disabled={!buttonEnabled}
          tooltip={tooltip}
        >
          {loading}
          <span>{loading !== undefined ? 'Rebasing' : 'Continue rebase'}</span>
        </Button>
      </div>
    )
  }
}

import * as React from 'react'
import { Button } from '../lib/button'
import { ButtonGroup } from '../lib/button-group'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../../lib/dispatcher'
import { PopupType } from '../../models/popup'
import { Repository } from '../../models/repository'
import { Octicon, OcticonSymbol } from '../octicons'

interface IAbortMergeWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly onDismissed: () => void
  readonly currentBranch: string
  readonly theirBranch: string
}

const titleString = 'Confirm abort merge'
const cancelButtonString = 'Cancel'
const abortButtonString = 'Abort merge'

/**
 * Modal to tell the user their merge encountered conflicts
 */
export class AbortMergeWarning extends React.Component<
  IAbortMergeWarningProps,
  {}
> {
  /**
   *  Aborts the merge and dismisses the modal
   */
  private onSubmit = async () => {
    await this.props.dispatcher.abortMerge(this.props.repository)
    this.props.onDismissed()
  }

  /**
   *  dismisses the modal and shows the merge conflicts modal
   */
  private onCancel = () => {
    this.props.onDismissed()
    this.props.dispatcher.showPopup({
      type: PopupType.MergeConflicts,
      repository: this.props.repository,
      currentBranch: this.props.currentBranch,
      theirBranch: this.props.theirBranch,
    })
  }

  public render() {
    return (
      <Dialog
        id="abort-merge-warning"
        title={titleString}
        dismissable={false}
        onDismissed={this.onCancel}
        onSubmit={this.onSubmit}
      >
        <DialogContent className="content-wrapper">
          <Octicon symbol={OcticonSymbol.alert} />
          <div className="column-left">
            <p>
              {'Are you sure you want to abort merging '}
              <strong>{this.props.theirBranch}</strong>
              {' into '}
              <strong>{this.props.currentBranch}</strong>?
            </p>
            <p>
              Aborting this merge will take you back to the pre-merge state and
              the conflicts you've already resolved will still be present.
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <ButtonGroup>
            <Button type="submit">{abortButtonString}</Button>
            <Button onClick={this.onCancel}>{cancelButtonString}</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }
}

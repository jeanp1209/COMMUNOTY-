import { updateConflictState } from '../../../../src/lib/stores/updates/changes-state'
import { createState, createStatus } from './changes-state-helper'
import {
  ManualConflictResolution,
  ManualConflictResolutionKind,
} from '../../../../src/models/manual-conflict-resolution'

describe('updateConflictState', () => {
  const statsStore = {
    recordMergeAbortedAfterConflicts: jest.fn(),
    recordMergeSuccessAfterConflicts: jest.fn(),
  }
  const manualResolutions = new Map<string, ManualConflictResolution>([
    ['foo', ManualConflictResolutionKind.theirs],
  ])

  it('returns null when no MERGE_HEAD file found', () => {
    const prevState = createState({
      conflictState: {
        currentBranch: 'old-branch',
        currentTip: 'old-sha',
        manualResolutions,
      },
    })
    const status = createStatus({ mergeHeadFound: false })
    const conflictState = updateConflictState(prevState, status, statsStore)
    expect(conflictState).toBeNull()
  })

  it('preserves manual resolutions between updates in the same merge', () => {
    const prevState = createState({
      conflictState: {
        currentBranch: 'old-branch',
        currentTip: 'old-sha',
        manualResolutions,
      },
    })
    const status = createStatus({
      mergeHeadFound: true,
      currentBranch: 'master',
      currentTip: 'first-sha',
    })

    const conflictState = updateConflictState(prevState, status, statsStore)

    expect(conflictState).toEqual({
      currentBranch: 'master',
      currentTip: 'first-sha',
      manualResolutions,
    })
  })

  it('returns null when MERGE_HEAD set but not branch or tip defined', () => {
    const prevState = createState({
      conflictState: {
        currentBranch: 'old-branch',
        currentTip: 'old-sha',
        manualResolutions,
      },
    })
    const status = createStatus({
      mergeHeadFound: true,
      currentBranch: undefined,
      currentTip: undefined,
    })

    const conflictState = updateConflictState(prevState, status, statsStore)
    expect(conflictState).toBeNull()
  })

  it('returns a value when status has MERGE_HEAD set', () => {
    const prevState = createState({
      conflictState: null,
    })
    const status = createStatus({
      mergeHeadFound: true,
      currentBranch: 'master',
      currentTip: 'first-sha',
    })

    const conflictState = updateConflictState(prevState, status, statsStore)

    expect(conflictState).toEqual({
      currentBranch: 'master',
      currentTip: 'first-sha',
      manualResolutions: new Map<string, ManualConflictResolution>(),
    })
  })

  it('increments abort counter when branch has changed', () => {
    const prevState = createState({
      conflictState: {
        currentBranch: 'old-branch',
        currentTip: 'old-sha',
        manualResolutions: new Map<string, ManualConflictResolution>(),
      },
    })
    const status = createStatus({
      mergeHeadFound: true,
      currentBranch: 'master',
      currentTip: 'first-sha',
    })

    updateConflictState(prevState, status, statsStore)

    expect(statsStore.recordMergeAbortedAfterConflicts).toHaveBeenCalled()
  })

  it('increments abort counter when conflict resolved and tip has not changed', () => {
    const prevState = createState({
      conflictState: {
        currentBranch: 'master',
        currentTip: 'old-sha',
        manualResolutions: new Map<string, ManualConflictResolution>(),
      },
    })
    const status = createStatus({
      mergeHeadFound: false,
      currentBranch: 'master',
      currentTip: 'old-sha',
    })

    updateConflictState(prevState, status, statsStore)

    expect(statsStore.recordMergeAbortedAfterConflicts).toHaveBeenCalled()
  })

  it('increments success counter when conflict resolved and tip has changed', () => {
    const prevState = createState({
      conflictState: {
        currentBranch: 'master',
        currentTip: 'old-sha',
        manualResolutions: new Map<string, ManualConflictResolution>(),
      },
    })
    const status = createStatus({
      mergeHeadFound: false,
      currentBranch: 'master',
      currentTip: 'new-sha',
    })

    updateConflictState(prevState, status, statsStore)

    expect(statsStore.recordMergeSuccessAfterConflicts).toHaveBeenCalled()
  })
})

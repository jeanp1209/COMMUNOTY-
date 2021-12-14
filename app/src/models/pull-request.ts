import { APIRefState } from '../lib/api'
import { GitHubRepository } from './github-repository'

export class PullRequestRef {
  /**
   * @param ref The name of the ref.
   * @param sha The SHA of the ref.
   * @param gitHubRepository The GitHub repository in which this ref lives. It could be null if the
   *                         repository was deleted after the PR was opened.
   */
  public constructor(
    public readonly ref: string,
    public readonly sha: string,
    public readonly gitHubRepository: GitHubRepository | null
  ) {}
}

/** The commit status and metadata for a given ref */
export interface ICommitStatus {
  readonly id: number
  readonly state: APIRefState
  readonly description: string
}

export class PullRequestStatus {
  /**
   * @param pullRequestNumber The pull request this status is associated with.
   * @param state The status' state.
   * @param totalCount The number of statuses represented in this combined status.
   * @param sha The SHA for which this status applies.
   * @param statuses The list of all statuses for a specific ref.
   */
  public constructor(
    public readonly pullRequestNumber: number,
    public readonly state: APIRefState,
    public readonly totalCount: number,
    public readonly sha: string,
    public readonly statuses: ReadonlyArray<ICommitStatus>
  ) {}
}

export class PullRequest {
  /**
   * @param id The database ID.
   * @param created The date on which the PR was created.
   * @param status The status of the PR. This will be `null` if we haven't looked up its
   *               status yet or if an error occurred while looking it up.
   * @param title The title of the PR.
   * @param number The number.
   * @param head The ref from which the pull request's changes are coming.
   * @param base The ref which the pull request is targetting.
   * @param author The author's login.
   */
  public constructor(
    public readonly id: number,
    public readonly created: Date,
    public readonly status: PullRequestStatus | null,
    public readonly title: string,
    public readonly pullRequestNumber: number,
    public readonly head: PullRequestRef,
    public readonly base: PullRequestRef,
    public readonly author: string
  ) {}
}

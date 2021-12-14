const Disable = false

/**
 * Enables the application to opt-in for preview features based on runtime
 * checks. This is backed by the GITHUB_DESKTOP_PREVIEW_FEATURES environment
 * variable, which is checked for non-development environments.
 */
function enableDevelopmentFeatures(): boolean {
  if (Disable) {
    return false
  }

  if (__DEV__) {
    return true
  }

  if (process.env.GITHUB_DESKTOP_PREVIEW_FEATURES === '1') {
    return true
  }

  return false
}

/** Should the app enable beta features? */
//@ts-ignore: this will be used again in the future
function enableBetaFeatures(): boolean {
  return enableDevelopmentFeatures() || __RELEASE_CHANNEL__ === 'beta'
}

/** Should merge tool integration be enabled? */
export function enableMergeTool(): boolean {
  return enableDevelopmentFeatures()
}

/** Should `git status` use --no-optional-locks to assist with concurrent usage */
export function enableStatusWithoutOptionalLocks(): boolean {
  return true
}

/** Should git pass `--recurse-submodules` when performing operations? */
export function enableRecurseSubmodulesFlag(): boolean {
  return enableBetaFeatures()
}

/** Should the app check and warn the user about committing large files? */
export function enableFileSizeWarningCheck(): boolean {
  return true
}

/** Should the app set protocol.version=2 for any fetch/push/pull/clone operation? */
export function enableGitProtocolVersionTwo(): boolean {
  return enableBetaFeatures()
}

export function enableReadmeOverwriteWarning(): boolean {
  return enableBetaFeatures()
}

/**
 * Whether or not to activate the "Create PR" blankslate action.
 *
 * The state of the feature as of writing this is that the underlying
 * data source required to power this feature is not reliable enough
 * and needs looking at so we aren't ready to move this to production
 * just yet.
 */
export function enableNoChangesCreatePRBlankslateAction(): boolean {
  return enableBetaFeatures()
}

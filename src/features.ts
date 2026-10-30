/**
 * Later product surfaces. They stay off until the design in
 * docs/uitbreidingen.md is actually built. The app does not call them.
 */
export type FeatureName = 'accounts' | 'uploads' | 'likes' | 'comments'

export const features: Record<FeatureName, boolean> = {
  accounts: false,
  uploads: false,
  likes: false,
  comments: false,
}

export class FeatureDisabledError extends Error {
  readonly feature: FeatureName

  constructor(feature: FeatureName) {
    super(`ODIN feature "${feature}" is turned off`)
    this.name = 'FeatureDisabledError'
    this.feature = feature
  }
}

export function assertEnabled(feature: FeatureName): void {
  if (!features[feature]) throw new FeatureDisabledError(feature)
}

import { describe, expect, it } from 'vitest'
import { FeatureDisabledError, features } from '../src/features'
import {
  createDisabledAuth,
  createDisabledComments,
  createDisabledLikes,
  createDisabledUploads,
} from '../src/future/disabled'

describe('feature flags', () => {
  it('ships with accounts, uploads, likes and comments off', () => {
    expect(features).toEqual({
      accounts: false,
      uploads: false,
      likes: false,
      comments: false,
    })
  })

  it('refuses the stub ports', async () => {
    const auth = createDisabledAuth()
    const comments = createDisabledComments()
    const likes = createDisabledLikes()
    const uploads = createDisabledUploads()
    await expect(auth.signIn('a@b.c')).rejects.toBeInstanceOf(FeatureDisabledError)
    await expect(auth.currentUser()).rejects.toBeInstanceOf(FeatureDisabledError)
    await expect(comments.list('at-the-gate')).rejects.toBeInstanceOf(FeatureDisabledError)
    await expect(likes.count('at-the-gate')).rejects.toBeInstanceOf(FeatureDisabledError)
    await expect(
      uploads.requestUpload({
        videoId: 'at-the-gate',
        title: 'At the Gate',
        description: '',
        sourceFilename: 'a.mp4',
        subtitlesFilename: 'a.vtt',
      }),
    ).rejects.toBeInstanceOf(FeatureDisabledError)
  })
})

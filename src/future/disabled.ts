import { assertEnabled } from '../features'
import type { AuthPort, CommentPort, LikePort, UploadPort } from './types'

/** Ports that refuse every call while the feature flags are off. */
export function createDisabledAuth(): AuthPort {
  return {
    async currentUser() {
      assertEnabled('accounts')
      return null
    },
    async signIn() {
      assertEnabled('accounts')
      throw new Error('unreachable')
    },
    async signOut() {
      assertEnabled('accounts')
    },
  }
}

export function createDisabledComments(): CommentPort {
  return {
    async list() {
      assertEnabled('comments')
      return []
    },
    async add() {
      assertEnabled('comments')
      throw new Error('unreachable')
    },
  }
}

export function createDisabledLikes(): LikePort {
  return {
    async count() {
      assertEnabled('likes')
      return 0
    },
    async likedByCurrentUser() {
      assertEnabled('likes')
      return false
    },
    async setLiked() {
      assertEnabled('likes')
    },
  }
}

export function createDisabledUploads(): UploadPort {
  return {
    async requestUpload() {
      assertEnabled('uploads')
      throw new Error('unreachable')
    },
  }
}

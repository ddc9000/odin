/**
 * Shapes for accounts, uploads, likes and comments.
 * Nothing in the read-only site implements these yet.
 * See docs/uitbreidingen.md.
 */

export interface User {
  id: string
  displayName: string
  handle: string
  email: string
}

export interface Session {
  userId: string
  token: string
  expiresAt: string
}

export interface Comment {
  id: string
  videoId: string
  userId: string
  body: string
  createdAt: string
}

export interface Like {
  videoId: string
  userId: string
  createdAt: string
}

export interface UploadRequest {
  videoId: string
  title: string
  description: string
  sourceFilename: string
  subtitlesFilename: string
}

export interface AuthPort {
  currentUser(): Promise<User | null>
  signIn(email: string): Promise<Session>
  signOut(): Promise<void>
}

export interface CommentPort {
  list(videoId: string): Promise<Comment[]>
  add(videoId: string, body: string): Promise<Comment>
}

export interface LikePort {
  count(videoId: string): Promise<number>
  likedByCurrentUser(videoId: string): Promise<boolean>
  setLiked(videoId: string, liked: boolean): Promise<void>
}

export interface UploadPort {
  requestUpload(input: UploadRequest): Promise<{ uploadId: string }>
}

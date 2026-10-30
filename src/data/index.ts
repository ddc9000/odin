import { mediaBaseUrl } from '../config'
import type { CatalogFile } from './types'
import raw from './catalog.json'
import { createCatalog } from './repository'

export const catalog = createCatalog(raw as CatalogFile, mediaBaseUrl)
export type { Catalog } from './repository'
export type { Video } from './types'

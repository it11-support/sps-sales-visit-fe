export interface Emit {
  (e: 'collapsed', isContentCollapsed: boolean): void
  (e: 'refresh', stopLoading: () => void): void
  (e: 'trash'): void
  (e: 'initialLoad'): void
  (e: 'update:loading', loading: boolean): void
}

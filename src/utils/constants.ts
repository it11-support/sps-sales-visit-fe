export const COOKIE_MAX_AGE_1_YEAR = 365 * 24 * 60 * 60

export const DEFAULT_PER_PAGE = 10

export const PAGINATION_ITEMS = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
  { value: 150, title: '150' },
]


export const COMPANIES = {
  SPS: "SPS",
  BBS: "BBS",
} as const;

export type Company = keyof typeof COMPANIES;

export const DEFAULT_TOAST_TIMEOUT = 3000

const COMPANY_PRIORITY = ['SPS']


export const getAnchorAndPrevDays = (companyData: Record<string, any>) => {
  const months = Object.keys(companyData).sort()

  if (months.length < 2) {
    return null
  }

  const currentKey = months[months.length - 1]
  const prevKey = months[months.length - 2]

  const anchorDate = companyData[currentKey].date // "2025-12-18"
  const anchorDay = new Date(anchorDate).getDate()

  const [prevYear, prevMonth] = prevKey.split('-').map(Number)
  const prevDays = daysInMonth(prevYear, prevMonth - 1)

  return {
    currentKey,
    prevKey,
    anchorDay,
    prevDays,
  }
}

const daysInMonth = (year: number, monthIndex: number) => {
  return new Date(year, monthIndex + 1, 0).getDate()
}


export const sortByCompanyPriority = <T>(data: Record<string, T>) => {
  const sorted: Record<string, T> = {};

  Object.keys(data)
    .sort((a, b) => {
      const pa = COMPANY_PRIORITY.indexOf(a);
      const pb = COMPANY_PRIORITY.indexOf(b);

      if (pa === -1 && pb === -1) return a.localeCompare(b);
      if (pa === -1) return 1;
      if (pb === -1) return -1;
      return pa - pb;
    })
    .forEach(key => {
      sorted[key] = data[key];
    });

  return sorted;
};

export const getLocalStoreKey = (userId: number | string) => {
  return `activityFilters_${userId}`
}



export const updateFilter = (key: string, value: object) => {
  const existing = localStorage.getItem(key)
  const oldData = existing ? JSON.parse(existing) : {}

  const merged = {
    ...oldData,
    ...value
  }

  localStorage.setItem(key, JSON.stringify(merged))
}

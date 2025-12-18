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

const WARNING_THRESHOLDS = [10, 20, 30, 40, 50]

export function getSavingWarning(savingsCurrent: number, savingsTarget: number) {
  if (savingsTarget <= 0) return null

  // If saved amount is already above target, warning should disappear.
  if (savingsCurrent > savingsTarget) return null

  if (savingsCurrent === savingsTarget) {
    return 'Tabungan kamu tepat di batas target saving.'
  }

  const belowTargetPct = ((savingsTarget - savingsCurrent) / savingsTarget) * 100
  const nearestThreshold = WARNING_THRESHOLDS.find(
    (threshold) => belowTargetPct <= threshold,
  )

  if (nearestThreshold !== undefined) {
    return `Tabungan kamu sekitar ${Math.ceil(belowTargetPct)}% lagi untuk mencapai target.`
  }

  // If gap is still larger than 50%, do not show warning yet.
  return null
}

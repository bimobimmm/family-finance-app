const WARNING_THRESHOLDS = [10, 20, 30, 40, 50]

export function getSavingWarning(totalBalance: number, savingsTarget: number) {
  if (savingsTarget <= 0) return null

  // If balance is already above target, warning should disappear.
  if (totalBalance > savingsTarget) return null

  if (totalBalance === savingsTarget) {
    return 'Saldo kamu tepat di batas target saving.'
  }

  const belowTargetPct = ((savingsTarget - totalBalance) / savingsTarget) * 100
  const nearestThreshold = WARNING_THRESHOLDS.find(
    (threshold) => belowTargetPct <= threshold,
  )

  if (nearestThreshold !== undefined) {
    return `Saldo kamu sekitar ${Math.ceil(belowTargetPct)}% di bawah target saving.`
  }

  return 'Kamu sudah melewati batas aman dari target saving.'
}

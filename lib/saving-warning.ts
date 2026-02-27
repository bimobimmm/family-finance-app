const WARNING_THRESHOLDS = [10, 20, 30, 40, 50]

export function getSavingWarning(totalBalance: number, savingsTarget: number) {
  if (savingsTarget <= 0) return null

  const safeRemaining = totalBalance - savingsTarget

  if (safeRemaining <= 0) {
    return 'Kamu sudah menyentuh atau melewati batas target saving.'
  }

  const safeRemainingPct = (safeRemaining / savingsTarget) * 100
  const nearestThreshold = WARNING_THRESHOLDS.find(
    (threshold) => safeRemainingPct <= threshold,
  )

  if (nearestThreshold !== undefined) {
    return `${nearestThreshold}% lagi kamu hampir mencapai batas saving yang kamu tentukan.`
  }

  return null
}

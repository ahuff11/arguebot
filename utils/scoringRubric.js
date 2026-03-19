const SCORING_RUBRIC = [
  { key: 'logic', label: 'Logic', min: 0, max: 10 },
  { key: 'evidence', label: 'Evidence', min: 0, max: 10 },
  { key: 'clarity', label: 'Clarity', min: 0, max: 10 },
  { key: 'rebuttalStrength', label: 'Rebuttal Strength', min: 0, max: 10 },
  { key: 'persuasiveness', label: 'Persuasiveness', min: 0, max: 10 },
];

function calculateTotalScore(categoryScores = {}) {
  return SCORING_RUBRIC.reduce((total, category) => {
    const value = Number(categoryScores[category.key] ?? 0);
    return total + Math.max(category.min, Math.min(category.max, value));
  }, 0);
}

module.exports = {
  SCORING_RUBRIC,
  calculateTotalScore,
};

export const getSmartInsight = (spent: number, budget: number) => {
  if (!budget) return "";

  const percent = (spent / budget) * 100;

  if (percent >= 90) {
    return "⚠ You have almost used your full budget this month.";
  }

  if (percent >= 70) {
    return "⚠ You have already used more than 70% of your budget.";
  }

  if (percent >= 40) {
    return "⚡ Keep an eye on your spending.";
  }

  return "✅ Great! You are managing your money well this month.";
};
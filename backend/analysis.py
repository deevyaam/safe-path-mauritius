from typing import Dict

RISK_WEIGHT = {
    'stress': 20,
    'sadness': 15,
    'agitation': 20,
    'fatigue': 12,
    'withdrawal': 15,
    'avoidance': 18
}

def score_indicators(indicators: Dict[str, bool]) -> Dict[str, object]:
    score = 0
    reasons = []

    for label, active in indicators.items():
        if not active:
            continue
        weight = RISK_WEIGHT.get(label, 10)
        score += weight
        reasons.append(f'{label.capitalize()} indicator observed adds {weight} points')

    score = min(score, 100)
    if score >= 70:
        level = 'High'
    elif score >= 40:
        level = 'Medium'
    else:
        level = 'Low'

    return {
        'score': score,
        'concern_level': level,
        'reasons': reasons,
        'explanation': 'This is an early risk indicator score. Human review is required before any referral or action.'
    }

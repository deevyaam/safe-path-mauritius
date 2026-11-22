from fastapi import APIRouter
from ..analysis import score_indicators

router = APIRouter(prefix='/analysis', tags=['analysis'])

@router.post('/')
def run_analysis(payload: dict):
    indicators = payload.get('indicators', {})
    result = score_indicators(indicators)
    result['note'] = 'This result is an early warning summary and is not a diagnosis. Human review is required.'
    return result

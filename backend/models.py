from dataclasses import dataclass

@dataclass
class CaseRecord:
    id: str
    name: str
    concern_level: str
    status: str
    summary: str
    indicators: str
    reviewer_notes: str
    referral: str

@dataclass
class Organization:
    id: int
    name: str
    description: str
    contact: str

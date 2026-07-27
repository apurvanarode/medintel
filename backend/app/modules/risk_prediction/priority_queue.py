import heapq

class PatientPriorityQueue:
    """
    Max-heap based priority queue for allocating limited follow-up-call
    staff slots to patients, ordered by readmission risk score.

    Using a heap here (O(log n) push/pop) is a deliberate choice over
    simply sorting the full list — in a real system, patients arrive and
    get re-scored continuously, so a heap lets us efficiently insert new
    high-risk patients without re-sorting the entire population each time.
    """

    def __init__(self):
        self._heap = []
        self._counter = 0  # tie-breaker for stable ordering

    def push(self, patient_id: str, risk_score: float):
        # heapq is a min-heap, so we negate the score to simulate a max-heap
        self._counter += 1
        heapq.heappush(self._heap, (-risk_score, self._counter, patient_id, risk_score))

    def pop(self):
        if not self._heap:
            return None
        _, _, patient_id, risk_score = heapq.heappop(self._heap)
        return patient_id, risk_score

    def is_empty(self):
        return len(self._heap) == 0


def allocate_follow_up_slots(patients_with_scores: list, available_slots: int):
    """
    patients_with_scores: list of (patient_id, risk_score) tuples
    Returns a ranked list of dicts, with the top `available_slots` marked
    as assigned=True, using a priority queue to determine order.
    """
    pq = PatientPriorityQueue()
    for patient_id, risk_score in patients_with_scores:
        pq.push(patient_id, risk_score)

    ranked = []
    rank = 1
    while not pq.is_empty():
        patient_id, risk_score = pq.pop()
        ranked.append({
            "patient_id": patient_id,
            "risk_score": risk_score,
            "priority_rank": rank,
            "assigned": rank <= available_slots,
        })
        rank += 1

    return ranked
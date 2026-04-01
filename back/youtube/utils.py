import re
from datetime import datetime


# =========================================================
# 3. 날짜 변환
# =========================================================
def convert_datetime(dt_str):
    if not dt_str:
        return None

    try:
        return datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ")
    except Exception as e:
        print("날짜 변환 실패:", dt_str, e)
        return None


# =========================================================
# 4. ISO 8601 duration -> 초 변환
# =========================================================
def parse_iso8601_duration_to_seconds(duration_str):
    if not duration_str:
        return 0

    pattern = re.compile(
        r"P"
        r"(?:(?P<days>\\d+)D)?"
        r"(?:T"
        r"(?:(?P<hours>\\d+)H)?"
        r"(?:(?P<minutes>\\d+)M)?"
        r"(?:(?P<seconds>\\d+)S)?"
        r")?"
    )

    match = pattern.fullmatch(duration_str)
    if not match:
        return 0

    days = int(match.group("days") or 0)
    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes") or 0)
    seconds = int(match.group("seconds") or 0)

    return days * 86400 + hours * 3600 + minutes * 60 + seconds


# =========================================================
# 5. 유틸 - 배치 분리
# =========================================================
def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]
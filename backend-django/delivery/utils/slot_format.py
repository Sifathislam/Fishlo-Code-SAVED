# delivery/utils/slot_format.py

def fmt_12h(t):
    if t.minute == 0:
        return t.strftime("%I%p").lstrip("0")
    return t.strftime("%I:%M%p").lstrip("0")

def slot_label(start_time, end_time) -> str:
    return f"{fmt_12h(start_time)} - {fmt_12h(end_time)}"
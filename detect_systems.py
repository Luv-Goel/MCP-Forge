import os, json, re

BASE = r'C:\Users\Luvgo\mcp_forge_repo'

SERVICE_PATTERNS = {
    "Windows": [r"\bREGISTRY_EVENT\b", r"HKLM\\",     r"\bSCHTASKS\b"],
    "Linux":   [r"\bKernelPanic\b",   r"\bREGISTRY_EVENT\b", r"/proc/",
                r"\bunhandled exception\b"],
    "macOS":   [r"[Ff]inder",           r"/System/Library/",        r"\bsystem_profiler\b"],
}

def match_system(text, patterns):
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False

# discover files
service_files = ["service_1.txt","service_2.txt","service_3.txt",
                 "service_4.txt","service_5.txt","manifest.txt"]
detected = {}
for fname in service_files:
    path = os.path.join(BASE, fname)
    with open(path, encoding='utf-8') as fh:
        content = fh.read()
    detected[fname] = []
    for sys_name, pats in SERVICE_PATTERNS.items():
        if match_system(content, pats):
            detected[fname].append(sys_name)

for fname, systems in detected.items():
    primary = systems[0] if systems else "unknown"
    print(f"{fname} -> {primary}")

#!/usr/bin/env python3
"""Turn book.dxr's Lingo property list into the gallery manifest.

  [[#header: 1, #file: "01.jpg", #folder: "adidas"], …]

#header marks the opening plate of each project, so the list carries both the
project grouping and the exact running order the CD used.
"""
import json
import re
import sys
from pathlib import Path

src = Path(sys.argv[1]).read_text()
ENTRY = re.compile(r'#header:\s*(\d+),\s*#file:\s*"([^"]+)",\s*#folder:\s*"([^"]+)"')

projects, index = [], {}
for header, file, folder in ENTRY.findall(src):
    if folder not in index:
        index[folder] = {'name': folder, 'plates': []}
        projects.append(index[folder])
    index[folder]['plates'].append({'file': file, 'header': header == '1'})

out = Path(sys.argv[2])
out.write_text(json.dumps(projects, indent=1, ensure_ascii=False))
total = sum(len(p['plates']) for p in projects)
print(f'{len(projects)} projects, {total} plates → {out}')
for p in projects:
    print(f"  {len(p['plates']):>2}  {p['name']}")

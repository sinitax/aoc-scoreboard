#!/usr/bin/env python3

import requests, os, json, sys

if len(sys.argv) != 5:
    print("Usage: scoreboard.py <year> <id> <headerfile> <outfile>")
    sys.exit(1)

year = sys.argv[1]
sbid = sys.argv[2]
headerfile = sys.argv[3]
outfile = sys.argv[4]
sburl = f"https://adventofcode.com/{year}/leaderboard/private/view/{sbid}.json"

r = requests.get(sburl, headers=json.loads(open(headerfile).read()))
if r.status_code != 200:
    sys.exit(1)

open(outfile, "w+").write(r.text)

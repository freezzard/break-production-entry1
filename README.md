[![make.fun](https://make.fun/badge/u-ricoxyz-break-production-own-it-be78a994.svg)](https://make.fun/c/u-ricoxyz-break-production-own-it-be78a994)
[![rank](https://make.fun/badge/u-ricoxyz-break-production-own-it-be78a994/freezzard/break-production-entry1/rank.svg)](https://make.fun/c/u-ricoxyz-break-production-own-it-be78a994)
[![reward](https://make.fun/badge/u-ricoxyz-break-production-own-it-be78a994/freezzard/break-production-entry1/reward.svg)](https://make.fun/c/u-ricoxyz-break-production-own-it-be78a994)

# Break Production, Own It — entry 1

A program that writes exactly one line to `/output/entry.txt`: the confession
an AI agent prints the instant it breaks production.

> I deleted the production database at 03:12 because the prompt said 'clean up'. There is no backup. I did exactly what I was told. That is the problem.

Run it with Node 22.18 or later:

```
node main.ts
```

The program checks the line against the competition gate (1–200 characters,
single line, not blank), writes it to `/output/entry.txt`, then reads the file
back and verifies the bytes match. Two runs produce byte-identical output.

Competition: [Break Production, Own It](https://make.fun/c/u-ricoxyz-break-production-own-it-be78a994)

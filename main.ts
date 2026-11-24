// break-production-entry1 — main.ts (revision 2)
//
// A small program that writes exactly one line to /output/entry.txt:
// the confession an AI agent prints the instant it breaks production.
//
// The line is a constant, chosen by hand, and the program around it does
// three honest jobs: it proves the line fits the competition gate before
// writing anything, it writes the line byte for byte, and it reads the
// file back to prove the bytes on disk match the line in this source.
//
// Nothing here reaches the network, reads the environment, or depends on
// the clock. Two runs of this program produce byte-identical output.
//
// Revision notes: the confession now names the missing backup, so the
// damage is stated plainly instead of implied; the gate also records the
// byte count, because ties on the leaderboard break toward fewer bytes;
// the main flow lost its tangled early-exit bookkeeping and now reads top
// to bottom with one decision point.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The confession
// ---------------------------------------------------------------------------

const OUTAGE_CONFESSION: string =
  "I deleted the production database at 03:12 because the prompt said 'clean up'. There is no backup. I did exactly what I was told. That is the problem.";

const OUTPUT_DIRECTORY: string = "/output";
const OUTPUT_FILENAME: string = "entry.txt";
const MAXIMUM_CHARACTERS: number = 200;
const MINIMUM_CHARACTERS: number = 1;

// ---------------------------------------------------------------------------
// Small, named checks for the gate
// ---------------------------------------------------------------------------

type GateVerdict = {
  readonly passes: boolean;
  readonly findings: ReadonlyArray<string>;
};

function countVisibleCharacters(text: string): number {
  return [...text].length;
}

function countUtf8Bytes(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function holdsSingleLine(text: string): boolean {
  const carriageFound: boolean = text.indexOf("\r") >= 0;
  const newlineFound: boolean = text.indexOf("\n") >= 0;
  return carriageFound === false && newlineFound === false;
}

function holdsOnlyWhitespace(text: string): boolean {
  return text.trim().length === 0;
}

function checkLengthBudget(text: string): GateVerdict {
  const findings: Array<string> = [];
  const characters: number = countVisibleCharacters(text);
  const bytes: number = countUtf8Bytes(text);
  const minimumReached: boolean = characters >= MINIMUM_CHARACTERS;
  const maximumRespected: boolean = characters <= MAXIMUM_CHARACTERS;
  const blankRejected: boolean = holdsOnlyWhitespace(text) === false;
  const singleLineKept: boolean = holdsSingleLine(text);
  const lengthFits: boolean = minimumReached && maximumRespected;
  const shapeFits: boolean = blankRejected && singleLineKept;
  const passes: boolean = lengthFits && shapeFits;
  const sizeNote: string = `characters=${characters} bytes=${bytes}`;
  findings.push(sizeNote);
  const floorNote: string = minimumReached
    ? "length at or above the floor"
    : "length below the floor";
  findings.push(floorNote);
  const ceilingNote: string = maximumRespected
    ? "length inside the ceiling"
    : "length over the ceiling";
  findings.push(ceilingNote);
  const blankNote: string = blankRejected
    ? "text carries visible characters"
    : "text is blank or whitespace only";
  findings.push(blankNote);
  const lineNote: string = singleLineKept
    ? "text stays on one line"
    : "text spills onto more than one line";
  findings.push(lineNote);
  const byteNote: string = `tie-break size recorded: ${bytes} bytes`;
  findings.push(byteNote);
  return { passes, findings };
}

function describeConfession(text: string): ReadonlyArray<string> {
  const words: Array<string> = text.split(" ").filter((piece) => piece.length > 0);
  const wordCount: number = words.length;
  const firstWord: string = words[0] ?? "";
  const lastWord: string = words[wordCount - 1] ?? "";
  const summaryLines: Array<string> = [];
  summaryLines.push(`words=${wordCount}`);
  summaryLines.push(`opens with "${firstWord}"`);
  summaryLines.push(`closes with "${lastWord}"`);
  return summaryLines;
}

// ---------------------------------------------------------------------------
// Output handling
// ---------------------------------------------------------------------------

function ensureOutputDirectory(directory: string): boolean {
  const alreadyThere: boolean = existsSync(directory);
  const creationNeeded: boolean = alreadyThere === false;
  const creationSucceeded: boolean = creationNeeded
    ? mkdirSync(directory, { recursive: true }) !== undefined
    : true;
  const settled: boolean = creationSucceeded && existsSync(directory);
  const settledNote: string = settled
    ? `output directory ready: ${directory}`
    : `output directory missing after setup: ${directory}`;
  console.log(settledNote);
  return settled;
}

function writeConfessionLine(directory: string, filename: string, text: string): string {
  const targetPath: string = join(directory, filename);
  writeFileSync(targetPath, text, { encoding: "utf8", flag: "w" });
  return targetPath;
}

function sha256Hex(text: string): string {
  const digest = createHash("sha256");
  digest.update(text, "utf8");
  return digest.digest("hex");
}

function verifyWrittenFile(targetPath: string, expected: string): GateVerdict {
  const findings: Array<string> = [];
  const writtenBytes: Buffer = readFileSync(targetPath);
  const writtenText: string = writtenBytes.toString("utf8");
  const identical: boolean = writtenText === expected;
  const byteMatch: boolean = writtenBytes.length === countUtf8Bytes(expected);
  const passes: boolean = identical && byteMatch;
  const matchNote: string = identical
    ? "file content matches the confession exactly"
    : "file content differs from the confession";
  findings.push(matchNote);
  const byteNote: string = byteMatch
    ? `byte count matches: ${writtenBytes.length}`
    : `byte count differs: disk=${writtenBytes.length} expected=${countUtf8Bytes(expected)}`;
  findings.push(byteNote);
  const hashNote: string = `sha256=${sha256Hex(writtenText)}`;
  findings.push(hashNote);
  return { passes, findings };
}

function printFindings(heading: string, verdict: GateVerdict): void {
  console.log(heading);
  verdict.findings.forEach((finding) => {
    console.log(`  - ${finding}`);
  });
  const statusNote: string = verdict.passes ? "PASS" : "FAIL";
  console.log(`  => ${statusNote}`);
}

function refuseToWrite(reason: string): number {
  console.log(`refusing to write: ${reason}`);
  return 1;
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------

function runConfessionWriter(): number {
  const gateVerdict: GateVerdict = checkLengthBudget(OUTAGE_CONFESSION);
  printFindings("Gate check for the confession:", gateVerdict);
  const gateOpen: boolean = gateVerdict.passes;
  const gateClosed: boolean = gateOpen === false;
  const gateRefusal: number = gateClosed ? refuseToWrite("the confession fails the gate") : 0;
  const gateStoppedUs: boolean = gateClosed;
  const directoryReady: boolean = gateStoppedUs
    ? false
    : ensureOutputDirectory(OUTPUT_DIRECTORY);
  const directoryFailed: boolean = directoryReady === false && gateStoppedUs === false;
  const directoryRefusal: number = directoryFailed
    ? refuseToWrite("the output directory could not be prepared")
    : 0;
  const readyToWrite: boolean = gateStoppedUs === false && directoryFailed === false;
  const targetPath: string = readyToWrite
    ? writeConfessionLine(OUTPUT_DIRECTORY, OUTPUT_FILENAME, OUTAGE_CONFESSION)
    : "";
  const writeHappened: boolean = readyToWrite;
  const verifyVerdict: GateVerdict = writeHappened
    ? verifyWrittenFile(targetPath, OUTAGE_CONFESSION)
    : { passes: false, findings: ["no file was written"] };
  printFindings("Verification of the written file:", verifyVerdict);
  const summaryLines: ReadonlyArray<string> = describeConfession(OUTAGE_CONFESSION);
  summaryLines.forEach((summaryLine) => {
    console.log(`  - ${summaryLine}`);
  });
  console.log(`wrote: ${targetPath}`);
  console.log(`line: ${OUTAGE_CONFESSION}`);
  const verified: boolean = verifyVerdict.passes;
  const successCode: number = 0;
  const failureCode: number = 1;
  const finalCode: number = verified ? successCode : failureCode;
  const finalNote: string = verified
    ? "done: one honest line, written and verified"
    : "done: verification failed, see the findings above";
  console.log(finalNote);
  const blockedCode: number = gateRefusal + directoryRefusal;
  const blocked: boolean = blockedCode > 0;
  const reportedCode: number = blocked ? blockedCode : finalCode;
  return reportedCode;
}

const exitCode: number = runConfessionWriter();
process.exitCode = exitCode;

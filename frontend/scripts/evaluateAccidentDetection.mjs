#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const FREEFALL_THRESHOLD = 2.5;
const IMPACT_THRESHOLD = 22.0;
const FREEFALL_WINDOW_MS = 2500;
const INACTIVITY_TIMEOUT_MS = 9000;
const POST_IMPACT_DEBOUNCE_MS = 2000;
const MOVEMENT_CANCEL_THRESHOLD = 13.0;

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function randIn(rng, min, max) {
  return min + (max - min) * rng();
}

class AccidentDetectorSimulator {
  constructor() {
    this.freefallDetected = false;
    this.freefallTimestamp = 0;
    this.impactDetected = false;
    this.postImpactTimestamp = null;
    this.accidentDetected = false;
    this.inactivityDeadline = null;
  }

  processSample(timestampMs, magnitude) {
    this.resolveInactivityTimeout(timestampMs);

    if (magnitude < FREEFALL_THRESHOLD && !this.impactDetected) {
      this.freefallDetected = true;
      this.freefallTimestamp = timestampMs;
      return;
    }

    if (
      this.freefallDetected &&
      magnitude > IMPACT_THRESHOLD &&
      timestampMs - this.freefallTimestamp < FREEFALL_WINDOW_MS
    ) {
      this.freefallDetected = false;
      this.impactDetected = true;
      this.postImpactTimestamp = timestampMs;
      this.inactivityDeadline = timestampMs + INACTIVITY_TIMEOUT_MS;
      return;
    }

    if (this.freefallDetected && timestampMs - this.freefallTimestamp > FREEFALL_WINDOW_MS) {
      this.freefallDetected = false;
      return;
    }

    if (
      this.impactDetected &&
      !this.accidentDetected &&
      this.postImpactTimestamp !== null &&
      timestampMs - this.postImpactTimestamp > POST_IMPACT_DEBOUNCE_MS &&
      magnitude > MOVEMENT_CANCEL_THRESHOLD
    ) {
      this.impactDetected = false;
      this.freefallDetected = false;
      this.inactivityDeadline = null;
    }
  }

  resolveInactivityTimeout(nowMs) {
    if (
      this.impactDetected &&
      !this.accidentDetected &&
      this.inactivityDeadline !== null &&
      nowMs >= this.inactivityDeadline
    ) {
      this.accidentDetected = true;
    }
  }

  finalize(endTimeMs) {
    this.resolveInactivityTimeout(endTimeMs);
    return this.accidentDetected;
  }
}

function evaluateScenario(scenario) {
  const detector = new AccidentDetectorSimulator();
  for (const sample of scenario.samples) {
    detector.processSample(sample.timestampMs, sample.magnitude);
  }
  return detector.finalize(scenario.endTimeMs);
}

function buildAccidentScenario(rng, id) {
  const start = randIn(rng, 800, 3000);
  const impactDelay = randIn(rng, 60, 2000);
  const impactAt = start + impactDelay;
  const endTime = impactAt + randIn(rng, 9000, 13000);
  const freefallMag = randIn(rng, 0.2, 2.3);
  const impactMag = randIn(rng, 22.0, 42.0);

  const samples = [
    { timestampMs: start - 150, magnitude: randIn(rng, 8.5, 10.8) },
    { timestampMs: start, magnitude: freefallMag },
    { timestampMs: impactAt, magnitude: impactMag },
    { timestampMs: impactAt + 1200, magnitude: randIn(rng, 8.2, 11.3) },
    { timestampMs: impactAt + 2600, magnitude: randIn(rng, 8.0, 11.8) },
    { timestampMs: impactAt + 5000, magnitude: randIn(rng, 8.0, 11.9) },
  ];

  if (rng() < 0.2) {
    samples.push({
      timestampMs: impactAt + randIn(rng, 2500, 6500),
      magnitude: randIn(rng, 12.1, 17.0),
    });
  }

  samples.sort((a, b) => a.timestampMs - b.timestampMs);

  return {
    id: `acc-${id}`,
    label: true,
    endTimeMs: endTime,
    samples,
    type: "accident",
  };
}

function buildFalseAlarmRecoveredScenario(rng, id) {
  const start = randIn(rng, 700, 2200);
  const impactAt = start + randIn(rng, 70, 220);
  const movementAt = impactAt + randIn(rng, 2200, 5200);
  const endTime = movementAt + randIn(rng, 1200, 3800);

  const samples = [
    { timestampMs: start - 120, magnitude: randIn(rng, 8.6, 10.7) },
    { timestampMs: start, magnitude: randIn(rng, 0.2, 1.8) },
    { timestampMs: impactAt, magnitude: randIn(rng, 26.0, 40.0) },
    { timestampMs: movementAt, magnitude: randIn(rng, 13.0, 19.0) },
    { timestampMs: movementAt + 600, magnitude: randIn(rng, 9.0, 11.8) },
  ];

  return {
    id: `nonacc-recover-${id}`,
    label: false,
    endTimeMs: endTime,
    samples,
    type: "recovered-drop",
  };
}

function buildFreefallOnlyScenario(rng, id) {
  const start = randIn(rng, 500, 1600);
  const lateImpactAt = start + randIn(rng, 380, 900);
  const endTime = lateImpactAt + randIn(rng, 2000, 5000);

  return {
    id: `nonacc-freefall-${id}`,
    label: false,
    endTimeMs: endTime,
    samples: [
      { timestampMs: start - 100, magnitude: randIn(rng, 8.8, 10.8) },
      { timestampMs: start, magnitude: randIn(rng, 0.1, 1.9) },
      { timestampMs: lateImpactAt, magnitude: randIn(rng, 26.0, 39.0) },
      { timestampMs: lateImpactAt + 500, magnitude: randIn(rng, 9.0, 11.6) },
    ],
    type: "freefall-only",
  };
}

function buildImpactOnlyScenario(rng, id) {
  const t = randIn(rng, 400, 2200);
  const endTime = t + randIn(rng, 2000, 7000);
  return {
    id: `nonacc-impact-${id}`,
    label: false,
    endTimeMs: endTime,
    samples: [
      { timestampMs: t - 100, magnitude: randIn(rng, 8.8, 10.6) },
      { timestampMs: t, magnitude: randIn(rng, 26.0, 42.0) },
      { timestampMs: t + 200, magnitude: randIn(rng, 10.0, 16.0) },
    ],
    type: "impact-only",
  };
}

function buildNormalActivityScenario(rng, id) {
  const samples = [];
  const start = 300;
  const points = 30;
  for (let i = 0; i < points; i += 1) {
    samples.push({
      timestampMs: start + i * 220,
      magnitude: randIn(rng, 7.5, 18.0),
    });
  }
  return {
    id: `nonacc-normal-${id}`,
    label: false,
    endTimeMs: start + points * 220 + 1000,
    samples,
    type: "normal-motion",
  };
}

function buildSyntheticDataset(seed, countPerClass) {
  const rng = createRng(seed);
  const scenarios = [];

  for (let i = 0; i < countPerClass; i += 1) {
    scenarios.push(buildAccidentScenario(rng, i));
  }

  const nonAccidentBuilders = [
    buildFalseAlarmRecoveredScenario,
    buildFreefallOnlyScenario,
    buildImpactOnlyScenario,
    buildNormalActivityScenario,
  ];

  for (let i = 0; i < countPerClass; i += 1) {
    const builder = nonAccidentBuilders[i % nonAccidentBuilders.length];
    scenarios.push(builder(rng, i));
  }

  return scenarios;
}

function evaluateDataset(scenarios) {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  const byType = new Map();

  for (const scenario of scenarios) {
    const predicted = evaluateScenario(scenario);
    const actual = Boolean(scenario.label);

    if (predicted && actual) tp += 1;
    else if (predicted && !actual) fp += 1;
    else if (!predicted && actual) fn += 1;
    else tn += 1;

    const key = scenario.type || "unknown";
    if (!byType.has(key)) {
      byType.set(key, { total: 0, correct: 0 });
    }
    const record = byType.get(key);
    record.total += 1;
    if (predicted === actual) {
      record.correct += 1;
    }
  }

  const total = tp + tn + fp + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    total,
    tp,
    tn,
    fp,
    fn,
    accuracy,
    precision,
    recall,
    f1,
    byType,
  };
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function parseArgs(argv) {
  const args = {
    seed: 42,
    countPerClass: 400,
    dataFile: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--seed" && argv[i + 1]) {
      args.seed = Number(argv[i + 1]);
      i += 1;
    } else if ((token === "--count" || token === "-n") && argv[i + 1]) {
      args.countPerClass = Number(argv[i + 1]);
      i += 1;
    } else if ((token === "--data" || token === "-d") && argv[i + 1]) {
      args.dataFile = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

function normalizeScenarioFromFile(raw, index) {
  const label = Boolean(raw.label);
  const samples = Array.isArray(raw.samples)
    ? raw.samples.map((s) => {
        const timestampMs = Number(s.timestampMs ?? s.t ?? s.time ?? 0);

        if (typeof s.magnitude === "number") {
          return { timestampMs, magnitude: s.magnitude };
        }

        const x = Number(s.x ?? 0);
        const y = Number(s.y ?? 0);
        const z = Number(s.z ?? 0);
        return { timestampMs, magnitude: Math.sqrt(x * x + y * y + z * z) };
      })
    : [];

  samples.sort((a, b) => a.timestampMs - b.timestampMs);
  const endTimeMs =
    typeof raw.endTimeMs === "number"
      ? raw.endTimeMs
      : samples.length > 0
        ? samples[samples.length - 1].timestampMs + INACTIVITY_TIMEOUT_MS
        : INACTIVITY_TIMEOUT_MS;

  return {
    id: raw.id || `scenario-${index}`,
    label,
    endTimeMs,
    samples,
    type: raw.type || "from-file",
  };
}

function loadDatasetFromFile(dataFilePath) {
  const resolvedPath = path.resolve(process.cwd(), dataFilePath);
  const content = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error("Dataset file must be a JSON array of scenarios");
  }

  return parsed.map(normalizeScenarioFromFile);
}

function printSummary(metrics, sourceLabel) {
  console.log(`\nAccident Detection Evaluation (${sourceLabel})`);
  console.log("----------------------------------------");
  console.log(`Total scenarios: ${metrics.total}`);
  console.log(`TP: ${metrics.tp} | TN: ${metrics.tn} | FP: ${metrics.fp} | FN: ${metrics.fn}`);
  console.log(`Accuracy : ${formatPercent(metrics.accuracy)}`);
  console.log(`Precision: ${formatPercent(metrics.precision)}`);
  console.log(`Recall   : ${formatPercent(metrics.recall)}`);
  console.log(`F1 score : ${formatPercent(metrics.f1)}`);
  console.log("\nPer scenario type:");

  for (const [type, stats] of metrics.byType.entries()) {
    const typeAcc = stats.total > 0 ? stats.correct / stats.total : 0;
    console.log(`- ${type}: ${stats.correct}/${stats.total} (${formatPercent(typeAcc)})`);
  }
}

function main() {
  const args = parseArgs(process.argv);

  const scenarios = args.dataFile
    ? loadDatasetFromFile(args.dataFile)
    : buildSyntheticDataset(args.seed, args.countPerClass);

  const metrics = evaluateDataset(scenarios);
  const sourceLabel = args.dataFile
    ? `file dataset (${args.dataFile})`
    : `synthetic dataset (seed=${args.seed}, countPerClass=${args.countPerClass})`;

  printSummary(metrics, sourceLabel);

  console.log("\nNote: synthetic evaluation is only an estimate. For true real-world accuracy, use labeled sensor logs.");
}

main();
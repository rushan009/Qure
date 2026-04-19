# Accident Detection Evaluation Report

- Generated: 2026-04-01 14:38:23 +0545
- Command: node frontend/scripts/evaluateAccidentDetection.mjs --seed 42 --count 400
- Dataset: Synthetic (seed=42, countPerClass=400)

## Visual Dashboard

- Open: ./accident-evaluation-2026-04-01-visual.html
- PDF: ./accident-evaluation-2026-04-01-visual.pdf

## Overall Metrics

| Metric | Value |
|---|---:|
| Total scenarios | 800 |
| TP | 328 |
| TN | 400 |
| FP | 0 |
| FN | 72 |
| Accuracy | 91.00% |
| Precision | 100.00% |
| Recall | 82.00% |
| F1 score | 90.11% |

## Case-wise Breakdown

| Scenario Type | Correct / Total | Accuracy |
|---|---:|---:|
| accident | 328 / 400 | 82.00% |
| recovered-drop | 100 / 100 | 100.00% |
| freefall-only | 100 / 100 | 100.00% |
| impact-only | 100 / 100 | 100.00% |
| normal-motion | 100 / 100 | 100.00% |

## Raw Output

```text
Accident Detection Evaluation (synthetic dataset (seed=42, countPerClass=400))
----------------------------------------
Total scenarios: 800
TP: 328 | TN: 400 | FP: 0 | FN: 72
Accuracy : 91.00%
Precision: 100.00%
Recall   : 82.00%
F1 score : 90.11%

Per scenario type:
- accident: 328/400 (82.00%)
- recovered-drop: 100/100 (100.00%)
- freefall-only: 100/100 (100.00%)
- impact-only: 100/100 (100.00%)
- normal-motion: 100/100 (100.00%)

Note: synthetic evaluation is only an estimate. For true real-world accuracy, use labeled sensor logs.
```

import {
  clampNumber,
  computeFillUpStats,
  computeFinanceProjections,
  parseMoney,
  type FillUpStats,
  type FinanceRawInputs,
} from "./finance-projections";
import type { SavedFillUpHistoryEntry } from "./backend-api";

// Base set of raw inputs so each test only needs to override the fields
// it cares about, rather than restating every field every time.
function makeInputs(overrides: Partial<FinanceRawInputs> = {}): FinanceRawInputs {
  return {
    incomeInput: "",
    expenseInput: "",
    monthlyFixedCostsInput: "",
    fuelGallonsInput: "",
    fuelPriceInput: "",
    milesPerWeekInput: "",
    combinedMpgInput: "",
    tankCapacityInput: "",
    currentTankPercentInput: "",
    ...overrides,
  };
}

function makeStats(overrides: Partial<FillUpStats> = {}): FillUpStats {
  return {
    typicalFuelPrice: 0,
    typicalFillUpGallons: 0,
    typicalTankCapacity: 0,
    typicalMpg: 0,
    dailyMiles: 0,
    typicalCycleDays: 0,
    ...overrides,
  };
}

// Builds a SavedFillUpHistoryEntry with sensible defaults; recordedAt
// controls sort order (computeFillUpStats sorts newest first).
function makeEntry(overrides: Partial<SavedFillUpHistoryEntry> = {}): SavedFillUpHistoryEntry {
  return {
    milesDriven: 0,
    fuelPrice: 0,
    combinedMpg: 0,
    tankCapacity: 0,
    gallons: 0,
    observedCost: 0,
    recordedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseMoney", () => {
  it("parses a normal numeric string", () => {
    expect(parseMoney("42.5")).toBe(42.5);
  });

  it("returns 0 for empty or non-numeric input", () => {
    expect(parseMoney("")).toBe(0);
    expect(parseMoney("not a number")).toBe(0);
  });

  it("returns 0 for non-finite results", () => {
    expect(parseMoney("Infinity")).toBe(0);
  });
});

describe("clampNumber", () => {
  it("passes through values within range", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
  });

  it("clamps to the minimum", () => {
    expect(clampNumber(-5, 0, 10)).toBe(0);
  });

  it("clamps to the maximum", () => {
    expect(clampNumber(50, 0, 10)).toBe(10);
  });

  it("returns the minimum for non-finite input", () => {
    expect(clampNumber(NaN, 2, 10)).toBe(2);
    expect(clampNumber(Infinity, 2, 10)).toBe(2);
  });
});

describe("computeFillUpStats", () => {
  it("returns all-zero stats for empty history", () => {
    const stats = computeFillUpStats([]);
    expect(stats).toEqual({
      typicalFuelPrice: 0,
      typicalFillUpGallons: 0,
      typicalTankCapacity: 0,
      typicalMpg: 0,
      dailyMiles: 0,
      typicalCycleDays: 0,
    });
  });

  it("derives price/mpg/capacity directly from a single history entry, but no cadence stats", () => {
    const stats = computeFillUpStats([
      makeEntry({
        fuelPrice: 3.75,
        gallons: 10,
        milesDriven: 300,
        combinedMpg: 25,
        tankCapacity: 14,
        recordedAt: "2024-03-01T00:00:00.000Z",
      }),
    ]);

    // A single sample's weighted average is just itself.
    expect(stats.typicalFuelPrice).toBeCloseTo(3.75, 10);
    expect(stats.typicalTankCapacity).toBeCloseTo(14, 10);
    // Computed MPG (miles / gallons) is preferred over the stored combinedMpg field.
    expect(stats.typicalMpg).toBeCloseTo(30, 10);
    // No consecutive pairs exist yet, so cadence can't be derived.
    expect(stats.dailyMiles).toBe(0);
    expect(stats.typicalCycleDays).toBe(0);
  });

  it("falls back to the stored combinedMpg field when milesDriven/gallons aren't usable", () => {
    const stats = computeFillUpStats([
      makeEntry({ gallons: 0, milesDriven: 0, combinedMpg: 27.5 }),
    ]);

    expect(stats.typicalMpg).toBeCloseTo(27.5, 10);
  });

  it("discards a single wild outlier and leaves the typical value close to the non-outlier average", () => {
    // Newest-first order, matching what computeFillUpStats produces internally.
    const cleanPrices = [3.5, 3.55, 3.45, 3.5, 3.52];
    const day = (n: number) => String(n).padStart(2, "0");
    const cleanOnlyStats = computeFillUpStats(
      cleanPrices.map((fuelPrice, index) =>
        makeEntry({ fuelPrice, recordedAt: `2024-02-${day(10 - index)}T00:00:00.000Z` }),
      ),
    );

    const withOutlierStats = computeFillUpStats(
      [100, ...cleanPrices].map((fuelPrice, index) =>
        makeEntry({ fuelPrice, recordedAt: `2024-02-${day(11 - index)}T00:00:00.000Z` }),
      ),
    );

    // The $100 outlier (>3 MADs from the median) should be filtered out
    // entirely, leaving the same result as if it were never recorded.
    expect(withOutlierStats.typicalFuelPrice).toBeCloseTo(cleanOnlyStats.typicalFuelPrice, 10);
    expect(withOutlierStats.typicalFuelPrice).toBeCloseTo(3.5047049653, 6);
    expect(withOutlierStats.typicalFuelPrice).toBeLessThan(10);
  });

  it("weights more recent entries more heavily than older ones", () => {
    // Two very different prices; whichever is "most recent" (first after
    // sorting) should pull the weighted average closer to itself.
    const recentHigh = computeFillUpStats([
      makeEntry({ fuelPrice: 5.0, recordedAt: "2024-05-02T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 3.0, recordedAt: "2024-05-01T00:00:00.000Z" }),
    ]);
    const recentLow = computeFillUpStats([
      makeEntry({ fuelPrice: 3.0, recordedAt: "2024-05-02T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 5.0, recordedAt: "2024-05-01T00:00:00.000Z" }),
    ]);

    expect(recentHigh.typicalFuelPrice).toBeGreaterThan(recentLow.typicalFuelPrice);
    // Sanity: both remain within the [3, 5] range spanned by the two samples.
    expect(recentHigh.typicalFuelPrice).toBeGreaterThan(4);
    expect(recentLow.typicalFuelPrice).toBeLessThan(4);
  });

  it("derives daily miles and cycle length from consecutive fill-ups", () => {
    const stats = computeFillUpStats([
      makeEntry({ milesDriven: 300, recordedAt: "2024-01-11T00:00:00.000Z" }),
      makeEntry({ milesDriven: 280, recordedAt: "2024-01-01T00:00:00.000Z" }),
    ]);

    // 10 days apart, 300 miles driven on the newer fill-up -> 30 miles/day.
    expect(stats.typicalCycleDays).toBeCloseTo(10, 10);
    expect(stats.dailyMiles).toBeCloseTo(30, 10);
  });

  it("ignores consecutive entries that are same-day duplicates or span an unrealistic gap", () => {
    const sameDay = computeFillUpStats([
      makeEntry({ milesDriven: 50, recordedAt: "2024-01-01T00:00:00.000Z" }),
      makeEntry({ milesDriven: 40, recordedAt: "2024-01-01T00:00:00.000Z" }),
    ]);
    expect(sameDay.typicalCycleDays).toBe(0);
    expect(sameDay.dailyMiles).toBe(0);

    const tooLongGap = computeFillUpStats([
      makeEntry({ milesDriven: 500, recordedAt: "2024-03-01T00:00:00.000Z" }),
      makeEntry({ milesDriven: 400, recordedAt: "2024-01-01T00:00:00.000Z" }), // 60 days earlier
    ]);
    expect(tooLongGap.typicalCycleDays).toBe(0);
    expect(tooLongGap.dailyMiles).toBe(0);
  });

  it("ignores entries with unparseable timestamps", () => {
    const stats = computeFillUpStats([
      makeEntry({ fuelPrice: 4.0, recordedAt: "not-a-date" }),
    ]);
    expect(stats.typicalFuelPrice).toBe(0);
  });
});

describe("computeFinanceProjections - blend ratios", () => {
  it("blends manual and history fuel price 25% manual / 75% history when both are present", () => {
    // Isolate the price blend: force the tank-level calculation to be the
    // only source of gallons (full tank, 0% current) so
    // projectedFillUpCost = tankCapacity * sanitizedFuelPrice exactly,
    // independent of MPG/miles inputs.
    const inputs = makeInputs({
      fuelPriceInput: "3.00",
      tankCapacityInput: "10",
      currentTankPercentInput: "0",
    });
    const stats = makeStats({ typicalFuelPrice: 4.0 });

    const result = computeFinanceProjections(inputs, stats);

    // Expected blended price: 4.00*0.75 + 3.00*0.25 = 3.75
    expect(result.projectedFillUpCost).toBeCloseTo(37.5, 10);
  });

  it("uses the manual fuel price alone when there is no history", () => {
    const inputs = makeInputs({
      fuelPriceInput: "3.00",
      tankCapacityInput: "10",
      currentTankPercentInput: "0",
    });
    const result = computeFinanceProjections(inputs, makeStats());

    expect(result.projectedFillUpCost).toBeCloseTo(30, 10);
  });

  it("uses the history fuel price alone when there is no manual input", () => {
    const inputs = makeInputs({
      tankCapacityInput: "10",
      currentTankPercentInput: "0",
    });
    const result = computeFinanceProjections(inputs, makeStats({ typicalFuelPrice: 4.0 }));

    expect(result.projectedFillUpCost).toBeCloseTo(40, 10);
  });

  it("blends manual and history MPG 30% manual / 70% history when both are present", () => {
    // Isolate the MPG blend: use history-only fuel price (no manual price
    // input, so no price blending ambiguity) and history-only daily
    // miles, so monthlyFuelBudget = (dailyMiles*30.4375/mpg) * price
    // depends on nothing but the MPG blend.
    const inputs = makeInputs({
      combinedMpgInput: "20",
      fuelPriceInput: "",
    });
    const stats = makeStats({
      typicalMpg: 30,
      typicalFuelPrice: 5.0,
      dailyMiles: 50,
    });

    const result = computeFinanceProjections(inputs, stats);

    // Expected blended MPG: 30*0.7 + 20*0.3 = 27
    // monthlyMiles = 50 * 30.4375 = 1521.875
    // monthlyFuelGallons = 1521.875 / 27
    // monthlyFuelBudget = monthlyFuelGallons * 5.00
    expect(result.monthlyFuelBudget).toBeCloseTo(281.8287037037037, 6);
  });

  it("uses the manual MPG alone when there is no history", () => {
    const inputs = makeInputs({ combinedMpgInput: "20" });
    const stats = makeStats({ typicalFuelPrice: 5.0, dailyMiles: 50 });

    const result = computeFinanceProjections(inputs, stats);

    const expectedGallons = (50 * 30.4375) / 20;
    expect(result.monthlyFuelBudget).toBeCloseTo(expectedGallons * 5.0, 6);
  });
});

describe("computeFinanceProjections - full scenario", () => {
  it("produces the expected numbers for a realistic mix of manual + history inputs", () => {
    const inputs = makeInputs({
      incomeInput: "5000",
      expenseInput: "1200",
      monthlyFixedCostsInput: "800",
      fuelPriceInput: "3.80",
      combinedMpgInput: "25",
      tankCapacityInput: "12",
      currentTankPercentInput: "40",
    });
    const stats = makeStats({
      typicalFuelPrice: 3.6,
      typicalFillUpGallons: 9.5,
      typicalTankCapacity: 12.0,
      typicalMpg: 28.0,
      dailyMiles: 40.0,
      typicalCycleDays: 6.0,
    });

    const result = computeFinanceProjections(inputs, stats);

    expect(result.monthlyIncome).toBe(5000);
    expect(result.monthlyExpenses).toBe(1200);
    expect(result.monthlyFixedCosts).toBe(800);
    expect(result.projectedFillUpCost).toBeCloseTo(26.28, 6);
    expect(result.monthlyFuelBudget).toBeCloseTo(163.98062730627308, 6);
    expect(result.projectedDaysUntilFillUp).toBeCloseTo(3.252, 6);
    expect(result.projectedBudgetAfterEssentials).toBeCloseTo(2836.019372693727, 6);
    expect(result.weeklySpendTarget).toBeCloseTo(498.0392698058166, 6);
  });

  it("handles all-empty inputs and no history without throwing or producing NaN/Infinity", () => {
    const result = computeFinanceProjections(makeInputs(), makeStats());

    for (const value of Object.values(result)) {
      expect(Number.isFinite(value)).toBe(true);
    }
    expect(result).toEqual({
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyFixedCosts: 0,
      monthlyFuelBudget: 0,
      projectedFillUpCost: 0,
      projectedDaysUntilFillUp: 0,
      projectedBudgetAfterEssentials: 0,
      weeklySpendTarget: 0,
    });
  });

  it("clamps an implausible fuel price so a typo doesn't blow up the estimate", () => {
    const inputs = makeInputs({
      fuelPriceInput: "999",
      tankCapacityInput: "10",
      currentTankPercentInput: "0",
    });
    const result = computeFinanceProjections(inputs, makeStats());

    // sanitizedFuelPrice is clamped to 20, so cost caps at 10 * 20 = 200.
    expect(result.projectedFillUpCost).toBeCloseTo(200, 10);
  });

  it("prefers tank-level-derived gallons over a manual gallons input", () => {
    const inputs = makeInputs({
      fuelGallonsInput: "3",
      fuelPriceInput: "2.00",
      tankCapacityInput: "10",
      currentTankPercentInput: "50",
    });
    const result = computeFinanceProjections(inputs, makeStats());

    // needsFromTankLevel = 10 * (1 - 0.5) = 5 gallons, which should win
    // over the manual "3" gallons input: cost = 5 * 2.00 = 10, not 6.
    expect(result.projectedFillUpCost).toBeCloseTo(10, 10);
  });

  it("falls back to a typical fill-up size when no tank level or manual gallons are given", () => {
    const inputs = makeInputs({ fuelPriceInput: "2.00" });
    const stats = makeStats({ typicalFillUpGallons: 8 });

    const result = computeFinanceProjections(inputs, stats);

    expect(result.projectedFillUpCost).toBeCloseTo(16, 10);
  });
});

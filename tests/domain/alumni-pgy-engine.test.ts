import { describe, it, expect } from 'vitest';
import {
  calculateCurrentPgy,
  AlumniResident,
  SAMPLE_ALUMNI_ROSTER,
} from '@/domain/alumni-models';

describe('Perpetual PGY Engine & Alumni Verification Fields', () => {
  it('calculates Incoming PGY-1 for graduates before July 1 of graduation year', () => {
    // Graduating in 2026, checked on May 15, 2026
    const testDate = new Date(2026, 4, 15); // May 15, 2026
    const pgy = calculateCurrentPgy(2026, testDate);
    expect(pgy).toBe('Incoming PGY-1');
  });

  it('calculates PGY-1 starting July 1 of graduation year through June 30 of next year', () => {
    // July 1, 2026
    const startJuly = new Date(2026, 6, 1);
    expect(calculateCurrentPgy(2026, startJuly)).toBe('PGY-1');

    // Dec 15, 2026
    const midYear = new Date(2026, 11, 15);
    expect(calculateCurrentPgy(2026, midYear)).toBe('PGY-1');

    // June 30, 2027
    const endJune = new Date(2027, 5, 30);
    expect(calculateCurrentPgy(2026, endJune)).toBe('PGY-1');
  });

  it('rolls over to PGY-2 on July 1 of the following year', () => {
    // July 1, 2027
    const nextJuly = new Date(2027, 6, 1);
    expect(calculateCurrentPgy(2026, nextJuly)).toBe('PGY-2');
  });

  it('rolls over to PGY-3 two years after graduation on July 1', () => {
    // July 1, 2028 for 2026 grad
    const pgy3Date = new Date(2028, 6, 1);
    expect(calculateCurrentPgy(2026, pgy3Date)).toBe('PGY-3');
  });

  it('transitions to Fellow / Attending after standard training duration (e.g. 3 years for IM)', () => {
    // July 1, 2029 for 2026 grad in Internal Medicine (3-year residency)
    const postResidency = new Date(2029, 6, 1);
    expect(calculateCurrentPgy(2026, postResidency, undefined, 'Internal Medicine')).toBe('Fellow / Attending');
  });

  it('respects manual overrides when specified (e.g. Research Year, Chief Resident, Fellowship, Attending)', () => {
    const testDate = new Date(2027, 6, 1); // would naturally be PGY-2
    expect(calculateCurrentPgy(2026, testDate, 'Research Year')).toBe('Research Year');
    expect(calculateCurrentPgy(2026, testDate, 'Chief Resident')).toBe('Chief Resident');
    expect(calculateCurrentPgy(2026, testDate, 'Fellow')).toBe('Fellow');
    expect(calculateCurrentPgy(2026, testDate, 'Attending')).toBe('Attending');
  });

  it('ensures AlumniResident model has verification fields and no signalStrategyUsed', () => {
    const firstAlum: AlumniResident = SAMPLE_ALUMNI_ROSTER[0];
    // Must NOT have signalStrategyUsed
    expect('signalStrategyUsed' in firstAlum).toBe(false);

    // Must support verification attributes
    expect(firstAlum.verificationStatus).toBeDefined();
    expect(firstAlum.lastVerifiedPeriod).toBeDefined();
  });
});

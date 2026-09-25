import { describe, it, expect } from 'vitest';
import { calculateSlaStatus } from '@/domain/sla-engine';
import { ReviewRequest } from '@/domain/types';

describe('Ticket 06: Institutional SLA Engine & Overdue Detection', () => {
  const baseRequest: ReviewRequest = {
    id: 'rev-test',
    snapshotId: 'snap-1',
    studentId: 'student-1',
    studentName: 'Alex Rivera',
    advisorId: 'advisor-1',
    documentType: 'personal_statement',
    stage: 'submitted',
    submittedAt: new Date().toISOString(),
    slaDueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  };

  it('identifies reviews within 0-9 days as "on_track"', () => {
    // 5 days elapsed
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const req = { ...baseRequest, submittedAt: fiveDaysAgo };

    const sla = calculateSlaStatus(req, 14);
    expect(sla.daysElapsed).toBe(5);
    expect(sla.daysRemaining).toBe(9);
    expect(sla.status).toBe('on_track');
    expect(sla.isBreached).toBe(false);
    expect(sla.shouldNudgeAdvisor).toBe(false);
  });

  it('identifies reviews at day 10-13 as "approaching_deadline" and triggers advisor nudge', () => {
    // 11 days elapsed
    const elevenDaysAgo = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString();
    const req = { ...baseRequest, submittedAt: elevenDaysAgo };

    const sla = calculateSlaStatus(req, 14);
    expect(sla.daysElapsed).toBe(11);
    expect(sla.daysRemaining).toBe(3);
    expect(sla.status).toBe('approaching_deadline');
    expect(sla.isBreached).toBe(false);
    expect(sla.shouldNudgeAdvisor).toBe(true);
  });

  it('identifies reviews at day 14+ as "breached" and routes to Dean alert queue', () => {
    // 16 days elapsed
    const sixteenDaysAgo = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString();
    const req = { ...baseRequest, submittedAt: sixteenDaysAgo };

    const sla = calculateSlaStatus(req, 14);
    expect(sla.daysElapsed).toBe(16);
    expect(sla.daysRemaining).toBe(0);
    expect(sla.status).toBe('breached');
    expect(sla.isBreached).toBe(true);
    expect(sla.shouldEscalateToDean).toBe(true);
  });

  it('marks completed reviews as resolved regardless of elapsed days', () => {
    const sixteenDaysAgo = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString();
    const req: ReviewRequest = {
      ...baseRequest,
      submittedAt: sixteenDaysAgo,
      stage: 'endorsed',
      completedAt: new Date().toISOString(),
    };

    const sla = calculateSlaStatus(req, 14);
    expect(sla.status).toBe('resolved');
    expect(sla.isBreached).toBe(false);
    expect(sla.shouldEscalateToDean).toBe(false);
  });
});

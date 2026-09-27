import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { AdvisorPortal } from '@/components/AdvisorPortal';

describe('AdvisorPortal Advisee Status & Review Queue Version Badge', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('renders "Drafting v1" under Assigned Advisees when advisee has not submitted any draft', () => {
    const advisorContext = service.getAdvisorDashboardContext();
    const html = renderToStaticMarkup(
      React.createElement(AdvisorPortal, {
        context: advisorContext,
        getSnapshotContent: (id) => service.getSnapshot(id),
      })
    );

    expect(html).toContain('Assigned Advisees');
    expect(html).toContain('Alex Rivera (MS4)');
    expect(html).toContain('Status: <strong class="text-slate-800">Drafting v1</strong>');
    expect(html).toContain('Your Review Queue is Clear!');
  });

  it('displays "Submitted v1" under Assigned Advisees and "v1" badge in Review Queue when advisee submits Draft 1', () => {
    storage.personalStatement.content = 'My journey into internal medicine began with patient advocacy.';
    storage.personalStatement.currentVersionNumber = 1;

    // Student submits Draft 1
    service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Draft 1 initial submission',
    });

    const advisorContext = service.getAdvisorDashboardContext();
    const html = renderToStaticMarkup(
      React.createElement(AdvisorPortal, {
        context: advisorContext,
        getSnapshotContent: (id) => service.getSnapshot(id),
      })
    );

    // Queue should have the v1 badge, submitted stage, and Latest Version
    expect(html).toContain('Alex Rivera (MS4)');
    expect(html).toContain('>submitted</span>');
    expect(html).toContain('>v1</span>');
    expect(html).toContain('>Latest Version</span>');

    // Assigned Advisees should reflect Submitted v1 instead of Drafting v1
    expect(html).toContain('Status: <strong class="text-slate-800">Submitted v1</strong>');
  });

  it('displays "Submitted v2" under Assigned Advisees and "v2" badge in Review Queue when advisee submits Draft 2', () => {
    // 1. Submit Draft 1
    storage.personalStatement.content = 'Draft 1 content.';
    service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Draft 1 initial submission',
    });

    // 2. Student updates to Draft 2 and submits
    service.updatePersonalStatement('Draft 2 revised clinical experiences.');
    expect(storage.personalStatement.currentVersionNumber).toBe(2);

    service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Draft 2 revision with attending feedback',
    });

    const advisorContext = service.getAdvisorDashboardContext();
    const html = renderToStaticMarkup(
      React.createElement(AdvisorPortal, {
        context: advisorContext,
        getSnapshotContent: (id) => service.getSnapshot(id),
      })
    );

    // Queue should highlight v2
    expect(html).toContain('>v2</span>');
    expect(html).toContain('>Latest Version</span>');

    // Assigned Advisees should reflect Submitted v2
    expect(html).toContain('Status: <strong class="text-slate-800">Submitted v2</strong>');
    expect(html).not.toContain('Status: <strong class="text-slate-800">Drafting v1</strong>');
  });

  it('reflects "In Review v1" when advisor has opened the review', () => {
    storage.personalStatement.content = 'Draft 1 content.';
    const req = service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Draft 1 submission',
    });

    service.openReviewAsAdvisor(req.id, 'usr-advisor-1');

    const advisorContext = service.getAdvisorDashboardContext();
    const html = renderToStaticMarkup(
      React.createElement(AdvisorPortal, {
        context: advisorContext,
        getSnapshotContent: (id) => service.getSnapshot(id),
      })
    );

    expect(html).toContain('>in review</span>');
    expect(html).toContain('>v1</span>');
    expect(html).toContain('Status: <strong class="text-slate-800">In Review v1</strong>');
  });
});

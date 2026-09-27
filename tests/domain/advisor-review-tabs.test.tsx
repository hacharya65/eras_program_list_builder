import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { AdvisorPortal } from '@/components/AdvisorPortal';

describe('Advisor Review Queue Tab Split (Pending vs Completed)', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('renders Pending and Completed tabs with correct counts', () => {
    // Student submits PS v1
    storage.personalStatement.content = 'My journey into internal medicine.';
    service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Draft 1 submission',
    });

    const advisorContext = service.getAdvisorDashboardContext();
    const html = renderToStaticMarkup(
      React.createElement(AdvisorPortal, {
        context: advisorContext,
        getSnapshotContent: (id) => service.getSnapshot(id),
      })
    );

    // Should render tabs
    expect(html).toContain('Pending Reviews');
    expect(html).toContain('Completed');
    expect(html).toContain('Alex Rivera (MS4)');
    expect(html).toContain('>v1</span>');
  });

  it('moves personal statement from Pending to Completed tab when advisor endorses as ERAS ready', () => {
    storage.personalStatement.content = 'My journey into internal medicine.';
    const req = service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Draft 1 submission',
    });

    // Advisor submits endorsement feedback (ready_to_lock)
    service.submitAdvisorFeedback({
      reviewRequestId: req.id,
      advisorId: 'usr-advisor-1',
      evaluation: {
        narrativeMotivation: 4,
        clinicalReflection: 4,
        toneAndFit: 4,
        structureAndMechanics: 4,
        overallVerdict: 'ready_to_lock',
        generalNotes: 'Flawless statement. Ready to lock for ERAS submission.',
      },
    });

    const advisorContext = service.getAdvisorDashboardContext();
    
    // Check that review request stage is endorsed and has completedAt
    const completedReq = storage.reviewRequests.find(r => r.id === req.id);
    expect(completedReq?.stage).toBe('endorsed');
    expect(completedReq?.completedAt).toBeDefined();

    const html = renderToStaticMarkup(
      React.createElement(AdvisorPortal, {
        context: advisorContext,
        getSnapshotContent: (id) => service.getSnapshot(id),
      })
    );

    // In default pending view, queue should be clear of pending reviews
    expect(html).toContain('Your Review Queue is Clear!');
    // Completed tab should indicate 1 completed review
    expect(html).toContain('Completed (1)');
    // Advisee status displays ERAS Ready v1
    expect(html).toContain('Personal Statement Status: <strong class="text-slate-800">ERAS Ready v1</strong>');
  });

  it('keeps review request out of Completed tab when revisions are requested', () => {
    storage.personalStatement.content = 'Draft needing work.';
    const req = service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Draft 1 submission',
    });

    // Advisor requests revisions
    service.submitAdvisorFeedback({
      reviewRequestId: req.id,
      advisorId: 'usr-advisor-1',
      evaluation: {
        narrativeMotivation: 2,
        clinicalReflection: 2,
        toneAndFit: 3,
        structureAndMechanics: 3,
        overallVerdict: 'revisions_requested',
        generalNotes: 'Needs deeper clinical reflection before ERAS sign-off.',
      },
    });

    const advisorContext = service.getAdvisorDashboardContext();
    const html = renderToStaticMarkup(
      React.createElement(AdvisorPortal, {
        context: advisorContext,
        getSnapshotContent: (id) => service.getSnapshot(id),
      })
    );

    // Completed tab should have 0 completed reviews
    expect(html).toContain('Completed (0)');
    // Advisee status should reflect Revisions Requested
    expect(html).toContain('Revisions Requested');
  });
});

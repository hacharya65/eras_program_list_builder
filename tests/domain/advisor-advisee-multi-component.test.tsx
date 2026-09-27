import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { AdvisorPortal } from '@/components/AdvisorPortal';

describe('Assigned Advisees Multi-Component Status Breakdown', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('renders explicit Personal Statement progress label and condensed core application components', () => {
    // Populate some experiences for the student
    service.updateExperience('exp-1', {
      title: 'Internal Medicine Sub-I',
      isMostMeaningful: true,
      descriptionText: 'Managed acutely ill patients.',
    });
    service.updateExperience('exp-2', {
      title: 'Free Clinic Volunteer',
      isMostMeaningful: false,
      descriptionText: 'Provided primary care triage.',
    });

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

    // 1. Should explicitly identify Personal Statement progress
    expect(html).toContain('Personal Statement:');
    expect(html).toContain('Submitted v1');

    // 2. Should display Selected Experiences status
    expect(html).toContain('Selected Experiences:');
    expect(html).toContain('2/10 Complete');
    expect(html).toContain('1/3 Starred');

    // 3. Should display Scholarly Works status
    expect(html).toContain('Scholarly Works:');

    // 4. Should display Strategic School List status
    expect(html).toContain('Strategic School List:');
  });
});

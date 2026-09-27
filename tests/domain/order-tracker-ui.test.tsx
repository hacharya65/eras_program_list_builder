import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrderTracker } from '@/components/OrderTracker';

describe('OrderTracker Component UI', () => {
  it('renders heading as "Personal Statement Document Review Pipeline"', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderTracker, {
        currentStage: 'submitted',
        personalStatementChars: 3450,
        personalStatementVersion: 2,
        experiencesCount: 7,
        experiencesMeaningfulCount: 2,
        scholarlyCount: 4,
        scholarlyMeaningfulCount: 1,
        schoolListCount: 18,
        schoolListSignalsAssigned: 12,
        schoolListSignalsBudget: 15,
      })
    );

    // Verify updated heading
    expect(html).toContain('Personal Statement Document Review Pipeline');
    expect(html).not.toContain('Clinical Order Pipeline Tracking');
  });

  it('excludes Personal Statement from Live ERAS Readiness Bars while retaining other components', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderTracker, {
        currentStage: 'in_review',
        personalStatementChars: 4100,
        personalStatementVersion: 1,
        experiencesCount: 10,
        experiencesMeaningfulCount: 3,
        scholarlyCount: 5,
        scholarlyMeaningfulCount: 2,
        schoolListCount: 20,
        schoolListSignalsAssigned: 15,
        schoolListSignalsBudget: 15,
      })
    );

    // Verify readiness bars header
    expect(html).toContain('Live ERAS Readiness Bars');
    expect(html).toContain('Core Application Components Progress');

    // Verify the 3 components are present
    expect(html).toContain('Selected Experiences');
    expect(html).toContain('Scholarly Works');
    expect(html).toContain('Strategic School List');

    // Verify Personal Statement is NOT in the readiness bars section
    // In the readiness section, only Selected Experiences, Scholarly Works, Strategic School List appear
    expect(html).not.toContain('v1</span>');
    expect(html).not.toContain('of 1 Page');
  });
});

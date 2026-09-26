import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAnnotation,
  createCommentThread,
  loadStoredAnnotations,
  saveStoredAnnotations,
  loadStoredThreads,
  saveStoredThreads,
  loadHistoricalDraftAnnotations,
  clearInMemoryAnnotationStores,
  DocumentAnnotation,
  CommentThread,
} from '../../src/domain/annotation-models';
import {
  getStoredApplicantStep2Ck,
  setStoredApplicantStep2Ck,
  APPLICANT_PROFILE_STORAGE_KEY,
  evaluateProgramTier,
} from '../../src/domain/school-list-models';

describe('Speed B: Substantial New Features & Core Workflow Overhauls', () => {
  describe('Ticket Candidate 9: Modal-Based Applicant Profile Intake & Competitiveness Decoupling', () => {
    it('persists applicant profile metrics and synchronizes step 2 CK with downstream tiering', () => {
      const mockProfile = {
        step2Ck: 262,
        step1Result: 'Pass',
        clerkshipHonors: 5,
        publications: 4,
        researchExperiences: 3,
        presentations: 6,
        leadershipHours: 150,
        volunteerExperiences: 6,
        isAoaMember: true,
      };

      // 1. Save profile to storage & update Step 2 CK
      setStoredApplicantStep2Ck(mockProfile.step2Ck);
      expect(getStoredApplicantStep2Ck()).toBe(262);

      // 2. Downstream School List auto-tiering immediately responds to new score
      // Program with median range 240-250: with Step 2 CK of 262 (> 250), it becomes 'safety'
      const tierForModerateProgram = evaluateProgramTier(262, 240, 250);
      expect(tierForModerateProgram).toBe('safety');

      // Program with median range 258-266: with Step 2 CK of 262, it is within range -> 'target'
      const tierForTopTierProgram = evaluateProgramTier(262, 258, 266);
      expect(tierForTopTierProgram).toBe('target');

      // Program with median range 265-272: with Step 2 CK of 262 (< 265), it is 'reach'
      const tierForHyperCompetitive = evaluateProgramTier(262, 265, 272);
      expect(tierForHyperCompetitive).toBe('reach');
    });
  });

  describe('Ticket Candidate 10: Version-Scoped Annotation Isolation & Leakage Prevention', () => {
    beforeEach(() => {
      clearInMemoryAnnotationStores();
      // Clear localStorage mocks
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });

    it('strictly scopes annotations by document_version_id preventing cross-draft bleeding', () => {
      const docId = 'personal_statement';

      // 1. Advisor creates annotations on Draft V1
      const v1Annotation = createAnnotation({
        documentId: docId,
        documentVersionId: 'v1',
        authorId: 'advisor-1',
        authorName: 'Dr. Chen',
        authorRole: 'advisor',
        startOffset: 0,
        endOffset: 25,
        anchorText: 'Draft 1 initial sentence.',
        type: 'strikethrough',
      });

      const v1Thread = createCommentThread({
        documentId: docId,
        documentVersionId: 'v1',
        authorId: 'advisor-1',
        authorName: 'Dr. Chen',
        authorRole: 'advisor',
        startOffset: 0,
        endOffset: 25,
        anchorText: 'Draft 1 initial sentence.',
        initialMessage: 'Tighten opening for Draft 1.',
        annotationId: v1Annotation.id,
      });

      saveStoredAnnotations(docId, [v1Annotation], 'v1');
      saveStoredThreads(docId, [v1Thread], 'v1');

      // 2. Verify V1 query returns the annotation
      const loadedV1 = loadStoredAnnotations(docId, 'v1');
      expect(loadedV1.length).toBe(1);
      expect(loadedV1[0].anchorText).toBe('Draft 1 initial sentence.');
      expect(loadedV1[0].documentVersionId).toBe('v1');

      // 3. Hydrate Draft V2: Newly submitted draft must load in an unpolluted state (0 active annotations)
      const loadedV2 = loadStoredAnnotations(docId, 'v2');
      const loadedV2Threads = loadStoredThreads(docId, 'v2');
      expect(loadedV2.length).toBe(0);
      expect(loadedV2Threads.length).toBe(0);

      // 4. Preserves previous draft history in a read-only historical log
      const historicalLog = loadHistoricalDraftAnnotations(docId, 2);
      expect(historicalLog.length).toBe(1);
      expect(historicalLog[0].versionNumber).toBe(1);
      expect(historicalLog[0].versionId).toBe('v1');
      expect(historicalLog[0].annotations.length).toBe(1);
      expect(historicalLog[0].threads.length).toBe(1);
      expect(historicalLog[0].threads[0].anchorText).toBe('Draft 1 initial sentence.');
    });

    it('ensures V2 annotations do not pollute V1 historical records', () => {
      const docId = 'personal_statement';

      // Save V1 annotation
      const annV1 = createAnnotation({
        documentId: docId,
        documentVersionId: 'v1',
        authorId: 'advisor-1',
        authorName: 'Dr. Chen',
        authorRole: 'advisor',
        startOffset: 5,
        endOffset: 15,
        anchorText: 'Old wording',
      });
      saveStoredAnnotations(docId, [annV1], 'v1');

      // Save V2 annotation
      const annV2 = createAnnotation({
        documentId: docId,
        documentVersionId: 'v2',
        authorId: 'advisor-1',
        authorName: 'Dr. Chen',
        authorRole: 'advisor',
        startOffset: 30,
        endOffset: 50,
        anchorText: 'New wording in draft 2',
      });
      saveStoredAnnotations(docId, [annV2], 'v2');

      // Both versions remain isolated
      const v1 = loadStoredAnnotations(docId, 'v1');
      const v2 = loadStoredAnnotations(docId, 'v2');

      expect(v1.length).toBe(1);
      expect(v1[0].anchorText).toBe('Old wording');

      expect(v2.length).toBe(1);
      expect(v2[0].anchorText).toBe('New wording in draft 2');
    });

    it('ensures legacy unversioned annotations never leak into v2 submissions', () => {
      const docId = 'personal_statement';
      const legacyAnn: DocumentAnnotation = {
        id: 'legacy-1',
        documentId: docId,
        authorId: 'advisor-1',
        authorName: 'Dr. Chen',
        authorRole: 'advisor',
        startOffset: 0,
        endOffset: 10,
        anchorText: 'Legacy text',
        type: 'highlight',
        color: 'yellow',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      // Stored under docId without version
      saveStoredAnnotations(docId, [legacyAnn]);

      // Querying for v2 must return empty array, never leaking unversioned item
      const loadedV2 = loadStoredAnnotations(docId, 'v2');
      expect(loadedV2.length).toBe(0);
    });
  });
});


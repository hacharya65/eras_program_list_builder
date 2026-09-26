/**
 * Official ERAS Specialty-Specific Essay Prompts & Configurations
 * Extracted from the 2027 ERAS Applicant Worksheet (Pages 22–24).
 *
 * Applicable specialties:
 * - Anesthesiology (Page 22): 3 prompts @ 500-character limit
 * - Neurological Surgery / Neurosurgery (Page 23): 3 prompts @ 1,000-character limit
 * - Plastic Surgery - Integrated (Page 24): 3 prompts @ 500-character limit
 */

export interface SpecialtyEssayPrompt {
  id: string;
  prompt: string;
  maxChars: number;
  placeholder?: string;
}

export interface SpecialtyEssayGroup {
  specialty: string;
  notice: string;
  prompts: SpecialtyEssayPrompt[];
}

export const ERAS_SPECIALTY_ESSAY_NOTICE =
  'The specialty listed in this section requires that applicants answer additional questions. Responses will only be sent to programs within the corresponding specialty. Responses are editable until the application is certified & submitted.';

export const SPECIALTY_ESSAY_DEFINITIONS: Record<string, SpecialtyEssayGroup> = {
  'Anesthesiology': {
    specialty: 'Anesthesiology',
    notice: ERAS_SPECIALTY_ESSAY_NOTICE,
    prompts: [
      {
        id: 'anes_career_ideal',
        prompt: 'Describe your ideal career as an attending.',
        maxChars: 500,
        placeholder: 'Describe your clinical focus, practice setting, academic aspirations, and long-term vision (500 chars max)...',
      },
      {
        id: 'anes_difficult_decision',
        prompt:
          'Describe a time when you made a difficult decision in a complex situation (not necessarily related to medicine). How did you make your decision, and what was the result? What did you learn from this experience?',
        maxChars: 500,
        placeholder: 'Detail the decision, your analytical process, outcome, and key takeaway (500 chars max)...',
      },
      {
        id: 'anes_adversity',
        prompt: 'Describe a time when you faced adversity, how you overcame it, and any lessons learned from it.',
        maxChars: 500,
        placeholder: 'Summarize the obstacle, your actionable response, and lessons learned (500 chars max)...',
      },
    ],
  },

  'Neurological Surgery': {
    specialty: 'Neurological Surgery',
    notice: ERAS_SPECIALTY_ESSAY_NOTICE,
    prompts: [
      {
        id: 'nsurg_quick_decision',
        prompt:
          'Describe a time when you had to make a quick decision. What did you consider when making the decision? Who did you consult or not and why?',
        maxChars: 1000,
        placeholder: 'Elaborate on the scenario, urgency, variables weighed, consultation choice, and result (1,000 chars max)...',
      },
      {
        id: 'nsurg_negative_feedback',
        prompt:
          'Describe a specific situation where you received negative feedback about your performance. How did you adjust your behavior? What did you learn from this situation?',
        maxChars: 1000,
        placeholder: 'Describe the critique, your reflective reaction, concrete steps taken to improve, and growth (1,000 chars max)...',
      },
      {
        id: 'nsurg_workload_overwhelming',
        prompt:
          'Describe a specific situation when your workload was overwelming. What specific actions did you take to manage your workload? What was the outcome?',
        maxChars: 1000,
        placeholder: 'Outline the clinical or academic demands, prioritization strategies, teamwork, and outcome (1,000 chars max)...',
      },
    ],
  },

  'Plastic Surgery (Integrated)': {
    specialty: 'Plastic Surgery (Integrated)',
    notice: ERAS_SPECIALTY_ESSAY_NOTICE,
    prompts: [
      {
        id: 'prs_team_disagreement',
        prompt:
          'Describe a specific situation when a team you were on had to collaborate to achieve an outcome and there was a disagreement. How did you specifically contribute to the solution?',
        maxChars: 500,
        placeholder: 'Detail the disagreement, your active mediation or collaboration, and resolution (500 chars max)...',
      },
      {
        id: 'prs_setback',
        prompt: 'Describe a specific situation where you experienced a setback. How did you overcome this challenge?',
        maxChars: 500,
        placeholder: 'Describe the challenge, your resilience and corrective steps, and personal insight (500 chars max)...',
      },
      {
        id: 'prs_quick_decision',
        prompt:
          'Describe a time when you had to make an important decision quickly. What did you consider when making the decision?',
        maxChars: 500,
        placeholder: 'Describe the situation, critical factors evaluated, and the outcome (500 chars max)...',
      },
    ],
  },
};

// Aliases mapping alternate naming to canonical keys
const SPECIALTY_ESSAY_ALIASES: Record<string, string> = {
  'Neurosurgery': 'Neurological Surgery',
  'Plastic Surgery': 'Plastic Surgery (Integrated)',
  'Plastic Surgery - Integrated': 'Plastic Surgery (Integrated)',
};

/**
 * Normalizes a specialty name and retrieves its corresponding essay prompt configuration,
 * or null if the specialty does not require additional ERAS essays.
 */
export function getSpecialtyEssayGroup(specialtyName?: string): SpecialtyEssayGroup | null {
  if (!specialtyName) return null;
  const canonicalKey = SPECIALTY_ESSAY_ALIASES[specialtyName] || specialtyName;
  return SPECIALTY_ESSAY_DEFINITIONS[canonicalKey] || null;
}

export const SPECIALTY_ESSAYS_STORAGE_KEY = 'eras_specialty_essay_responses';

let inMemoryEssayResponses: Record<string, Record<string, string>> = {};

/**
 * Loads all saved specialty essay responses from storage.
 * Format: { [specialtyKey]: { [promptId]: responseText } }
 */
export function getStoredSpecialtyEssays(): Record<string, Record<string, string>> {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(SPECIALTY_ESSAYS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return inMemoryEssayResponses;
}

/**
 * Saves a response for a specific prompt under a specialty.
 */
export function saveStoredSpecialtyEssay(specialtyKey: string, promptId: string, value: string): void {
  const current = getStoredSpecialtyEssays();
  const canonicalKey = SPECIALTY_ESSAY_ALIASES[specialtyKey] || specialtyKey;
  const updated = {
    ...current,
    [canonicalKey]: {
      ...(current[canonicalKey] || {}),
      [promptId]: value,
    },
  };

  inMemoryEssayResponses = updated;

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SPECIALTY_ESSAYS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(
        new CustomEvent('specialty_essays_updated', {
          detail: { specialty: canonicalKey, promptId, value },
        })
      );
    } catch {
      // fallback
    }
  }
}

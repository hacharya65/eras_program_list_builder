import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://lbxnxogegsuclfrddbez.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieG54b2dlZ3N1Y2xmcmRkYmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNTg5ODAsImV4cCI6MjEwNzkzNDk4MH0.Skm2HOa4b_d1T1Ww22Qcs5JTA8zGz3LI-HmxsvPBoX0';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseClient;
}

/**
 * Cloud Synchronization Adapter for Student Accounts
 */
export async function syncStudentAccountToCloud(account: {
  id: string;
  name: string;
  email?: string;
  medicalSchool?: string;
  specialty?: string;
  step2Ck?: number;
  pronouns?: string;
  gradYear?: number;
  isDemo?: boolean;
}): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('student_accounts').upsert({
      id: account.id,
      name: account.name,
      email: account.email || null,
      medical_school: account.medicalSchool || null,
      specialty: account.specialty || 'Internal Medicine',
      step2_ck: account.step2Ck ?? 252,
      pronouns: account.pronouns || null,
      grad_year: account.gradYear || 2027,
      is_demo: Boolean(account.isDemo),
      last_active_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] Failed to sync student account:', err);
  }
}

/**
 * Cloud Synchronization Adapter for Specialty Advising Intake
 */
export async function syncIntakeToCloud(studentId: string, intakeData: Record<string, any>): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('specialty_advising_intakes').upsert({
      student_id: studentId,
      intake_data: intakeData,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] Failed to sync intake:', err);
  }
}

/**
 * Cloud Synchronization Adapter for School List
 */
export async function syncSchoolListToCloud(studentId: string, specialty: string, items: any[]): Promise<void> {
  try {
    const supabase = getSupabase();
    const id = `${studentId}_${specialty.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await supabase.from('school_lists').upsert({
      id,
      student_id: studentId,
      specialty,
      items,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] Failed to sync school list:', err);
  }
}

/**
 * Cloud Synchronization Adapter for Student Portfolio
 */
export async function syncPortfolioToCloud(studentId: string, portfolioData: Record<string, any>): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('student_portfolios').upsert({
      student_id: studentId,
      portfolio_data: portfolioData,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] Failed to sync portfolio:', err);
  }
}

/**
 * Fetch Student Account from Supabase Cloud
 */
export async function fetchStudentAccountFromCloud(studentId: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('student_accounts')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      medicalSchool: data.medical_school,
      specialty: data.specialty,
      step2Ck: data.step2_ck,
      pronouns: data.pronouns,
      gradYear: data.grad_year,
      isDemo: data.is_demo,
      createdAt: data.created_at,
      lastActiveAt: data.last_active_at,
    };
  } catch {
    return null;
  }
}

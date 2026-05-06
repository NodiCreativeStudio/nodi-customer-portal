export type Industry = "retail" | "wellness" | "repair";

export interface OnboardingForm {
  // Page 1
  company_name: string;
  industry: Industry | "";
  contact_email: string;
  contact_phone: string;
  website: string;
  address: string;
  employees_range: string;
  vat_id: string;
  founding_year: string;
  description: string;
  preferred_contact: "email" | "phone" | "both" | "";
  best_time: string;
  // Page 2 (vertical_data)
  vertical: {
    // retail
    online_orders?: boolean;
    loyalty_program?: boolean;
    whatsapp_automation?: boolean;
    challenges?: string;
    monthly_customers?: string;
    sales_channel?: string;
    // wellness
    online_booking?: boolean;
    membership?: boolean;
    whatsapp_reminders?: boolean;
    services?: string;
    weekly_bookings?: string;
    service_type?: string;
    // repair
    job_tracking?: boolean;
    customer_notifications?: boolean;
    whatsapp_status?: boolean;
    repairs?: string;
    monthly_repairs?: string;
    repair_category?: string;
  };
  // Page 3
  goals: string[];
  budget_range: string;
  timeline: string;
  additional_requirements: string;
  agreed_terms: boolean;
}

export const emptyForm: OnboardingForm = {
  company_name: "", industry: "", contact_email: "", contact_phone: "",
  website: "", address: "", employees_range: "", vat_id: "",
  founding_year: "", description: "", preferred_contact: "", best_time: "",
  vertical: {},
  goals: [], budget_range: "", timeline: "", additional_requirements: "",
  agreed_terms: false,
};

export const employeesOptions = ["1-10", "11-50", "51-100", "100+"];
export const bestTimeOptions = ["Morning", "Afternoon", "Evening"];
export const budgetOptions = [
  "Under €500/month", "€500–1000/month", "€1000–2000/month", "€2000+/month",
];
export const timelineOptions = [
  "Immediate (within 1 week)", "This month", "Next month", "Flexible",
];
export const goalOptions = [
  "Increase customer engagement",
  "Improve operational efficiency",
  "Generate more sales",
  "Better customer experience",
  "Other",
];

export function validatePage1(f: OnboardingForm): string | null {
  if (!f.company_name.trim()) return "Company name is required";
  if (!f.industry) return "Industry is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact_email)) return "Valid contact email is required";
  if (!/^[+\d\s().-]{6,}$/.test(f.contact_phone)) return "Valid contact phone is required";
  if (f.website && !/^https?:\/\//i.test(f.website)) return "Website must start with http:// or https://";
  if (!f.employees_range) return "Number of employees is required";
  if (f.description.length > 200) return "Description must be 200 characters or fewer";
  if (f.founding_year && !/^\d{4}$/.test(f.founding_year)) return "Founding year must be a 4-digit year";
  return null;
}

export function validatePage2(f: OnboardingForm): string | null {
  // No required fields on page 2 — all optional, but cap text length
  const v = f.vertical;
  if ((v.challenges?.length ?? 0) > 200) return "Text exceeds 200 characters";
  if ((v.services?.length ?? 0) > 200) return "Text exceeds 200 characters";
  if ((v.repairs?.length ?? 0) > 200) return "Text exceeds 200 characters";
  return null;
}

export function validatePage3(f: OnboardingForm): string | null {
  if (f.goals.length === 0) return "Select at least one primary goal";
  if (!f.budget_range) return "Budget range is required";
  if (!f.timeline) return "Timeline is required";
  if ((f.additional_requirements?.length ?? 0) > 300) return "Additional requirements exceed 300 characters";
  if (!f.agreed_terms) return "You must agree to the Service Agreement";
  return null;
}

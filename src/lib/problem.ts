export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  errors?: Record<string, string[]>;
  extensions?: Record<string, unknown>;
}

export function isProblemDetail(value: unknown): value is ProblemDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "title" in value &&
    "status" in value
  );
}

export function getFieldErrors(
  problem: ProblemDetail
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!problem.errors) return out;
  for (const [field, msgs] of Object.entries(problem.errors)) {
    out[field] = msgs[0] ?? "Invalid value";
  }
  return out;
}

export function getGlobalError(problem: ProblemDetail): string {
  if (problem.errors && Object.keys(problem.errors).length > 0) return "";
  return problem.title;
}

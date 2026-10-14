/**
 * TEMPORARY MOCK — replace when M4's backend/app/api/configs.py and real preset seed files are available.
 *
 * Matches:
 *   - docs/api-contract.md section 3.3 (Configuration Endpoints)
 *   - backend/app/scoring/config_schema.py (ScoringConfiguration fields and enums)
 *   - backend/app/db/schemas.py (ConfigurationRecord, ConfigurationListItem)
 *
 * Presets:
 *   - "Balanced": roughly even weights across the 5 default criteria (sum to 100).
 *   - "Skills-heavy": Technical Skills weighted highest (50).
 *   - "Projects-heavy": Projects & Experience weighted highest (45).
 *
 * Custom saved configs:
 *   - "Frontend Specialist": Custom user-saved config (is_preset: false).
 *   - "Research & Hackathon Track": Custom user-saved config (is_preset: false).
 *
 * Validation error shape:
 *   Standard FastAPI / Pydantic 422 Unprocessable Entity error details format:
 *   Array of { loc: (string | number)[], msg: string, type: string }.
 *   Note: Assumed error shape based on standard FastAPI behavior pending M4's
 *   concrete config_validate.py implementation.
 */

import type {
  ConfigurationListItem,
  ConfigurationRecord,
  ApiValidationErrorDetail,
} from "@/lib/types";

export const mockConfigurationRecords: ConfigurationRecord[] = [
  // 1. Preset: Balanced
  {
    id: "3c91b8a1-5501-4478-9b81-d41935e40889",
    name: "Balanced",
    is_preset: true,
    created_at: "2026-10-09T09:00:00Z",
    config_json: {
      criteria: [
        {
          name: "technical_skills",
          weight: 25,
          keywords: ["Python", "FastAPI", "React", "PostgreSQL"],
        },
        {
          name: "projects",
          weight: 25,
          keywords: ["Fullstack", "Distributed Systems"],
        },
        {
          name: "github_activity",
          weight: 20,
          keywords: [],
        },
        {
          name: "achievements",
          weight: 15,
          keywords: ["Hackathon Winner", "Published"],
        },
        {
          name: "portfolio",
          weight: 15,
          keywords: [],
        },
      ],
      eligibility_rules: [
        {
          signal: "team.member_count",
          operator: ">=",
          value: 2,
          scope: "team",
        },
        {
          signal: "github.contributions_12m",
          operator: ">=",
          value: 50,
          scope: "any_member",
        },
      ],
      top_x: 10,
      aggregation: "mean",
      missing_policy: "redistribute",
      tie_break: [
        "technical_skills",
        "projects",
        "github_activity",
        "achievements",
        "portfolio",
        "team_id",
      ],
    },
  },

  // 2. Preset: Skills-heavy
  {
    id: "7a82b9c3-1102-491a-8c44-e52841f50123",
    name: "Skills-heavy",
    is_preset: true,
    created_at: "2026-10-09T09:10:00Z",
    config_json: {
      criteria: [
        {
          name: "technical_skills",
          weight: 50,
          keywords: ["Python", "FastAPI", "Go", "Rust", "TypeScript", "SQL"],
        },
        {
          name: "projects",
          weight: 20,
          keywords: ["System Design", "Backend"],
        },
        {
          name: "github_activity",
          weight: 10,
          keywords: [],
        },
        {
          name: "achievements",
          weight: 10,
          keywords: [],
        },
        {
          name: "portfolio",
          weight: 10,
          keywords: [],
        },
      ],
      eligibility_rules: [],
      top_x: 10,
      aggregation: "weighted_mean",
      missing_policy: "redistribute",
      tie_break: [
        "technical_skills",
        "projects",
        "github_activity",
        "achievements",
        "portfolio",
        "team_id",
      ],
    },
  },

  // 3. Preset: Projects-heavy
  {
    id: "9b14c7d2-4401-482b-9d55-f63952a60456",
    name: "Projects-heavy",
    is_preset: true,
    created_at: "2026-10-09T09:20:00Z",
    config_json: {
      criteria: [
        {
          name: "projects",
          weight: 45,
          keywords: ["Production", "Open Source", "Deployment"],
        },
        {
          name: "technical_skills",
          weight: 25,
          keywords: ["React", "Node", "Docker"],
        },
        {
          name: "github_activity",
          weight: 15,
          keywords: [],
        },
        {
          name: "portfolio",
          weight: 10,
          keywords: [],
        },
        {
          name: "achievements",
          weight: 5,
          keywords: [],
        },
      ],
      eligibility_rules: [],
      top_x: 12,
      aggregation: "mean",
      missing_policy: "neutral",
      tie_break: [
        "projects",
        "technical_skills",
        "github_activity",
        "portfolio",
        "achievements",
        "team_id",
      ],
    },
  },

  // 4. Custom Saved Config: Frontend Specialist
  {
    id: "4d21e8f5-3312-462a-8b22-c74063b70789",
    name: "Frontend Specialist",
    is_preset: false,
    created_at: "2026-10-10T14:30:00Z",
    config_json: {
      criteria: [
        {
          name: "technical_skills",
          weight: 35,
          keywords: ["React", "TypeScript", "Tailwind", "Next.js"],
        },
        {
          name: "portfolio",
          weight: 30,
          keywords: ["UI/UX", "Figma", "Design Systems"],
        },
        {
          name: "projects",
          weight: 20,
          keywords: ["Web App", "Accessibility"],
        },
        {
          name: "github_activity",
          weight: 10,
          keywords: [],
        },
        {
          name: "achievements",
          weight: 5,
          keywords: [],
        },
      ],
      eligibility_rules: [],
      top_x: 8,
      aggregation: "mean",
      missing_policy: "penalty",
      tie_break: ["portfolio", "technical_skills", "projects", "team_id"],
    },
  },

  // 5. Custom Saved Config: Research & Hackathon Track
  {
    id: "6e33f9a7-2201-451e-9a11-b85174c80912",
    name: "Research & Hackathon Track",
    is_preset: false,
    created_at: "2026-10-11T16:15:00Z",
    config_json: {
      criteria: [
        {
          name: "achievements",
          weight: 35,
          keywords: ["First Place", "Paper", "Publication", "Award"],
        },
        {
          name: "projects",
          weight: 30,
          keywords: ["AI/ML", "NLP", "LLM", "Research"],
        },
        {
          name: "technical_skills",
          weight: 20,
          keywords: ["PyTorch", "Python", "Transformers"],
        },
        {
          name: "portfolio",
          weight: 10,
          keywords: [],
        },
        {
          name: "github_activity",
          weight: 5,
          keywords: [],
        },
      ],
      eligibility_rules: [],
      top_x: 5,
      aggregation: "at_least_one",
      missing_policy: "redistribute",
      tie_break: ["achievements", "projects", "team_id"],
    },
  },
];

/**
 * Derived list of configuration summaries for GET /configs response.
 */
export const mockConfigurationList: ConfigurationListItem[] =
  mockConfigurationRecords.map(({ id, name, is_preset, created_at }) => ({
    id,
    name,
    is_preset,
    created_at,
  }));

/**
 * Example mock validation errors matching standard FastAPI 422 shape.
 * Used for testing error-handling display.
 */
export const mockValidationErrors = {
  weightsMismatch: [
    {
      loc: ["body", "config_json", "criteria"],
      msg: "Weights must sum to 100",
      type: "value_error",
    },
  ] as ApiValidationErrorDetail[],
  emptyCriterionName: [
    {
      loc: ["body", "config_json", "criteria", 0, "name"],
      msg: "Criterion name cannot be empty",
      type: "value_error",
    },
  ] as ApiValidationErrorDetail[],
  missingName: [
    {
      loc: ["body", "name"],
      msg: "Configuration name cannot be empty",
      type: "value_error",
    },
  ] as ApiValidationErrorDetail[],
  topXInvalid: [
    {
      loc: ["body", "config_json", "top_x"],
      msg: "top_x must be greater than or equal to 1",
      type: "value_error",
    },
  ] as ApiValidationErrorDetail[],
};


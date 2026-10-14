/**
 * TEMPORARY MOCK — replace when M2's api/upload.py (POST /upload) is available (Day 4).
 *
 * Shape matches docs/api-contract.md section 3.2 (POST /upload 201 Created) exactly.
 * Dataset: 40 teams from samples/registrations_40.csv (docs/data-format.md section 5).
 *
 * Mock composition:
 *   - T001: solo team (Byte Bandits), all links OK
 *   - T002: solo team, missing linkedin + portfolio
 *   - T003: solo team, INVALID github (no username)
 *   - T006: solo team, INVALID resume (bad scheme htp://)
 *   - T007–T008: 2-member team, T008 has blank github
 *   - T010: 2-member team, INVALID linkedin (no profile ID), also duplicate of T038
 *   - T014: 2-member team, INVALID email format
 *   - T017: 3-member team, fully OK
 *   - T031: 4-member team, several missing links
 *   - T037: 6-member team (largest), lots of missing
 *   - T038: duplicate of T010
 *   - T039: has a duplicate member (same as T020 member 2)
 *   - T040: almost-empty (all links blank, one member has no name)
 *
 * Summary: 40 teams, 112 members, 9 warnings, 0 hard errors.
 */

import type { UploadResponse } from "@/lib/types";

export const mockUploadResponse: UploadResponse = {
  dataset_id: "7f8b9a20-8012-4e6f-99ab-61d092305e41",
  filename: "registrations_40.csv",
  content_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  total_teams: 40,
  total_members: 112,
  validation_report: {
    errors_count: 0,
    warnings_count: 9,
    duplicate_teams: ["T038"],
    duplicate_members: ["T039"],
    missing_fields_summary: {
      github: 8,
      resume: 4,
      linkedin: 11,
      portfolio: 15,
    },
  },
  // preview: first 20 teams (preview rows only carry team_id, team_name, member_count)
  preview: [
    { team_id: "T001", team_name: "Byte Bandits", member_count: 1 },
    { team_id: "T002", team_name: "Code Crusaders", member_count: 1 },
    { team_id: "T003", team_name: "Null Pointers", member_count: 1 },
    { team_id: "T004", team_name: "Stack Overflowers", member_count: 1 },
    { team_id: "T005", team_name: "Git Gud", member_count: 1 },
    { team_id: "T006", team_name: "Pixel Pioneers", member_count: 1 },
    { team_id: "T007", team_name: "Binary Beasts", member_count: 2 },
    { team_id: "T008", team_name: "Syntax Squad", member_count: 2 },
    { team_id: "T009", team_name: "Debug Ducks", member_count: 2 },
    { team_id: "T010", team_name: "Loop Legends", member_count: 2 },
    { team_id: "T011", team_name: "Cache Me Outside", member_count: 2 },
    { team_id: "T012", team_name: "Merge Conflict", member_count: 2 },
    { team_id: "T013", team_name: "Quantum Quokkas", member_count: 2 },
    { team_id: "T014", team_name: "Data Dragons", member_count: 2 },
    { team_id: "T015", team_name: "Hash Hunters", member_count: 2 },
    { team_id: "T016", team_name: "Async Aces", member_count: 2 },
    { team_id: "T017", team_name: "Kernel Knights", member_count: 3 },
    { team_id: "T018", team_name: "Lambda Lords", member_count: 3 },
    { team_id: "T019", team_name: "Segfault Survivors", member_count: 3 },
    { team_id: "T020", team_name: "Tensor Titans", member_count: 3 },
  ],
};

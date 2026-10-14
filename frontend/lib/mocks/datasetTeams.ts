/**
 * TEMPORARY MOCK — replace when M2's GET /datasets/{dataset_id}/teams endpoint is available (Day 4).
 *
 * Shape matches docs/api-contract.md section 3.2 (GET /datasets/{dataset_id}/teams) exactly.
 * Includes a representative cross-section of the 40-team sample:
 *   - T001: solo, all OK
 *   - T002: solo, missing linkedin + portfolio
 *   - T003: solo, INVALID github (no username — "https://github.com/" with no path)
 *   - T007: 2-member, fully OK
 *   - T008: 2-member, member 1 missing github
 *   - T010: 2-member, member 1 INVALID linkedin (no profile ID slug)
 *   - T014: 2-member, member 2 INVALID email (treated as INVALID link field)
 *   - T017: 3-member, fully OK (AlgoArchitects)
 *   - T031: 4-member, several MISSING across members
 *   - T037: 6-member (largest team), majority of links MISSING
 *   - T038: duplicate team (copy of T010 — same members, flagged in validation_report)
 *   - T039: has one member who is a duplicate of T020 member 2
 *   - T040: almost-empty (all links blank, one member has no name — kept with warnings)
 *
 * FieldStatus at upload stage: OK | MISSING | INVALID only.
 * UNAVAILABLE and UNCERTAIN are enrichment-stage values (Days 8–10).
 */

import type { DatasetTeamsResponse } from "@/lib/types";

export const mockDatasetTeams: DatasetTeamsResponse = {
  dataset_id: "7f8b9a20-8012-4e6f-99ab-61d092305e41",
  teams: [
    // T001 — solo team, all OK
    {
      team_id: "T001",
      team_name: "Byte Bandits",
      members: [
        {
          name: "Aarav Desai",
          email: "aarav.desai0@example.com",
          github: { value: "aaravdesai0", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/aaravdesai0.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/aaravdesai0", status: "OK" },
          portfolio: { value: "https://aaravdesai0.example.dev", status: "OK" },
        },
      ],
    },
    // T002 — solo team, missing linkedin + portfolio
    {
      team_id: "T002",
      team_name: "NullPointers",
      members: [
        {
          name: "Priya Sharma",
          email: "priya.sharma1@example.com",
          github: { value: "priyasharma1", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/priyasharma1.pdf", status: "OK" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: null, status: "MISSING" },
        },
      ],
    },
    // T003 — solo, INVALID github (URL present but no username path)
    {
      team_id: "T003",
      team_name: "SegFault Squad",
      members: [
        {
          name: "Ravi Kumar",
          email: "ravi.kumar2@example.com",
          github: { value: "https://github.com/", status: "INVALID" },
          resume: { value: "https://drive.example.com/resumes/ravikumar2.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/ravikumar2", status: "OK" },
          portfolio: { value: null, status: "MISSING" },
        },
      ],
    },
    // T006 — solo, INVALID resume (bad scheme htp://)
    {
      team_id: "T006",
      team_name: "404 Found",
      members: [
        {
          name: "Sneha Mehta",
          email: "sneha.mehta5@example.com",
          github: { value: "snehaMehta5", status: "OK" },
          resume: { value: "htp://drive.example.com/resumes/sneha.pdf", status: "INVALID" },
          linkedin: { value: "https://www.linkedin.com/in/snehaMehta5", status: "OK" },
          portfolio: { value: null, status: "MISSING" },
        },
      ],
    },
    // T007 — 2-member team, fully OK
    {
      team_id: "T007",
      team_name: "Binary Trees",
      members: [
        {
          name: "Arjun Nair",
          email: "arjun.nair6@example.com",
          github: { value: "arjunnair6", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/arjunnair6.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/arjunnair6", status: "OK" },
          portfolio: { value: "https://arjunnair6.example.dev", status: "OK" },
        },
        {
          name: "Kavya Reddy",
          email: "kavya.reddy7@example.com",
          github: { value: "kavyareddy7", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/kavyareddy7.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/kavyareddy7", status: "OK" },
          portfolio: { value: "https://kavyareddy7.example.dev", status: "OK" },
        },
      ],
    },
    // T008 — 2-member, member 1 missing github
    {
      team_id: "T008",
      team_name: "Hash Colliders",
      members: [
        {
          name: "Vikram Singh",
          email: "vikram.singh8@example.com",
          github: { value: null, status: "MISSING" },
          resume: { value: "https://drive.example.com/resumes/vikramsingh8.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/vikramsingh8", status: "OK" },
          portfolio: { value: "https://vikramsingh8.example.dev", status: "OK" },
        },
        {
          name: "Ananya Patel",
          email: "ananya.patel9@example.com",
          github: { value: "ananyapatel9", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/ananyapatel9.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/ananyapatel9", status: "OK" },
          portfolio: { value: null, status: "MISSING" },
        },
      ],
    },
    // T010 — 2-member, INVALID linkedin (no profile ID slug)
    {
      team_id: "T010",
      team_name: "Deadlock Divers",
      members: [
        {
          name: "Rohan Gupta",
          email: "rohan.gupta12@example.com",
          github: { value: "rohangupta12", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/rohangupta12.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/", status: "INVALID" },
          portfolio: { value: "https://rohangupta12.example.dev", status: "OK" },
        },
        {
          name: "Shreya Joshi",
          email: "shreya.joshi13@example.com",
          github: { value: "shreyajoshi13", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/shreyajoshi13.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/shreyajoshi13", status: "OK" },
          portfolio: { value: null, status: "MISSING" },
        },
      ],
    },
    // T017 — 3-member, fully OK
    {
      team_id: "T017",
      team_name: "AlgoArchitects",
      members: [
        {
          name: "Meera Iyer",
          email: "meera.iyer20@example.com",
          github: { value: "meeraiyer20", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/meeraiyer20.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/meeraiyer20", status: "OK" },
          portfolio: { value: "https://meeraiyer20.example.dev", status: "OK" },
        },
        {
          name: "Karan Malhotra",
          email: "karan.malhotra21@example.com",
          github: { value: "karanmalhotra21", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/karanmalhotra21.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/karanmalhotra21", status: "OK" },
          portfolio: { value: "https://karanmalhotra21.example.dev", status: "OK" },
        },
        {
          name: "Divya Pillai",
          email: "divya.pillai22@example.com",
          github: { value: "divyapillai22", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/divyapillai22.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/divyapillai22", status: "OK" },
          portfolio: { value: "https://divyapillai22.example.dev", status: "OK" },
        },
      ],
    },
    // T031 — 4-member, several MISSING across members
    {
      team_id: "T031",
      team_name: "Recursive Raiders",
      members: [
        {
          name: "Tanvi Saxena",
          email: "tanvi.saxena44@example.com",
          github: { value: "tanvisaxena44", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/tanvisaxena44.pdf", status: "OK" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: null, status: "MISSING" },
        },
        {
          name: "Aditya Rao",
          email: "aditya.rao45@example.com",
          github: { value: null, status: "MISSING" },
          resume: { value: null, status: "MISSING" },
          linkedin: { value: "https://www.linkedin.com/in/adityarao45", status: "OK" },
          portfolio: { value: null, status: "MISSING" },
        },
        {
          name: "Pallavi Jain",
          email: "pallavi.jain46@example.com",
          github: { value: "pallavijain46", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/pallavijain46.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/pallavijain46", status: "OK" },
          portfolio: { value: "https://pallavijain46.example.dev", status: "OK" },
        },
        {
          name: "Nikhil Verma",
          email: "nikhil.verma47@example.com",
          github: { value: "nikhilverma47", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/nikhilverma47.pdf", status: "OK" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: null, status: "MISSING" },
        },
      ],
    },
    // T037 — 6-member (largest team), majority of links MISSING
    {
      team_id: "T037",
      team_name: "Hexadecimal Heroes",
      members: [
        {
          name: "Suresh Nambiar",
          email: "suresh.nambiar54@example.com",
          github: { value: "sureshnambiar54", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/sureshnambiar54.pdf", status: "OK" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: null, status: "MISSING" },
        },
        {
          name: "Anjali Bose",
          email: "anjali.bose55@example.com",
          github: { value: null, status: "MISSING" },
          resume: { value: null, status: "MISSING" },
          linkedin: { value: "https://www.linkedin.com/in/anjalibose55", status: "OK" },
          portfolio: { value: null, status: "MISSING" },
        },
        {
          name: "Rajesh Pillai",
          email: "rajesh.pillai56@example.com",
          github: { value: null, status: "MISSING" },
          resume: { value: null, status: "MISSING" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: null, status: "MISSING" },
        },
        {
          name: "Sonal Thakkar",
          email: "sonal.thakkar57@example.com",
          github: { value: "sonalthakkar57", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/sonalthakkar57.pdf", status: "OK" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: "https://sonalthakkar57.example.dev", status: "OK" },
        },
        {
          name: "Deepak Choudhary",
          email: "deepak.choudhary58@example.com",
          github: { value: null, status: "MISSING" },
          resume: { value: null, status: "MISSING" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: null, status: "MISSING" },
        },
        {
          name: "Pooja Krishnan",
          email: "pooja.krishnan59@example.com",
          github: { value: "poojakrishnan59", status: "OK" },
          resume: { value: "https://drive.example.com/resumes/poojakrishnan59.pdf", status: "OK" },
          linkedin: { value: "https://www.linkedin.com/in/poojakrishnan59", status: "OK" },
          portfolio: { value: null, status: "MISSING" },
        },
      ],
    },
    // T040 — almost-empty team, all links blank, member 2 has no name (flagged but kept)
    {
      team_id: "T040",
      team_name: "Ghost Coders",
      members: [
        {
          name: "Farhan Qureshi",
          email: "farhan.qureshi63@example.com",
          github: { value: null, status: "MISSING" },
          resume: { value: null, status: "MISSING" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: null, status: "MISSING" },
        },
        {
          name: "", // flagged — empty name, member kept per data-format.md section 4
          email: "ghost2.qureshi63@example.com",
          github: { value: null, status: "MISSING" },
          resume: { value: null, status: "MISSING" },
          linkedin: { value: null, status: "MISSING" },
          portfolio: { value: null, status: "MISSING" },
        },
      ],
    },
  ],
};

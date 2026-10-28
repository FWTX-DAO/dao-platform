import { describe, expect, test } from "bun:test";
import {
  escapeLikePattern,
  normalizeTalentListParams,
  talentFiltersToSearchParams,
  talentQueryFromSearchParams,
} from "../src/app/_services/talent/services/talent-query";
import {
  TALENT_MAX_PAGE_SIZE,
  TALENT_MAX_SEARCH_LENGTH,
  TALENT_PAGE_SIZE,
  type TalentListParams,
} from "../src/app/_services/talent/types";
import { escapeCsvCell, toCsv } from "../src/shared/utils/csv";

const untrusted = (params: Record<string, unknown>) =>
  params as unknown as TalentListParams;

describe("talent list params", () => {
  test("defaults to newest first on the first page of every status", () => {
    expect(normalizeTalentListParams()).toEqual({
      search: "",
      status: "all",
      interests: [],
      preferences: [],
      sort: "createdAt",
      dir: "desc",
      page: 1,
      pageSize: TALENT_PAGE_SIZE,
    });
  });

  test("clamps untrusted paging input from the server action", () => {
    for (const page of [0, -3, Number.NaN, "abc"]) {
      expect(normalizeTalentListParams(untrusted({ page })).page).toBe(1);
    }
    expect(normalizeTalentListParams({ page: 2.9 }).page).toBe(2);
    expect(normalizeTalentListParams({ pageSize: 10_000 }).pageSize).toBe(
      TALENT_MAX_PAGE_SIZE,
    );
  });

  test("rejects unknown statuses and trims long searches", () => {
    expect(
      normalizeTalentListParams(untrusted({ status: "pending_email" })).status,
    ).toBe("all");
    expect(normalizeTalentListParams({ status: "archived" }).status).toBe(
      "archived",
    );
    const search = normalizeTalentListParams({
      search: `  ${"x".repeat(TALENT_MAX_SEARCH_LENGTH + 50)}  `,
    }).search;
    expect(search).toHaveLength(TALENT_MAX_SEARCH_LENGTH);
  });

  test("only sorts by whitelisted columns, defaulting text columns to A–Z", () => {
    expect(
      normalizeTalentListParams(untrusted({ sort: "email; drop table" })),
    ).toMatchObject({ sort: "createdAt", dir: "desc" });
    expect(normalizeTalentListParams({ sort: "fullName" })).toMatchObject({
      sort: "fullName",
      dir: "asc",
    });
    expect(
      normalizeTalentListParams(
        untrusted({ sort: "location", dir: "sideways" }),
      ).dir,
    ).toBe("asc");
    expect(
      normalizeTalentListParams({ sort: "updatedAt", dir: "asc" }),
    ).toMatchObject({ sort: "updatedAt", dir: "asc" });
  });

  test("keeps only known facet options, deduped in form order", () => {
    const query = normalizeTalentListParams(
      untrusted({
        interests: ["contract", "bogus", "full-time", "contract"],
        preferences: "remote",
      }),
    );
    expect(query.interests).toEqual(["full-time", "contract"]);
    expect(query.preferences).toEqual([]);
  });

  test("escapes LIKE wildcards so searches match literally", () => {
    expect(escapeLikePattern("50%_off\\")).toBe("50\\%\\_off\\\\");
    expect(escapeLikePattern("Fort Worth")).toBe("Fort Worth");
  });
});

describe("talent export URL", () => {
  test("round-trips table filters through the query string", () => {
    const params = talentFiltersToSearchParams({
      search: " python ",
      status: "verified",
      interests: ["cofounding", "advising"],
      preferences: ["remote"],
      sort: "fullName",
      dir: "asc",
    });
    expect(params.toString()).toBe(
      "search=python&status=verified&interests=cofounding%2Cadvising&preferences=remote&sort=fullName&dir=asc",
    );
    expect(talentQueryFromSearchParams(params)).toMatchObject({
      search: "python",
      status: "verified",
      interests: ["cofounding", "advising"],
      preferences: ["remote"],
      sort: "fullName",
      dir: "asc",
    });
  });

  test("ignores tampered export params", () => {
    const query = talentQueryFromSearchParams(
      new URLSearchParams("status=*&interests=,,x&sort=id&dir=up"),
    );
    expect(query).toMatchObject({
      status: "all",
      interests: [],
      sort: "createdAt",
      dir: "desc",
    });
  });
});

describe("csv export", () => {
  test("neutralizes spreadsheet formulas from public form input", () => {
    expect(escapeCsvCell('=HYPERLINK("http://x")')).toBe(
      '"\'=HYPERLINK(""http://x"")"',
    );
    expect(escapeCsvCell("+1 817 555 0100")).toBe("'+1 817 555 0100");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeCsvCell("-2+3")).toBe("'-2+3");
    expect(escapeCsvCell("Ada Lovelace")).toBe("Ada Lovelace");
  });

  test("quotes delimiters and flattens arrays and dates", () => {
    expect(escapeCsvCell('Fort Worth, "TX"')).toBe('"Fort Worth, ""TX"""');
    expect(escapeCsvCell("line one\nline two")).toBe('"line one\nline two"');
    expect(escapeCsvCell(["Python", "SQL"])).toBe("Python; SQL");
    expect(escapeCsvCell(new Date("2026-10-27T20:22:41.605Z"))).toBe(
      "2026-10-27T20:22:41.605Z",
    );
    expect(escapeCsvCell(null)).toBe("");
  });

  test("builds an RFC 4180 document with a BOM for Excel", () => {
    const csv = toCsv(
      [
        { header: "name", value: (r: { name: string }) => r.name },
        { header: "n", value: () => 1 },
      ],
      [{ name: "José" }],
    );
    expect(csv).toBe("﻿name,n\r\nJosé,1\r\n");
  });
});

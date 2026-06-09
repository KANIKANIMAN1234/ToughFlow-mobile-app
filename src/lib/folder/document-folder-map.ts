export type DriveDocumentType =
  | "expense"
  | "daily_report"
  | "site_survey_photo"
  | "site_survey_report"
  | "estimate"
  | "work_completion"
  | "invoice";

export type DriveFolderMappings = Record<DriveDocumentType, string>;

export const DRIVE_DOCUMENT_TYPES: DriveDocumentType[] = [
  "expense",
  "daily_report",
  "site_survey_photo",
  "site_survey_report",
  "estimate",
  "work_completion",
  "invoice",
];

export const DEFAULT_DRIVE_FOLDER_MAPPINGS: DriveFolderMappings = {
  expense: "経費",
  daily_report: "日報",
  site_survey_photo: "現地調査",
  site_survey_report: "報告書",
  estimate: "見積",
  work_completion: "作業完了報告",
  invoice: "請求",
};

const FOLDER_NAME_KEYWORDS: Record<DriveDocumentType, string[]> = {
  expense: ["経費"],
  daily_report: ["日報"],
  site_survey_photo: ["写真（現場", "写真(現場", "写真（現地", "08.写真"],
  site_survey_report: ["現地調査報告", "報告書", "03.現地調査"],
  estimate: ["見積"],
  work_completion: ["作業完了"],
  invoice: ["請求"],
};

function guessSubfolderForDocumentType(
  type: DriveDocumentType,
  subfolderNames: string[]
): string | null {
  for (const keyword of FOLDER_NAME_KEYWORDS[type]) {
    const match = subfolderNames.find((name) => name.includes(keyword));
    if (match) return match;
  }

  const defaultName = DEFAULT_DRIVE_FOLDER_MAPPINGS[type];
  if (type === "site_survey_photo") {
    const photoFolder = subfolderNames.find(
      (name) => name.includes("写真") && name.includes("現")
    );
    if (photoFolder) return photoFolder;
  }
  if (type === "site_survey_report") {
    const reportFolder = subfolderNames.find((name) => name.includes("報告"));
    if (reportFolder) return reportFolder;
  }

  const looseMatch = subfolderNames.find((name) => name.includes(defaultName));
  return looseMatch ?? null;
}

export function mergeDocumentFolderMap(
  partial: Partial<DriveFolderMappings> | null | undefined
): DriveFolderMappings {
  return { ...DEFAULT_DRIVE_FOLDER_MAPPINGS, ...partial };
}

export function parseDocumentFolderMap(raw: unknown): DriveFolderMappings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_DRIVE_FOLDER_MAPPINGS };
  }
  const input = raw as Partial<Record<DriveDocumentType, unknown>>;
  const merged = { ...DEFAULT_DRIVE_FOLDER_MAPPINGS };
  for (const key of DRIVE_DOCUMENT_TYPES) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) {
      merged[key] = value.trim();
    }
  }
  return merged;
}

export function resolveDocumentFolderName(
  documentFolderMap: DriveFolderMappings,
  type: DriveDocumentType
): string {
  return documentFolderMap[type] || DEFAULT_DRIVE_FOLDER_MAPPINGS[type];
}

export function syncMappingsToSubfolders(
  subfolderNames: string[],
  map: DriveFolderMappings
): DriveFolderMappings {
  const fallback = subfolderNames[0] ?? DEFAULT_DRIVE_FOLDER_MAPPINGS.expense;
  const next = { ...map };
  for (const key of DRIVE_DOCUMENT_TYPES) {
    if (subfolderNames.includes(next[key])) continue;

    const defaultName = DEFAULT_DRIVE_FOLDER_MAPPINGS[key];
    if (subfolderNames.includes(defaultName)) {
      next[key] = defaultName;
      continue;
    }

    const guessed = guessSubfolderForDocumentType(key, subfolderNames);
    if (guessed) {
      next[key] = guessed;
      continue;
    }

    next[key] = fallback;
  }
  return next;
}

export function normalizeFolderSubfolderNames(
  subfolderNames: string[],
  documentFolderMap: DriveFolderMappings
): string[] {
  const names = new Set(
    subfolderNames.map((name) => name.trim()).filter(Boolean)
  );
  for (const name of Object.values(documentFolderMap)) {
    if (name.trim()) names.add(name.trim());
  }
  return [...names];
}

export function buildFolderSettingsForDrive(input: {
  driveRootFolderId?: string | null;
  projectNamePattern?: string | null;
  subfolderNames?: string[] | null;
  documentFolderMap?: Partial<DriveFolderMappings> | null;
}): {
  driveRootFolderId: string;
  projectNamePattern: string;
  subfolderNames: string[];
  documentFolderMap: DriveFolderMappings;
} {
  const resolvedSubfolders =
    Array.isArray(input.subfolderNames) && input.subfolderNames.length > 0
      ? input.subfolderNames.filter(Boolean)
      : Object.values(DEFAULT_DRIVE_FOLDER_MAPPINGS);
  const documentFolderMap = syncMappingsToSubfolders(
    resolvedSubfolders,
    mergeDocumentFolderMap(input.documentFolderMap)
  );

  return {
    driveRootFolderId: input.driveRootFolderId ?? "",
    projectNamePattern: input.projectNamePattern ?? "{date}_{name}",
    subfolderNames: normalizeFolderSubfolderNames(resolvedSubfolders, documentFolderMap),
    documentFolderMap,
  };
}

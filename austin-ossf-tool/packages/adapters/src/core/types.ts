export type RawSourceRecord = {
  externalId?: string;
  sourceUrl?: string;
  payload: Record<string, unknown>;
};

export type NormalizedRecord = {
  recordType: string;
  permitNumber?: string;
  applicationDate?: string;
  approvalDate?: string;
  recordDate?: string;
  title?: string;
  status?: string;
  property: {
    addressLine1?: string;
    city?: string;
    stateCode?: string;
    postalCode?: string;
    countyName?: string;
    parcelId?: string;
    legalDescription?: string;
  };
  system?: {
    systemType?: string;
    capacity?: string;
    bedrooms?: number;
    installDate?: string;
    approvalDate?: string;
    operateDate?: string;
    installerName?: string;
    maintainerName?: string;
    status?: string;
  };
  contacts?: Array<{
    role: string;
    name?: string;
    licenseNumber?: string;
    phone?: string;
    email?: string;
  }>;
  documents?: Array<{
    documentType?: string;
    title?: string;
    fileUrl?: string;
  }>;
  metadata?: Record<string, unknown>;
};

export interface CountyAdapter {
  slug: string;
  fetchRecords(): Promise<RawSourceRecord[]>;
  normalize(record: RawSourceRecord): Promise<NormalizedRecord | null>;
}

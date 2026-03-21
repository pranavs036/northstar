export interface SchemaProperty {
  name: string;
  value: string | null;
  required: boolean;
  present: boolean;
}

export interface ProductSchema {
  type: string;
  properties: SchemaProperty[];
  rawJsonLd: string;
}

export interface SchemaAuditResult {
  url: string;
  skuId: string;
  schemasFound: ProductSchema[];
  completenessScore: number;
  missingRequired: string[];
  missingOptional: string[];
  hasPrice: boolean;
  hasAvailability: boolean;
  hasReviews: boolean;
  hasRatings: boolean;
  hasImages: boolean;
  hasBrand: boolean;
}

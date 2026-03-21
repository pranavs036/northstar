export type SentimentLabel = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export interface SentimentResult {
  label: SentimentLabel;
  score: number; // -1.0 to 1.0
  reasoning: string;
}

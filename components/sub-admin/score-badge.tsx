import { Badge } from "@/components/ui/badge";

type ScoreBadgeProps = {
  score?: number | null;
};

export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (typeof score !== "number") {
    return <Badge variant="outline">N/A</Badge>;
  }

  return <Badge variant="outline">{score.toFixed(2)} / 5</Badge>;
}

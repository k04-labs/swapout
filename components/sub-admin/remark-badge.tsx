import { Badge } from "@/components/ui/badge";

type RemarkBadgeProps = {
  remarkScore?: number | null;
  remark?: string | null;
};

export function RemarkBadge({ remarkScore, remark }: RemarkBadgeProps) {
  if (!remark && !remarkScore) {
    return <Badge variant="outline">Not Assessed</Badge>;
  }

  if (remark && !remarkScore) {
    return <Badge variant="secondary">{remark}</Badge>;
  }

  if (!remark) {
    return <Badge variant="outline">{remarkScore}</Badge>;
  }

  if (remarkScore === 1) return <Badge variant="danger">1 • {remark}</Badge>;
  if (remarkScore === 2) return <Badge variant="warning">2 • {remark}</Badge>;
  if (remarkScore === 3) return <Badge variant="secondary">3 • {remark}</Badge>;
  if (remarkScore === 4) return <Badge variant="secondary">4 • {remark}</Badge>;
  return <Badge variant="success">5 • {remark}</Badge>;
}

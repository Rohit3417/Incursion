import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ComparePage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configuration comparison and rank-difference table arrive on Day 13.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

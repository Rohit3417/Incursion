import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Run history list with past datasets, configurations, and timestamps
            arrives on Day 13.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

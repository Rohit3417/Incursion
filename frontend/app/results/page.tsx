import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ResultsPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Results table arrives on Day 6 (mock data), connected to real
            evaluation runs on Day 7.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

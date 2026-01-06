"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useTranslations } from 'next-intl';

interface BotMetricsChartProps {
  botId: Id<"bots">;
  metricType: "decisionsCreated" | "decisionsResolved" | "newsAggregated" | "indicatorsTracked" | "executionTime" | "errorCount";
  title: string;
  color?: string;
  period?: "hour" | "day" | "week";
}

export function BotMetricsChart({
  botId,
  metricType,
  title,
  color = "#3b82f6",
  period = "day",
}: BotMetricsChartProps) {
  const t = useTranslations('bots');
  // Récupérer les métriques des 7 derniers jours
  const endTime = Date.now();
  const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 jours

  const metrics = useQuery(api.bots.getBotMetrics, {
    botId,
    metricType,
    period,
    startTime,
    endTime,
    limit: 100,
  });

  const metricLabels: Record<string, string> = {
    decisionsCreated: t('metrics.decisionsCreated'),
    decisionsResolved: t('metrics.decisionsResolved'),
    newsAggregated: t('metrics.newsAggregated'),
    indicatorsTracked: t('metrics.indicatorsTracked'),
    executionTime: t('metrics.executionTime'),
    errorCount: t('metrics.errorCount'),
  };

  const chartData = useMemo(() => {
    if (!metrics) return [];

    // Grouper par jour et agréger les valeurs
    const grouped: Record<string, number> = {};
    
    metrics.forEach((metric) => {
      const date = new Date(metric.timestamp);
      const dayKey = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = 0;
      }
      grouped[dayKey] += metric.value;
    });

    // Convertir en tableau pour le graphique
    return Object.entries(grouped)
      .map(([date, value]) => ({
        date,
        value,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      });
  }, [metrics]);

  const chartConfig = {
    value: {
      label: metricLabels[metricType] || title,
      color: color,
    },
  };

  if (metrics === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SolarIcon icon="chart-2-bold" className="size-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SolarIcon icon="chart-2-bold" className="size-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>{t('metrics.noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <SolarIcon icon="chart-2-bold" className="size-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4, fill: color }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


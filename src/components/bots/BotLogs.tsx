"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from 'next-intl';

interface BotLogsProps {
  botId: Id<"bots">;
}

const levelColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  success: "bg-green-500/10 text-green-600 dark:text-green-400",
  warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const levelIcons: Record<string, string> = {
  info: "info-circle-bold",
  success: "check-circle-bold",
  warning: "danger-triangle-bold",
  error: "close-circle-bold",
};

export function BotLogs({ botId }: BotLogsProps) {
  const t = useTranslations('bots');
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const logs = useQuery(
    api.bots.getBotLogs,
    botId ? { botId, limit } : "skip"
  );

  const filteredLogs = logs?.filter(
    (log) => levelFilter === "all" || log.level === levelFilter
  );

  const levelLabels: Record<string, string> = {
    info: t('logs.levels.info'),
    success: t('logs.levels.success'),
    warning: t('logs.levels.warning'),
    error: t('logs.levels.error'),
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (logs === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SolarIcon icon="file-text-bold" className="size-5" />
            {t('logs.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <SolarIcon icon="file-text-bold" className="size-5" />
            {t('logs.title')}
          </CardTitle>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('logs.filterByLevel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('logs.allLevels')}</SelectItem>
              <SelectItem value="info">{t('logs.levels.info')}</SelectItem>
              <SelectItem value="success">{t('logs.levels.success')}</SelectItem>
              <SelectItem value="warning">{t('logs.levels.warning')}</SelectItem>
              <SelectItem value="error">{t('logs.levels.error')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs && filteredLogs.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
              >
                <div className="shrink-0 mt-0.5">
                  <SolarIcon
                    icon={levelIcons[log.level] || "info-circle-bold"}
                    className={cn(
                      "size-4",
                      log.level === "info" && "text-blue-600 dark:text-blue-400",
                      log.level === "success" && "text-green-600 dark:text-green-400",
                      log.level === "warning" && "text-yellow-600 dark:text-yellow-400",
                      log.level === "error" && "text-red-600 dark:text-red-400"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", levelColors[log.level])}
                    >
                      {levelLabels[log.level]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </span>
                    {log.functionName && (
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {log.functionName}
                      </code>
                    )}
                    {log.executionTime && (
                      <span className="text-xs text-muted-foreground">
                        {log.executionTime}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{log.message}</p>
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        {t('logs.details')}
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {logs.length >= limit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit(limit + 50)}
                className="w-full"
              >
                {t('logs.loadMore')}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <SolarIcon icon="file-text-bold" className="size-12 mx-auto mb-4 opacity-50" />
            <p>{t('logs.noLogs')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


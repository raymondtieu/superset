import { getTimeFormatterForGranularity } from '@superset-ui/core';
import {
  MetricsLayoutEnum,
  PivotTableChart,
} from '@superset-ui/plugin-chart-pivot-table';

import { DEFAULT_NUMBER_FORMAT } from '@superset-ui/chart-controls';
import { DEXChartTransformedProps } from './types';
import EchartsTimeseries from '../../EchartsTimeseries';

import WebDataRocks from '@webdatarocks/webdatarocks';
import '@webdatarocks/webdatarocks/webdatarocks.min.css';
import { useEffect, useMemo, useRef } from 'react';

const MIN_LINE_CHART_HEIGHT = 300;

const PIVOT_TABLE_HEIGHT = 400;
const PIVOT_TABLE_AGGREGATE_FUNCTION = 'sum';

export default function DEXChart(props: DEXChartTransformedProps) {
  const {
    formData,
    height,
    width,
    groupby,
    setDataMask,
    onContextMenu,
    xAxis,
    emitCrossFilters,
    datasource,
    pivotData,
  } = props;

  const pivotRows = Array.isArray(pivotData?.data) ? pivotData.data : [];
  const hasPivot = pivotRows.length > 0;

  const metrics = useMemo(
    () =>
      (hasPivot
        ? Object.keys(pivotRows[0])
            .map(key => key)
            .filter(key => key !== 'dt' && !groupby.includes(key)) // TODO (kgopal): Change to use constant for dt
        : []),
    [hasPivot, pivotRows, groupby],
  );

  const pivotContainerRef = useRef<HTMLDivElement | null>(null);
  const pivotInstanceRef = useRef<any>(null);

  const formattedPivotRows = useMemo(() => {
    if (!hasPivot) return [] as Record<string, unknown>[];

    return pivotRows.map(originalRow => {
      const formattedRow: Record<string, unknown> = { ...originalRow };

      // Ensure metric fields are numbers
      metrics.forEach(metricName => {
        const value = (originalRow as Record<string, unknown>)[metricName];
        if (typeof value === 'string') {
          const parsed = Number(value);
          formattedRow[metricName] = Number.isNaN(parsed) ? value : parsed;
        }
      });

      return formattedRow;
    });
  }, [hasPivot, pivotRows, metrics]);

  useEffect(() => {
    if (!pivotContainerRef.current) return;

    pivotInstanceRef.current = new WebDataRocks({
      container: pivotContainerRef.current,
      customizeCell: (cellStyle: any, cellData: any) => {
        // TODO (rtieu): Format numbers in pivot table using DEFAULT_NUMBER_FORMAT
      },
      toolbar: true,
    });

    return () => {
      const instance = pivotInstanceRef.current;
      if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      } else if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
      pivotInstanceRef.current = null;
    };
  }, []);

  // Provide data + slice to WebDataRocks whenever inputs change
  useEffect(() => {
    const instance = pivotInstanceRef.current;
    if (!instance || !hasPivot) return;

    const mapping: Record<string, any> = {};

    groupby.forEach(g => {
      mapping[g as string] = { type: 'string' };
    });

    metrics.forEach(m => {
      mapping[m] = { type: 'number' };
    });

    const report = {
      dataSource: {
        data: [
          {
            dt: { type: 'date string' },
            ...mapping,
          },
          ...formattedPivotRows,
        ]
      },
      slice: {
        rows: groupby.map(name => ({ uniqueName: name })),
        columns: [
          { uniqueName: 'Measures' },
          { uniqueName: 'dt' },
        ],
        measures: metrics.map(name => ({
          uniqueName: name,
          aggregation: PIVOT_TABLE_AGGREGATE_FUNCTION,
        })),
      },
      options: {
        grid: {
          type: 'classic',
        },
        datePattern: 'YYYY-MM-DD',
      },
    } as any;

    instance.setReport(report);
  }, [hasPivot, formattedPivotRows, groupby, metrics, xAxis.label]);

  return (
    <div style={{ position: 'relative', height, width }}>
      <EchartsTimeseries
        {...props}
        height={
          hasPivot && height - PIVOT_TABLE_HEIGHT > MIN_LINE_CHART_HEIGHT
            ? height - PIVOT_TABLE_HEIGHT
            : height
        }
      />
      {hasPivot ? (
        <div id="pivotContainer" ref={pivotContainerRef} style={{ height: PIVOT_TABLE_HEIGHT }} />
      ) : null}
    </div>
  );
}

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
const PIVOT_TABLE_AGGREGATE_FUNCTION = 'Sum';
const PIVOT_TABLE_ROW_COLUMN_ORDER = 'key_a_to_z';

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

  // Safely derive pivot table data and metrics
  const pivotRows = Array.isArray(pivotData?.data) ? pivotData.data : [];
  const hasPivot = pivotRows.length > 0;

  const pivotTableProps = {
    width,
    height,
    data: pivotRows,
    groupbyRows: groupby,
    groupbyColumns: ['dt'], // TODO (kgopal): Change to use constant
    metrics: hasPivot
      ? Object.keys(pivotRows[0])
          .map(key => key)
          .filter(key => key !== 'dt' && !groupby.includes(key))
      : [], // TODO (kgopal): Change to use constant for dt
    tableRenderer: '',
    colOrder: PIVOT_TABLE_ROW_COLUMN_ORDER,
    rowOrder: PIVOT_TABLE_ROW_COLUMN_ORDER,
    aggregateFunction: PIVOT_TABLE_AGGREGATE_FUNCTION,
    transposePivot: false,
    combineMetric: false,
    rowSubtotalPosition: false,
    colSubtotalPosition: false,
    colTotals: true, // TODO (kgopal): Change to false when time comparison percent change applied
    colSubTotals: false,
    rowTotals: false,
    rowSubTotals: false,
    valueFormat: DEFAULT_NUMBER_FORMAT,
    currencyFormat: {
      symbol: '',
      symbolPosition: '',
    },
    emitCrossFilters,
    setDataMask,
    verboseMap: datasource?.verboseMap || {},
    columnFormats: datasource?.columnFormats || {},
    currencyFormats: {},
    metricsLayout: MetricsLayoutEnum.COLUMNS,
    metricColorFormatters: [],
    dateFormatters: {
      [xAxis.label]: getTimeFormatterForGranularity(formData.timeGrainSqla),
    },
    onContextMenu,
    timeGrainSqla: formData.timeGrainSqla,
    margin: 100,
    legacy_order_by: null,
    order_desc: false,
  };

  const pivotContainerRef = useRef<HTMLDivElement | null>(null);
  const pivotInstanceRef = useRef<any>(null);

  // Normalize groupby to plain field names (strings)
  const groupbyNames = useMemo(
    () =>
      (groupby || []).map((g: any) => {
        if (typeof g === 'string') return g;
        // Try common shapes used in Superset
        return g?.label || g?.column || g?.sqlExpression || String(g);
      }),
    [groupby],
  );

  // Ensure WebDataRocks-friendly data formats
  const metrics = useMemo(
    () =>
      (hasPivot
        ? Object.keys(pivotRows[0])
            .map(key => key)
            .filter(key => key !== 'dt' && !groupbyNames.includes(key))
        : []),
    [hasPivot, pivotRows, groupbyNames],
  );

  const formattedPivotRows = useMemo(() => {
    if (!hasPivot) return [] as Record<string, unknown>[];

    return pivotRows.map(originalRow => {
      const formattedRow: Record<string, unknown> = { ...originalRow };

      // Normalize date field to ISO 8601 string if possible
      const dtValue = (originalRow as Record<string, unknown>)['dt'];
      if (dtValue instanceof Date) {
        formattedRow['dt'] = dtValue.toISOString();
      } else if (typeof dtValue === 'number') {
        // Keep as Unix ms; mapping will mark it as a date
        formattedRow['dt'] = dtValue;
      } else if (typeof dtValue === 'string') {
        // Assume ISO 8601 or a string the widget can parse
        formattedRow['dt'] = dtValue;
      }

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

    const mapping: Record<string, any> = {
      dt: { type: 'date', caption: xAxis.label },
    };
    groupbyNames.forEach(g => {
      mapping[g] = { type: 'string' };
    });
    metrics.forEach(m => {
      mapping[m] = { type: 'number' };
    });

    const report = {
      dataSource: {
        data: formattedPivotRows,
        mapping,
      },
      slice: {
        rows: groupbyNames.map(name => ({ uniqueName: name })),
        columns: [
          { uniqueName: 'Measures' },
          { uniqueName: 'dt' },
        ],
        measures: metrics.map(name => ({ uniqueName: name, aggregation: 'sum' })),
      },
      options: {
        grid: {
          type: 'flat',
        },
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
        <PivotTableChart {...pivotTableProps} height={PIVOT_TABLE_HEIGHT} />
      ) : null}

      <div id="pivotContainer" ref={pivotContainerRef} style={{ height: PIVOT_TABLE_HEIGHT }} />
    </div>
  );
}

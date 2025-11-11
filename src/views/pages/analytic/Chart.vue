<script lang="ts" setup>
import { useConfigStore } from '@/@core/stores';
import { useSalesSummaryStore } from '@/@core/stores/sales';
import { ISalesSummary } from '@/@core/typedefs';
import { useTheme } from 'vuetify';
const { proxy } = getCurrentInstance()!

const vuetifyTheme = useTheme()

const currentTab = ref<number>(0)
const salesSummaryStore = useSalesSummaryStore()
const configStore = useConfigStore()

const numberFormatter = (val: number) => {
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + ' B'
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + ' M'
  if (val >= 1_000) return (val / 1_000).toFixed(2) + ' K'
  return val
}

watch(() => configStore.theme, (val) => {
    console.log(val)
  }, 
  { deep: true }
)


const percentFormatter = (val: number) =>
  val !== null && val !== undefined ? `${val.toFixed(2)} %` : '-'
  
const getCompanyField = (
  type: 'mom' | 'yoy',
  company: 'SPS' | 'BBS',
  field: keyof ISalesSummary
) =>
  computed(() =>
    (salesSummaryStore.summary[type][company] ?? []).map((item, index, arr) => {
      if (field === 'month') {
        return item[field];
      }

      const fieldName = field.toString();

      if (fieldName.startsWith('mom_') || fieldName.startsWith('yoy_')) {
        const baseField = fieldName.replace(/^mom_/, '').replace(/^yoy_/, '');

        const current = (item[baseField as keyof ISalesSummary] ?? 0) as number;
        const prev =
          index > 0
            ? ((arr[index - 1]?.[baseField as keyof ISalesSummary] ?? 0) as number)
            : 0;

        if (prev === 0) {
          return current > 0 ? 100 : 0;
        }

        return ((current - prev) / prev) * 100;
      }

      return (item[field] ?? 0) as number;
    })
  );


const generateChartData = (
  fieldName: "revenue" | "volume" | "active_customers",
  type: 'mom' | 'yoy',
  company: 'SPS' | 'BBS'
) =>  getCompanyField(type, company, fieldName).value.map(Number)

const generateLineChartData = (
  fieldName: "revenue" | "volume" | "active_customers",
  type: 'mom' | 'yoy',
  company: 'SPS' | 'BBS'
) => getCompanyField(type, company, `${type}_${fieldName}`).value.map(Number)

const buildColumnChart = (
  metricLabel: "Revenue" | "Volume" | "Customer",
  fieldName: "revenue" | "volume" | "active_customers",
  months: string[],
  type: 'mom' | 'yoy',
) => {
  const currentTheme = vuetifyTheme.current.value.colors;
  const variableTheme = vuetifyTheme.current.value.variables;
  const labelColor = `rgba(${hexToRgb(currentTheme["on-surface"])},${variableTheme["disabled-opacity"]})`

  const isDark = configStore.theme === 'dark'
  const labelType = type === 'mom' ? 'MoM' : 'YoY';
  const spsData = generateChartData(fieldName, type, 'SPS').map(Number)
  const bbsData = generateChartData(fieldName, type, 'BBS').map(Number)

  const maxVal = Math.max(...spsData, ...bbsData) * 1.005 // Calculate max label value + 0.5%

  const options = {
    chart: {
      height: 450,
      type: "line",
      stacked: false,
    }, colors: ['#008FFB', '#FB8C00'],
    dataLabels: { enabled: false },
    stroke: {
      width: [1, 2, 2],
      curve: ['straight', 'monotoneCubic'],
    },
    title: {
      text: `${labelType} ${metricLabel} Summary`,
      align: "left",
      offsetX: 110,
      style: { color:  isDark ? '#fff' : '#111' },
    },
    xaxis: {
      categories: months,
      labels: {
        style: { colors: isDark ? '#ccc' : '#333', fontSize: "0.8125rem" },
      },
    },
    yaxis: [
      {
        seriesName: `${metricLabel}`,
        min: 0,
        max: maxVal,
        labels: { 
          formatter: numberFormatter, 
          style: {
            colors: '#008FFB',
          }, 
        },
        title: { text: `SPS - BBS ${metricLabel}`, style: { color: '#008FFB' } },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      theme: "dark",
      y: {
        formatter: function (value: number, { seriesIndex, w }: any) {
          const seriesName = w.config.series[seriesIndex].name;
          if (seriesName.includes("Growth")) {
            return percentFormatter(value);
          }
          return numberFormatter(value);
        },
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
        const labels = w.config.series.map((s: any) => s.name);
        const values = series.map((s: any) => s[dataPointIndex] || 0);
        const total = values.reduce((a: number, b: number) => a + b, 0);
        const xLabel = w.globals.categoryLabels[dataPointIndex]; 
        
        let html = `<div style="padding:8px; width:200px;">`;
        html += `<div style="font-weight:bold; margin-bottom:4px;">${xLabel}</div>`;

        labels.forEach((name: string, i: number) => {
          const color = w.globals.colors[i] || '#999';

          html += `
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};"></span>
                <span>${name}</span>
              </div>
              <span>${numberFormatter(values[i])}</span>
            </div>`;
        });

        if(metricLabel !== 'Customer'){
          html += `<hr style="margin:4px 0;"/>`;
          html += `
            <div style="display:flex;justify-content:space-between;font-weight:bold;">
              <span>Total</span>
              <span>${numberFormatter(total)}</span>
            </div>
          `;
          html += `</div>`;
        }
        return html;
      }
    },
    legend: {
      horizontalAlign: "left",
      offsetX: 40,
      labels: { colors: "#fff" },
    },
  }
  const series = [
    {
      name: `SPS ${metricLabel}`,
      type: "column",
      data: generateChartData(fieldName, type, 'SPS'),
      yAxisIndex: 0,
    },   
    {
      name: `BBS ${metricLabel}`,
      type: "column",
      data: generateChartData(fieldName, type, 'BBS'),
      yAxisIndex: 0,
    }
  ];
  return {options, series}
}

const buildLineChart = (
  metricLabel: "Revenue" | "Volume" | "Customer",
  fieldName: "revenue" | "volume" | "active_customers",
  months: string[],
  type: 'mom' | 'yoy',
) => {
  const currentTheme = vuetifyTheme.current.value.colors;
  const variableTheme = vuetifyTheme.current.value.variables;
  const labelColor = `rgba(${hexToRgb(currentTheme["on-surface"])},${variableTheme["disabled-opacity"]})`;

  const labelType = type === 'mom' ? 'MoM' : 'YoY';

  const options = {
    chart: {
      height: 450,
      type: "line",
      stacked: false,
    },
    colors: ['#008FFB', '#FB8C00'],
    dataLabels: { enabled: false },
    stroke: {
      width: [3, 3],
      curve: ["monotoneCubic", "monotoneCubic"],
    },
    title: {
      text: `${labelType} ${metricLabel} Growth`,
      align: "left",
      offsetX: 110,
      style: { color: currentTheme["on-background"] },
    },
    xaxis: {
      categories: months,
      labels: {
        style: { colors: labelColor, fontSize: "0.8125rem" },
      },
    },
    yaxis: [
      {
        seriesName: `${labelType} ${metricLabel} Growth`,
        axisTicks: { show: true },
        axisBorder: { show: true, color: "#008FFB" },
        labels: {
          style: { colors: "#008FFB" },
          formatter: percentFormatter,
        },
        title: { text: `${labelType} ${metricLabel} Growth (%)`, style: { color: "#008FFB" } },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      theme: "dark",
      y: {
        formatter: function (value: number, { seriesIndex, w }: any) {
          return percentFormatter(value);
        },
      },
    },
    legend: {
      horizontalAlign: "left",
      offsetX: 40,
      labels: { colors: "#fff" },
    },
  };

  const series = [
    {
      name: `SPS ${labelType} ${metricLabel} Growth`,
      type: "line",
      data: generateLineChartData(fieldName, type, 'SPS'),
      yAxisIndex: 0,
    },
    {
      name: `BBS ${labelType} ${metricLabel} Growth`,
      type: "line",
      data: generateLineChartData(fieldName, type, 'BBS'),
      yAxisIndex: 0,
    },
  ];

  return { options, series };
}

const momRevenueChartConfig = buildColumnChart('Revenue', 'revenue', getCompanyField('mom', 'SPS', 'month').value as string[], 'mom')
const momVolumeChartConfig = buildColumnChart('Volume', 'volume', getCompanyField('mom', 'SPS', 'month').value as string[], 'mom')
const momCustomerChartConfig = buildColumnChart('Customer', 'active_customers', getCompanyField('mom', 'SPS', 'month').value as string[], 'mom');

const yoyRevenueChartConfig = buildColumnChart('Revenue', 'revenue', getCompanyField('yoy', 'SPS', 'month').value as string[], 'yoy')
const yoyVolumeChartConfig = buildColumnChart('Volume', 'volume', getCompanyField('yoy', 'SPS', 'month').value as string[], 'yoy')
const yoyCustomerChartConfig = buildColumnChart('Customer', 'active_customers', getCompanyField('yoy', 'SPS', 'month').value as string[], 'yoy');


const momRevenueLineChartConfig = buildLineChart('Revenue', 'revenue', getCompanyField('mom', 'SPS', 'month').value as string[], 'mom')
const momVolumeLineChartConfig = buildLineChart('Volume', 'volume', getCompanyField('mom', 'SPS', 'month').value as string[], 'mom')
const momCustomerLineChartConfig = buildLineChart('Customer', 'active_customers', getCompanyField('mom', 'SPS', 'month').value as string[], 'mom');

const yoyRevenueLineChartConfig = buildLineChart('Revenue', 'revenue', getCompanyField('yoy', 'SPS', 'month').value as string[], 'yoy')
const yoyVolumeLineChartConfig = buildLineChart('Volume', 'volume', getCompanyField('yoy', 'SPS', 'month').value as string[], 'yoy')
const yoyCustomerLineChartConfig = buildLineChart('Customer', 'active_customers', getCompanyField('yoy', 'SPS', 'month').value as string[], 'yoy');


const chartConfigs = computed(() => {
  const isDark = configStore.theme === 'dark'

  const withTheme = (config: any) => ({
    ...config,
    options: {
      ...config.options,
   
      title: {
        ...config.options.title,
        style: { color: isDark ? '#fff' : '#2f2b3de6' },
      },
      xaxis: {
        ...config.options.xaxis,
        labels: {
          ...config.options.xaxis.labels,
          style: { colors: isDark ? '#ccc' : '#2f2b3de6' },
        },
      },
      yaxis: config.options.yaxis?.map((y: any) => ({
        ...y,
        labels: {
          ...y.labels,
          style: { colors: isDark ? '#ccc' : '#2f2b3de6' },
        },
        title: {
          ...y.title,
          style: { color: isDark ? '#fff' : '#2f2b3de6' },
        },
      })),
      legend: {
        ...config.options.legend,
        labels: { colors: isDark ? '#fff' : '#2f2b3de6' },
      },
    },
  })

  return [
    {
      title: 'Revenue',
      icon: 'tabler-coin',
      momBarOptions: withTheme(momRevenueChartConfig).options,
      yoyBarOptions: withTheme(yoyRevenueChartConfig).options,
      momLineOptions: withTheme(momRevenueLineChartConfig).options,
      yoyLineOptions: withTheme(yoyRevenueLineChartConfig).options,
      momBarSeries: momRevenueChartConfig.series,
      yoyBarSeries: yoyRevenueChartConfig.series,
      momLineSeries: momRevenueLineChartConfig.series,
      yoyLineSeries: yoyRevenueLineChartConfig.series
    },
    {
      title: 'Volume',
      icon: 'tabler-chart-bar',
      momBarOptions: withTheme(momVolumeChartConfig).options,
      yoyBarOptions: withTheme(yoyVolumeChartConfig).options,
      momLineOptions: withTheme(momVolumeLineChartConfig).options,
      yoyLineOptions: withTheme(yoyVolumeLineChartConfig).options,
      momBarSeries: momVolumeChartConfig.series,
      yoyBarSeries: yoyVolumeChartConfig.series,
      momLineSeries: momVolumeLineChartConfig.series,
      yoyLineSeries: yoyVolumeLineChartConfig.series,
      },
      {
      title: 'Customers',
      icon: 'tabler-users',
      momBarOptions: withTheme(momCustomerChartConfig).options,
      yoyBarOptions: withTheme(yoyCustomerChartConfig).options,
      momLineOptions: withTheme(momCustomerLineChartConfig).options,
      yoyLineOptions: withTheme(yoyCustomerLineChartConfig).options,
      momBarSeries: momCustomerChartConfig.series,
      yoyBarSeries: yoyCustomerChartConfig.series,
      momLineSeries: momCustomerLineChartConfig.series,
      yoyLineSeries: yoyCustomerLineChartConfig.series,
    }
  ]
})

</script>
<template>
   <VSlideGroup
      v-model="currentTab"
      show-arrows
      mandatory
      class="mb-10"
    >    
      <VSlideGroupItem
        v-for="(report, index) in chartConfigs"
        :key="report.title"
        v-slot="{ isSelected, toggle }"
        :value="index"
      >
        <div
          style="block-size: 120px; inline-size: 140px;"
          :style="isSelected ? 'border-color:rgb(var(--v-theme-primary)) !important' : ''"
          :class="isSelected ? 'border' : 'border border-dashed'"
          class="d-flex flex-column justify-center align-center cursor-pointer rounded py-4 px-5 me-4"
          @click="toggle"
        >
          <VAvatar
            rounded
            size="38"
            :color="isSelected ? 'primary' : ''"
            variant="tonal"
            class="mb-2"
          >
            <VIcon
              size="22"
              :icon="report.icon"
            />
          </VAvatar>
          <h6 class="text-base font-weight-medium mb-0">
            {{ report.title }}
          </h6>
        </div>
      </VSlideGroupItem>
    </VSlideGroup>
    <div class="chart-scroll-wrapper">
      <div class="chart-column" v-for="key in ['momBar', 'momLine', 'yoyBar', 'yoyLine']">
       <VueApexCharts
        :key="configStore.theme + key"
        :ref="key + 'RefVueApexChart'"
        :options="(chartConfigs[Number(currentTab)] as any)[`${key}Options`]"
        :series="(chartConfigs[Number(currentTab)] as any)[`${key}Series`]"
        height="400"
        :width=" key === 'yoyBar' || key === 'yoyLine' ? 600 : 800"
      />
      </div>
    </div>
</template>


<style lang="scss" scoped>
.chart-scroll-wrapper {
  overflow-x: auto;
  padding-block-end: 1rem;
}

.chart-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-inline-size: max-content;
}
</style>

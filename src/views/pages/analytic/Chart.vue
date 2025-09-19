<script lang="ts" setup>
import { useSalesSummaryStore } from '@/@core/stores/sales';
import { ISalesSummary } from '@/@core/typedefs';
import { useTheme } from 'vuetify';

const vuetifyTheme = useTheme()

const currentTab = ref<number>(0)
const salesSummaryStore = useSalesSummaryStore()

const numberFormatter = (val: number) => {
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + ' B'
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + ' M'
  if (val >= 1_000) return (val / 1_000).toFixed(2) + ' K'
  return val
}

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
) =>  getCompanyField(type, company, fieldName).value as string[]

const generateLineChartData = (
  fieldName: "revenue" | "volume" | "active_customers",
  type: 'mom' | 'yoy',
  company: 'SPS' | 'BBS'
) => getCompanyField(type, company, `${type}_${fieldName}`).value as string[]

const buildColumnChart = (
  metricLabel: "Revenue" | "Volume" | "Customer",
  fieldName: "revenue" | "volume" | "active_customers",
  months: string[],
  type: 'mom' | 'yoy',
) => {
  const currentTheme = vuetifyTheme.current.value.colors;
  const variableTheme = vuetifyTheme.current.value.variables;
  const labelColor = `rgba(${hexToRgb(currentTheme["on-surface"])},${variableTheme["disabled-opacity"]})`

  const options = {
    chart: {
      height: 450,
      type: "line",
      stacked: false,
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [1, 2, 2],
      curve: ['straight', 'monotoneCubic'],
    },
    title: {
      text: `${type.toUpperCase()} ${metricLabel} Summary`,
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
        seriesName: `SPS ${metricLabel}`,
        labels: { 
          formatter: numberFormatter, 
          style: {
            colors: '#008FFB',
          }, 
        },
        title: { text: `SPS ${metricLabel}`, style: { color: '#008FFB' } },
      },
      {
       seriesName: `BBS ${metricLabel}`,
        opposite: true,
        labels: { 
          formatter: numberFormatter, 
          style: {
            colors: '#00E396D9',
          }, 
        },
        title: { text: `BBS ${metricLabel}`, style: { color: '#00E396D9' } },
      }
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
    },
    legend: {
      horizontalAlign: "left",
      offsetX: 40,
      labels: { colors: "#ff5722" },
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
    },
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

  const options = {
    chart: {
      height: 450,
      type: "line",
      stacked: false,
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [3, 3],
      curve: ["monotoneCubic", "monotoneCubic"],
    },
    title: {
      text: `MoM ${metricLabel} Growth`,
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
        seriesName: `MoM ${metricLabel} Growth`,
        axisTicks: { show: true },
        axisBorder: { show: true, color: "#FEB019" },
        labels: {
          style: { colors: "#FEB019" },
          formatter: percentFormatter,
        },
        title: { text: `MoM ${metricLabel} Growth (%)`, style: { color: "#FEB019" } },
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
      labels: { colors: "#ff5722" },
    },
  };

  const series = [
    {
      name: `SPS MoM ${metricLabel} Growth`,
      type: "line",
      data: generateLineChartData(fieldName, type, 'SPS'),
      yAxisIndex: 0,
    },
    {
      name: `BBS MoM ${metricLabel} Growth`,
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
  return [
    {
      title: 'Revenue',
      icon: 'tabler-coin',
      momBarOptions: momRevenueChartConfig.options,
      yoyBarOptions: yoyRevenueChartConfig.options,
      momLineOptions: momRevenueLineChartConfig.options,
      yoyLineOptions: yoyRevenueLineChartConfig.options,
      momBarSeries: momRevenueChartConfig.series,
      yoyBarSeries: yoyRevenueChartConfig.series,
      momLineSeries: momRevenueLineChartConfig.series,
      yoyLineSeries: yoyRevenueLineChartConfig.series
    },
    {
      title: 'Volume',
      icon: 'tabler-chart-bar',
      momBarOptions: momVolumeChartConfig.options,
      yoyBarOptions: yoyVolumeChartConfig.options,
      momLineOptions: momVolumeLineChartConfig.options,
      yoyLineOptions: yoyVolumeLineChartConfig.options,
      momBarSeries: momVolumeChartConfig.series,
      yoyBarSeries: yoyVolumeChartConfig.series,
      momLineSeries: momVolumeLineChartConfig.series,
      yoyLineSeries: yoyVolumeLineChartConfig.series,
      },
      {
      title: 'Customers',
      icon: 'tabler-users',
      momBarOptions: momCustomerChartConfig.options,
      yoyBarOptions: yoyCustomerChartConfig.options,
      momLineOptions: momCustomerLineChartConfig.options,
      yoyLineOptions: yoyCustomerLineChartConfig.options,
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

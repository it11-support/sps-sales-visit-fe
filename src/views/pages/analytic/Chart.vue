<script lang="ts" setup>
import { useSalesSummaryStore } from '@/@core/stores/sales';
import { ISalesSummary } from '@/@core/typedefs';
import { useTheme } from 'vuetify';

const vuetifyTheme = useTheme()

const refVueApexChart = ref()
const yoyRefVueApexChart = ref()
const momRefVueApexChart  = ref()

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


const createChartConfig = (
  title: string,
  categories: string[],
  yaxis: any[],
  series: any[],
  type: 'bar' | 'line' | 'column' = 'line',
  stacked = false
) => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const labelColor = `rgba(${hexToRgb(currentTheme['on-surface'])},${variableTheme['disabled-opacity']})`

  return {
    chart: {
      type,
      stacked,
      height: 450,
    },
    plotOptions: {
    bar: {
      columnWidth: '90%', 
      barHeight: '100%'
    }
  },
    dataLabels: { enabled: false },
    stroke: {
      width: [1, 2, 2],
      curve: ['straight', 'monotoneCubic'],
    },
    title: {
      text: title,
      align: 'left',
      offsetX: 110,
      style: { color: currentTheme['on-background'] },
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: labelColor, fontSize: '0.8125rem' },
      },
    },
    yaxis,
    tooltip: {
      theme: 'dark',
      fixed: {
        enabled: true,
        position: 'topLeft',
        offsetY: 30,
        offsetX: 60,
      },
    },
    legend: {
      horizontalAlign: 'left',
      offsetX: 40,
      labels: { colors: '#ff5722' },
    },
    series,
  }
}

const buildMomChart = (
  metricLabel: "Revenue" | "Volume" | "Customer",
  fieldName: "revenue" | "volume" | "active_customers",
  spsMonths: string[]
) => {
  const currentTheme = vuetifyTheme.current.value.colors;
  const variableTheme = vuetifyTheme.current.value.variables;
  const labelColor = `rgba(${hexToRgb(currentTheme["on-surface"])},${variableTheme["disabled-opacity"]})`;

  const spsGrowth = getCompanyField("mom", "SPS", `mom_${fieldName}`).value as string[];
  const bbsGrowth = getCompanyField("mom", "BBS", `mom_${fieldName}`).value as string[];

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
      categories: spsMonths,
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
      data: spsGrowth,
      yAxisIndex: 0,
    },
    {
      name: `BBS MoM ${metricLabel} Growth`,
      type: "line",
      data: bbsGrowth,
      yAxisIndex: 0,
    },
  ];

  return { options, series };
};



const buildYoyChart = (
  metricLabel: "Revenue" | "Volume" | "Customer",
  fieldName:  "revenue" | "volume" | "active_customers",
  spsMonths: string[]
) =>  {
  
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const labelColor = `rgba(${hexToRgb(currentTheme['on-surface'])},${variableTheme['disabled-opacity']})`

  const spsData = getCompanyField("yoy", "SPS", fieldName).value as string[];
  const spsGrowth = getCompanyField("yoy", "SPS", `yoy_${fieldName}`).value as string[];
  const bbsData = getCompanyField("yoy", "BBS", fieldName).value as string[];
  const bbsGrowth = getCompanyField("yoy", "BBS", `yoy_${fieldName}`).value as string[];

  const options = {
    chart: {
      height: 450,
      type: "line",
      stacked: false,
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [1, 4, 1, 4],
      curve: ["straight", "monotoneCubic", "straight", "monotoneCubic"],
    },
    title: {
      text: `YoY ${metricLabel} Summary`,
      align: "left",
      offsetX: 110,
      style: { color: currentTheme["on-background"] },
    },
    xaxis: {
      categories: spsMonths,
      labels: {
        style: { colors: labelColor, fontSize: "0.8125rem" },
      },
    },
    yaxis: [
      {
        seriesName: metricLabel,
        axisTicks: { show: true },
        axisBorder: { show: true, color: "#008FFB" },
        labels: {
          style: { colors: "#008FFB" },
          formatter: numberFormatter,
        },
        title: { text: metricLabel, style: { color: "#008FFB" } },
      },
      {
        seriesName: `YoY ${metricLabel} Growth`,
        opposite: true,
        axisTicks: { show: true },
        axisBorder: { show: true, color: "#FEB019" },
        labels: {
          style: { colors: "#FEB019" },
          formatter: percentFormatter,
        },
        title: { text: `YoY ${metricLabel} Growth (%)`, style: { color: "#FEB019" } },
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
    },
    legend: {
      horizontalAlign: "left",
      offsetX: 40,
      labels: { colors: "#ff5722" },
    },
  };

  const series = [
    {
      name: `SPS ${metricLabel}`,
      type: "column",
      data: spsData,
      yAxisIndex: 0,
    },
    {
      name: `SPS YoY ${metricLabel} Growth`,
      type: "line",
      data: spsGrowth,
      yAxisIndex: 1,
    },
    {
      name: `BBS ${metricLabel}`,
      type: "column",
      data: bbsData,
      yAxisIndex: 0,
    },
    {
      name: `BBS YoY ${metricLabel} Growth`,
      type: "line",
      data: bbsGrowth,
      yAxisIndex: 1,
    },
  ];

  return { options, series };
}

const yoyRevenueChart = buildYoyChart("Revenue", "revenue", getCompanyField("yoy", "SPS", "month").value as string[] );
const yoyVolumeChart = buildYoyChart("Volume", "volume", getCompanyField("yoy", "SPS", "month").value as string[]);
const yoyCustomerChart = buildYoyChart("Customer", "active_customers", getCompanyField("yoy", "SPS", "month").value as string[]);

const momRevenueChart = buildMomChart("Revenue", "revenue", getCompanyField("mom", "SPS", "month").value as string[] );
const momVolumeChart = buildMomChart("Volume", "volume", getCompanyField("mom", "SPS", "month").value as string[]);
const momCustomerChart = buildMomChart("Customer", "active_customers", getCompanyField("mom", "SPS", "month").value as string[]);


const chartConfigs = computed(() => {

  return [
    {
      title: 'Revenue',
      icon: 'tabler-coin',
      chartOptions: createChartConfig(
        'MoM Revenue Summary',
        getCompanyField('mom', 'SPS', 'month').value as string[],
        [
        {
          seriesName: 'SPS Revenue',
          labels: { 
            formatter: numberFormatter, 
            style: {
              colors: '#008FFB',
            }, 
          },
          title: { text: 'SPS Revenue', style: { color: '#008FFB' } },
        },
        {
          seriesName: 'BBS Revenue',
          opposite: true,
          labels: { 
            formatter: numberFormatter, 
            style: {
              colors: '#00E396D9',
            }, 
          },
          title: { text: 'BBS Revenue', style: { color: '#00E396D9' } },
        },
      ],
       [
        { name: 'Revenue SPS', type: 'bar', data: getCompanyField('mom', 'SPS', 'revenue').value },
        { name: 'Revenue BBS', type: 'bar', data: getCompanyField('mom', 'BBS', 'revenue').value },
      ],
      'bar',
      true
      ),
      yoyChartOptions: yoyRevenueChart.options,
      momChartOptions: momRevenueChart.options,
      series: [
        {
          name: 'Revenue SPS',
          type: 'bar',
          data: getCompanyField('mom', 'SPS', 'revenue').value
        },
        {
          name: 'Revenue BBS',
          type: 'bar',
          data: getCompanyField('mom', 'BBS', 'revenue').value
        },        
      ],
      yoySeries: yoyRevenueChart.series,
      momSeries: momRevenueChart.series,
    },
    {
      title: 'Volume',
      icon: 'tabler-chart-bar',
      chartOptions: createChartConfig(
        'MoM Volume Summary',
        getCompanyField('mom', 'SPS', 'month').value as string[],
        [
        {
          seriesName: 'SPS Volume',
          labels: { 
            formatter: numberFormatter, 
            style: {
              colors: '#008FFB',
            }, 
          },
          title: { text: 'SPS Volume', style: { color: '#008FFB' } },
        },
        {
          seriesName: 'BBS Volume',
          opposite: true,
          labels: { 
            formatter: numberFormatter, 
            style: {
              colors: '#00E396D9',
            }, 
          },
          title: { text: 'BBS Volume', style: { color: '#00E396D9' } },
        },
      ],
       [
        { name: 'Volume SPS', type: 'bar', data: getCompanyField('mom', 'SPS', 'volume').value },
        { name: 'Volume BBS', type: 'bar', data: getCompanyField('mom', 'BBS', 'volume').value },
      ],
      'bar',
      true
      ),
      yoyChartOptions: yoyVolumeChart.options,
      momChartOptions: momVolumeChart.options,
      series: [
        {
          name: 'Volume SPS',
          type: 'bar',
          data: getCompanyField('mom', 'SPS', 'volume').value
        },
        {
          name: 'Volume BBS',
          type: 'bar',
          data: getCompanyField('mom', 'BBS', 'volume').value
        },        
      ],
      yoySeries: yoyVolumeChart.series,
      momSeries: momVolumeChart.series
      },
      {
      title: 'Customers',
      icon: 'tabler-users',
      chartOptions: createChartConfig(
        'MoM Customer Summary',
        getCompanyField('mom', 'SPS', 'month').value as string[],
        [
        {
          seriesName: 'SPS Customer',
          labels: { 
            formatter: numberFormatter, 
            style: {
              colors: '#008FFB',
            }, 
          },
          title: { text: 'SPS Customer', style: { color: '#008FFB' } },
        },
        {
          seriesName: 'BBS Customer',
          opposite: true,
          labels: { 
            formatter: numberFormatter, 
            style: {
              colors: '#00E396D9',
            }, 
          },
          title: { text: 'BBS Customer', style: { color: '#00E396D9' } },
        },
      ],
       [
        { name: 'Customer SPS', type: 'bar', data: getCompanyField('mom', 'SPS', 'active_customers').value },
        { name: 'Customer BBS', type: 'bar', data: getCompanyField('mom', 'BBS', 'active_customers').value },
      ],
      'bar',
      true
      ),
      yoyChartOptions: yoyCustomerChart.options,
      momChartOptions: momCustomerChart.options,
      series: [
        {
          name: 'Customer SPS',
          type: 'bar',
          data: getCompanyField('mom', 'SPS', 'active_customers').value
        },
        {
          name: 'Customer BBS',
          type: 'bar',
          data: getCompanyField('mom', 'BBS', 'active_customers').value
        },        
      ],
      yoySeries: yoyCustomerChart.series,
      momSeries: momCustomerChart.series
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
      <div class="chart-column">
       <VueApexCharts
        ref="refVueApexChart"
        :key="currentTab"
        :options="chartConfigs[Number(currentTab)].chartOptions"
        :series="chartConfigs[Number(currentTab)].series"
        height="400"
        width="800"
      />

      <VueApexCharts
        ref="momRefVueApexChart"
        :key="'mom-' + currentTab"
        :options="chartConfigs[Number(currentTab)].momChartOptions"
        :series="chartConfigs[Number(currentTab)].momSeries"
        height="400"
        width="800"
      />

      <VueApexCharts
        ref="yoyRefVueApexChart"
        :key="'yoy-' + currentTab"
        :options="chartConfigs[Number(currentTab)].yoyChartOptions"
        :series="chartConfigs[Number(currentTab)].yoySeries"
        height="400"
        width="800"
        class="mt-6"
      />
      </div>
    </div>
</template>

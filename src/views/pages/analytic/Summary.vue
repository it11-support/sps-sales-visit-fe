<script lang="ts" setup>
import { useSalesSummaryStore } from '@/@core/stores/sales';
import { ISalesSummary } from '@/@core/typedefs';
import { useTheme } from 'vuetify';
import { VSkeletonLoader } from 'vuetify/components';


const salesSummaryStore = useSalesSummaryStore()
const vuetifyTheme = useTheme()

onMounted(async () => {
  await salesSummaryStore.fetchSalesSummary()
})

const refVueApexChart = ref()
const yoyRefVueApexChart = ref()
const currentTab = ref<number>(0)

const labelMoM = computed(() => salesSummaryStore.summary.mom.map((item: Partial<ISalesSummary>) => item.month))
const activeCustomer = computed(() => salesSummaryStore.summary.mom.map((item: Partial<ISalesSummary>) => item.active_customers))
const volume = computed(() => salesSummaryStore.summary.mom.map((item: Partial<ISalesSummary>) => item.volume))
const revenue = computed(() => salesSummaryStore.summary.mom.map((item: Partial<ISalesSummary>) => item.revenue))
const momVolume = computed(() => salesSummaryStore.summary.mom.map((item: Partial<ISalesSummary>) => item.mom_volume))
const momRevenue = computed(() => salesSummaryStore.summary.mom.map((item: Partial<ISalesSummary>) => item.mom_revenue))
const momActiveCustomer = computed(() => salesSummaryStore.summary.mom.map((item: Partial<ISalesSummary>) => item.mom_active_customers))

const labelYoy = computed(() => salesSummaryStore.summary.yoy.map((item: Partial<ISalesSummary>) => item.month))
const yearlyActiveCustomer = computed(() => salesSummaryStore.summary.yoy.map((item: Partial<ISalesSummary>) => item.active_customers))
const yoyActiveCustomer = computed(() => salesSummaryStore.summary.yoy.map((item: Partial<ISalesSummary>) => item.yoy_active_customers))
const yearlyVolume = computed(() => salesSummaryStore.summary.yoy.map((item: Partial<ISalesSummary>) => item.volume))
const yoyVolume = computed(() => salesSummaryStore.summary.yoy.map((item: Partial<ISalesSummary>) => item.yoy_volume))
const yearlyRevenue = computed(() => salesSummaryStore.summary.yoy.map((item: Partial<ISalesSummary>) => item.revenue))
const yoyRevenue = computed(() => salesSummaryStore.summary.yoy.map((item: Partial<ISalesSummary>) => item.yoy_revenue))

const chartConfigs = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const labelColor = `rgba(${hexToRgb(currentTheme['on-surface'])},${variableTheme['disabled-opacity']})`

  return [
    {
      title: 'Revenue',
      icon: 'tabler-coin',
      chartOptions: {
        chart: {
          height: 450,
          type: 'line',
          stacked: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          width: [1, 4, 4],
          curve: ['straight','monotoneCubic']
        },
        title: {
          text: 'Monthly Revenue Summary',
          align: 'left',
          offsetX: 110,
          style: {
            color: currentTheme['on-background']
          }
      },
      xaxis: {
        categories: labelMoM.value,
        labels: {
          style: {
            colors: labelColor,
            fontSize: '0.8125rem'
          }
        }
      },
      yaxis: [
        {
          seriesName: 'Revenue',
          axisTicks: {
            show: true,
          },
          axisBorder: {
            show: true,
            color: '#008FFB'
          },
          labels: {
            style: {
              colors: '#008FFB',
            },
            formatter(val: number) {
              return (val / 1_000_000_000).toFixed(2) + ' B';
            },
          },
          title: {
            text: "Revenue",
            style: {
              color: '#008FFB',
            }
          },
          tooltip: {
            enabled: true,
            theme: 'dark'
          }
        },          
        {
          seriesName: 'MoM Revenue',
          opposite: true,
          axisTicks: {
            show: true,
          },
          axisBorder: {
            show: true,
            color: '#FEB019'
          },
          labels: {
            style: {
              colors: '#FEB019',
            },
            formatter(val: number) {
              return val ? (val).toFixed(2) + ' %'  : '-';
            },
          },
          title: {
            text: "MoM Revenue Growth (%)",
            style: {
              color: '#FEB019',
            }
          }
        },        
      ],
      tooltip: {
        fixed: {
          enabled: true,
          position: 'topLeft',
          offsetY: 30,
          offsetX: 60,
           style: {
            color: currentTheme['on-background']
          }
        },
        theme: 'dark'
      },
      legend: {
          horizontalAlign: 'left',
          offsetX: 40,
          labels: {
            colors: '#ff5722',
          }
        }
      },
      yoyChartOptions: {
        chart: {
          height: 450,
          type: 'line',
          stacked: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          width: [1, 4, 4],
          curve: ['straight','monotoneCubic']
        },
        title: {
          text: 'YoY Revenue Summary',
          align: 'left',
          offsetX: 110,
          style: {
            color: currentTheme['on-background']
          }
        },
        xaxis: {
          categories: labelYoy.value,
          labels: {
            style: {
              colors: labelColor,
              fontSize: '0.8125rem'
            }
          }
        },
        yaxis: [
          {
            seriesName: 'Revenue',
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#008FFB'
            },
            labels: {
              style: {
                colors: '#008FFB',
              },
              formatter(val: number) {
                const bil = (val / 1_000_000_000).toFixed(2);
                const mil = (val / 1_000_000).toFixed(2);
                const thn = (val / 1_000).toFixed(2);
                if (val >= 1_000_000_000) return `${bil} B`;
                if (val >= 1_000_000) return `${mil} M`;
                if (val >= 1_000) return `${thn} K`;
                return val;
              }
            },
            title: {
              text: "Revenue",
              style: {
                color: '#008FFB',
              }
            },
            tooltip: {
              enabled: true,
              theme: 'dark'
            }
          },          
          {
            seriesName: 'MoM Revenue',
            opposite: true,
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#FEB019'
            },
            labels: {
              style: {
                colors: '#FEB019',
              },
              formatter(val: number) {
                return val ? (val).toFixed(2) + ' %'  : '-';
              },
            },
            title: {
              text: "YoY Revenue Growth (%)",
              style: {
                color: '#FEB019',
              }
            }
          },        
        ],
        tooltip: {
          fixed: {
            enabled: true,
            position: 'topLeft',
            offsetY: 30,
            offsetX: 60
          },
          theme: 'dark'
        },
        legend: {
            horizontalAlign: 'left',
            offsetX: 40,
            labels: {
              colors: '#ff5722',
            }
          }
      },
      series: [{
          name: 'Revenue',
          type: 'column',
          data: revenue.value
        }, {
          name: 'MoM Revenue',
          type: 'line',
          data: momRevenue.value
      },
      ],
      yoySeries: [{
        name: 'Revenue',
          type: 'column',
          data: yearlyRevenue.value
        }, {
          name: 'YoY Revenue',
          type: 'line',
          data: yoyRevenue.value
      },
      ]
    },
    {
      title: 'Volume (Kg)',
      icon: 'tabler-chart-bar',
       chartOptions: {
        chart: {
          height: 450,
          type: 'line',
          stacked: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          width: [1, 4, 4],
          curve: ['straight','monotoneCubic']

        },
        title: {
          text: 'Monthly Volume Summary',
          align: 'left',
          offsetX: 110,
          style: {
            color: currentTheme['on-background']
          }
        },
        xaxis: {
          categories: labelMoM.value,
          labels: {
          style: {
            colors: labelColor,
            fontSize: '0.8125rem'
          }
        }
        },
        yaxis: [
          {
            seriesName: 'Volume',
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#008FFB'
            },
            labels: {
              style: {
                colors: '#008FFB',
              },
              formatter(val: number) {
                return (val / 1_000).toFixed(2) + ' T';
              },
            },
            title: {
              text: "Volume (T)",
              style: {
                color: '#008FFB',
              }
            },
            tooltip: {
              enabled: true,
              theme: 'dark'
            }
          },          
          {
            seriesName: 'MoM Volume',
            opposite: true,
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#FEB019'
            },
            labels: {
              style: {
                colors: '#FEB019',
              },
              formatter(val: number) {
                return val ? (val).toFixed(2) + ' %'  : '-';
              },
            },
            title: {
              text: "MoM Volume Growth (%)",
              style: {
                color: '#FEB019',
              }
            }
          },
        ],
        tooltip: {
          fixed: {
            enabled: true,
            position: 'topLeft',
            offsetY: 30,
            offsetX: 60
          },
           theme: 'dark'
        },
        legend: {
            horizontalAlign: 'left',
            offsetX: 40,
            labels: {
              colors: '#ff5722',
            }
          }
      },
      yoyChartOptions: {
        chart: {
          height: 450,
          type: 'line',
          stacked: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          width: [1, 4, 4],
          curve: ['straight','monotoneCubic']
        },
        title: {
          text: 'YoY Volume Summary',
          align: 'left',
          offsetX: 110,
          style: {
            color: currentTheme['on-background']
          }
        },
        xaxis: {
          categories: labelYoy.value,
          labels: {
            style: {
              colors: labelColor,
              fontSize: '0.8125rem'
            }
          }
        },
        yaxis: [
          {
            seriesName: 'Active Customer',
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#008FFB'
            },
            labels: {
              style: {
                colors: '#008FFB',
              },
              formatter(val: number) {
                return (val / 1_000).toFixed(2) + ' T';
              },
            },
            title: {
              text: "Volume",
              style: {
                color: '#008FFB',
              }
            },
            tooltip: {
              enabled: true,
              theme: 'dark'
            }
          },          
          {
            seriesName: 'MoM Active Customer',
            opposite: true,
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#FEB019'
            },
            labels: {
              style: {
                colors: '#FEB019',
              },
              formatter(val: number) {
                return val ? (val).toFixed(2) + ' %'  : '-';
              },
            },
            title: {
              text: "YoY Volume Growth (%)",
              style: {
                color: '#FEB019',
              }
            }
          },        
        ],
        tooltip: {
          fixed: {
            enabled: true,
            position: 'topLeft',
            offsetY: 30,
            offsetX: 60
          },
          theme: 'dark'
        },
        legend: {
            horizontalAlign: 'left',
            offsetX: 40,
            labels: {
              colors: '#ff5722',
            }
          }
      },
      series: [{
          name: 'Volume',
          type: 'column',
          data: volume.value
        }, {
          name: 'MoM Volume',
          type: 'line',
          data: momVolume.value
      }],
       yoySeries: [{
        name: 'Volume ',
          type: 'column',
          data: yearlyVolume.value
        }, {
          name: 'YoY Volume ',
          type: 'line',
          data: yoyVolume.value
      },
      ]
    },
    {
      title: 'Customer',
      icon: 'tabler-users',
      chartOptions: {
        chart: {
          height: 450,
          type: 'line',
          stacked: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          width: [1, 4, 4],
          curve: ['straight','monotoneCubic']

        },
        title: {
          text: 'Monthly Active Customer Summary',
          align: 'left',
          offsetX: 110,
          style: {
            color: currentTheme['on-background']
          }
        },
        xaxis: {
          categories: labelMoM.value,
          labels: {
          style: {
            colors: labelColor,
            fontSize: '0.8125rem'
          }
        }
        },
        yaxis: [
          {
            seriesName: 'Customer',
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#008FFB'
            },
            labels: {
              style: {
                colors: '#008FFB',
              },
            },
            title: {
              text: "Active Customer",
              style: {
                color: '#008FFB',
              }
            },
            tooltip: {
              enabled: true,
              theme: 'dark'
            }
          },          
          {
            seriesName: 'MoM Active Customer',
            opposite: true,
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#FEB019'
            },
            labels: {
              style: {
                colors: '#FEB019',
              },
              formatter(val: number) {
                return val ? (val).toFixed(2) + ' %'  : '-';
              },
            },
            title: {
              text: "MoM Active Customer Growth (%)",
              style: {
                color: '#FEB019',
              }
            }
          },
        ],
        tooltip: {
          fixed: {
            enabled: true,
            position: 'topLeft',
            offsetY: 30,
            offsetX: 60
          },
          theme: 'dark'
        },
        legend: {
            horizontalAlign: 'left',
            offsetX: 40,
            labels: {
              colors: '#ff5722',
            }
          }
      },
      yoyChartOptions: {
        chart: {
          height: 450,
          type: 'line',
          stacked: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          width: [1, 4, 4],
          curve: ['straight','monotoneCubic']
        },
        title: {
          text: 'YoY Active Customer Summary',
          align: 'left',
          offsetX: 110,
          style: {
            color: currentTheme['on-background']
          }
        },
        xaxis: {
          categories: labelYoy.value,
          labels: {
            style: {
              colors: labelColor,
              fontSize: '0.8125rem'
            }
          }
        },
        yaxis: [
          {
            seriesName: 'Customer',
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#008FFB'
            },
            labels: {
              style: {
                colors: '#008FFB',
              }
            },
            title: {
              text: "Active Customer",
              style: {
                color: '#008FFB',
              }
            },
            tooltip: {
              enabled: true,
              theme: 'dark'
            }
          },          
          {
            seriesName: 'MoM Active Customer',
            opposite: true,
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
              color: '#FEB019'
            },
            labels: {
              style: {
                colors: '#FEB019',
              },
              formatter(val: number) {
                return val ? (val).toFixed(2) + ' %'  : '-';
              },
            },
            title: {
              text: "YoY Active Customer Growth (%)",
              style: {
                color: '#FEB019',
              }
            }
          },        
        ],
        tooltip: {
          fixed: {
            enabled: true,
            position: 'topLeft',
            offsetY: 30,
            offsetX: 60
          },
          theme: 'dark'
        },
        legend: {
            horizontalAlign: 'left',
            offsetX: 40,
            labels: {
              colors: '#ff5722',
            }
          }
      },
      series: [{
          name: 'Active Customer',
          type: 'column',
          data: activeCustomer.value
        }, {
          name: 'MoM Active Customer',
          type: 'line',
          data: momActiveCustomer.value
      }],
      yoySeries: [{
        name: 'Active Customer ',
          type: 'column',
          data: yearlyActiveCustomer.value
        }, {
          name: 'YoY Active Customer ',
          type: 'line',
          data: yoyActiveCustomer.value
      }]
    }
  ]
})

</script>

<template>
  <VSkeletonLoader
    type="article"
    v-if="salesSummaryStore.loading">
  </VSkeletonLoader>
  <template v-else>
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
          ref="yoyRefVueApexChart"
          :key="'yoy-' + currentTab"
          :options="chartConfigs[Number(currentTab)].yoyChartOptions"
          :series="chartConfigs[Number(currentTab)].yoySeries"
          height="400"
          width="600"
          class="mt-6"
        />
      </div>
    </div>
  </template>
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

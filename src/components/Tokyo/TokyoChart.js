import _ from "lodash";
import c3 from "c3";
import { generateTokyoChartData } from "./TokyoChartData.js";
import { COLOR_CONFIRMED } from "../../data/constants";

export const renderWholeTokyoChart = (elementSelector, tokyoCounts) => {
  let unifiedChartContainer = document.querySelector(elementSelector);
  let chartData = generateTokyoChartData(tokyoCounts);

  // Only plot first 20.
  chartData = _.mapValues(chartData, (v) => {
    return _.slice(v, 0, 20);
  });

  const xDataset = "CityNamesEn";

  let chart = c3.generate({
    bindto: unifiedChartContainer,
    padding: { top: 5, bottom: 50, left: 100, right: 30 },
    transition: { duration: 0 },
    tooltip: { show: false },
    legend: { show: false },
    point: { show: false },
    data: {
      x: xDataset,
      type: "bar",
      columns: [chartData.cityNamesEn, chartData.confirmed],
      colors: {
        Confirmed: COLOR_CONFIRMED,
      },
    },
    axis: {
      rotated: true,
      x: {
        type: "category",
        categories: [xDataset],
        padding: { left: 0, right: 0 },
      },
      y: {
        min: 0,
        padding: { top: 0, bottom: 0 },
      },
    },
    grid: {
      y: {
        show: true,
      },
    },
  });
  return chart;
};

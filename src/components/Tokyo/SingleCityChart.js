import _ from "lodash";
import c3 from "c3";

const generateChartData = (counts, prefectureName) => {
  let xAxisData = ["x"];
  let countData = [prefectureName];
  _.forEach(counts, (v) => {
    xAxisData.push(v.date);
  });
  _.forEach(counts, (v) => {
    countData.push(v.count);
  });
  return [xAxisData, countData];
};

export const renderCityChart = (name, counts, parentElement) => {
  let chartElement = document.createElement("div");
  chartElement.classList.add("city-chart", "chart");
  parentElement.appendChild(chartElement);

  const chartData = generateChartData(counts, name);

  // Roughly determine ticks.
  const yValues = _.slice(_.last(chartData), 1);
  let yMax = _.max(yValues);
  let yTicks = [500, 1000];
  if (yMax < 5) {
    yTicks = [3, 5];
    yMax = 5;
  } else if (yMax < 10) {
    yTicks = [5, 10];
    yMax = 10;
  } else if (yMax < 50) {
    yTicks = [25, 50];
    yMax = 50;
  } else if (yMax < 100) {
    yTicks = [50, 100];
    yMax = 100;
  } else if (yMax < 500) {
    yTicks = [250, 500];
    yMax = 500;
  }

  let chart = c3.generate({
    bindto: chartElement,
    padding: { top: 5, bottom: 0, left: 30, right: 30 },
    transition: { duration: 0 },
    tooltip: { show: false },
    legend: { show: true },
    point: { show: false },
    data: {
      type: "line",
      x: "x",
      columns: chartData,
    },
    axis: {
      x: {
        type: "timeseries",
        tick: { format: "%m/%d", count: 3 },
        padding: { left: 0, right: 0 },
      },
      y: {
        min: 0,
        max: yMax,
        tick: { values: yTicks },
        padding: { top: 0, bottom: 0 },
      },
    },
  });
};

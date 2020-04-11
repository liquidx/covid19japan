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

const renderCityChart = (name, counts, parentElement) => {
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

const renderWardCityCharts = (tokyoCounts) => {
  let chartsContainer = document.querySelector("#charts");
  for (let city of tokyoCounts) {
    let name = city.name;
    if (name == "") {
      continue;
    }

    // Ignore 0-sized areas.
    if (_.sum(_.map(city.values, (v) => v.count)) == 0) {
      continue;
    }

    renderCityChart(
      `${city.name_ja} (${city.name})`,
      city.values,
      chartsContainer
    );
  }
};

const generateUnifiedChartData = (tokyoCounts) => {
  let cityAxis = ["City"];
  let latestCount = ["Count"];
  let longCityNames = ["CityNames"];
  let deltas = ["Delta"];

  const exclusionFilter = (v) => {
    return v.name != "" && v.name != "Unknown" && v.values.length > 0;
  };

  let sortedTokyoCounts = _.reverse(
    _.sortBy(_.filter(tokyoCounts, exclusionFilter), (v) => {
      return _.last(v.values).count;
    })
  );

  _.forEach(sortedTokyoCounts, (v) => {
    cityAxis.push(v.name_ja);
  });

  _.forEach(sortedTokyoCounts, (v) => {
    longCityNames.push(`${v.name_ja} (${v.name})`);
  });

  _.forEach(sortedTokyoCounts, (v) => {
    latestCount.push(_.last(v.values).count);
  });

  _.forEach(sortedTokyoCounts, (v) => {
    let lastTwo = _.slice(v.values, -2);
    console.log(lastTwo);
    if (lastTwo) {
      deltas.push(lastTwo[1].count - lastTwo[0].count);
    } else {
      deltas.push(0);
    }
  });

  return [cityAxis, latestCount, longCityNames, deltas];
};

const renderUnifiedChart = (tokyoCounts) => {
  let unifiedChartContainer = document.querySelector("#unified-chart");
  let chartData = generateUnifiedChartData(tokyoCounts);

  // Only plot first 20.
  chartData = _.map(chartData, (v) => {
    return _.slice(v, 0, 20);
  });

  let chart = c3.generate({
    bindto: unifiedChartContainer,
    padding: { top: 5, bottom: 50, left: 30, right: 30 },
    transition: { duration: 0 },
    tooltip: { show: false },
    legend: { show: false },
    point: { show: false },
    data: {
      type: "bar",
      columns: [chartData[1]],
    },
    axis: {
      x: {
        type: "category",
        categories: _.slice(chartData[0], 1),
        padding: { left: 0, right: 0 },
      },
      y: {
        min: 0,
        padding: { top: 0, bottom: 0 },
      },
    },
  });
};

const renderWardTable = (tokyoCounts) => {
  let tableBody = document.querySelector("table#count-table tbody");
  let dataSets = generateUnifiedChartData(tokyoCounts);

  for (let i = 1; i < dataSets[0].length; i++) {
    let row = document.createElement("tr");

    let prefectureCell = document.createElement("td");
    prefectureCell.innerHTML = dataSets[2][i];
    row.appendChild(prefectureCell);

    let countCell = document.createElement("td");
    countCell.innerHTML = dataSets[1][i];
    row.appendChild(countCell);

    let deltaCell = document.createElement("td");
    deltaCell.innerHTML = `+${dataSets[3][i]}`;
    row.appendChild(deltaCell);

    tableBody.appendChild(row);
  }
};

const main = () => {
  fetch("https://data.covid19japan.com/tokyo/counts.json")
    .then((response) => response.json())
    .then((tokyoCounts) => {
      console.log(tokyoCounts);
      renderUnifiedChart(tokyoCounts);
      renderWardCityCharts(tokyoCounts);
      renderWardTable(tokyoCounts);
    });
};

window.onload = main;

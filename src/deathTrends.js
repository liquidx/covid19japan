import _ from "lodash";
import c3 from "c3";

import {
  COLOR_DECEASED,
  COLOR_ACTIVE,
  COLOR_TESTED,
  COLOR_CONFIRMED,
} from "./data/constants.js";
import rangesliderJs from "rangeslider-js";

const generateDeathDataset = (patients) => {
  let deathsByDay = {};
  for (let patient of patients) {
    let dateAnnounced = patient.dateAnnounced;
    if (!patient.dateAnnounced) {
      continue;
    }

    if (!deathsByDay[dateAnnounced]) {
      deathsByDay[dateAnnounced] = {
        patients: [],
        deaths: 0,
        deathsAgeUnknown: 0,
        deathsOver60: 0,
        deathsUnder60: 0,
      };
    }

    if (patient.patientStatus == "Deceased") {
      deathsByDay[dateAnnounced].deaths += 1;
      deathsByDay[dateAnnounced].patients.push(patient);
      if (patient.ageBracket == -1) {
        deathsByDay[dateAnnounced].deathsAgeUnknown += 1;
      } else {
        if (patient.ageBracket >= 60) {
          deathsByDay[dateAnnounced].deathsOver60 += 1;
        } else {
          deathsByDay[dateAnnounced].deathsUnder60 += 1;
        }
      }
    }
  }

  return _.sortBy(
    _.map(_.toPairs(deathsByDay), (v) => {
      return {
        date: v[0],
        patients: v[1].patients,
        deaths: v[1].deaths,
        deathsAgeUnknown: v[1].deathsAgeUnknown,
        deathsUnder60: v[1].deathsUnder60,
        deathsOver60: v[1].deathsOver60,
      };
    }),
    ["date"]
  );
};

const movingAverage = (values, period) => {
  let averages = [];
  _.forEach(values, (v, i) => {
    let extent = _.slice(values, Math.max(0, i - period), i + 1);
    averages.push(_.sum(extent) / extent.length);
  });
  return averages;
};

const generateChartData = (deaths) => {
  let xAxisData = ["date"];
  let deathsData = ["allDeaths"];
  let deathsAgeUnknownData = ["deathsAgeUnknown"];
  let deathsOver60Data = ["deathsOver60"];
  let deathsUnder60Data = ["deathsUnder60"];
  _.forEach(deaths, (v) => {
    xAxisData.push(v.date);
  });
  _.forEach(movingAverage(_.map(deaths, "deaths"), 7), (v) => {
    deathsData.push(v);
  });
  _.forEach(deaths, (v) => {
    deathsOver60Data.push(v.deathsOver60);
  });
  _.forEach(deaths, (v) => {
    deathsUnder60Data.push(v.deathsUnder60);
  });
  _.forEach(deaths, (v) => {
    deathsAgeUnknownData.push(v.deathsAgeUnknown);
  });
  return [
    xAxisData,
    deathsData,
    deathsAgeUnknownData,
    deathsUnder60Data,
    deathsOver60Data,
  ];
};

let _deathsChart = null;
const renderDeaths = (deaths) => {
  let deathsChartData = generateChartData(_.slice(deaths, 40, -2));
  let chartElement = document.querySelector("#death-trend .chart");
  _deathsChart = c3.generate({
    bindto: chartElement,
    padding: { top: 20, bottom: 20, left: 60, right: 0 },
    transition: { duration: 0 },
    tooltip: { show: false },
    legend: { show: true },
    point: { show: false },
    x: "date",
    data: {
      x: "date",
      columns: deathsChartData,
      groups: [["deathsAgeUnknown", "deathsUnder60", "deathsOver60"]],
      colors: {
        allDeaths: COLOR_DECEASED,
        deathsAgeUnknown: "rgb(220, 200, 200)",
        deathsUnder60: "rgb(220, 160, 160)",
        deathsOver60: "rgb(220, 120, 120)",
      },
      type: "bar",
      types: {
        allDeaths: "spline",
      },
    },
    bar: {
      width: { ratio: 0.8 },
    },
    axis: {
      x: {
        type: "timeseries",
        tick: { format: "%m/%d" },
      },
    },
  });
};

let _casesAndDeathsChart = null;
let _summaryData = null;
let _deathsDateOffset = 12;
let _deathsScaleFactor = 25;

const renderCasesAndDeaths = (summary, deathsOffsetDays, deathsScaleFactor) => {
  const period = 60;
  console.log(deathsScaleFactor);
  let dateDataset = _.map(summary.daily, "date");
  let confirmedDataset = _.map(summary.daily, "confirmed");
  let deathsDataset = _.map(summary.daily, (o) => {
    return -1 * o.deceased * deathsScaleFactor;
  });

  dateDataset = _.slice(
    dateDataset,
    summary.daily.length - period,
    summary.daily.length - 1
  );
  confirmedDataset = _.slice(
    confirmedDataset,
    summary.daily.length - period,
    summary.daily.length - 1
  );
  deathsDataset = _.slice(
    deathsDataset,
    summary.daily.length - period,
    summary.daily.length - 1
  );

  let confirmedAvgDataset = movingAverage(confirmedDataset, 7);
  let deathsAvgDataset = movingAverage(deathsDataset, 7);

  // Apply date offset
  deathsAvgDataset = _.slice(
    _.map(deathsAvgDataset, (o) => {
      return o * -1;
    }),
    deathsOffsetDays
  );
  deathsDataset = _.slice(deathsDataset, deathsOffsetDays);

  dateDataset = _.concat(["date"], dateDataset);
  confirmedDataset = _.concat(["confirmed"], confirmedDataset);
  deathsDataset = _.concat(["deaths"], deathsDataset);
  confirmedAvgDataset = _.concat(["confirmedAvg"], confirmedAvgDataset);
  deathsAvgDataset = _.concat(["deathsAvg"], deathsAvgDataset);

  let chartElement = document.querySelector(
    "#death-trend .cases-and-deaths-chart"
  );
  if (_casesAndDeathsChart) {
    _casesAndDeathsChart.destroy();
  }
  _casesAndDeathsChart = c3.generate({
    bindto: chartElement,
    padding: { top: 20, bottom: 20, left: 60, right: 0 },
    transition: { duration: 0 },
    tooltip: { show: false },
    legend: { show: true },
    point: { show: false },
    x: "date",
    data: {
      x: "date",
      columns: [
        dateDataset,
        confirmedDataset,
        deathsDataset,
        confirmedAvgDataset,
        deathsAvgDataset,
      ],
      colors: {
        confirmed: COLOR_CONFIRMED,
        deaths: COLOR_TESTED,
        confirmedAvg: COLOR_ACTIVE,
        deathsAvg: COLOR_DECEASED,
      },
      type: "bar",
      types: {
        confirmedAvg: "spline",
        deathsAvg: "spline",
      },
    },
    bar: {
      width: { ratio: 0.8 },
    },
    axis: {
      x: {
        type: "timeseries",
        tick: { format: "%m/%d" },
      },
      y: {
        tick: {
          format: (y) => {
            if (y < 0) {
              let realDeaths = parseInt((-1 * y) / deathsScaleFactor);
              return `Deaths ${realDeaths}`;
            }
            return y;
          },
        },
      },
    },
  });
};

const updateWithSliderValues = (dateOffset, scaleFactor) => {
  renderCasesAndDeaths(_summaryData, dateOffset, scaleFactor);
};

const main = () => {
  fetch("http://localhost:3999/patient_data/latest.json")
    .then((response) => response.json())
    .then((patients) => {
      let deathDataset = generateDeathDataset(patients);
      renderDeaths(deathDataset);
    });

  fetch("http://localhost:3999/summary/latest.json")
    .then((response) => response.json())
    .then((summary) => {
      _summaryData = summary;
      updateWithSliderValues(_deathsDateOffset, _deathsScaleFactor);
    });

  rangesliderJs.create(document.querySelector("#date-slider"), {
    min: 0,
    max: 30,
    value: _deathsDateOffset,
    step: 1,
    onSlide: (value, percent, position) => {
      document.querySelector("#date-offset").innerText = value;
      _deathsDateOffset = parseInt(value);
      updateWithSliderValues(_deathsDateOffset, _deathsScaleFactor);
    },
  });

  rangesliderJs.create(document.querySelector("#scale-slider"), {
    min: 1,
    max: 50,
    value: _deathsScaleFactor,
    step: 1,
    onSlide: (value, percent, position) => {
      document.querySelector("#scale-factor").innerText = value;
      _deathsScaleFactor = parseInt(value);
      updateWithSliderValues(_deathsDateOffset, _deathsScaleFactor);
    },
  });

  let rangeSliderFill = document.querySelector(".rangeslider__fill");
  rangeSliderFill.style.background =
    "linear-gradient(90deg, rgba(253,174,97,1) 0%, rgba(158,1,66,1) 100%)";
};

window.onload = main;

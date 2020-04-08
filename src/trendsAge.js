import c3 from "c3";
import d3 from "d3";
import _ from "lodash";
import rangesliderJs from "rangeslider-js";
import {
  parse as dateParse,
  format as dateFormat,
  addDays as dateAddDays,
} from "date-fns";

let _ageDateSelection = "2020-03-01";
let _ageLineColor = "rgba(0, 0, 0, 0.05)";
let _ageLineFocusColor = "rgba(200, 0, 0, 1)";
let _ageBreakdowns = {};
let _ageTrendChart = null;
let _ageTrendAnimationPlayTimer = null;

export const renderAgeTrends = (ageBreakdowns) => {
  let chartElement = document.querySelector("#age-trend .chart");
  _ageBreakdowns = _.slice(ageBreakdowns, 30); // ignore the first 30 days.
  let ageData = _.map(_ageBreakdowns, (v) => {
    return _.concat([v.date], v.ageAccumulatorFractions);
  });

  console.log(_ageBreakdowns);

  _ageDateSelection = ageData[0][0];
  let lineColors = _.fromPairs(
    _.map(_ageBreakdowns, (v) => {
      if (v.date == _ageDateSelection) {
        return [v.date, _ageLineFocusColor];
      }
      return [v.date, _ageLineColor];
    })
  );

  _ageTrendChart = c3.generate({
    bindto: chartElement,
    padding: { top: 20, bottom: 20, left: 60, right: 0 },
    transition: { duration: 0 },
    data: {
      type: "spline",
      columns: ageData,
      colors: lineColors,
      selection: true,
    },
    axis: {
      y: {
        min: 0,
        max: 0.4,
        label: {
          text: "Cases %",
          position: "outer-middle",
        },
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        tick: {
          count: 5,
          format: (d) => {
            return parseInt(d * 100) + "%";
          },
        },
      },
      x: {
        label: {
          text: "Age",
          position: "outer-center",
        },
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        tick: {
          format: (d) => {
            return d * 10;
          },
        },
      },
    },
    tooltip: { show: false },
    legend: { show: false },
    point: { show: false },
  });

  rangesliderJs.create(document.querySelector("#age-date-slider"), {
    min: 0,
    max: _ageBreakdowns.length - 1,
    value: _.keys(_ageBreakdowns).indexOf(_ageDateSelection),
    step: 1,
    onSlide: (value, percent, position) => {
      updateAgeChartSelection(value);
    },
  });

  let startStop = document.querySelectorAll("#age-trend-start-stop");
  _.forEach(startStop, (v) => {
    return v.addEventListener("click", toggleAnimation);
  });
  document.querySelector(
    "#age-trend-chart-date-label"
  ).innerHTML = _ageDateSelection;
  updateAgeChartSelection(0);
};

export const updateAgeChartSelection = (value) => {
  _ageDateSelection = _ageBreakdowns[value].date;
  let colors = _.fromPairs(
    _.map(_ageBreakdowns, (v) => {
      if (v.date == _ageDateSelection) {
        return [v.date, _ageLineFocusColor];
      }
      return [v.date, _ageLineColor];
    })
  );
  _ageTrendChart.data.colors(colors);
  _ageTrendChart.focus([_ageDateSelection]);

  document.querySelector(
    "#age-trend-chart-date-label"
  ).innerHTML = _ageDateSelection;
};

const toggleAnimation = (e) => {
  console.log(e);
  if (!_ageTrendAnimationPlayTimer) {
    // Start at the beginning
    let slider = document.querySelector("#age-date-slider");
    slider["rangeslider-js"].update({ value: 0 });
    updateAgeChartSelection(0);

    _ageTrendAnimationPlayTimer = setInterval(() => {
      let slider = document.querySelector("#age-date-slider");
      let newValue = Math.min(parseInt(slider.value) + 1, parseInt(slider.max));
      slider["rangeslider-js"].update({ value: newValue });
      updateAgeChartSelection(newValue);
      if (newValue >= slider.max) {
        clearTimeout(_ageTrendAnimationPlayTimer);
        _ageTrendAnimationPlayTimer = null;
      }
    }, 330);
  } else {
    console.log("stop");
    clearTimeout(_ageTrendAnimationPlayTimer);
    _ageTrendAnimationPlayTimer = null;
  }
};

export const keyboardEventForRangeSlider = (e) => {
  e = e || window.event;

  let slider = document.querySelector("#age-date-slider");
  if (!slider) {
    return;
  }

  if (e.keyCode == "37") {
    // left arrow
    let newValue = Math.max(parseInt(slider.value) - 1, parseInt(slider.min));
    slider["rangeslider-js"].update({ value: newValue });
    updateAgeChartSelection(newValue);
  } else if (e.keyCode == "39") {
    // right arrow
    let newValue = Math.min(parseInt(slider.value) + 1, parseInt(slider.max));
    slider["rangeslider-js"].update({ value: newValue });
    updateAgeChartSelection(newValue);
  } else if (e.keyCode == "32") {
    toggleAnimation();
  }
};

import c3 from "c3";
import { interpolateRgb } from "d3-interpolate";
import { color as d3color } from "d3-color";
import _ from "lodash";
import rangesliderJs from "rangeslider-js";
import {
  parse as dateParse,
  format as dateFormat,
  addDays as dateAddDays,
} from "date-fns";

let _ageDateSelection = "2020-03-01";
let _ageBreakdowns = {};
let _ageTrendChart = null;
let _ageTrendAnimationPlayTimer = null;
let _ageLineColors = {};

let _agePastColor = "#fdae61";
let _ageRecentColor = "#9e0142";

export const renderAgeTrends = (ageBreakdowns) => {
  let chartElement = document.querySelector("#age-trend .chart");
  _ageBreakdowns = _.slice(ageBreakdowns, 30); // ignore the first 30 days.
  let ageData = _.map(_ageBreakdowns, (v) => {
    return _.concat([v.date], v.ageAccumulatorFractions);
  });

  console.log(_ageBreakdowns);

  _ageDateSelection = ageData[0][0];
  let lineColorPairs = [];
  let colorInterpolator = interpolateRgb(_agePastColor, _ageRecentColor);
  for (let i = 0; i < ageData.length; i++) {
    let color = d3color(colorInterpolator(i / ageData.length));
    color.opacity = 0.2;
    lineColorPairs.push([ageData[i][0], color.formatRgb()]);
  }
  _ageLineColors = _.fromPairs(lineColorPairs);
  console.log(_ageLineColors);

  _ageTrendChart = c3.generate({
    bindto: chartElement,
    padding: { top: 20, bottom: 20, left: 60, right: 0 },
    transition: { duration: 0 },
    data: {
      type: "spline",
      columns: ageData,
      colors: _.clone(_ageLineColors),
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

  let rangeSliderFill = document.querySelector(".rangeslider__fill");
  rangeSliderFill.style.background =
    "linear-gradient(90deg, rgba(253,174,97,1) 0%, rgba(158,1,66,1) 100%)";

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

  let highlightColor = d3color(_ageLineColors[_ageDateSelection]);
  highlightColor.opacity = 1.0;

  let colors = _.clone(_ageLineColors);
  colors[_ageDateSelection] = highlightColor.formatRgb();

  console.log(_ageLineColors);

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
    }, 200);
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

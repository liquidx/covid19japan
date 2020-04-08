import c3 from "c3";
import d3 from "d3";
import _ from "lodash";
import rangesliderJs from "rangeslider-js";
import {
  parse as dateParse,
  format as dateFormat,
  addDays as dateAddDays,
} from "date-fns";

const renderPatientRow = (patient) => {
  let row = document.createElement("tr");
};

const patientsByDate = (patients) => {
  let dailySummary = {};
  for (let patient of patients) {
    let dateAnnounced = patient.dateAnnounced;
    if (!patient.dateAnnounced) {
      continue;
    }
    if (!dailySummary[dateAnnounced]) {
      dailySummary[dateAnnounced] = {
        patients: [],
        confirmed: 0,
      };
    }

    if (patient.confirmedPatient) {
      dailySummary[dateAnnounced].confirmed += 1;
      dailySummary[dateAnnounced].patients.push(patient);
    }
  }
  return dailySummary;
};

const AGE_BUCKETS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

const calculateAgeTrends = (patients) => {
  // Break down patients by date announced.
  let patientsDay = patientsByDate(patients);

  // Break down each day by age
  for (let day of _.keys(patientsDay)) {
    let patientsByDay = patientsDay[day].patients;
    let ages = _.fromPairs(
      _.map(AGE_BUCKETS, (age) => {
        return [age, 0];
      })
    );
    for (let patient of patientsByDay) {
      if (
        typeof patient.ageBracket != "undefined" &&
        patient.ageBracket >= 0 &&
        AGE_BUCKETS.indexOf(patient.ageBracket) != -1
      ) {
        ages[patient.ageBracket] += 1;
      }
    }
    patientsDay[day].ages = ages;
  }

  let ageBreakdowns = _.sortBy(
    _.map(patientsDay, (v, k) => {
      return { date: k, ages: v.ages };
    }),
    ["date"]
  );
  let ageBreakdownsLookup = _.fromPairs(
    _.map(ageBreakdowns, (v) => {
      return [v.date, v.ages];
    })
  );

  // Calculates a 3-day accumulation
  ageBreakdowns = _.map(ageBreakdowns, (agesByDay) => {
    let day = dateParse(agesByDay.date, "yyyy-MM-dd", new Date());

    let ageAccumulator = _.clone(agesByDay.ages);
    for (let daysBefore = 1; daysBefore <= 3; daysBefore++) {
      let previous = dateFormat(dateAddDays(day, -daysBefore), "yyyy-MM-dd");
      let previousAges = ageBreakdownsLookup[previous];
      if (previousAges) {
        _.mergeWith(ageAccumulator, previousAges, _.add);
      }
    }

    let ageCount = _.sum(_.values(agesByDay.ages));
    let ageAccumulatorCount = _.sum(_.values(ageAccumulator));

    let ageFractions = {};
    if (ageCount > 0) {
      ageFractions = _.map(agesByDay.ages, (v) => {
        return v / ageCount;
      });
    }

    let ageAccumulatedFractions = {};
    if (ageAccumulatorCount > 0) {
      ageAccumulatedFractions = _.map(ageAccumulator, (v) => {
        return v / ageAccumulatorCount;
      });
    }

    return _.assignIn(agesByDay, {
      ageCount: ageCount,
      ageAccumulator: ageAccumulator,
      ageFractions: ageFractions,
      ageAccumulatorFractions: ageAccumulatedFractions,
    });
  });

  return ageBreakdowns;
};

let _ageDateSelection = "2020-03-01";
let _ageLineColor = "rgba(0, 0, 0, 0.05)";
let _ageLineFocusColor = "rgba(200, 0, 0, 1)";
let _ageBreakdowns = {};
let _ageTrendChart = null;
let _ageTrendSlider = null;

const renderAgeTrends = (ageBreakdowns) => {
  let chartElement = document.querySelector("#age-trends .chart");
  _ageBreakdowns = _.slice(ageBreakdowns, 30); // ignore the first 30 days.
  let ageData = _.map(_ageBreakdowns, (v) => {
    return _.concat([v.date], v.ageAccumulatorFractions);
  });

  document.querySelector("#chart-date-label").innerHTML = _ageDateSelection;

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
};

const updateAgeChartSelection = (value) => {
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

  document.querySelector("#chart-date-label").innerHTML = _ageDateSelection;
};

const keyboardEventForRangeSlider = (e) => {
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
  }
};

const main = () => {
  fetch("https://data.covid19japan.com/patient_data/latest.json")
    .then((response) => response.json())
    .then((patients) => {
      let ageBreakdownByDay = calculateAgeTrends(patients);
      renderAgeTrends(ageBreakdownByDay);
    });
};

window.onload = main;
document.onkeydown = keyboardEventForRangeSlider;

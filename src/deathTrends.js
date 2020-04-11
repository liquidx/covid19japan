import _ from "lodash";
import c3 from "c3";

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
        deathsOver60: 0,
        deathsUnder60: 0,
      };
    }

    if (patient.patientStatus == "Deceased") {
      deathsByDay[dateAnnounced].deaths += 1;
      deathsByDay[dateAnnounced].patients.push(patient);
      if (patient.ageBracket != -1) {
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
        deathsUnder60: v[1].deathsUnder60,
        deathsOver60: v[1].deathsOver60,
      };
    }),
    ["date"]
  );
};

const generateChartData = (deaths) => {
  let xAxisData = ["x"];
  let deathsData = ["deaths"];
  let deathsOver60Data = ["deathsOver60"];
  let deathsUnder60Data = ["deathsUnder60"];
  _.forEach(deaths, (v) => {
    xAxisData.push(v.date);
  });
  _.forEach(deaths, (v) => {
    deathsData.push(v.deaths);
  });
  _.forEach(deaths, (v) => {
    deathsOver60Data.push(v.deathsOver60);
  });
  _.forEach(deaths, (v) => {
    deathsUnder60Data.push(v.deathsUnder60);
  });
  return [xAxisData, deathsData, deathsOver60Data, deathsUnder60Data];
};

let _deathsChart = null;
const renderDeaths = (deaths) => {
  let deathsChartData = generateChartData(_.slice(deaths, 40, -2));
  console.log(deaths);

  let chartElement = document.querySelector("#death-trend .chart");
  _deathsChart = c3.generate({
    bindto: chartElement,
    padding: { top: 20, bottom: 20, left: 60, right: 0 },
    transition: { duration: 0 },
    tooltip: { show: false },
    legend: { show: true },
    point: { show: false },
    data: {
      type: "bar",
      x: "x",
      columns: deathsChartData,
    },
    bar: {
      width: { ratio: 1.0 },
    },
    axis: {
      x: {
        type: "timeseries",
        tick: { format: "%m/%d" },
      },
    },
  });
};

const main = () => {
  fetch("https://data.covid19japan.com/patient_data/latest.json")
    .then((response) => response.json())
    .then((patients) => {
      let deathDataset = generateDeathDataset(patients);
      renderDeaths(deathDataset);
    });
};

window.onload = main;

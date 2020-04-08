import c3 from "c3";
import d3 from "d3";
import _ from "lodash";
import rangesliderJs from "rangeslider-js";
import {
  parse as dateParse,
  format as dateFormat,
  addDays as dateAddDays,
} from "date-fns";

import { renderAgeTrends, keyboardEventForRangeSlider } from "./trendsAge.js";

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

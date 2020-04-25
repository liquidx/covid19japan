import _ from "lodash";

export const generateTokyoChartData = (tokyoCounts) => {
  let cityNamesJa = ["CityNamesJa"];
  let cityNamesEn = ["CityNamesEn"];
  let latestCount = ["Confirmed"];
  let cityNamesBoth = ["CityNamesBoth"];
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
    cityNamesJa.push(v.name_ja);
  });
  _.forEach(sortedTokyoCounts, (v) => {
    cityNamesEn.push(v.name);
  });

  _.forEach(sortedTokyoCounts, (v) => {
    cityNamesBoth.push(`${v.name_ja} (${v.name})`);
  });

  _.forEach(sortedTokyoCounts, (v) => {
    latestCount.push(_.last(v.values).count);
  });

  _.forEach(sortedTokyoCounts, (v) => {
    let lastTwo = _.slice(v.values, -2);
    if (lastTwo) {
      deltas.push(lastTwo[1].count - lastTwo[0].count);
    } else {
      deltas.push(0);
    }
  });
  return {
    cityNamesEn: cityNamesEn,
    cityNamesJa: cityNamesJa,
    cityNamesBoth: cityNamesBoth,
    confirmed: latestCount,
    confirmedDelta: deltas,
  };
};

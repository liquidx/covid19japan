import _ from "lodash";
import { select as d3_select } from "d3-selection";
import { scaleLinear as d3_scaleLinear } from "d3-scale";
import { max as d3_max } from "d3-array";

import { COLOR_CONFIRMED_LIGHT } from "../../data/constants";

export const renderWardTable = (elementSelector, tokyoCounts) => {
  const exclusionFilter = (v) => {
    return v.name != "" && v.name != "Unknown" && v.values.length > 0;
  };

  let sortedTokyoCounts = _.reverse(
    _.sortBy(_.filter(tokyoCounts, exclusionFilter), (v) => {
      return _.last(v.values).count;
    })
  );

  sortedTokyoCounts = _.map(sortedTokyoCounts, (v) => {
    let latestConfirmed = _.last(v.values).count;
    let lastTwo = _.slice(v.values, -2);
    let latestConfirmedDelta = 0;
    if (lastTwo) {
      latestConfirmedDelta = lastTwo[1].count - lastTwo[0].count;
    }

    v.latestConfirmed = latestConfirmed;
    v.latestConfirmedDelta = latestConfirmedDelta;
    return v;
  });

  let w = d3_scaleLinear()
    .domain([0, d3_max(sortedTokyoCounts, (o) => o.latestConfirmed)])
    .range([0, 100]);

  let tbody = d3_select(elementSelector);
  let rows = tbody.selectAll("tr").data(sortedTokyoCounts).join("tr");

  rows
    .append("td")
    .attr("class", "cityname")
    .text((d) => {
      return `${d.name_ja} (${d.name})`;
    });

  rows
    .append("td")
    .attr("class", "barline")
    .style("background-image", (d) => {
      let p = w(d.latestConfirmed);
      return `linear-gradient(to right, ${COLOR_CONFIRMED_LIGHT}, ${COLOR_CONFIRMED_LIGHT} ${p}%, rgba(0, 0, 0, 0) ${p}%, rgba(0, 0, 0, 0) 100%)`;
    })
    .text((d) => d.latestConfirmed);
  rows.append("td").text((d) => d.latestConfirmedDelta);
};

import * as c3 from "c3";
import { color as d3_color } from "d3-color";
import i18next from "i18next";
import { format as dateFormat } from "date-fns";

import { LOCALES } from "../../i18n";
import { niceScale } from "../../data/scaling";

import {
  COLOR_ACTIVE,
  COLOR_CONFIRMED,
  COLOR_RECOVERED,
  COLOR_DECEASED,
  DEFAULT_CHART_TIME_PERIOD,
} from "../../data/constants";

const drawTotalCasesChart = (
  containerElement,
  sheetTrend,
  existingChart,
  lang,
  timePeriod = DEFAULT_CHART_TIME_PERIOD
) => {
  const dateLocale = LOCALES[lang];

  const cols = {
    Date: ["Date"],
    Confirmed: ["Confirmed"],
    Active: ["Active"],
    Critical: ["Critical"],
    Deceased: ["Deceased"],
    Recovered: ["Recovered"],
    Tested: ["Tested"],
  };

  const startIndex = timePeriod > 0 ? sheetTrend.length - timePeriod : 0;
  for (let i = startIndex; i < sheetTrend.length; i++) {
    const row = sheetTrend[i];

    cols.Date.push(row.date);
    cols.Confirmed.push(row.confirmedCumulative);
    cols.Critical.push(row.criticalCumulative);
    cols.Deceased.push(row.deceasedCumulative);
    cols.Recovered.push(row.recoveredCumulative);
    cols.Active.push(
      row.confirmedCumulative - row.deceasedCumulative - row.recoveredCumulative
    );
    cols.Tested.push(row.testedCumulative);
  }

  const scale = niceScale(cols.Confirmed.slice(1), 5);

  if (existingChart) {
    existingChart.destroy();
  }

  return c3.generate({
    bindto: containerElement,
    data: {
      x: "Date",
      color: (color, d) => {
        if (d && d.index === cols.Date.length - 2) {
          const newColor = d3_color(color);
          newColor.opacity = 0.6;
          return newColor;
        } else {
          return color;
        }
      },
      columns: [
        cols.Date,
        cols.Confirmed,
        cols.Active,
        cols.Recovered,
        cols.Deceased,
        //cols.Tested
      ],
      names: {
        Confirmed: i18next.t("kpi-confirmed"),
        Active: i18next.t("kpi-active"),
        Recovered: i18next.t("kpi-recovered"),
        Deceased: i18next.t("kpi-deceased"),
      },
      regions: {
        [cols.Confirmed[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
        [cols.Active[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
        [cols.Recovered[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
        [cols.Deceased[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
        //[cols.Tested[0]]: [{'start': cols.Date[cols.Date.length-2], 'style':'dashed'}],
      },
    },
    color: {
      pattern: [COLOR_CONFIRMED, COLOR_ACTIVE, COLOR_RECOVERED, COLOR_DECEASED],
    },
    point: {
      r: 1,
    },
    axis: {
      x: {
        type: "timeseries",
        tick: {
          count: 6,
          format: (x) => {
            if (isNaN(x)) {
              return "";
            }
            const xDate = Date.parse(x);
            return dateFormat(xDate, "MMM d", {
              locale: dateLocale,
              addSuffix: true,
            });
          },
        },
      },
      y: {
        padding: 0,
        max: scale.max,
        tick: {
          values: scale.ticks,
        },
      },
    },
    tooltip: {
      format: {
        value: (value, ratio, id, index) => {
          if (index && cols[id][index]) {
            const diff = parseInt(value) - cols[id][index];
            return `${value} (${diff >= 0 ? "+" : ""}${diff}) ${
              index === cols.Date.length - 2 ? i18next.t("provisional") : ""
            }`;
          } else {
            return value;
          }
        },
      },
    },
    grid: {
      x: {
        show: true,
      },
      y: {
        show: true,
      },
    },
    padding: {
      left: 40,
      right: 10,
      top: 0,
      bottom: 0,
    },
  });
};

export default drawTotalCasesChart;

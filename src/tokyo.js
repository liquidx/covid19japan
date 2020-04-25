import _ from "lodash";

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import locI18next from "loc-i18next";

import toggleLangPicker from "./components/Header/ToggleLangPicker";

import { renderWholeTokyoChart } from "./components/Tokyo/TokyoChart";
import { renderWardTable } from "./components/Tokyo/TokyoTable";

import {
  LANG_CONFIG,
  JSON_PATH,
  SUPPORTED_LANGS,
  DDB_COMMON,
} from "./data/constants";

const localize = locI18next.init(i18next);
let LANG = "en";
let TOKYO_COUNT_DATA = {};

const setLang = (lng) => {
  if (lng && lng.length > 1) {
    // Clip to first two letters of the language.
    let proposedLng = lng.slice(0, 2);
    // Don't set the lang if it's not the supported languages.
    if (SUPPORTED_LANGS.includes(proposedLng)) {
      LANG = proposedLng;
    }
  }

  toggleLangPicker(LANG);
  i18next.changeLanguage(LANG).then(() => {
    localize("html");
    renderPage(TOKYO_COUNT_DATA);
  });
};

const initDataTranslate = () => {
  // load translation framework
  i18next
    .use(LanguageDetector)
    .init(LANG_CONFIG)
    .then(() => {
      setLang(i18next.language);
    });

  // Language selector event handler
  const langPickers = document.querySelectorAll("[data-lang-picker]");
  if (langPickers) {
    langPickers.forEach((pick) => {
      pick.addEventListener("click", (e) => {
        e.preventDefault();
        setLang(e.target.dataset.langPicker);
      });
    });
  }
};

const renderCityCharts = (tokyoCounts) => {
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

const renderPage = (tokyoCountData) => {
  let chart = document.querySelector("#tokyo-chart");
  chart.innerHTML = "";
  renderWholeTokyoChart("#tokyo-chart", tokyoCountData);

  let tableBody = document.querySelector("table#count-table tbody");
  tableBody.innerHTML = "";
  renderWardTable("table#count-table tbody", tokyoCountData);
};

const main = () => {
  initDataTranslate();
  fetch("https://data.covid19japan.com/tokyo/counts.json")
    .then((response) => response.json())
    .then((tokyoCounts) => {
      TOKYO_COUNT_DATA = tokyoCounts;
      renderPage(tokyoCounts);
    });
};

document.addEventListener("DOMContentLoaded", main);

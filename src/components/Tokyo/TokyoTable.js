import { generateTokyoChartData } from "./TokyoChartData";

export const renderWardTable = (elementSelector, tokyoCounts) => {
  let tableBody = document.querySelector(elementSelector);
  let dataSets = generateTokyoChartData(tokyoCounts);

  for (let i = 1; i < dataSets.cityNamesEn.length; i++) {
    let row = document.createElement("tr");

    let prefectureCell = document.createElement("td");
    prefectureCell.innerHTML = dataSets.cityNamesBoth[i];
    row.appendChild(prefectureCell);

    let countCell = document.createElement("td");
    countCell.innerHTML = dataSets.confirmed[i];
    row.appendChild(countCell);

    let deltaCell = document.createElement("td");
    deltaCell.innerHTML = `+${dataSets.confirmedDelta[i]}`;
    row.appendChild(deltaCell);

    tableBody.appendChild(row);
  }
};

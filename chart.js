(function () {
  let chart = null;

  function parseTableRow(tableId, rowIndex) {
    const tbl = document.getElementById(tableId);
    if (!tbl || !tbl.rows[rowIndex]) return [];
    const cells = tbl.rows[rowIndex].cells;
    const vals = [];
    for (let i = 1; i < cells.length; i++) {
      const raw = cells[i].innerText.replace(/,/g, '');
      vals.push(parseFloat(raw) || 0);
    }
    return vals;
  }

  // Compute min/max for both axes such that zero is at the same vertical position on both.
  function alignedLimits(yData, y2Data) {
    const pos1 = Math.max(0, ...yData);
    const neg1 = -Math.min(0, ...yData);
    const pos2 = Math.max(0, ...y2Data);
    const neg2 = -Math.min(0, ...y2Data);

    // posRatio: fraction of total range above zero — must accommodate both axes
    const r1 = pos1 + neg1, r2 = pos2 + neg2;
    const posRatio = Math.max(
      r1 > 0 ? pos1 / r1 : 0.5,
      r2 > 0 ? pos2 / r2 : 0.5,
    );
    const negRatio = 1 - posRatio;

    // Expand each axis's range so all data fits with the shared posRatio, plus 5% padding
    const range1 = Math.max(neg1 > 0 ? neg1 / negRatio : 0, pos1 > 0 ? pos1 / posRatio : 0) * 1.05;
    const range2 = Math.max(neg2 > 0 ? neg2 / negRatio : 0, pos2 > 0 ? pos2 / posRatio : 0) * 1.05;

    return {
      yMin:  -range1 * negRatio, yMax:  range1 * posRatio,
      y2Min: -range2 * negRatio, y2Max: range2 * posRatio,
    };
  }

  function updateChart() {
    const buyStay = parseTableRow('stratBuyStay', 1);       // Net Profit row
    const buyRentout = parseTableRow('stratBuyRentout', 1); // Net Profit row
    const effectiveRent = parseTableRow('stratBuyStay', 2); // Effective Rent /mth row
    if (!buyStay.length) return;

    const labels = buyStay.map((_, i) => 'Yr ' + i);

    const { yMin, yMax, y2Min, y2Max } = alignedLimits(
      effectiveRent,
      [...buyStay, ...buyRentout],
    );

    const data = {
      labels,
      datasets: [
        {
          label: 'Buy & Stay — Net Profit',
          data: buyStay,
          borderColor: '#0D9B8C',
          backgroundColor: 'rgba(13,155,140,0.08)',
          tension: 0.3,
          fill: true,
          pointRadius: 2,
          yAxisID: 'y2',
        },
        {
          label: 'Buy & Rent Out — Net Profit',
          data: buyRentout,
          borderColor: '#0F2044',
          backgroundColor: 'rgba(15,32,68,0.06)',
          tension: 0.3,
          fill: true,
          pointRadius: 2,
          yAxisID: 'y2',
        },
        {
          label: 'Buy & Stay — Effective Rent/mth',
          data: effectiveRent,
          borderColor: '#E07B39',
          backgroundColor: 'rgba(224,123,57,0.0)',
          tension: 0.3,
          fill: false,
          pointRadius: 2,
          borderDash: [5, 3],
          yAxisID: 'y',
        },
      ],
    };

    const options = {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label(ctx) {
              const val = ctx.parsed.y;
              if (ctx.dataset.yAxisID === 'y2') {
                return ctx.dataset.label + ': SGD ' + val.toLocaleString('en-SG', { maximumFractionDigits: 0 });
              }
              return ctx.dataset.label + ': SGD ' + val.toLocaleString('en-SG', { maximumFractionDigits: 0 }) + '/mth';
            },
          },
        },
      },
      scales: {
        y: {
          min: yMin, max: yMax,
          ticks: {
            callback(val) {
              return 'SGD ' + val.toLocaleString('en-SG', { maximumFractionDigits: 0 }) + '/mth';
            },
          },
        },
        y2: {
          position: 'right',
          min: y2Min, max: y2Max,
          grid: { drawOnChartArea: false },
          ticks: {
            callback(val) {
              return 'SGD ' + (val / 1000).toFixed(0) + 'k';
            },
          },
        },
      },
    };

    if (chart) {
      chart.data = data;
      chart.options = options;
      chart.update();
    } else {
      const ctx = document.getElementById('cashflowChart');
      if (!ctx) return;
      chart = new Chart(ctx, { type: 'line', data, options });
    }
  }

  // Watch stratBuyStay for row changes and re-render chart
  function initObserver() {
    const target = document.getElementById('stratBuyStay');
    if (!target) return;
    const observer = new MutationObserver(updateChart);
    observer.observe(target, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }
})();

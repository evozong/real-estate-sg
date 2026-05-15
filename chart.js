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

  function updateChart() {
    const buyStay = parseTableRow('stratBuyStay', 1);       // Net Profit row
    const buyRentout = parseTableRow('stratBuyRentout', 1); // Net Profit row
    if (!buyStay.length) return;

    const labels = buyStay.map((_, i) => 'Yr ' + i);

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
        },
        {
          label: 'Buy & Rent Out — Net Profit',
          data: buyRentout,
          borderColor: '#0F2044',
          backgroundColor: 'rgba(15,32,68,0.06)',
          tension: 0.3,
          fill: true,
          pointRadius: 2,
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
              return ctx.dataset.label + ': SGD ' + val.toLocaleString('en-SG', { maximumFractionDigits: 0 });
            },
          },
        },
      },
      scales: {
        y: {
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

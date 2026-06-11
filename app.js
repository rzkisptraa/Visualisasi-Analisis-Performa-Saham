// Global State variables
let pricesData = null;
let metaData = null;

let relativeChart = null;
let trendChart = null;
let momentumChart = null;

// Ticker Names Map for display
const TICKER_NAMES = {
    "BBCA": "PT Bank Central Asia Tbk",
    "BBRI": "PT Bank Rakyat Indonesia Tbk",
    "BMRI": "PT Bank Mandiri Tbk",
    "TLKM": "PT Telkom Indonesia Tbk",
    "BREN": "PT Barito Renewables Energy Tbk",
    "AMMN": "PT Amman Mineral Internasional Tbk",
    "IHSG": "Indeks Harga Saham Gabungan (IHSG)"
};

// Colors for Chart 1
const ASSET_COLORS = {
    "IHSG": "#9CA3AF", // Light Gray (Benchmark)
    "BBCA": "#F59E0B", // Amber
    "BBRI": "#3B82F6", // Blue
    "BMRI": "#F97316", // Orange
    "TLKM": "#EF4444", // Red
    "BREN": "#10B981", // Green
    "AMMN": "#06B6D4"  // Cyan
};

// Custom Chart.js Plugin for Stochastic reference bands
const horizontalLinePlugin = {
    id: 'horizontalLine',
    beforeDraw(chart) {
        const { ctx, chartArea: { left, right }, scales: { y } } = chart;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        // Draw line at 80 (Overbought)
        const y80 = y.getPixelForValue(80);
        ctx.beginPath();
        ctx.moveTo(left, y80);
        ctx.lineTo(right, y80);
        ctx.stroke();
        
        // Draw line at 20 (Oversold)
        const y20 = y.getPixelForValue(20);
        ctx.beginPath();
        ctx.moveTo(left, y20);
        ctx.lineTo(right, y20);
        ctx.stroke();
        
        // Add text labels
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px Inter';
        ctx.fillText('Overbought (80)', left + 5, y80 - 5);
        ctx.fillText('Oversold (20)', left + 5, y20 + 12);
        ctx.restore();
    }
};

// Register plugin globally or selectively
Chart.register(horizontalLinePlugin);

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    try {
        // Fetch JSON files
        const [pricesRes, metaRes] = await Promise.all([
            fetch('data/prices.json'),
            fetch('data/meta.json')
        ]);
        
        if (!pricesRes.ok || !metaRes.ok) {
            throw new Error('Failed to fetch data files');
        }
        
        pricesData = await pricesRes.json();
        metaData = await metaRes.json();
        
        // Setup metadata & KPI counters
        setupMetadata();
        setupKPIs();
        
        // Render Chart 1 (Relative Performance)
        renderRelativeChart();
        
        // Init Selected Stock detail charts and insights
        const stockSelect = document.getElementById('stock-select');
        updateSelectedStockView(stockSelect.value);
        
        // Add dropdown change listener
        stockSelect.addEventListener('change', (e) => {
            updateSelectedStockView(e.target.value);
        });
        
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('analysis-insights-box').innerHTML = `
            <div style="color: var(--bearish-color); padding: 10px; border: 1px solid rgba(255,85,85,0.2); background: rgba(255,85,85,0.05); border-radius: 6px;">
                <strong>Gagal memuat data dashboard.</strong> Silakan jalankan <code>python scripts/fetch_data.py</code> untuk membuat file data JSON terlebih dahulu.
            </div>
        `;
    }
}

// Setup static metadata values
function setupMetadata() {
    document.getElementById('last-update-time').textContent = metaData.last_update;
}

// Helper for count up animation using requestAnimationFrame
function animateValue(elementId, start, end, duration, decimalPlaces = 0, prefix = "", suffix = "") {
    const obj = document.getElementById(elementId);
    if (!obj) return;
    
    let startTimestamp = null;
    const isNegative = end < 0;
    const absoluteEnd = Math.abs(end);
    const absoluteStart = Math.abs(start);
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = progress * (absoluteEnd - absoluteStart) + absoluteStart;
        
        // Apply decimal places and format
        const formattedVal = currentVal.toFixed(decimalPlaces);
        const displayVal = parseFloat(formattedVal).toLocaleString('id-ID', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
        });
        
        // Re-apply negative sign if needed
        const sign = isNegative ? "-" : (suffix === "%" && end > 0 ? "+" : "");
        obj.textContent = prefix + sign + displayVal + suffix;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

// Setup KPIs with animations
function setupKPIs() {
    // KPI 1: IHSG Current Close (Format: IDR format with 2 decimals)
    animateValue('kpi-ihsg-val', 0, metaData.ihsg_current, 1000, 2);
    
    // KPI 2: Status Pasar
    const statusVal = document.getElementById('kpi-status-val');
    const statusDesc = document.getElementById('kpi-status-desc');
    statusVal.textContent = metaData.status_pasar;
    
    if (metaData.status_pasar === 'Bullish') {
        statusVal.className = 'kpi-value text-success';
        statusDesc.textContent = 'IHSG di atas MA50';
    } else {
        statusVal.className = 'kpi-value text-danger';
        statusDesc.textContent = 'IHSG di bawah MA50';
    }
    
    // KPI 3: Top Outperformer
    const topOut = metaData.top_outperformer;
    const topOutVal = document.getElementById('kpi-outperformer-val');
    topOutVal.innerHTML = `${topOut.ticker} <span id="top-out-pct"></span>`;
    animateValue('top-out-pct', 0, topOut.return, 1000, 1, "(", "%)");
    
    // KPI 4: Top Underperformer
    const topUnder = metaData.top_underperformer;
    const topUnderVal = document.getElementById('kpi-underperformer-val');
    topUnderVal.innerHTML = `${topUnder.ticker} <span id="top-under-pct"></span>`;
    animateValue('top-under-pct', 0, topUnder.return, 1000, 1, "(", "%)");
}

// Chart 1: Performa Relatif
function renderRelativeChart() {
    const ctx = document.getElementById('relativePerformanceChart').getContext('2d');
    
    // Generate dates (X-axis labels)
    // Extract dates from IHSG dataset
    const labels = pricesData["IHSG"].map(item => item.date);
    
    // Build datasets for each ticker
    const datasets = Object.keys(pricesData).map(ticker => {
        const data = pricesData[ticker].map(item => item.rebased);
        return {
            label: ticker === 'IHSG' ? 'IHSG (Benchmark)' : ticker,
            data: data,
            borderColor: ASSET_COLORS[ticker] || '#FFF',
            borderWidth: ticker === 'IHSG' ? 3 : 1.8,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false,
            tension: 0.1,
            zIndex: ticker === 'IHSG' ? 10 : 1
        };
    });
    
    // Sort datasets so IHSG is rendered on top
    datasets.sort((a, b) => (a.label.includes('IHSG') ? 1 : -1));

    relativeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#9CA3AF',
                        font: {
                            family: 'Inter',
                            size: 11
                        },
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: '#141A21',
                    borderColor: '#2A3441',
                    borderWidth: 1,
                    titleColor: '#FFFFFF',
                    bodyColor: '#9CA3AF',
                    titleFont: {
                        family: 'Inter',
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Inter'
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(42, 52, 65, 0.3)',
                        drawTicks: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        font: {
                            family: 'Inter',
                            size: 10
                        },
                        maxTicksLimit: 12
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(42, 52, 65, 0.3)',
                        drawTicks: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        font: {
                            family: 'Inter',
                            size: 10
                        },
                        callback: function(value) {
                            return value.toFixed(0) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update Detail View (Chart 2, Chart 3, and Insights)
function updateSelectedStockView(ticker) {
    // Update display text
    document.querySelectorAll('.selected-stock-ticker').forEach(el => {
        el.textContent = ticker;
    });
    document.querySelectorAll('.selected-stock-ticker-full').forEach(el => {
        el.textContent = ` - ${TICKER_NAMES[ticker]}`;
    });
    
    const stockData = pricesData[ticker];
    if (!stockData) return;
    
    // Prepare Data
    const labels = stockData.map(item => item.date);
    const closePrices = stockData.map(item => item.close);
    const ma20 = stockData.map(item => item.ma20);
    const ma50 = stockData.map(item => item.ma50);
    const k = stockData.map(item => item.k);
    const d = stockData.map(item => item.d);
    
    // 1. Render/Update Chart 2 (Trend)
    updateTrendChart(labels, closePrices, ma20, ma50, ticker);
    
    // 2. Render/Update Chart 3 (Momentum)
    updateMomentumChart(labels, k, d);
    
    // 3. Generate Automatic Insights
    generateInsights(ticker, stockData);
}

// Chart 2: Trend Chart
function updateTrendChart(labels, closePrices, ma20, ma50, ticker) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const colorTheme = ASSET_COLORS[ticker] || '#0066FF';
    
    const datasets = [
        {
            label: 'Harga Penutupan',
            data: closePrices,
            borderColor: colorTheme,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false,
            tension: 0.1
        },
        {
            label: 'MA20',
            data: ma20,
            borderColor: '#F59E0B', // Amber
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            borderDash: [2, 2],
            tension: 0.1
        },
        {
            label: 'MA50',
            data: ma50,
            borderColor: '#A855F7', // Purple
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            tension: 0.1
        }
    ];
    
    if (trendChart) {
        trendChart.data.labels = labels;
        trendChart.data.datasets = datasets;
        trendChart.options.plugins.tooltip.callbacks.label = function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': Rp ';
            }
            if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            }
            return label;
        };
        trendChart.update();
    } else {
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#9CA3AF',
                            font: { family: 'Inter', size: 10 }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#141A21',
                        borderColor: '#2A3441',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': Rp ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(42, 52, 65, 0.3)', drawTicks: false },
                        ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 10 }, maxTicksLimit: 8 }
                    },
                    y: {
                        grid: { color: 'rgba(42, 52, 65, 0.3)', drawTicks: false },
                        ticks: {
                            color: '#9CA3AF',
                            font: { family: 'Inter', size: 10 },
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                }
            }
        });
    }
}

// Chart 3: Momentum Chart
function updateMomentumChart(labels, k, d) {
    const ctx = document.getElementById('momentumChart').getContext('2d');
    
    const datasets = [
        {
            label: '%K (Cepat)',
            data: k,
            borderColor: '#06B6D4', // Cyan
            borderWidth: 1.8,
            pointRadius: 0,
            tension: 0.15
        },
        {
            label: '%D (Lambat)',
            data: d,
            borderColor: '#EC4899', // Pink
            borderWidth: 1.8,
            pointRadius: 0,
            tension: 0.15
        }
    ];
    
    if (momentumChart) {
        momentumChart.data.labels = labels;
        momentumChart.data.datasets = datasets;
        momentumChart.update();
    } else {
        momentumChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#9CA3AF',
                            font: { family: 'Inter', size: 10 }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#141A21',
                        borderColor: '#2A3441',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(42, 52, 65, 0.3)', drawTicks: false },
                        ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 10 }, maxTicksLimit: 8 }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(42, 52, 65, 0.3)', drawTicks: false },
                        ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });
    }
}

// Generate Insights Automatically
function generateInsights(ticker, stockData) {
    const latest = stockData[stockData.length - 1];
    const prev = stockData[stockData.length - 2] || latest;
    const first = stockData[0];
    
    const close = latest.close;
    const ma20 = latest.ma20;
    const ma50 = latest.ma50;
    const k = latest.k;
    const d = latest.d;
    
    // Calculate returns
    const stockReturn = ((close - first.close) / first.close * 100).toFixed(1);
    const ihsgReturn = metaData.returns["IHSG"].toFixed(1);
    
    // 1. Determine Trend Badge & Text
    let trendBadge = "Neutral";
    let trendBadgeClass = "badge-neutral";
    let trendInsightText = "";
    
    if (close > ma50) {
        trendBadge = "Bullish";
        trendBadgeClass = "badge-bullish";
        trendInsightText = `<span class="text-success">bullish</span>. Harga penutupan terbaru (Rp ${close.toLocaleString('id-ID')}) berada di atas MA50 (Rp ${ma50.toLocaleString('id-ID')}), yang menunjukkan pergerakan tren jangka menengah yang kuat.`;
    } else {
        trendBadge = "Bearish";
        trendBadgeClass = "badge-bearish";
        trendInsightText = `<span class="text-danger">bearish</span>. Harga penutupan terbaru (Rp ${close.toLocaleString('id-ID')}) berada di bawah MA50 (Rp ${ma50.toLocaleString('id-ID')}), yang mengindikasikan tekanan jual jangka menengah.`;
    }
    
    // Add short-term MA20 reference
    let shortTermTrend = "";
    if (close > ma20) {
        shortTermTrend = `Di jangka pendek, harga juga diperdagangkan di atas MA20 (Rp ${ma20.toLocaleString('id-ID')}), mengonfirmasi kekuatan momentum beli saat ini.`;
    } else {
        shortTermTrend = `Di jangka pendek, harga tertekan di bawah MA20 (Rp ${ma20.toLocaleString('id-ID')}), menunjukkan adanya pelemahan tren jangka pendek.`;
    }
    
    // Check for Golden Cross/Death Cross crossover in the last 5 days
    let crossoverInsight = "";
    let crossoverDetected = false;
    for (let i = stockData.length - 1; i >= Math.max(1, stockData.length - 5); i--) {
        const curr = stockData[i];
        const previous = stockData[i - 1];
        
        // Golden Cross (K crossing above D at low level)
        if (previous.k <= previous.d && curr.k > curr.d && curr.k < 35) {
            crossoverInsight = `Telah terjadi sinyal momentum <strong>Golden Cross</strong> (garis %K memotong ke atas garis %D) di area oversold pada tanggal ${curr.date}, mengindikasikan potensi titik balik pembalikan arah naik (rebound).`;
            crossoverDetected = true;
            break;
        }
        // Death Cross (K crossing below D at high level)
        if (previous.k >= previous.d && curr.k < curr.d && curr.k > 65) {
            crossoverInsight = `Telah terjadi sinyal momentum <strong>Death Cross</strong> (garis %K memotong ke bawah garis %D) di area overbought pada tanggal ${curr.date}, mengindikasikan potensi pembalikan arah turun (koreksi).`;
            crossoverDetected = true;
            break;
        }
    }
    
    // Update Trend Badge
    const trBadgeEl = document.getElementById('stock-trend-badge');
    trBadgeEl.textContent = trendBadge;
    trBadgeEl.className = `badge ${trendBadgeClass}`;
    
    // 2. Determine Momentum Badge & Text
    let momentumBadge = "Netral";
    let momentumBadgeClass = "badge-neutral";
    let momentumInsightText = "";
    
    if (k > 80 && d > 80) {
        momentumBadge = "Overbought";
        momentumBadgeClass = "badge-bearish";
        momentumInsightText = `Momentum Stochastic Oscillator saat ini berada pada angka <strong>%K: ${k.toFixed(1)} / %D: ${d.toFixed(1)}</strong>, yang menunjukkan kondisi <strong>Overbought (Jenuh Beli)</strong>. Pengguna disarankan waspada karena harga berada di area rawan aksi ambil untung (profit taking).`;
    } else if (k < 20 && d < 20) {
        momentumBadge = "Oversold";
        momentumBadgeClass = "badge-bullish";
        momentumInsightText = `Momentum Stochastic Oscillator saat ini berada pada angka <strong>%K: ${k.toFixed(1)} / %D: ${d.toFixed(1)}</strong>, menunjukkan kondisi <strong>Oversold (Jenuh Jual)</strong>. Kondisi ini sering kali menarik pembeli karena harga secara teknikal dinilai sudah terlampau murah.`;
    } else {
        momentumBadge = "Netral";
        momentumBadgeClass = "badge-neutral";
        momentumInsightText = `Momentum Stochastic berada di zona netral (<strong>%K: ${k.toFixed(1)} / %D: ${d.toFixed(1)}</strong>). Pergerakan momentum saat ini cenderung stabil tanpa sinyal ekstrem.`;
    }
    
    const momBadgeEl = document.getElementById('stock-momentum-badge');
    momBadgeEl.textContent = momentumBadge;
    momBadgeEl.className = `badge ${momentumBadgeClass}`;
    
    // 3. Performance vs IHSG Text
    let relativePerformanceText = "";
    const isOutperformer = parseFloat(stockReturn) > parseFloat(ihsgReturn);
    
    if (isOutperformer) {
        relativePerformanceText = `Saham <strong>${ticker}</strong> berhasil <span class="text-success">mengungguli</span> indeks IHSG (Outperformer) selama 252 hari perdagangan terakhir, dengan total imbal hasil sebesar <strong>${stockReturn}%</strong> dibandingkan IHSG yang sebesar <strong>${ihsgReturn}%</strong>.`;
    } else {
        relativePerformanceText = `Saham <strong>${ticker}</strong> bergerak <span class="text-danger">tertinggal</span> dibandingkan indeks IHSG (Underperformer) selama 252 hari perdagangan terakhir, dengan imbal hasil total sebesar <strong>${stockReturn}%</strong> dibandingkan IHSG yang sebesar <strong>${ihsgReturn}%</strong>.`;
    }
    
    // Assemble final bullet points
    let htmlContent = `
        <p>Berdasarkan analisis data penutupan historis dan indikator teknikal untuk saham <strong>${TICKER_NAMES[ticker]} (${ticker})</strong>, berikut rangkuman analisis tren dan momentumnya:</p>
        <ul>
            <li><strong>Analisis Performa Relatif:</strong> ${relativePerformanceText}</li>
            <li><strong>Analisis Tren (Moving Average):</strong> Saham ${ticker} saat ini menunjukkan tren ${trendInsightText} ${shortTermTrend}</li>
            <li><strong>Analisis Momentum (Stochastic):</strong> ${momentumInsightText}</li>
            ${crossoverDetected ? `<li><strong>Sinyal Khusus:</strong> ${crossoverInsight}</li>` : ''}
        </ul>
        <p style="margin-top: 16px; font-size: 0.9rem; color: var(--text-secondary); font-style: italic;">
            *Catatan: Analisis ini diperbarui secara otomatis berdasarkan data historis penutupan terakhir dan tidak ditujukan sebagai rekomendasi finansial mutlak.
        </p>
    `;
    
    document.getElementById('analysis-insights-box').innerHTML = htmlContent;
}

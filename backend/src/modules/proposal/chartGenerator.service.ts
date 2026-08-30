import puppeteer from 'puppeteer';

export class ChartGeneratorService {
    static async generateSavingsChart(monthlyData: any[], avgMonthlySavings: string, savingsInWords: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PUPPETEER PAGE LOG:', msg.text()));
        page.on('pageerror', (err: any) => console.log('PUPPETEER PAGE ERROR:', err.message || err));
        
        await page.setViewport({ width: 850, height: 480 });

        const labels = monthlyData.map(m => {
            if (m.month_name) return m.month_name;
            if (m.month) {
                const parts = m.month.split('-');
                if (parts.length === 2) {
                    const year = parts[0];
                    const monthNum = parseInt(parts[1], 10);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    return `${months[monthNum - 1]}'${year.substring(2)}`;
                }
                return m.month;
            }
            return '';
        });

        const data = monthlyData.map(m => {
            const val = m.saving !== undefined ? m.saving : (m.savings !== undefined ? m.savings : 0);
            const rawStr = val.toString().replace(/[^0-9]/g, '');
            return parseInt(rawStr, 10) || 0;
        });

        const maxVal = Math.max(...data);
        const backgroundColor = data.map(v => v === maxVal ? '#15B771' : '#3B82F6');

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #FCFAEE;
                    font-family: Arial, sans-serif;
                    height: 480px;
                    display: flex;
                    flex-direction: column;
                }
                .content {
                    padding: 40px;
                    flex: 1;
                    position: relative;
                }
                .title-container {
                    margin-bottom: 20px;
                }
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1a1a1a;
                }
                .subtitle {
                    font-size: 14px;
                    color: #666;
                    margin-top: 5px;
                }
                .avg-bubble {
                    position: absolute;
                    top: 40px;
                    right: 40px;
                    border: 1px solid #4BB543;
                    border-radius: 20px;
                    padding: 8px 16px;
                    font-weight: bold;
                    font-size: 14px;
                    background-color: transparent;
                }
                .chart-container {
                    width: 100%;
                    height: 300px;
                    margin-top: 40px;
                }
                .footer-bar {
                    background-color: #0F172A;
                    color: white;
                    padding: 15px;
                    text-align: center;
                    font-size: 16px;
                    font-weight: bold;
                    margin-top: auto;
                }
                .highlight {
                    background-color: #FFFF00;
                    color: black;
                    padding: 2px 6px;
                }
            </style>
        </head>
        <body>
            <div class="content">
                <div class="title-container">
                    <div class="title">MONTHLY SAVINGS OPPORTUNITY</div>
                    <div class="subtitle">Based on the historical energy bills and consumption data provided</div>
                </div>
                
                <div class="avg-bubble">
                    Average Monthly Savings ${avgMonthlySavings}
                </div>
 
                <div class="chart-container">
                    <canvas id="myChart"></canvas>
                </div>
            </div>
            
            <div class="footer-bar">
                You are losing around <span class="highlight">${savingsInWords}</span> annually by not switching to Prolt immediately.
            </div>
 
            <script>
                Chart.register(ChartDataLabels);
                const ctx = document.getElementById('myChart').getContext('2d');
                
                const dataVals = ${JSON.stringify(data)};
                const avgSavingsNum = dataVals.reduce((a, b) => a + b, 0) / dataVals.length;
                
                const avgLinePlugin = {
                    id: 'avgLine',
                    afterDraw: function(chart) {
                        const yAxis = chart.scales.y;
                        if (!yAxis) return;
                        const yVal = yAxis.getPixelForValue(avgSavingsNum);
                        const ctx = chart.ctx;
                        ctx.save();
                        ctx.beginPath();
                        ctx.setLineDash([5, 5]);
                        ctx.moveTo(chart.chartArea.left, yVal);
                        ctx.lineTo(chart.chartArea.right, yVal);
                        ctx.strokeStyle = '#FF3B30';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.restore();
                        
                        ctx.save();
                        ctx.font = 'bold 12px sans-serif';
                        ctx.fillStyle = '#FF3B30';
                        ctx.textAlign = 'left';
                        const labelText = 'Avg. ₹' + (avgSavingsNum / 100000).toFixed(2) + ' lakhs';
                        ctx.fillText(labelText, chart.chartArea.right + 10, yVal + 4);
                        ctx.restore();
                    }
                };

                new Chart(ctx, {
                    type: 'bar',
                    plugins: [avgLinePlugin],
                    data: {
                        labels: ${JSON.stringify(labels)},
                        datasets: [{
                            data: dataVals,
                            backgroundColor: ${JSON.stringify(backgroundColor)},
                            borderRadius: 8,
                            barPercentage: 0.6
                        }]
                    },
                    options: {
                        layout: {
                            padding: {
                                right: 120
                            }
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false },
                            datalabels: {
                                anchor: 'end',
                                align: 'top',
                                formatter: function(value) {
                                    return '₹' + value.toLocaleString('en-IN');
                                },
                                font: {
                                    weight: 'bold'
                                }
                            }
                        },
                        scales: {
                            y: {
                                display: false,
                                beginAtZero: true,
                                suggestedMax: Math.max(...dataVals) * 1.3
                            },
                            x: {
                                grid: {
                                    display: false,
                                    drawBorder: false
                                },
                                ticks: {
                                    font: {
                                        weight: 'bold'
                                    }
                                }
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>
        `;
 
        try {
            await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
            const screenshot = await page.screenshot({ type: 'png' });
            return screenshot as Buffer;
        } finally {
            await browser.close().catch(() => {});
        }
    }

    static async generateConsumptionMixChart(oaPercentage: number, discomPercentage: number, oaUnits: number, discomUnits: number): Promise<Buffer> {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 600, height: 400 });

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background-color: white;
                    font-family: Arial, sans-serif;
                }
                .chart-container {
                    width: 100%;
                    height: 350px;
                    position: relative;
                }
            </style>
        </head>
        <body>
            <div class="chart-container">
                <canvas id="mixChart"></canvas>
            </div>
            <script>
                const ctx = document.getElementById('mixChart').getContext('2d');
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Open Access', 'DISCOM'],
                        datasets: [{
                            data: [${oaPercentage}, ${discomPercentage}],
                            backgroundColor: ['#22C55E', '#3B82F6'],
                            borderColor: ['#22C55E', '#3B82F6'],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { weight: 'bold', size: 14 },
                                    padding: 20
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.label + ': ' + context.parsed + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'load' });
        const screenshot = await page.screenshot({ type: 'png' });
        await browser.close();
        
        return screenshot as Buffer;
    }

    static async generateSpendComparisonChart(actualSpend: number, optimizedSpend: number, monthLabel: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 600, height: 400 });

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background-color: white;
                    font-family: Arial, sans-serif;
                }
                .chart-container {
                    width: 100%;
                    height: 350px;
                    position: relative;
                }
            </style>
        </head>
        <body>
            <div class="chart-container">
                <canvas id="spendChart"></canvas>
            </div>
            <script>
                Chart.register(ChartDataLabels);
                const ctx = document.getElementById('spendChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Your Current\nSpend', 'Prolt Optimized\nSpend'],
                        datasets: [{
                            data: [${actualSpend}, ${optimizedSpend}],
                            backgroundColor: ['#FEE2E2', '#DCFCE7'],
                            borderColor: ['#EF4444', '#22C55E'],
                            borderWidth: 2,
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        indexAxis: 'x',
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false },
                            datalabels: {
                                anchor: 'end',
                                align: 'top',
                                formatter: function(value) {
                                    return '₹' + (value / 100000).toFixed(2) + 'L';
                                },
                                font: {
                                    weight: 'bold',
                                    size: 14
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + (value / 100000).toFixed(0) + 'L';
                                    }
                                }
                            },
                            x: {
                                ticks: {
                                    font: { weight: 'bold', size: 12 }
                                }
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'load' });
        const screenshot = await page.screenshot({ type: 'png' });
        await browser.close();
        
        return screenshot as Buffer;
    }

    static async generateDailySavingsChart(dailyData: any[], monthLabel: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 600, height: 380 });

        const labels = dailyData.map(d => d.dayLabel || `Day ${d.day}`);
        const savingsData = dailyData.map(d => d.savings || 0);
        const optimizedData = dailyData.map(d => d.proltSpend || 0);
        const actualData = dailyData.map(d => d.actualSpend || 0);

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background-color: white;
                    font-family: Arial, sans-serif;
                }
                .chart-container {
                    width: 100%;
                    height: 330px;
                    position: relative;
                }
                .legend {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 10px;
                    font-size: 12px;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .legend-box {
                    width: 12px;
                    height: 12px;
                }
            </style>
        </head>
        <body>
            <div class="chart-container">
                <canvas id="dailyChart"></canvas>
            </div>
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-box" style="background-color: #22C55E;"></div>
                    <span>Savings Opportunity</span>
                </div>
                <div class="legend-item">
                    <div class="legend-box" style="background-color: #DBEAFE;"></div>
                    <span>Actual Spend</span>
                </div>
                <div class="legend-item">
                    <div class="legend-box" style="background-color: #F59E0B;"></div>
                    <span>Prolt Optimized</span>
                </div>
            </div>
            <script>
                const ctx = document.getElementById('dailyChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(labels)},
                        datasets: [
                            {
                                label: 'Savings',
                                data: ${JSON.stringify(savingsData)},
                                backgroundColor: '#22C55E'
                            },
                            {
                                label: 'Actual',
                                data: ${JSON.stringify(actualData)},
                                backgroundColor: '#DBEAFE'
                            },
                            {
                                label: 'Optimized',
                                data: ${JSON.stringify(optimizedData)},
                                backgroundColor: '#F59E0B'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return '₹' + (context.parsed.y / 1000).toFixed(2) + 'K';
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                stacked: false,
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + (value / 1000).toFixed(0) + 'K';
                                    }
                                }
                            },
                            x: {
                                ticks: {
                                    font: { size: 10 }
                                }
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'load' });
        const screenshot = await page.screenshot({ type: 'png' });
        await browser.close();
        
        return screenshot as Buffer;
    }

    static async generatePurchaseComparisonChart(oaPercentage: number, discomPercentage: number): Promise<Buffer> {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 600, height: 400 });

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background-color: white;
                    font-family: Arial, sans-serif;
                }
                .chart-container {
                    width: 100%;
                    height: 350px;
                    position: relative;
                }
            </style>
        </head>
        <body>
            <div class="chart-container">
                <canvas id="purchaseChart"></canvas>
            </div>
            <script>
                Chart.register(ChartDataLabels);
                const ctx = document.getElementById('purchaseChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['How You Should Purchase'],
                        datasets: [
                            {
                                label: 'Open Access',
                                data: [${oaPercentage}],
                                backgroundColor: '#22C55E'
                            },
                            {
                                label: 'DISCOM',
                                data: [${discomPercentage}],
                                backgroundColor: '#3B82F6'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        indexAxis: 'x',
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { font: { weight: 'bold' }, padding: 15 }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.dataset.label + ': ' + context.parsed.x + '%';
                                    }
                                }
                            },
                            datalabels: {
                                anchor: 'center',
                                align: 'center',
                                formatter: function(value) {
                                    return value + '%';
                                },
                                font: {
                                    weight: 'bold',
                                    size: 16,
                                    color: 'white'
                                }
                            }
                        },
                        scales: {
                            x: {
                                stacked: true,
                                max: 100,
                                ticks: {
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            },
                            y: {
                                stacked: true
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'load' });
        const screenshot = await page.screenshot({ type: 'png' });
        await browser.close();
        
        return screenshot as Buffer;
    }
}

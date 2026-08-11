import puppeteer from 'puppeteer';

export class ChartGeneratorService {
    static async generateSavingsChart(monthlyData: any[], avgMonthlySavings: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 800, height: 400 });

        const labels = monthlyData.map(m => m.month_name);
        // The saving field has formatting like "₹1,00,000". We need just the number.
        const data = monthlyData.map(m => {
            const rawStr = m.saving.toString().replace(/[^0-9]/g, '');
            return parseInt(rawStr, 10) || 0;
        });

        const backgroundColor = data.map((_, i) => i === data.length - 1 ? '#4BB543' : '#3B5BBD');

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
            <style>
                body {
                    margin: 0;
                    padding: 40px;
                    background-color: #F9F6E2;
                    font-family: Arial, sans-serif;
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
                    height: 250px;
                    margin-top: 40px;
                }
            </style>
        </head>
        <body>
            <div class="title-container">
                <div class="title">MONTHLY SAVINGS OPPORTUNITY</div>
                <div class="subtitle">Based on the historical energy bills and consumption data provided</div>
            </div>
            
            <div class="avg-bubble">
                Average Monthly Savings ₹${avgMonthlySavings}
            </div>

            <div class="chart-container">
                <canvas id="myChart"></canvas>
            </div>

            <script>
                Chart.register(ChartDataLabels);
                const ctx = document.getElementById('myChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(labels)},
                        datasets: [{
                            data: ${JSON.stringify(data)},
                            backgroundColor: ${JSON.stringify(backgroundColor)},
                            borderRadius: 8,
                            barPercentage: 0.6
                        }]
                    },
                    options: {
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
                                suggestedMax: Math.max(...${JSON.stringify(data)}) * 1.2
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

        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const screenshot = await page.screenshot({ type: 'png' });
        await browser.close();
        
        return screenshot as Buffer;
    }
}

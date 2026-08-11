import puppeteer from 'puppeteer';

export class ChartGeneratorService {
    static async generateSavingsChart(monthlyData: any[], avgMonthlySavings: string, savingsInWords: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 800, height: 480 });

        const labels = monthlyData.map(m => m.month_name);
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
                    padding: 0;
                    background-color: #F9F6E2;
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
                    height: 250px;
                    margin-top: 40px;
                }
                .footer-bar {
                    background-color: #1E2A4F;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                }
                .highlight {
                    background-color: #FFFF00;
                    color: black;
                    padding: 2px 8px;
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
                    Average Monthly Savings ₹${avgMonthlySavings}
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

        await page.setContent(html, { waitUntil: 'load' });
        
        const screenshot = await page.screenshot({ type: 'png' });
        await browser.close();
        
        return screenshot as Buffer;
    }
}

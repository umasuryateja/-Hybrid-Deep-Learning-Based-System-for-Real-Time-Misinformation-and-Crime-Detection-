document.addEventListener('DOMContentLoaded', () => {
    // Response Time Distribution Chart
    const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
    new Chart(responseTimeCtx, {
        type: 'bar',
        data: {
            labels: ['0-100ms', '100-200ms', '200-300ms', '300-400ms', '400-500ms', '>500ms'],
            datasets: [{
                label: 'Request Count',
                data: [450, 320, 180, 90, 40, 20],
                backgroundColor: 'rgba(26, 115, 232, 0.5)',
                borderColor: 'rgba(26, 115, 232, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Response Time Distribution (Last 24 Hours)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Requests'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Response Time'
                    }
                }
            }
        }
    });

    // Model Accuracy Trends Chart
    const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
    new Chart(accuracyCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Weapon Detection',
                    data: [97.5, 98.1, 98.4, 98.9, 99.2, 99.8],
                    borderColor: 'rgba(26, 115, 232, 1)',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Misinformation Detection',
                    data: [94.2, 94.8, 95.3, 95.7, 96.1, 96.5],
                    borderColor: 'rgba(52, 168, 83, 1)',
                    backgroundColor: 'rgba(52, 168, 83, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Model Accuracy Trends (6 Months)'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 90,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Accuracy (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            }
        }
    });

    // Add hover effects to metrics
    const metrics = document.querySelectorAll('.metric');
    metrics.forEach(metric => {
        metric.addEventListener('mouseenter', () => {
            metric.style.transform = 'translateY(-5px)';
            metric.style.transition = 'transform 0.3s ease';
        });
        
        metric.addEventListener('mouseleave', () => {
            metric.style.transform = 'translateY(0)';
        });
    });

    // Add hover effects to architecture layers
    const layers = document.querySelectorAll('.arch-layer');
    layers.forEach(layer => {
        layer.addEventListener('mouseenter', () => {
            layer.style.transform = 'translateX(10px)';
            layer.style.transition = 'transform 0.3s ease';
        });
        
        layer.addEventListener('mouseleave', () => {
            layer.style.transform = 'translateX(0)';
        });
    });

    // Update charts on theme change
    const updateChartsTheme = (isDark) => {
        Chart.defaults.color = isDark ? '#fff' : '#666';
        Chart.defaults.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    };

    // Initial theme check
    updateChartsTheme(document.body.classList.contains('dark-theme'));

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isDark = document.body.classList.contains('dark-theme');
                updateChartsTheme(isDark);
            }
        });
    });

    observer.observe(document.body, {
        attributes: true
    });
}); 
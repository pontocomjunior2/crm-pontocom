import React from 'react';
import { DollarSign, ShoppingCart, Package, RotateCcw } from 'lucide-react';

const RevenueDistributionChart = ({ data }) => {
    const { orderRevenue, packageRevenue, recurringRevenue, totalRevenue } = data;

    // Calculate percentages
    const orderPercent = totalRevenue > 0 ? Math.round((orderRevenue / totalRevenue) * 100) : 0;
    const packagePercent = totalRevenue > 0 ? Math.round((packageRevenue / totalRevenue) * 100) : 0;
    const recurringPercent = totalRevenue > 0 ? Math.round((recurringRevenue / totalRevenue) * 100) : 0;

    // Calculate SVG donut segments
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = 30;

    // Calculate stroke offsets for each segment
    const orderDash = (orderPercent / 100) * circumference;
    const packageDash = (packagePercent / 100) * circumference;
    const recurringDash = (recurringPercent / 100) * circumference;

    const segments = [
        {
            label: 'Avulsos',
            value: orderRevenue,
            percent: orderPercent,
            color: '#10b981',
            icon: <ShoppingCart size={16} />,
            offset: 0,
            dash: orderDash
        },
        {
            label: 'Pacotes',
            value: packageRevenue,
            percent: packagePercent,
            color: '#06b6d4',
            icon: <Package size={16} />,
            offset: orderDash,
            dash: packageDash
        },
        {
            label: 'Serviços Extras',
            value: recurringRevenue,
            percent: recurringPercent,
            color: '#6366f1',
            icon: <RotateCcw size={16} />,
            offset: orderDash + packageDash,
            dash: recurringDash
        }
    ];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="card-dark p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Distribuição de Receitas</h3>
                <p className="text-xs text-muted-foreground">Composição da receita total</p>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Donut Chart */}
                <div className="relative flex-shrink-0">
                    <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke="rgba(255, 107, 53, 0.1)"
                            strokeWidth={strokeWidth}
                        />

                        {/* Segments */}
                        {segments.map((segment, i) => (
                            <circle
                                key={i}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
                                strokeDashoffset={-segment.offset}
                                className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                                strokeLinecap="round"
                            />
                        ))}
                    </svg>

                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <DollarSign size={24} className="text-primary mb-1" />
                        <span className="text-2xl font-black text-foreground">{formatCurrency(totalRevenue)}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3 w-full">
                    {segments.map((segment, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: segment.color }}
                                ></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{segment.icon}</span>
                                    <span className="text-sm font-medium text-foreground">{segment.label}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-foreground">{formatCurrency(segment.value)}</div>
                                <div className="text-xs text-muted-foreground">{segment.percent}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RevenueDistributionChart;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import styles from './RecruiterAnalytics.module.css';

const COLORS = ['#2563EB', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export default function RecruiterAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/recruiter').then(({ data }) => {
      if (data.success) setStats(data.stats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const monthlyData = stats?.monthlyApps?.map(m => ({
    month: new Date(m.month + '-01').toLocaleDateString('en', { month: 'short' }),
    applications: parseInt(m.count),
  })) || [];

  const statusData = stats?.statusBreakdown?.map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: parseInt(s.count),
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Reports & Analytics</h1>
            <p className="section-subtitle">Comprehensive insights into your hiring pipeline</p>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Total Jobs Posted', value: stats?.totalJobs || 0, icon: '💼', color: 'rgba(37,99,235,0.1)', iconColor: 'var(--primary)' },
            { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: '✅', color: 'rgba(16,185,129,0.1)', iconColor: 'var(--success)' },
            { label: 'Total Applications', value: stats?.totalApplications || 0, icon: '📋', color: 'rgba(124,58,237,0.1)', iconColor: 'var(--secondary)' },
            { label: 'Shortlisted', value: stats?.shortlisted || 0, icon: '⭐', color: 'rgba(245,158,11,0.1)', iconColor: 'var(--warning)' },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="stat-icon" style={{ background: card.color, color: card.iconColor }}>
                <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
              </div>
              <div className="stat-info">
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className={styles.chartsGrid}>
          <motion.div
            className={`card ${styles.chartCard}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className={styles.chartTitle}>Application Trends (6 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              {monthlyData.length > 0 ? (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ fill: '#2563EB', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              ) : (
                <div className="empty-state" style={{ height: 250 }}>
                  <div className="empty-state-icon">📈</div>
                  <p className="empty-state-title">No data yet</p>
                  <p className="empty-state-desc">Post jobs to see application trends</p>
                </div>
              )}
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className={`card ${styles.chartCard}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className={styles.chartTitle}>Application Status Distribution</h3>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.pieLabels}>
                  {statusData.map((s, i) => (
                    <div key={i} className={styles.pieLabel}>
                      <div className={styles.pieDot} style={{ background: COLORS[i % COLORS.length] }} />
                      <span>{s.name}: {s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ height: 250 }}>
                <div className="empty-state-icon">🥧</div>
                <p className="empty-state-title">No applications yet</p>
              </div>
            )}
          </motion.div>

          <motion.div
            className={`card ${styles.chartCard} ${styles.fullWidth}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className={styles.chartTitle}>Top Jobs by Applications</h3>
            <ResponsiveContainer width="100%" height={250}>
              {stats?.topJobs?.length > 0 ? (
                <BarChart data={stats.topJobs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="title" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="applications" name="Applications" radius={[6, 6, 0, 0]}>
                    {stats.topJobs.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div className="empty-state" style={{ height: 250 }}>
                  <div className="empty-state-icon">📊</div>
                  <p className="empty-state-title">No data to display</p>
                </div>
              )}
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

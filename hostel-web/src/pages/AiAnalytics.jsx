import { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AiAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.dashboard.aiAnalytics();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load predictive analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <div style={styles.centered}>Synthesizing machine learning models…</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!data) return <div style={styles.centered}>No analytics data available.</div>;

  // 1. Setup Occupancy Demand Chart
  const roomDemand = data.roomDemand || {};
  const occupancyChartData = {
    labels: roomDemand.labels || [],
    datasets: [
      {
        label: 'Predicted Occupancy %',
        data: roomDemand.predictedDemandOccupancy || [],
        backgroundColor: 'rgba(34, 197, 94, 0.4)',
        borderColor: '#22c55e',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const occupancyChartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 50,
        max: 100,
        grid: { color: '#2a2a32' },
        ticks: { color: '#8b8b9a' }
      },
      x: {
        grid: { color: 'transparent' },
        ticks: { color: '#8b8b9a' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Occupancy: ${context.parsed.y}%`
        }
      }
    }
  };

  // 2. Setup Complaint Trends Chart
  const complaintTrends = data.complaintTrends || {};
  const complaintCategories = complaintTrends.categories || {};
  const complaintChartData = {
    labels: complaintTrends.months || [],
    datasets: [
      {
        label: 'WiFi Issues',
        data: complaintCategories.WIFI || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Plumbing Issues',
        data: complaintCategories.PLUMBING || [],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Electrical Issues',
        data: complaintCategories.ELECTRICAL || [],
        borderColor: '#eab308',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const complaintChartOptions = {
    responsive: true,
    scales: {
      y: {
        grid: { color: '#2a2a32' },
        ticks: { color: '#8b8b9a' }
      },
      x: {
        grid: { color: 'transparent' },
        ticks: { color: '#8b8b9a' }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#e8e8ed', font: { family: 'DM Sans', size: 11 } }
      }
    }
  };

  // 3. Defaulters risk
  const defaulters = data.defaultersRisk || [];

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div style={styles.badge}>AI Engine</div>
        <h1 style={styles.headerTitle}>Predictive Intelligence & Forecasting</h1>
        <p style={styles.headerSubtitle}>Machine learning analytics on historical data for demand predictions, student payment risk, and maintenance trends</p>
      </div>

      <div style={styles.grid}>
        {/* Occupancy Forecasting */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Room Demand Prediction</h3>
            <span style={styles.forecastBadge}>Next 6 Months</span>
          </div>
          <p style={styles.cardDesc}>Estimates occupancy load and flags peak admission months to plan capacity allocation.</p>
          <div style={styles.chartWrapper}>
            <Bar data={occupancyChartData} options={occupancyChartOptions} />
          </div>
          <div style={styles.insightBox}>
            <strong>🧠 Smart Alert:</strong> Occupancy is projected to hit <strong>{roomDemand.predictedDemandOccupancy[3]}%</strong> next semester. We recommend clearing maintenance backlogs in Block B before mid-term admissions.
          </div>
        </div>

        {/* Complaint Trends */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Complaint Frequency Trends</h3>
            <span style={styles.forecastBadge}>Seasonality Log</span>
          </div>
          <p style={styles.cardDesc}>Tracks complaint types to schedule preventive maintenance before utility outages occur.</p>
          <div style={styles.chartWrapper}>
            <Line data={complaintChartData} options={complaintChartOptions} />
          </div>
          <div style={styles.insightBox}>
            <strong>🧠 Smart Alert:</strong> WiFi complaints peaked in March but have declined. Plumbing maintenance requests are trending upward as summer approaches.
          </div>
        </div>
      </div>

      {/* Fee Defaulters Risk Prediction Table */}
      <div style={{ ...styles.card, marginTop: '2rem' }}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>AI Fee Default Risk Monitor</h3>
          <span style={styles.riskBadge}>Risk Scoring Matrix</span>
        </div>
        <p style={styles.cardDesc}>Flags accounts with high likelihood of defaulting on next month's hostel dues based on payment latency, login patterns, and past due reminders.</p>
        
        <div style={styles.defaultersGrid}>
          {defaulters.map((d) => (
            <div key={d.studentId} style={styles.defaulterCard}>
              <div style={styles.defaulterRow}>
                <div>
                  <span style={styles.defaulterName}>{d.name}</span>
                  <span style={styles.defaulterId}> (ID: #{d.studentId})</span>
                </div>
                <span style={{
                  ...styles.riskScoreBadge,
                  ...(d.riskScore >= 80 ? styles.riskHigh : d.riskScore >= 60 ? styles.riskMedium : styles.riskLow)
                }}>
                  {d.riskScore}% Default Risk
                </span>
              </div>
              <div style={styles.defaulterReason}>
                <strong>Behavioral Flag:</strong> {d.reason}
              </div>
              <div style={styles.defaulterActions}>
                <button style={styles.btnAction} onClick={() => alert(`Pre-emptive warning letter generated for ${d.name}`)}>
                  Email Pre-emptive Alert
                </button>
                <button style={styles.btnContact} onClick={() => alert(`Warden contact dialog opened for ${d.name}`)}>
                  Schedule Interview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingBottom: '3rem' },
  pageHeader: { marginBottom: '2.5rem' },
  badge: { display: 'inline-block', fontSize: '0.65rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' },
  headerTitle: { fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0' },
  headerSubtitle: { color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' },
  centered: { padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' },
  
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'stretch' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  cardTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 600 },
  cardDesc: { margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' },
  
  forecastBadge: { fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600 },
  riskBadge: { fontSize: '0.7rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600 },
  
  chartWrapper: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  insightBox: { background: 'rgba(255, 255, 255, 0.02)', borderLeft: '3px solid var(--accent)', padding: '0.85rem', borderRadius: '0 8px 8px 0', fontSize: '0.8rem', marginTop: '1.25rem', color: 'var(--text)', lineHeight: '1.4' },
  
  error: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', color: '#fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', margin: '2rem 0', fontSize: '0.875rem' },

  // Defaulters List
  defaultersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '0.5rem' },
  defaulterCard: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  defaulterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  defaulterName: { fontWeight: 700, fontSize: '0.95rem' },
  defaulterId: { color: 'var(--text-muted)', fontSize: '0.8rem' },
  
  riskScoreBadge: { fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 4 },
  riskHigh: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' },
  riskMedium: { background: 'rgba(234, 179, 8, 0.15)', color: 'var(--warning)' },
  riskLow: { background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent)' },
  
  defaulterReason: { fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '0.6rem 0.8rem', borderRadius: 6, border: '1px solid var(--border)' },
  
  defaulterActions: { display: 'flex', gap: '0.5rem' },
  btnAction: { flex: 1.5, background: 'var(--accent)', color: '#000', border: 'none', padding: '0.4rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 },
  btnContact: { flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.4rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500 },
};

import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart3, Users, Utensils } from 'lucide-react';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/reports/weekly', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <div>Loading reports...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Weekly Analytics Report</h1>
      <p style={styles.subtitle}>{reportData?.startDate} to {reportData?.endDate}</p>

      <div style={styles.grid}>
        <div style={styles.card} className="glass-card">
          <Users size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          <h3 style={styles.cardTitle}>Total Students</h3>
          <p style={styles.stat}>{reportData?.totalStudents || 0}</p>
        </div>

        <div style={styles.card} className="glass-card">
          <Utensils size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          <h3 style={styles.cardTitle}>Meals Served</h3>
          <p style={styles.stat}>{reportData?.totalMealsVerified || 0}</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem' },
  title: { fontSize: '2rem', margin: '0 0 0.5rem 0' },
  subtitle: { color: 'var(--text-muted)', marginBottom: '2rem' },
  grid: { display: 'flex', gap: '2rem' },
  card: { padding: '2rem', borderRadius: '12px', flex: 1, border: '1px solid var(--border)', background: 'var(--surface)' },
  cardTitle: { margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '1rem' },
  stat: { fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }
};

import { useState, useEffect } from 'react';
import { api } from '../../api/client';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function Mess() {
  const [menus, setMenus] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeDay, setActiveDay] = useState('MONDAY');
  
  // Feedback Form State
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  
  // Edit Menu Form State (Admin Only)
  const [editBreakfast, setEditBreakfast] = useState('');
  const [editLunch, setEditLunch] = useState('');
  const [editDinner, setEditDinner] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = user.role === 'STUDENT';
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  const loadMessData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const menuList = await api.mess.getMenu();
      setMenus(menuList);
      
      // Auto-fill edit inputs based on current active day
      const currentMenu = menuList.find(m => m.dayOfWeek === activeDay);
      if (currentMenu) {
        setEditBreakfast(currentMenu.breakfast);
        setEditLunch(currentMenu.lunch);
        setEditDinner(currentMenu.dinner);
      } else {
        setEditBreakfast('');
        setEditLunch('');
        setEditDinner('');
      }

      if (isAdmin) {
        const feedbackList = await api.mess.listFeedback();
        setFeedbacks(feedbackList);
      }
    } catch (err) {
      setError(err.message || 'Failed to load mess details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessData();
  }, [activeDay]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError(null);
    try {
      await api.mess.submitFeedback({ rating, comments });
      setSuccess('Thank you for rating today\'s meals! We have shared your feedback with the mess warden.');
      setComments('');
      setRating(5);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    }
  };

  const handleMenuUpdate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError(null);
    try {
      await api.mess.updateMenu({
        dayOfWeek: activeDay,
        breakfast: editBreakfast,
        lunch: editLunch,
        dinner: editDinner
      });
      setSuccess(`Mess menu updated for ${activeDay.toUpperCase()}!`);
      loadMessData();
    } catch (err) {
      setError(err.message || 'Failed to update menu');
    }
  };

  if (loading && menus.length === 0) return <div style={styles.centered}>Loading mess directory…</div>;

  const currentMenu = menus.find(m => m.dayOfWeek === activeDay);

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Mess Management</h1>
      <p style={styles.headerSubtitle}>
        {isStudent 
          ? 'Check daily meals, raise issues, and submit quality feedback.' 
          : 'Update weekly food schedules and review resident ratings.'}
      </p>

      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {/* Weekly Menu Tab view */}
        <div style={styles.columnLeft}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Weekly Meal Schedule</h3>
            <div style={styles.daySelector}>
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  style={{
                    ...styles.dayTab,
                    ...(activeDay === d ? styles.dayTabActive : {})
                  }}
                >
                  {d.substring(0, 3)}
                </button>
              ))}
            </div>

            {currentMenu ? (
              <div style={styles.menuBox}>
                <div style={styles.mealTime}>
                  <div style={styles.mealHeader}>
                    <strong>🍳 Breakfast</strong>
                    <span style={styles.timeTag}>7:30 AM - 9:00 AM</span>
                  </div>
                  <p style={styles.mealDesc}>{currentMenu.breakfast}</p>
                </div>

                <div style={styles.mealTime}>
                  <div style={styles.mealHeader}>
                    <strong>🍲 Lunch</strong>
                    <span style={styles.timeTag}>12:30 PM - 2:00 PM</span>
                  </div>
                  <p style={styles.mealDesc}>{currentMenu.lunch}</p>
                </div>

                <div style={styles.mealTime}>
                  <div style={styles.mealHeader}>
                    <strong>🍛 Dinner</strong>
                    <span style={styles.timeTag}>7:30 PM - 9:00 PM</span>
                  </div>
                  <p style={styles.mealDesc}>{currentMenu.dinner}</p>
                </div>
              </div>
            ) : (
              <div style={styles.emptyMenu}>
                <p>No menu defined for {activeDay}.</p>
                {isAdmin && <p style={styles.textMuted}>Use the form on the right to register a menu.</p>}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel: Feedback (Student) or Edit Menu (Admin) */}
        <div style={styles.columnRight}>
          {isStudent && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Rate Today's Food</h3>
              <form onSubmit={handleFeedbackSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Quality Rating (1 - 5 Stars)</label>
                  <div style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        style={styles.starBtn}
                      >
                        {star <= rating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Comments / Cooking Suggestions</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Tell us what you liked or how we can improve today's dishes..."
                    style={styles.textarea}
                    maxLength="500"
                    required
                  />
                </div>

                <button type="submit" style={styles.submitBtn}>
                  Submit Mess Rating
                </button>
              </form>
            </div>
          )}

          {isAdmin && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Edit Menu for {activeDay}</h3>
              <form onSubmit={handleMenuUpdate} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Breakfast Offerings</label>
                  <input
                    type="text"
                    value={editBreakfast}
                    onChange={(e) => setEditBreakfast(e.target.value)}
                    placeholder="e.g. Scrambled Eggs, Toast, Coffee"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Lunch Offerings</label>
                  <input
                    type="text"
                    value={editLunch}
                    onChange={(e) => setEditLunch(e.target.value)}
                    placeholder="e.g. Grilled Chicken Rice, Salads, Lentils"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Dinner Offerings</label>
                  <input
                    type="text"
                    value={editDinner}
                    onChange={(e) => setEditDinner(e.target.value)}
                    placeholder="e.g. Pasta Marinara, Garlic Bread, Ice Cream"
                    style={styles.input}
                    required
                  />
                </div>

                <button type="submit" style={styles.submitBtn}>
                  Save Menu Schedule
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Food Review Feed (Warden Only) */}
      {isAdmin && (
        <div style={{ ...styles.card, marginTop: '2rem' }}>
          <h3 style={styles.cardTitle}>Student Food Reviews</h3>
          {feedbacks.length === 0 ? (
            <p style={styles.empty}>No food ratings recorded.</p>
          ) : (
            <div style={styles.feedbackGrid}>
              {feedbacks.map((f) => (
                <div key={f.id} style={styles.feedbackItem}>
                  <div style={styles.feedbackHeader}>
                    <strong>{f.studentName}</strong>
                    <span style={styles.starText}>{'★'.repeat(f.rating) + '☆'.repeat(5 - f.rating)}</span>
                  </div>
                  <p style={styles.feedbackBody}>{f.comments}</p>
                  <span style={styles.feedbackDate}>{new Date(f.createdAt).toLocaleDateString()} at {new Date(f.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { paddingBottom: '3rem' },
  headerTitle: { fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0' },
  headerSubtitle: { color: 'var(--text-muted)', margin: '0 0 2rem 0' },
  centered: { padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.25fr 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  columnLeft: { display: 'flex', flexDirection: 'column' },
  columnRight: { display: 'flex', flexDirection: 'column' },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
  },
  cardTitle: { margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 600 },
  daySelector: {
    display: 'flex',
    gap: '0.25rem',
    background: 'var(--bg)',
    padding: '0.35rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    overflowX: 'auto',
    marginBottom: '1.5rem',
  },
  dayTab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    minWidth: '55px',
  },
  dayTabActive: {
    background: 'rgba(34, 197, 94, 0.12)',
    color: 'var(--accent)',
  },
  menuBox: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  mealTime: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem',
  },
  mealHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' },
  timeTag: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  mealDesc: { margin: 0, fontSize: '0.9rem', color: 'var(--text)' },
  emptyMenu: { textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' },
  textMuted: { fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' },

  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  textarea: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    outline: 'none',
    minHeight: '100px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  starRow: { display: 'flex', gap: '0.5rem' },
  starBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--warning)',
    fontSize: '1.75rem',
    padding: 0,
    cursor: 'pointer',
  },
  submitBtn: {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem',
    fontWeight: 600,
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  success: {
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid var(--accent)',
    color: '#a7f3d0',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid var(--danger)',
    color: '#fca5a5',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  },

  // Warden Feed
  feedbackGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  feedbackItem: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  feedbackHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' },
  starText: { color: 'var(--warning)' },
  feedbackBody: { margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' },
  feedbackDate: { fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'flex-end', marginTop: 'auto' },
  empty: { color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' },
};

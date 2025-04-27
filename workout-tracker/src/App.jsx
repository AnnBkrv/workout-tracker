import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [form, setForm] = useState({
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
    date: new Date().toISOString().slice(0, 16)  // Default to current date and time (YYYY-MM-DDTHH:mm)
  });

  const [message, setMessage] = useState('');
  const [workouts, setWorkouts] = useState([]);  // State to store workouts


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data being submitted:", form);
    try {
      const res = await axios.post('http://127.0.0.1:8000/workout', {
        exercise: form.exercise,
        sets: parseInt(form.sets),
        reps: parseInt(form.reps),
        weight: parseFloat(form.weight),
        date: form.date
      });
      setMessage(res.data.message);
      setForm({ exercise: '', sets: '', reps: '', weight: '', date: new Date().toISOString().slice(0, 16) });
      fetchWorkouts();  // Refresh the list after adding a workout
    } catch (err) {
      setMessage('Error logging workout');
    }
  };

  // Fetch workouts from the backend when the component loads
  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/workouts');
      setWorkouts(res.data);  // Set the workouts to state
    } catch (err) {
      console.error('Error fetching workouts:', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Workout Logger 💪</h1>

      {/* Form for logging a workout */}
      <form onSubmit={handleSubmit}>
        <input name="exercise" placeholder="Exercise" value={form.exercise} onChange={handleChange} required />
        <input name="sets" placeholder="Sets" value={form.sets} onChange={handleChange} required type="number" />
        <input name="reps" placeholder="Reps" value={form.reps} onChange={handleChange} required type="number" />
        <input name="weight" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} required type="number" />
        <input name="date" type="datetime-local" value={form.date} onChange={handleChange}
        />
        <button type="submit">Log Workout</button>
      </form>

      {message && <p>{message}</p>}
      {/* Display the list of logged workouts */}
      <h2>Logged Workouts</h2>
      <ul>
        {workouts.map((workout, index) => (
          <li key={index}>
            {workout.exercise} - {workout.sets} sets of {workout.reps} reps at {workout.weight} kg on {new Date(workout.date).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

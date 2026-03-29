import { useState, useEffect } from 'react';
import axios from 'axios';

function capitalizeFirstLetter(string) {
  return string
    .split(' ')  // Split the string by spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())  // Capitalize each word
    .join(' ');  // Join the words back together
}

function App() {
  const [workout, setWorkout] = useState({
  date: new Date().toISOString().slice(0, 16),
  exercises: [
    { exercise: '', sets: 1, reps: 1, weight: 0.1 }
  ]
});



  const [message, setMessage] = useState('');
  const [workouts, setWorkouts] = useState([]);  // State to store workouts
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);  // List of exercises
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // Store the date part (YYYY-MM-DD)
  const [viewAll, setViewAll] = useState(false);  // State to toggle between views (today's workouts or all workouts)


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value); // Update the selected date
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...workout.exercises];
    updated[index][field] = value;

    setWorkout(prev => ({
      ...prev,
      exercises: updated
    }));
  };

  const addExercise = () => {
    setWorkout(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { exercise: '', sets: 1, reps: 1, weight: 0.1 }
      ]
    }));
  };

  const removeExercise = (index) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (workout.sets <= 0 || workout.reps <= 0 || workout.weight <= 0) {
      setMessage("Please enter positive values for sets, reps, and weight.");
      return;
    }
    try {
      await axios.post('http://127.0.0.1:8000/workout', workout);

      setMessage("Workout saved!");

      setWorkout({
        date: new Date().toISOString().slice(0, 16),
        exercises: [{ exercise: '', sets: 1, reps: 1, weight: 0.1 }]
      });

      await fetchWorkouts();
    } catch (err) {
      console.error(err);
      setMessage('Error logging workout');
    }
  };

  const fetchWorkouts = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/workouts');
      setWorkouts(res.data);
    } catch (err) {
      console.error('Error fetching workouts:', err);
    }
  };

  const [editingWorkout, setEditingWorkout] = useState(null); // stores the workout being edited

  const startEditing = (workout) => {
    setEditingWorkout(workout);
    setForm({
      date: workout.date,
      exercises: workout.exercises.map(ex => ({ ...ex }))
    });
  };

  const finishEditing = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/workout/${editingWorkout.id}`, form);
      fetchWorkouts();
      setEditingWorkout(null);
    } catch (err) {
      console.error("Failed to save workout:", err);
    }
  };

  const fetchPreset = async (exerciseName) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/preset/${exerciseName}`);

      setForm(prevForm => ({
        ...prevForm,
        sets: res.data.sets,
        reps: res.data.reps,
        weight: res.data.weight
      }));
    } catch (err) {
      console.error('Error fetching preset:', err);
    }
  };

  const deleteWorkout = async (id) => {
    const confirmed = window.confirm("Delete this workout?");
    if (!confirmed) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/workout/${id}`);
      fetchWorkouts();
    } catch (err) {
      console.error("Failed to delete workout:", err);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);


  return (
    <div style={{ padding: '2rem' }}>
      <h1>Workout Tracker</h1>
      <form onSubmit={handleSubmit}>

      <h3>Exercises</h3>

      {workout.exercises.map((ex, index) => (
        <div key={index} style={{ display: "flex", alignItems: "center", border: '1px solid #ccc',
          padding: '10px', gap: "10px", marginBottom: "10px"
         }}>

          <input
            placeholder="Exercise"
            value={ex.exercise}
            onChange={(e) => handleExerciseChange(index, 'exercise', e.target.value)}
            required
          />

          <label>Sets:</label>
          <input
            type="number"
            value={ex.sets}
            onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
            min="1"
            required
          />

          <label>Reps:</label>
          <input
            type="number"
            value={ex.reps}
            onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
            min="1"
            required
          />

          <label>Weight:</label>
          <input
            type="number"
            value={ex.weight}
            onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
            min="0.1"
            step="0.1"
            required
          />
        <button
          type="button"
          onClick={() => removeExercise(index)}
          style={{ marginTop: '5px', marginLeft: '10px', color: 'red' }}
        > ❌
        </button>
        </div>
      ))}

      <button type="button" onClick={addExercise}>
        ➕
      </button>

      <br /><br />

      <button type="submit">
        Log Workout
      </button>

      <label>Date:</label>
      <input
        type="datetime-local"
        value={workout.date}
        onChange={(e) =>
          setWorkout({ ...workout, date: e.target.value })
        }
      />

    </form>

      {message && <p>{message}</p>}

      {/* Date picker to select the day */}
      {/*
      <label>Select Date:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
      />
      */}

      {/* Button to toggle between today's workouts and all workouts */}
      {/*
      <button onClick={() => setViewAll(!viewAll)}>
        {viewAll ? 'View Today\'s Workouts' : 'View All Workouts'}
      </button>
      */}

      {/* OVERVIEW (list of workouts) */}
      {!selectedWorkout && (
        <div>
          <h2>All Workouts</h2>
          <ul>
            {workouts.map((workout) => (
              <li key={workout.id}>
                <button onClick={() => setSelectedWorkout(workout)}>
                  Workout {new Date(workout.date).toLocaleDateString()} ({workout.exercises.length} exercises)
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* DETAIL VIEW (single workout) */}
      {selectedWorkout && (
        <div>
          <h2>
            Workout {new Date(selectedWorkout.date).toLocaleDateString()}
          </h2>

          {selectedWorkout.exercises.map((ex, i) => (
            <div key={i}>
              {ex.exercise} — {ex.sets} × {ex.reps} @ {ex.weight} kg
            </div>
          ))}

          <br />

          <button onClick={() => setSelectedWorkout(null)}>
            ← Back
          </button>

          <button onClick={() => startEditing(selectedWorkout)}>
            Edit
          </button>

          <button
            onClick={() => {
              deleteWorkout(selectedWorkout.id);
              setSelectedWorkout(null);
            }}
            style={{ color: 'red', marginLeft: '10px' }}
          >
            Delete Workout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

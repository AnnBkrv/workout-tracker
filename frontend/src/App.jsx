import { useState, useEffect } from 'react';
import axios from 'axios';

function capitalizeFirstLetter(string) {
  return string
    .split(' ')  // Split the string by spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())  // Capitalize each word
    .join(' ');  // Join the words back together
}

function App() {
  const [form, setForm] = useState({
    exercise: '',
    sets: 1,
    reps: 1,
    weight: 0.1,
    date: new Date().toISOString().slice(0, 16)  // Default to current date and time (YYYY-MM-DDTHH:mm)
  });



  const [message, setMessage] = useState('');
  const [workouts, setWorkouts] = useState([]);  // State to store workouts
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

  const handleExerciseChange = async (e) => {
    const selectedExercise = e.target.value.trim();
    const normalized = capitalizeFirstLetter(selectedExercise);;
    setForm(prevForm => ({
      ...prevForm,
      exercise: selectedExercise
    }));
    
    // Fetch preset only if the exercise exists in the list
    if (exercises.includes(normalized)) {
      await fetchPreset(normalized);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.sets <= 0 || form.reps <= 0 || form.weight <= 0) {
      setMessage("Please enter positive values for sets, reps, and weight.");
      return;
    }
    try {
      if (!exercises.includes(capitalizeFirstLetter(form.exercise))) {
        const shouldSave = window.confirm(`"${capitalizeFirstLetter(form.exercise)}" is a new exercise. Save it to your list?`);
        if (shouldSave) {
          await axios.post('http://127.0.0.1:8000/exercises', {
            exercise: capitalizeFirstLetter(form.exercise)
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          await fetchExercises(); // Refresh the exercises list after adding
        }}

      const res = await axios.post('http://127.0.0.1:8000/workout', {
        exercise: form.exercise,
        sets: parseInt(form.sets),
        reps: parseInt(form.reps),
        weight: parseFloat(form.weight),
        date: form.date
      });
      setMessage(res.data.message);
      setForm({ exercise: '', sets: 1, reps: 1, weight: 0.1, date: new Date().toISOString().slice(0, 16) });
      fetchWorkouts();  // Refresh the list after adding a workout
    } catch (err) {
      console.error(err);
      setMessage('Error logging workout');
    }
  };

  // Fetch workouts from the backend when the component loads
  useEffect(() => {
    fetchExercises();
    fetchWorkouts();
  }, []);

  const fetchExercises = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/exercises');
      setExercises(res.data);  // Set the exercises to state
    } catch (err) {
      console.error('Error fetching exercises:', err);
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

   // Filter workouts by the selected date
  const filteredWorkouts = workouts.filter((workout) =>
      workout.date.slice(0, 10) === selectedDate
    );
  // Group workouts by date for the "All Workouts" view
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const workoutDate = workout.date.slice(0, 10); // Extract date part (YYYY-MM-DD)
    if (!acc[workoutDate]) {
      acc[workoutDate] = [];
    }
    acc[workoutDate].push(workout);
    return acc;
  }, {});

    useEffect(() => {
      fetchExercises();
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

  const deleteWorkout = async (date) => {
    const confirmed = window.confirm(`Are you sure you want to delete all workouts on ${date}?`);
    if (!confirmed) return;
  
    try {
      await axios.delete(`http://127.0.0.1:8000/workouts/by_date/${date}`);
      fetchWorkouts();  // Refresh list
    } catch (err) {
      console.error("Failed to delete workouts by date:", err);
    }
  };

  const deleteExercise = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this exercise?");
    if (!confirmed) return;
    console.log("Trying to delete exercise with ID:", id);  // ← ADD THIS

    try {
      await axios.delete(`http://127.0.0.1:8000/workouts/${id}`);
      fetchWorkouts();  // Refresh list
    } catch (err) {
      console.error("Failed to delete workout:", err);
    }
  };
  
  

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Workout Logger</h1>

      <form onSubmit={handleSubmit}>
        <input
          list="exercise-list"
          name="exercise"
          placeholder="Exercise"
          value={form.exercise}
          onChange={handleChange}
          required
        />
        <datalist id="exercise-list">
          {exercises.map((exercise, index) => (
            <option key={index} value={exercise} />
          ))}
        </datalist>

        <label>Sets:</label>
        <input name="sets" value={form.sets} onChange={handleChange} type="number" min="1" required />
        <label>Reps:</label>
        <input name="reps" value={form.reps} onChange={handleChange} type="number" min="1" required />
        <label>Weight (kg):</label>
        <input
          name="weight"
          value={form.weight}
          onChange={handleChange}
          type="number"
          min="0.1"
          required
          step="0.1"
        />
        <input name="date" type="datetime-local" value={form.date} onChange={handleChange} />
        <button type="submit">Log Workout</button>
      </form>

      {message && <p>{message}</p>}

      {/* Date picker to select the day */}
      <label>Select Date:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
      />

      {/* Button to toggle between today's workouts and all workouts */}
      <button onClick={() => setViewAll(!viewAll)}>
        {viewAll ? 'View Today\'s Workouts' : 'View All Workouts'}
      </button>

      <h2>{viewAll ? 'All Workouts' : `Workouts on ${selectedDate}`}</h2>
      <ul>
        {viewAll ? (
          // Display all workouts grouped by date
          Object.keys(groupedWorkouts).map((date, index) => (
            <div key={index}>
              <h3>{date}</h3>
              <ul>
                {groupedWorkouts[date].map((workout, index) => (
                  <li key={index}>
                    {workout.exercise} - {workout.sets} sets of {workout.reps} reps at {workout.weight} kg on {new Date(workout.date).toLocaleString()}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => deleteWorkout(date)}  // Group delete by date
                style={{ marginBottom: '1rem', color: 'red' }}
              >
                Delete Workouts for {date}
              </button>
            </div>
          ))
        ) : (
          // Display today's workouts
          filteredWorkouts.map((workout, index) => (
            <li key={index}>
              {workout.exercise} - {workout.sets} sets of {workout.reps} reps at {workout.weight} kg on {new Date(workout.date).toLocaleString()}
              <button
                onClick={() => deleteExercise(workout.id)}  // Correct: pass name
                style={{ marginLeft: '10px', color: 'red' }}
              >
                Delete Exercise
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default App;

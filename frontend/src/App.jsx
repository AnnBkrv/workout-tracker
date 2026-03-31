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
  const [isEditing, setIsEditing] = useState(false);


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

  const groupByMonth = (workouts) => {
    const grouped = {};

    workouts.forEach(workout => {
      const date = new Date(workout.date);

      const year = date.getFullYear();
      const month = date.getMonth(); // 0–11

      const key = `${year}-${month}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(workout);
    });

    return grouped;
  };
  const groupedWorkouts = groupByMonth(workouts);

  const sortedMonths = Object.keys(groupedWorkouts).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const deleteWorkout = async (id) => {
    const confirmed = window.confirm("Delete this workout?");
    if (!confirmed) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/workout/${id}`);
      fetchWorkouts();
      // go back to "All Workouts" view
      if (selectedWorkout?.id === id) {
        setSelectedWorkout(null);
      }
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
      {/* log workout button */}
      <button type="submit"
        style={{ marginRight: '5px'}}>
        Log Workout
      </button>

      <label style={{ padding: '5px'}}>Date:</label>
      <input
        type="datetime-local"
        value={workout.date}
        onChange={(e) =>
          setWorkout({ ...workout, date: e.target.value })
        }
      />

    </form>

      {message && <p>{message}</p>}

      {!selectedWorkout && (
        <div>
          <h2>All Workouts</h2>

          {sortedMonths.map((monthKey) => {
            const workoutsInMonth = groupedWorkouts[monthKey];

            const [year, month] = monthKey.split("-");
            const date = new Date(year, month);

            const monthName = date.toLocaleString("default", {
              month: "long",
              year: "numeric",
            });

            return (
              <div key={monthKey}>
                <h3>{monthName}</h3>

                <ul>
                  {workoutsInMonth
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((workout) => (
                      <li key={workout.id}>
                        <button
                          style={{ marginBottom: "10px" }}
                          onClick={() => setSelectedWorkout(workout)}
                        >
                          Workout{" "}
                          {new Date(workout.date).toLocaleDateString()}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      {selectedWorkout && (
      <div>
        <h2>
          Workout {new Date(selectedWorkout.date).toLocaleDateString()}
        </h2>

        {/* Header for edit mode */}
        {isEditing && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              fontWeight: 'bold',
              marginBottom: '5px'
            }}
          >
            <div style={{ width: '120px' }}>Exercise</div>
            <div style={{ width: '60px' }}>Sets</div>
            <div style={{ width: '60px' }}>Reps</div>
            <div style={{ width: '80px' }}>Weight</div>
            <div style={{ width: '30px' }}></div> {/* for ❌ */}
          </div>
        )}

        {selectedWorkout.exercises.map((ex, i) => (
          <div key={i} style={{ marginBottom: '10px', display : "flex", gap : "10px", alignItems : "center" }}>
            {isEditing ? (
              <>
                <input placeholder='Exercise'
                  style={{ width: '120px' }}
                  value={ex.exercise}
                  onChange={(e) => {
                    const updated = [...selectedWorkout.exercises];
                    updated[i].exercise = e.target.value;
                    setSelectedWorkout({ ...selectedWorkout, exercises: updated });
                  }}
                />
                <input placeholder='Sets'
                  type="number"
                  style={{ width: '60px' }}
                  value={ex.sets}
                  onChange={(e) => {
                    const updated = [...selectedWorkout.exercises];
                    updated[i].sets = e.target.value;
                    setSelectedWorkout({ ...selectedWorkout, exercises: updated });
                  }}
                />
                <input placeholder='Reps'
                  style={{ width: '60px' }}
                  type="number"
                  value={ex.reps}
                  onChange={(e) => {
                    const updated = [...selectedWorkout.exercises];
                    updated[i].reps = e.target.value;
                    setSelectedWorkout({ ...selectedWorkout, exercises: updated });
                  }}
                />
                <input placeholder='weight'
                  style={{ width: '80px' }}
                  type="number"
                  value={ex.weight}
                  onChange={(e) => {
                    const updated = [...selectedWorkout.exercises];
                    updated[i].weight = e.target.value;
                    setSelectedWorkout({ ...selectedWorkout, exercises: updated });
                  }}
                />
              {/* REMOVE BUTTON */}
              <button
                type="button"
                onClick={() => {
                  const updated = selectedWorkout.exercises.filter((_, index) => index !== i);
                  setSelectedWorkout({ ...selectedWorkout, exercises: updated });
                }}
                style={{ color: 'red' }}
              >
                ❌
              </button>
              </>
              
            ) : (
              <div>
                {ex.exercise} — {ex.sets} × {ex.reps} @ {ex.weight} kg
              </div>
            )}
            
          </div>
        ))}
        {/* Add button */}
        {isEditing && (
        <button
          type="button"
          onClick={() => {
            const newExercise = {
              exercise: '',
              sets: 1,
              reps: 1,
              weight: 0.1
            };

            setSelectedWorkout({
              ...selectedWorkout,
              exercises: [...selectedWorkout.exercises, newExercise]
            });
          }}
          style={{ marginTop: '10px', marginBottom : "10px" }}
        >
          ➕ Add Exercise
        </button>
      )}
        
        <br />

        <button onClick={() => setSelectedWorkout(null)}>
          ← Back
        </button>

        {/* Delete */}
        <button
          onClick={() => deleteWorkout(selectedWorkout.id)}
          style={{ marginLeft: '10px', color: 'red' }}
        >
          Delete Workout
        </button>

        {/* Edit */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{ marginLeft: '10px' }}
          >
            Edit
          </button>
        ) : (
          <>
          {/* Save Button */}
            <button
              onClick={async () => {
                try {
                  await axios.put(
                    `http://127.0.0.1:8000/workout/${selectedWorkout.id}`,
                    selectedWorkout
                  );
                  setIsEditing(false);
                  await fetchWorkouts();
                } catch (err) {
                  console.error(err);
                }
              }}
              style={{ marginLeft: '10px' }}
            >
              Save
            </button>
          {/* Cancel button */}
            <button
              onClick={() => setIsEditing(false)}
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    )}
    </div>
  );
}

export default App;

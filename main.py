from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) # this allows react to talk to the backend

# In-memory storage for exercises
exercises = ["Squat", "Deadlift", "Bench Press", "Pull-up", "Push-up"]
exercise_presets = {} 
workouts = []

# Define the structure of a workout entry
class WorkoutEntry(BaseModel):
    exercise: str
    sets: int
    reps: int
    weight: float
    date: datetime

class Exercise(BaseModel):
    exercise: str

@app.post("/workout")
def log_workout(entry: WorkoutEntry):
    entry.exercise = entry.exercise.strip().title()

    # Add exercise to list if it's new
    if entry.exercise not in exercises:
        exercises.append(entry.exercise)
        print(f"Added new exercise: {entry.exercise}")

    workouts.append(entry)

    # Save the latest sets, reps, and weight for this exercise
    exercise_presets[entry.exercise] = {
        "sets": entry.sets,
        "reps": entry.reps,
        "weight": entry.weight
    }
    return {"message": "Workout saved!", "entry": entry}

@app.post("/exercises")
def add_exercise(exercise: Exercise):
    exercises.append(exercise.exercise)
    return {"message": f"Exercise '{exercise.exercise}' added successfully!"}


@app.get("/workouts", response_model=List[WorkoutEntry])
def get_workouts():
    return workouts

@app.get("/preset/{exercise}")
def get_preset(exercise: str):
    preset = exercise_presets.get(exercise)
    if preset:
        return preset
    else:
        return {"sets": 1, "reps": 1, "weight": 0.1}  # Default if not found

@app.get("/exercises", response_model=List[str])
def get_exercises():
    return exercises

@app.get("/")
def read_root():
    return {"message": "Welcome to the Workout Tracker API 💪"}